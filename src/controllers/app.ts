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
  CreditCardTransactionEntity,
  StatementEntity,
  CategorizedTransactionEntity,
  CheckingAccountNameKeywordEntity,
  CategorizedCheckingAccountTransactionEntity,
  TransactionEntity
} from 'entities';
import {
  addCategoryKeywordToDb,
  addCategoryToDb,
  addCheckingAccountTransactionsToDb,
  addCreditCardTransactionsToDb,
  addStatementToDb,
  getCheckingAccountTransactionsFromDb,
  getCategoriesFromDb,
  getCategoryKeywordsFromDb,
  getCreditCardTransactionsFromDb
} from './dbInterface';
import { StatementType } from '../types/enums';
import { getIsoDate, isEmptyLine, isValidDate, roundTo } from '../utilities';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getCategories = async (request: Request, response: Response, next: any) => {
  console.log('getCategories');
  const categories: CategoryEntity[] = await getCategoriesFromDb();
  response.json(categories);
};

export const getCategorizedTransactions = async (request: Request, response: Response, next: any) => {

  console.log('getCategorizedTransactions');

  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;

  const categories: CategoryEntity[] = await getCategoriesFromDb();
  const categoryKeywords: CategoryKeywordEntity[] = await getCategoryKeywordsFromDb();

  const checkingAccountTransactions: CheckingAccountTransactionEntity[] = await getCheckingAccountTransactionsFromDb(startDate, endDate);
  const categorizedCheckingAccountTransactions: CategorizedCheckingAccountTransactionEntity[] = categorizeCheckingAccountTransactions(checkingAccountTransactions, categories, categoryKeywords);

  const creditCardTransactions: CreditCardTransactionEntity[] = await getCreditCardTransactionsFromDb(startDate, endDate);
  const categorizedTransactions: CategorizedTransactionEntity[] = categorizeTransactions(creditCardTransactions, categories, categoryKeywords);

  const transactions: TransactionEntity[] = [];
  let sum = 0;

  for (const categorizedTransaction of categorizedCheckingAccountTransactions) {
    const transaction: TransactionEntity = {
      id: categorizedTransaction.transaction.id,
      statementId: categorizedTransaction.transaction.statementId,
      transactionDate: categorizedTransaction.transaction.transactionDate,
      amount: categorizedTransaction.transaction.amount,
      description: categorizedTransaction.transaction.name,
      category: categorizedTransaction.category.keyword,
    };
    transactions.push(transaction);
    sum += categorizedTransaction.transaction.amount;
  }
  for (const categorizedTransaction of categorizedTransactions) {
    const transaction: TransactionEntity = {
      id: categorizedTransaction.transaction.id,
      statementId: categorizedTransaction.transaction.statementId,
      transactionDate: categorizedTransaction.transaction.transactionDate,
      amount: categorizedTransaction.transaction.amount,
      description: categorizedTransaction.transaction.description,
      category: categorizedTransaction.category.keyword,
    };
    transactions.push(transaction);
    sum += categorizedTransaction.transaction.amount;
  }

  sum = roundTo(-sum, 2)

  const categorizedStatementData: CategorizedStatementData = {
    startDate,
    endDate,
    transactions,
    total: sum,
  };

  response.json(categorizedStatementData);
};

const categorizeCheckingAccountTransactions = (
  transactions: CheckingAccountTransactionEntity[],
  checkingAccountCategories: CategoryEntity[],
  checkingAccountNameKeywords: CheckingAccountNameKeywordEntity[]): CategorizedCheckingAccountTransactionEntity[] => {

  const categorizedTransactions: CategorizedCheckingAccountTransactionEntity[] = [];

  let sum: number = 0;

  for (const transaction of transactions) {
    const category: CategoryEntity | null = categorizeCheckingAccountTransaction(transaction, checkingAccountCategories, checkingAccountNameKeywords);
    if (!isNil(category)) {
      const categorizedTransaction: CategorizedCheckingAccountTransactionEntity = {
        transaction,
        category,
      };
      categorizedTransactions.push(categorizedTransaction);

      sum += transaction.amount;
    }
    else {
      console.log('uncategorized transaction: ', transaction.name);
    }
  }

  // console.log('sum: ', sum);
  // const sumString: string = (-sum).toFixed(2);
  // console.log('sumString: ', sumString);
  // const roundedSum: number = roundTo(-sum, 2);
  // console.log('roundedSum: ', roundedSum);

  return categorizedTransactions;
};

const categorizeCheckingAccountTransaction = (
  transaction: CheckingAccountTransactionEntity,
  checkingAccountCategories: CategoryEntity[],
  checkingAccountNameKeywords: CheckingAccountNameKeywordEntity[]): CategoryEntity | null => {

  for (const nameKeyword of checkingAccountNameKeywords) {
    if (transaction.name.includes(nameKeyword.keyword)) {
      const checkingAccountNameKeywordEntity: CheckingAccountNameKeywordEntity = nameKeyword;
      const categoryId = checkingAccountNameKeywordEntity.categoryId;
      for (const category of checkingAccountCategories) {
        if (category.id === categoryId) {
          return category;
        }
      }
    }
  }

  for (const category of checkingAccountCategories) {
    if (transaction.transactionType === category.keyword) {
      return category;
    }
  }

  // console.log(transaction);
  return null;
}

const categorizeTransactions = (
  transactions: CreditCardTransactionEntity[],
  categories: CategoryEntity[],
  creditCardDescriptionKeywords: CategoryKeywordEntity[]): CategorizedTransactionEntity[] => {

  const categorizedTransactions: CategorizedTransactionEntity[] = [];

  let sum: number = 0;

  for (const transaction of transactions) {
    const category: CategoryEntity | null = categorizeTransaction(transaction, categories, creditCardDescriptionKeywords);
    if (!isNil(category)) {
      const categorizedTransaction: CategorizedTransactionEntity = {
        transaction,
        category,
      };
      categorizedTransactions.push(categorizedTransaction);

      sum += transaction.amount;
    }
  }

  console.log('sum: ', sum);
  const sumString: string = (-sum).toFixed(2);
  console.log('sumString: ', sumString);
  const roundedSum: number = roundTo(-sum, 2);
  console.log('roundedSum: ', roundedSum);

  return categorizedTransactions;
};

const categorizeTransaction = (
  transaction: CreditCardTransactionEntity,
  categories: CategoryEntity[],
  categoryKeywords: CategoryKeywordEntity[]): CategoryEntity | null => {

  for (const descriptionKeyword of categoryKeywords) {
    if (transaction.description.includes(descriptionKeyword.keyword)) {
      const categoryKeywordEntity: CategoryKeywordEntity = descriptionKeyword;
      const categoryId = categoryKeywordEntity.categoryId;
      for (const category of categories) {
        if (category.id === categoryId) {
          return category;
        }
      }
    }
  }

  for (const category of categories) {
    if (transaction.category === category.keyword) {
      return category;
    }
  }

  console.log(transaction);
  return null;
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

const processStatement = async (originalFileName: string, csvTransactions: any[]): Promise<string> => {

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
    return Promise.resolve(statementId);
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
    return Promise.resolve(statementId);
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
  };
  await addCategoryToDb(categoryEntity);
  return response.status(200).send();
}

export const addCategoryKeyword = async (request: Request, response: Response, next: any) => {
  const { id, keyword, categoryId } = request.body;
  const creditCardDescriptionKeywordEntity: CategoryKeywordEntity = {
    id,
    keyword,
    categoryId,
  };
  await addCategoryKeywordToDb(creditCardDescriptionKeywordEntity);
  return response.status(200).send();
}
