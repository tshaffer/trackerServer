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
  BankTransactionEntity,
  ReviewedTransactionEntities
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
import { BankTransactionType, DisregardLevel, StatementType } from '../types/enums';
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
  const allCategories: CategoryEntity[] = await getCategoriesFromDb();
  const categories: CategoryEntity[] = [];
  for (const category of allCategories) {
    if (category.disregardLevel === DisregardLevel.None) {
      categories.push(category);
    }
  }
  response.json(categories);
};

export const getCategorizedTransactions = async (request: Request, response: Response, next: any) => {

  console.log('getCategorizedTransactions');

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
  console.log('unidentifiedBankTransactionEntities: ', unidentifiedBankTransactions);

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

  // console.log(uncategorizedTransaction);
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

  console.log('sum: ', sum);
  const sumString: string = (-sum).toFixed(2);
  console.log('sumString: ', sumString);
  const roundedSum: number = roundTo(-sum, 2);
  console.log('roundedSum: ', roundedSum);

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

  // console.log(transaction);
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
      bankTransactionType: BankTransactionType.CreditCard,
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
      bankTransactionType: BankTransactionType.Checking,
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
