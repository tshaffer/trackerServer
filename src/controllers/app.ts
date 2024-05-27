import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';
import { version } from '../version';
import multer from 'multer';
import * as fs from 'fs';
import Papa from 'papaparse';
import { isBoolean, isNumber, isString } from 'lodash';
import { CheckingAccountTransactionEntity, CreditCardCategoryEntity, CreditCardDescriptionKeywordEntity, CreditCardTransactionEntity, StatementEntity } from 'entities';
import { addCheckingAccountTransactionsToDb, addCreditCardTransactionsToDb, addStatementToDb, createStatement, getCreditCardCategoriesFromDb, getCreditCardDescriptionKeywordsFromDb, getTransactionsFromDb } from './dbInterface';
import { StatementType } from '../types/enums';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getCategorizedTransactions = async (request: Request, response: Response, next: any) => {

  console.log('getCategorizedTransactions');

  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;

  const transactions: CreditCardTransactionEntity[] = await getTransactionsFromDb(startDate, endDate);

  const creditCardCategories: CreditCardCategoryEntity[] = await getCreditCardCategoriesFromDb();

  const creditCardDescriptionKeywords: CreditCardDescriptionKeywordEntity[] = await getCreditCardDescriptionKeywordsFromDb();

  const categorizedTransactions: string[] = categorizeTransactions(transactions, creditCardCategories, creditCardDescriptionKeywords);

  response.json(categorizedTransactions);
};

const categorizeTransactions = (
  transactions: CreditCardTransactionEntity[],
  creditCardCategories: CreditCardCategoryEntity[],
  creditCardDescriptionKeywords: CreditCardDescriptionKeywordEntity[]): string[] => {

  const categorizedTransactions: string[] = [];

  for (const transaction of transactions) {
    const category: string = categorizeTransaction(transaction, creditCardCategories, creditCardDescriptionKeywords);
    const categorizedTransaction: any = {
      transaction,
      category,
    };
    categorizedTransactions.push(categorizedTransaction);
  }

  return categorizedTransactions;
};

const categorizeTransaction = (
  transaction: CreditCardTransactionEntity,
  creditCardCategories: CreditCardCategoryEntity[],
  creditCardDescriptionKeywords: CreditCardDescriptionKeywordEntity[]): string => {

  for (const descriptionKeyword of creditCardDescriptionKeywords) {
    if (transaction.description.includes(descriptionKeyword.keyword)) {
      return descriptionKeyword.keyword;
    }
  }

  for (const category of creditCardCategories) {
    if (transaction.category === category.keyword) {
      return category.keyword;
    }
  }

  return 'Uncategorized';
};

export const uploadStatement = async (request: Request, response: Response, next: any) => {

  console.log('uploadStatement');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // cb(null, 'public');
      cb(null, '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public');
    },
    filename: function (req, file, cb) {
      cb(null, 'statement.csv');
    }
  });

  const upload = multer({ storage: storage }).single('file');

  upload(request, response, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('MulterError: ', err);
      return response.status(500).json(err);
    } else if (err) {
      console.log('nonMulterError: ', err);
      return response.status(500).json(err);
    }
    console.log('return from upload: ', request.file);

    const originalFileName: string = request.file.originalname;
    // const filePath: string = path.join('public', 'creditCardStatement.csv');
    const filePath: string = '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public/statement.csv';
    const content: string = fs.readFileSync(filePath).toString();

    const result = Papa.parse(content,
      {
        header: false,
        dynamicTyping: true,
        transform,
      });


    return processStatement(originalFileName, result.data as any[])
      .then(() => {
        const responseData = {
          uploadStatus: 'success',
        };
        return response.status(200).send(responseData);

      });
  });
};

const processStatement = async (originalFileName: string, csvTransactions: any[]): Promise<void> => {

  const statementId: string = uuidv4();

  if (originalFileName.startsWith('Chase7011_Activity')) {

    console.log('Chase credit card statement');

    // Chase7011_Activity20220601_20221231_20240521.csv
    const startDateStr: string = originalFileName.substring(18, 26);
    const dbStartDate: string = getCreditCardStatementDate(startDateStr);
    const endDateStr: string = originalFileName.substring(27, 35);
    const dbEndDate: string = getCreditCardStatementDate(endDateStr);

    const statementEntity: StatementEntity = {
      id: statementId,
      type: StatementType.CreditCard,
      startDate: dbStartDate,
      endDate: dbEndDate,
    };
    await addStatementToDb(statementEntity);
    await processCreditCardStatement(statementId, csvTransactions);
    return Promise.resolve();
  } else if (originalFileName.startsWith('Cash Reserve - 2137_')) {

    // Cash Reserve - 2137_07-01-2023_12-31-2023.csv
    console.log('US Bank checking account');

    const startDateStr: string = originalFileName.substring(20, 30);
    const dbStartDate: string = getCheckingAccountStatementDate(startDateStr);
    const endDateStr: string = originalFileName.substring(31, 41);
    const dbEndDate: string = getCheckingAccountStatementDate(endDateStr);

    const statementEntity: StatementEntity = {
      id: statementId,
      type: StatementType.Checking,
      startDate: dbStartDate,
      endDate: dbEndDate,
    };
    await addStatementToDb(statementEntity);
    await processCheckingAccountStatement(statementId, csvTransactions);
    return Promise.resolve();
  } else {
    console.log('originalFileName does not match expected pattern: ', originalFileName);
    return Promise.reject('Invalid file name');
  };
}

const processCreditCardStatement = async (statementId: string, csvTransactions: any[]) => {

  const transactions: CreditCardTransactionEntity[] = [];

  console.log('processCreditCardStatement');

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
    const creditCardTransaction: CreditCardTransactionEntity = {
      id: uuidv4(),
      statementId,
      transactionDate,
      postDate,
      description,
      category,
      type,
      amount,
    };

    transactions.push(creditCardTransaction);
  }

  await addCreditCardTransactionsToDb(transactions);

  console.log('processCreditCardStatement complete');
}

const processCheckingAccountStatement = async (statementId: string, csvTransactions: any[]): Promise<string[]> => {

  const transactions: CheckingAccountTransactionEntity[] = [];

  const errorList: string[] = [];

  console.log('processCheckingAccountStatement');

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
    const checkingAccountTransaction: CheckingAccountTransactionEntity = {
      id: uuidv4(),
      statementId,
      transactionDate,
      transactionType,
      name,
      memo,
      amount,
    };

    transactions.push(checkingAccountTransaction);
  }

  await addCheckingAccountTransactionsToDb(transactions);

  console.log('processCheckingAccountStatement complete');

  return Promise.resolve(errorList);
}

const getIsoDate = (dateStr: string): string => {
  const year = dateStr.substring(6, 10);
  const yearValue = parseInt(year);
  const month = dateStr.substring(0, 2);
  const monthIndex = parseInt(month) - 1;
  const day = dateStr.substring(3, 5);
  const dayValue = parseInt(day);
  const date = new Date(yearValue, monthIndex, dayValue);
  return date.toISOString();
}

function isValidDate(dateString: string): boolean {
  // Check if the string can be parsed into a date
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return false;
  }

  // Additional check to ensure the parsed date matches the input string
  // This prevents cases where invalid dates like "2023-02-30" are parsed as valid dates
  const [month, day, year] = dateString.split('/').map(Number);

  if (year !== date.getFullYear() || month !== (date.getMonth() + 1) || day !== date.getDate()) {
    return false;
  }

  return true;
}

const isEmptyLine = (lineOfInput: any[]): boolean => {
  const columnValues: any[] = Object.values(lineOfInput);
  for (const columnValue of columnValues) {
    if (!isBoolean(columnValue)) {
      return false;
    }
  }
  return true;
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
