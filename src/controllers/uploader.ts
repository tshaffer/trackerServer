import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

import * as fs from 'fs';
import Papa from 'papaparse';
import { isNil, isNumber } from 'lodash';
import {
  CheckingAccountTransaction,
  Category,
  CheckingAccountStatement,
  CreditCardStatement,
  CreditCardTransaction,
  MinMaxDates,
  CheckTransaction
} from '../types';
import {
  addCheckingAccountTransactionsToDb,
  addCreditCardTransactionsToDb,
  getCategoriesFromDb,
  getCreditCardTransactionsFromDb,
  getDuplicateCreditCardTransactionsDb,
  removeDuplicateCreditCardTransactionsDb,
  getMinMaxCreditCardTransactionDatesFromDb,
  addCategoriesToDb,
  addCreditCardStatementToDb,
  addCheckingAccountStatementToDb
} from './dbInterface';
import { BankTransactionType, CheckingAccountTransactionType, DisregardLevel, StatementType } from '../types/enums';
import { getIsoDate, isEmptyLine, isValidDate } from '../utilities';

export const uploadStatement = async (request: Request, response: Response, next: any) => {

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/statementUploads/');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });

  const upload = multer({ storage });
  upload.array('files')(request, response, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log('MulterError: ', err);
      return response.status(500).json(err);
    } else if (err) {
      console.log('nonMulterError: ', err);
      return response.status(500).json(err);
    } else {
      console.log('no error on upload');
      console.log(request.files.length);

      const uploadedStatementFiles: Express.Multer.File[] = (request as any).files;
      for (const uploadedStatementFile of uploadedStatementFiles) {
        const originalFileName: string = uploadedStatementFile.originalname;
        const filePath: string = uploadedStatementFile.path;
        const content: string = fs.readFileSync(filePath).toString();
        const result: Papa.ParseResult<any> = Papa.parse(content,
          {
            header: false,
            dynamicTyping: true,
            transform,
          });

        // TEDTODO - check result for errors
        const statementId: string = await processStatement(originalFileName, result.data as any[])
      }

      const responseData = {
        uploadStatus: 'success',
      };
      return response.status(200).send(responseData);
    }
  });
};

const processStatement = async (originalFileName: string, csvTransactions: any[]): Promise<string> => {

  const statementId: string = uuidv4();

  if (originalFileName.startsWith('Chase7011_Activity') || originalFileName.startsWith('Chase5014_Activity')) {

    // Chase7011_Activity20220601_20221231_20240521.csv
    const startDateStr: string = originalFileName.substring(18, 26);
    const dbStartDate: string = getCreditCardStatementDate(startDateStr);
    const endDateStr: string = originalFileName.substring(27, 35);
    const dbEndDate: string = getCreditCardStatementDate(endDateStr);

    const statement: CreditCardStatement = {
      id: statementId,
      fileName: originalFileName,
      type: StatementType.CreditCard,
      startDate: dbStartDate,
      endDate: dbEndDate,
      transactionCount: 0,
      netDebits: 0,
    };
    await processCreditCardStatement(statement, csvTransactions);
    await addCreditCardStatementToDb(statement);
    await executeRemoveDuplicateCreditCardTransactions();
    await executeAddReferencedCategories();
    return Promise.resolve(statementId);

  } else if (originalFileName.startsWith('Cash Reserve - 2137_')) {

    // Cash Reserve - 2137_07-01-2023_12-31-2023.csv
    const startDateStr: string = originalFileName.substring(20, 30);
    const dbStartDate: string = getCheckingAccountStatementDate(startDateStr);
    const endDateStr: string = originalFileName.substring(31, 41);
    const dbEndDate: string = getCheckingAccountStatementDate(endDateStr);

    const statement: CheckingAccountStatement = {
      id: statementId,
      fileName: originalFileName,
      type: StatementType.Checking,
      startDate: dbStartDate,
      endDate: dbEndDate,
      transactionCount: 0,
      netDebits: 0,
      checkCount: 0,
      atmWithdrawalCount: 0,
    };
    await processCheckingAccountStatement(statement, csvTransactions);
    await addCheckingAccountStatementToDb(statement);
    return Promise.resolve(statementId);

  } else {
    console.log('originalFileName does not match expected pattern: ', originalFileName);
    return Promise.reject('Invalid file name');
  };
}

const processCreditCardStatement = async (creditCardStatement: CreditCardStatement, csvTransactions: any[]) => {

  const transactions: CreditCardTransaction[] = [];

  let netDebits = 0;

  for (let i = 0; i < csvTransactions.length; i++) {

    const parsedLine: any[] = csvTransactions[i];

    if (isEmptyLine(parsedLine)) {
      continue;
    }

    /*
      if (transactionDate.charCodeAt(0) === 65279) {
        transactionDate = (transactionDate as string).substring(1);
      }
    */
    if (!isValidDate(parsedLine[0])) {
      continue;
    }
    if (!isValidDate(parsedLine[1])) {
      continue;
    }
    const transactionDate = getIsoDate(parsedLine[0]);
    const postDate = getIsoDate(parsedLine[1]);

    const description = parsedLine[2];
    const category = parsedLine[3];
    const type = parsedLine[4];
    const amount = parsedLine[5];

    netDebits += amount;

    const creditCardTransaction: CreditCardTransaction = {
      id: uuidv4(),
      statementId: creditCardStatement.id,
      transactionDate,
      postDate,
      description,
      category,
      type,
      amount,
      bankTransactionType: BankTransactionType.CreditCard,
      userDescription: description,
      overrideCategory: false,
      overrideCategoryId: '',
  };

    transactions.push(creditCardTransaction);
  }

  creditCardStatement.transactionCount = transactions.length;
  creditCardStatement.netDebits = netDebits;

  await addCreditCardTransactionsToDb(transactions);
}

const processCheckingAccountStatement = async (checkingAccountStatement: CheckingAccountStatement, csvTransactions: any[]): Promise<any> => {

  const transactions: CheckingAccountTransaction[] = [];

  let netDebits = 0;
  let checkCount = 0;
  let atmWithdrawalCount = 0;

  for (let i = 0; i < csvTransactions.length; i++) {

    const parsedLine: any[] = csvTransactions[i];

    if (isEmptyLine(parsedLine)) {
      continue;
    }

    /*
      if (transactionDate.charCodeAt(0) === 65279) {
        transactionDate = (transactionDate as string).substring(1);
      }
    */
    const transactionDate = parsedLine[0];
    const transactionType = parsedLine[1];
    const name = parsedLine[2];
    const memo = parsedLine[3];
    const amount = parsedLine[4];
    if (!isNumber(amount)) {
      continue;
    }

    netDebits += amount;

    if (name.startsWith('ATM WITHDRAWAL')) {
      atmWithdrawalCount++;
    }

    if (name === 'CHECK') {
      checkCount++;
      // transactionType should be the check number
      const checkTransaction: CheckTransaction = {
        id: uuidv4(),
        statementId: checkingAccountStatement.id,
        transactionDate,
        transactionType,
        name,
        memo,
        amount,
        bankTransactionType: BankTransactionType.Checking,
        checkingAccountTransactionType: CheckingAccountTransactionType.Check,
        checkNumber: transactionType,
        payee: 'TBD',
        userDescription: name,
        overrideCategory: false,
        overrideCategoryId: '',
      };
      transactions.push(checkTransaction);
    } else {
      const checkingAccountTransaction: CheckingAccountTransaction = {
        id: uuidv4(),
        statementId: checkingAccountStatement.id,
        transactionDate,
        transactionType,
        name,
        memo,
        amount,
        bankTransactionType: BankTransactionType.Checking,
        checkingAccountTransactionType: CheckingAccountTransactionType.TBD,
        userDescription: name,
        overrideCategory: false,
        overrideCategoryId: '',
      };

      transactions.push(checkingAccountTransaction);
    }
  }

  checkingAccountStatement.transactionCount = transactions.length;
  checkingAccountStatement.netDebits = netDebits;

  checkingAccountStatement.checkCount = checkCount;
  checkingAccountStatement.atmWithdrawalCount = atmWithdrawalCount;

  await addCheckingAccountTransactionsToDb(transactions);

  return Promise.resolve();
}

const transform = (arg1: any, arg2: any) => {
  if (arg1 === '') {
    return 'FALSE';
  } else {
    return arg1;
  }
}

const getCreditCardStatementDate = (dateStr: string): string => {
  const year = dateStr.substring(0, 4);
  const yearValue = parseInt(year);
  const month = dateStr.substring(4, 6);
  const monthIndex = parseInt(month) - 1;
  const day = dateStr.substring(6, 8);
  const dayValue = parseInt(day);
  const date = new Date(yearValue, monthIndex, dayValue);
  return date.toISOString();
};

const getCheckingAccountStatementDate = (dateStr: string): string => {
  const month = dateStr.substring(0, 2);
  const monthIndex = parseInt(month) - 1;
  const day = dateStr.substring(3, 5);
  const dayValue = parseInt(day);
  const year = dateStr.substring(6, 10);
  const yearValue = parseInt(year);
  const date = new Date(yearValue, monthIndex, dayValue);
  return date.toISOString();
};

const executeRemoveDuplicateCreditCardTransactions = async () => {
  const duplicateCreditCardTransactions = await getDuplicateCreditCardTransactionsInternal();
  const idsToDelete: string[] = duplicateCreditCardTransactions.map(doc => (doc as any)._id);
  await removeDuplicateCreditCardTransactionsDb(idsToDelete);
}

export const getDuplicateCreditCardTransactions = async (request: Request, response: Response, next: any) => {
  const duplicateCreditCardTransactions = await getDuplicateCreditCardTransactionsInternal();
  response.json(duplicateCreditCardTransactions);
}

export const removeDuplicateCreditCardTransactions = async (request: Request, response: Response, next: any) => {
  await executeRemoveDuplicateCreditCardTransactions();
  return response.status(200).send();
}

const getDuplicateCreditCardTransactionsInternal = async () => {

  const duplicateCreditCardTransactions: CreditCardTransaction[] = [];

  const creditCardTransactions: CreditCardTransaction[] = await getDuplicateCreditCardTransactionsDb();

  const creditCardTransactionMap: Map<string, CreditCardTransaction> = new Map();

  for (const creditCardTransaction of creditCardTransactions) {
    const key = creditCardTransaction.postDate + creditCardTransaction.description + creditCardTransaction.amount.toString();

    const existingCreditCardTransaction: CreditCardTransaction | undefined = creditCardTransactionMap.get(key);

    if (isNil(existingCreditCardTransaction)) {
      creditCardTransactionMap.set(key, creditCardTransaction);
    } else {
      if (existingCreditCardTransaction.statementId !== creditCardTransaction.statementId) {
        duplicateCreditCardTransactions.push(creditCardTransaction);
      }
    }
  }

  return duplicateCreditCardTransactions;
};

// add categories that are referenced in credit card transactions but do not already exist in the db
export const addReferencedCategories = async (request: Request, response: Response, next: any) => {
  await executeAddReferencedCategories();
  return response.status(200).send();
}

const executeAddReferencedCategories = async () => {
  const minMaxTransactionDates: MinMaxDates = await getMinMaxCreditCardTransactionDatesFromDb();

  const { minDate, maxDate } = minMaxTransactionDates;
  const creditCardTransactions: CreditCardTransaction[] = await getCreditCardTransactionsFromDb(minDate, maxDate);

  const referencedCategories = new Set<string>();

  creditCardTransactions.forEach((creditCardTransaction: CreditCardTransaction) => {
    if (creditCardTransaction.category.length > 0 && creditCardTransaction.category !== 'false') {
      referencedCategories.add(creditCardTransaction.category);
    }
  });

  const existingCategories: Category[] = await getCategoriesFromDb();

  const referencedArray: string[] = Array.from(referencedCategories);
  const existingCategoryNames: Set<string> = new Set<string>(existingCategories.map(category => category.name));
  const newCategoryNames: string[] = referencedArray.filter(category => !existingCategoryNames.has(category));

  const categoryEntities: Category[] = newCategoryNames.map((name: string) => {
    return {
      id: uuidv4(),
      name,
      parentId: '',
      disregardLevel: DisregardLevel.None,
    };
  });

  await addCategoriesToDb(categoryEntities);
}

