import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';
import { version } from '../version';
import multer from 'multer';
import * as fs from 'fs';
import Papa from 'papaparse';
import { isNil, isNumber } from 'lodash';
import {
  CategorizedStatementData,
  CheckingAccountTransactionEntity,
  CategoryEntity,
  CategoryKeywordEntity,
  CheckingAccountStatementEntity,
  CreditCardStatementEntity,
  CreditCardTransactionEntity,
  CategorizedTransactionEntity,
  BankTransactionEntity,
  ReviewedTransactionEntities,
  MinMaxStartDates
} from '../types';
import {
  addCategoryKeywordToDb,
  addCategoryToDb,
  addCheckingAccountTransactionsToDb,
  addCreditCardTransactionsToDb,
  getCheckingAccountTransactionsFromDb,
  getCategoriesFromDb,
  getCategoryKeywordsFromDb,
  getCreditCardTransactionsFromDb,
  getDuplicateCreditCardTransactionsDb,
  removeDuplicateCreditCardTransactionsDb,
  getMinMaxCreditCardTransactionDatesFromDb,
  addCategoriesToDb,
  getMinMaxCheckingAccountTransactionDatesFromDb,
  deleteCategoryKeywordFromDb,
  updateCategoryKeywordInDb,
  getCreditCardStatementsFromDb,
  getCheckingAccountStatementsFromDb,
  addCreditCardStatementToDb,
  addCheckingAccountStatementToDb
} from './dbInterface';
import { BankTransactionType, DisregardLevel, StatementType } from '../types/enums';
import { getIsoDate, isEmptyLine, isValidDate, roundTo } from '../utilities';

export const getVersion = (request: Request, response: Response, next: any) => {
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getCategories = async (request: Request, response: Response, next: any) => {
  const allCategories: CategoryEntity[] = await getCategoriesFromDb();
  const categories: CategoryEntity[] = [];
  for (const category of allCategories) {
    if (category.disregardLevel === DisregardLevel.None) {
      categories.push(category);
    }
  }
  response.json(categories);
};

export const getCategoryKeywords = async (request: Request, response: Response, next: any) => {
  const categoryKeywords: CategoryKeywordEntity[] = await getCategoryKeywordsFromDb();
  response.json(categoryKeywords);
};

export const getCreditCardStatements = async (request: Request, response: Response, next: any) => {
  const creditCardStatements: CreditCardStatementEntity[] = await getCreditCardStatementsFromDb();
  response.json(creditCardStatements);
};

export const getCheckingAccountStatements = async (request: Request, response: Response, next: any) => {
  const checkingAccountStatements: CheckingAccountStatementEntity[] = await getCheckingAccountStatementsFromDb();
  response.json(checkingAccountStatements);
};

export const getCategorizedTransactions = async (request: Request, response: Response, next: any) => {
  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;

  const allCategories: CategoryEntity[] = await getCategoriesFromDb();
  const categories: CategoryEntity[] = [];
  for (const category of allCategories) {
    if (category.disregardLevel === DisregardLevel.None) {
      categories.push(category);
    }
  }

  const categoryKeywords: CategoryKeywordEntity[] = await getCategoryKeywordsFromDb();

  const checkingAccountTransactions: BankTransactionEntity[] = await getCheckingAccountTransactionsFromDb(startDate, endDate);
  const creditCardTransactions: BankTransactionEntity[] = await getCreditCardTransactionsFromDb(startDate, endDate);
  const allTransactions: BankTransactionEntity[] = checkingAccountTransactions.concat(creditCardTransactions);

  const reviewedTransactionEntities: ReviewedTransactionEntities = categorizeTransactions(allTransactions, categories, categoryKeywords);
  const categorizedTransactions: CategorizedTransactionEntity[] = reviewedTransactionEntities.categorizedTransactions;
  const uncategorizedTransactions: BankTransactionEntity[] = reviewedTransactionEntities.uncategorizedTransactions;
  // TEDTODO - fetch the ignoredCategoryId from the database; support multiple ignored categories
  const unidentifiedBankTransactions: BankTransactionEntity[] = getUnidentifiedTransactions(uncategorizedTransactions, "9a5cf18d-e308-4f9f-8dc4-e026dfb7833b", categoryKeywords);

  const transactions: CategorizedTransactionEntity[] = [];
  let sum = 0;

  for (const categorizedTransaction of categorizedTransactions) {
    const transaction: CategorizedTransactionEntity = {
      bankTransactionEntity: categorizedTransaction.bankTransactionEntity,
      categoryEntity: categorizedTransaction.categoryEntity,
    };
    transactions.push(transaction);
    sum += transaction.bankTransactionEntity.amount;
  }

  sum = roundTo(-sum, 2)

  const categorizedStatementData: CategorizedStatementData = {
    startDate,
    endDate,
    transactions,
    total: sum,
    unidentifiedBankTransactions,
  };

  response.json(categorizedStatementData);
};

const getUnidentifiedTransactions = (
  uncategorizedTransactions: BankTransactionEntity[],
  ignoredCategoryId: string,
  categoryKeywordEntities: CategoryKeywordEntity[],
): BankTransactionEntity[] => {

  const unidentifiedBankTransactionEntities: BankTransactionEntity[] = [];

  for (const transaction of uncategorizedTransactions) {
    if (isUnidentifiedTransaction(transaction, ignoredCategoryId, categoryKeywordEntities)) {
      unidentifiedBankTransactionEntities.push(transaction);
    }
  }
  return unidentifiedBankTransactionEntities;
}

const isUnidentifiedTransaction = (uncategorizedTransaction: BankTransactionEntity, ignoredCategoryId: string, categoryKeywords: CategoryKeywordEntity[]): boolean => {

  const transactionDetails: string = uncategorizedTransaction.bankTransactionType === BankTransactionType.CreditCard ?
    (uncategorizedTransaction as CreditCardTransactionEntity).description : (uncategorizedTransaction as CheckingAccountTransactionEntity).name;

  for (const categoryKeyword of categoryKeywords) {
    if (transactionDetails.includes(categoryKeyword.keyword)) {
      if (ignoredCategoryId === categoryKeyword.categoryId) {
        return false;
      }
    }
  }

  return true;
}


const categorizeTransactions = (
  transactions: BankTransactionEntity[],
  categories: CategoryEntity[],
  categoryKeywordEntities: CategoryKeywordEntity[]
): ReviewedTransactionEntities => {

  const categorizedTransactions: CategorizedTransactionEntity[] = [];
  const uncategorizedTransactions: BankTransactionEntity[] = [];

  let sum: number = 0;

  for (const transaction of transactions) {
    const category: CategoryEntity | null = categorizeTransaction(transaction, categories, categoryKeywordEntities);
    if (!isNil(category)) {
      const categorizedTransaction: CategorizedTransactionEntity = {
        bankTransactionEntity: transaction,
        categoryEntity: category,
      };
      categorizedTransactions.push(categorizedTransaction);

      sum += transaction.amount;
    } else {
      uncategorizedTransactions.push(transaction);
    }
  }

  return {
    categorizedTransactions,
    uncategorizedTransactions
  };
};

const categorizeTransaction = (
  transaction: BankTransactionEntity,
  categories: CategoryEntity[],
  categoryKeywords: CategoryKeywordEntity[]): CategoryEntity | null => {

  const transactionDetails: string = transaction.bankTransactionType === BankTransactionType.CreditCard ?
    (transaction as CreditCardTransactionEntity).description : (transaction as CheckingAccountTransactionEntity).name;

  for (const categoryKeyword of categoryKeywords) {
    if (transactionDetails.includes(categoryKeyword.keyword)) {
      const categoryKeywordEntity: CategoryKeywordEntity = categoryKeyword;
      const categoryId = categoryKeywordEntity.categoryId;
      for (const category of categories) {
        if (category.id === categoryId) {
          return category;
        }
      }
    }
  }

  if (transaction.bankTransactionType === BankTransactionType.CreditCard) {
    if (!isNil((transaction as unknown as CreditCardTransactionEntity).category)) {
      for (const category of categories) {
        if ((transaction as unknown as CreditCardTransactionEntity).category === category.keyword) {
          return category;
        }
      }
    }
  }

  return null;
};

export const uploadStatement = async (request: Request, response: Response, next: any) => {

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

const processStatement = async (originalFileName: string, csvTransactions: any[]): Promise<string> => {

  const statementId: string = uuidv4();

  if (originalFileName.startsWith('Chase7011_Activity') || originalFileName.startsWith('Chase5014_Activity')) {

    // Chase7011_Activity20220601_20221231_20240521.csv
    const startDateStr: string = originalFileName.substring(18, 26);
    const dbStartDate: string = getCreditCardStatementDate(startDateStr);
    const endDateStr: string = originalFileName.substring(27, 35);
    const dbEndDate: string = getCreditCardStatementDate(endDateStr);

    const statementEntity: CreditCardStatementEntity = {
      id: statementId,
      fileName: originalFileName,
      type: StatementType.CreditCard,
      startDate: dbStartDate,
      endDate: dbEndDate,
      transactionCount: 0,
      netSpent: 0,
    };
    await processCreditCardStatement(statementEntity, csvTransactions);
    await addCreditCardStatementToDb(statementEntity);
    await executeRemoveDuplicateCreditCardTransactions();
    await executeAddReferencedCategories();
    return Promise.resolve(statementId);

  } else if (originalFileName.startsWith('Cash Reserve - 2137_')) {

    // Cash Reserve - 2137_07-01-2023_12-31-2023.csv
    const startDateStr: string = originalFileName.substring(20, 30);
    const dbStartDate: string = getCheckingAccountStatementDate(startDateStr);
    const endDateStr: string = originalFileName.substring(31, 41);
    const dbEndDate: string = getCheckingAccountStatementDate(endDateStr);

    const statementEntity: CheckingAccountStatementEntity = {
      id: statementId,
      fileName: originalFileName,
      type: StatementType.Checking,
      startDate: dbStartDate,
      endDate: dbEndDate,
      transactionCount: 0,
      netSpent: 0,
      checkCount: 0,
      atmWithdrawalCount: 0,
    };
    await processCheckingAccountStatement(statementEntity, csvTransactions);
    await addCheckingAccountStatementToDb(statementEntity);
    return Promise.resolve(statementId);

  } else {
    console.log('originalFileName does not match expected pattern: ', originalFileName);
    return Promise.reject('Invalid file name');
  };
}

const processCreditCardStatement = async (creditCardStatementEntity: CreditCardStatementEntity, csvTransactions: any[]) => {

  const transactions: CreditCardTransactionEntity[] = [];

  let netSpent = 0;

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

    netSpent += amount;

    const creditCardTransaction: CreditCardTransactionEntity = {
      id: uuidv4(),
      statementId: creditCardStatementEntity.id,
      transactionDate,
      postDate,
      description,
      category,
      type,
      amount,
      bankTransactionType: BankTransactionType.CreditCard,
    };

    transactions.push(creditCardTransaction);
  }

  creditCardStatementEntity.transactionCount = transactions.length;
  creditCardStatementEntity.netSpent = netSpent;

  console.log('netSpent: ', netSpent);

  await addCreditCardTransactionsToDb(transactions);
}

const processCheckingAccountStatement = async (checkingAccountStatementEntity: CheckingAccountStatementEntity, csvTransactions: any[]): Promise<any> => {

  const transactions: CheckingAccountTransactionEntity[] = [];

  let netSpent = 0;
  let checkCount = 0;
  let atmWithdrawalCount = 0;

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

    if (name === 'CHECK') {
      checkCount++;
    }
    if (name.startsWith('ATM WITHDRAWAL')) {
      atmWithdrawalCount++;
    }
    netSpent += amount;

    const checkingAccountTransaction: CheckingAccountTransactionEntity = {
      id: uuidv4(),
      statementId: checkingAccountStatementEntity.id,
      transactionDate,
      transactionType,
      name,
      memo,
      amount,
      bankTransactionType: BankTransactionType.Checking,
    };

    transactions.push(checkingAccountTransaction);
  }

  checkingAccountStatementEntity.transactionCount = transactions.length;
  checkingAccountStatementEntity.netSpent = netSpent;

  checkingAccountStatementEntity.checkCount = checkCount;
  checkingAccountStatementEntity.atmWithdrawalCount = atmWithdrawalCount;

  await addCheckingAccountTransactionsToDb(transactions);

  console.log('processCheckingAccountStatement complete');

  console.log('checkCount: ', checkCount);
  console.log('atmWithdrawalCount: ', atmWithdrawalCount);
  console.log('netSpent: ', netSpent);

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

export const addCategory = async (request: Request, response: Response, next: any) => {
  const { id, keyword } = request.body;
  const categoryEntity: CategoryEntity = {
    id,
    keyword,
    disregardLevel: DisregardLevel.None
  };
  await addCategoryToDb(categoryEntity);
  return response.status(200).send();
}

export const addCategoryKeyword = async (request: Request, response: Response, next: any) => {
  const { id, keyword, categoryId } = request.body;
  const categoryKeywordEntity: CategoryKeywordEntity = {
    id,
    keyword,
    categoryId,
  };
  await addCategoryKeywordToDb(categoryKeywordEntity);
  return response.status(200).send();
}

export const updateCategoryKeyword = async (request: Request, response: Response, next: any) => {
  const { id, keyword, categoryId } = request.body;
  const categoryKeywordEntity: CategoryKeywordEntity = {
    id,
    keyword,
    categoryId,
  };
  await updateCategoryKeywordInDb(categoryKeywordEntity);
  return response.status(200).send();
}

export const deleteCategoryKeyword = async (request: Request, response: Response, next: any) => {
  const { id, keyword, categoryId } = request.body;
  const categoryKeywordEntity: CategoryKeywordEntity = {
    id,
    keyword,
    categoryId,
  };
  await deleteCategoryKeywordFromDb(categoryKeywordEntity);
  return response.status(200).send();
}

const getDuplicateCreditCardTransactionsInternal = async () => {

  const duplicateCreditCardTransactions: CreditCardTransactionEntity[] = [];

  const creditCardTransactions: CreditCardTransactionEntity[] = await getDuplicateCreditCardTransactionsDb();

  const creditCardTransactionMap: Map<string, CreditCardTransactionEntity> = new Map();

  for (const creditCardTransaction of creditCardTransactions) {
    const key = creditCardTransaction.postDate + creditCardTransaction.description + creditCardTransaction.amount.toString();

    const existingCreditCardTransactionEntity: CreditCardTransactionEntity | undefined = creditCardTransactionMap.get(key);

    if (isNil(existingCreditCardTransactionEntity)) {
      creditCardTransactionMap.set(key, creditCardTransaction);
    } else {
      if (existingCreditCardTransactionEntity.statementId !== creditCardTransaction.statementId) {
        duplicateCreditCardTransactions.push(creditCardTransaction);
      }
    }
  }

  return duplicateCreditCardTransactions;
};

export const getDuplicateCreditCardTransactions = async (request: Request, response: Response, next: any) => {
  const duplicateCreditCardTransactions = await getDuplicateCreditCardTransactionsInternal();
  response.json(duplicateCreditCardTransactions);
}

export const removeDuplicateCreditCardTransactions = async (request: Request, response: Response, next: any) => {
  await executeRemoveDuplicateCreditCardTransactions();
  return response.status(200).send();
}

const executeRemoveDuplicateCreditCardTransactions = async () => {
  const duplicateCreditCardTransactions = await getDuplicateCreditCardTransactionsInternal();
  const idsToDelete: string[] = duplicateCreditCardTransactions.map(doc => (doc as any)._id);
  await removeDuplicateCreditCardTransactionsDb(idsToDelete);
}

// add categories that are referenced in credit card transactions but do not already exist in the db
export const addReferencedCategories = async (request: Request, response: Response, next: any) => {
  await executeAddReferencedCategories();
  return response.status(200).send();
}

const executeAddReferencedCategories = async () => {
  const minMaxTransactionDates: MinMaxStartDates = await getMinMaxCreditCardTransactionDatesFromDb();

  const { minDate, maxDate } = minMaxTransactionDates;
  const creditCardTransactions: CreditCardTransactionEntity[] = await getCreditCardTransactionsFromDb(minDate, maxDate);

  const referencedCategories = new Set<string>();

  creditCardTransactions.forEach((creditCardTransaction: CreditCardTransactionEntity) => {
    if (creditCardTransaction.category.length > 0 && creditCardTransaction.category !== 'false') {
      referencedCategories.add(creditCardTransaction.category);
    }
  });

  const existingCategories: CategoryEntity[] = await getCategoriesFromDb();

  const referencedArray: string[] = Array.from(referencedCategories);
  const existingKeywords: Set<string> = new Set<string>(existingCategories.map(category => category.keyword));
  const newCategories: string[] = referencedArray.filter(category => !existingKeywords.has(category));

  const categoryEntities: CategoryEntity[] = newCategories.map((keyword: string) => {
    return {
      id: uuidv4(),
      keyword,
      disregardLevel: DisregardLevel.None,
    };
  });

  await addCategoriesToDb(categoryEntities);
}

export const getMinMaxCreditCardTransactionDates = async (request: Request, response: Response, next: any) => {
  const minMaxTransactionDates = await getMinMaxCreditCardTransactionDatesFromDb();
  response.json(minMaxTransactionDates);
}

export const getMinMaxCheckingAccountTransactionDates = async (request: Request, response: Response, next: any) => {
  const minMaxTransactionDates = await getMinMaxCheckingAccountTransactionDatesFromDb();
  response.json(minMaxTransactionDates);
}
