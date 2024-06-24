import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';
import { version } from '../version';
import multer from 'multer';
import * as fs from 'fs';
import Papa from 'papaparse';
import { isNil, isNumber } from 'lodash';
import {
  CategorizedStatementData,
  CheckingAccountTransaction,
  Category,
  CategoryAssignmentRule,
  CheckingAccountStatement,
  CreditCardStatement,
  CreditCardTransaction,
  CategorizedTransaction,
  BankTransaction,
  ReviewedTransactions,
  MinMaxDates
} from '../types';
import {
  addCategoryAssignmentRuleToDb,
  addCategoryToDb,
  addCheckingAccountTransactionsToDb,
  addCreditCardTransactionsToDb,
  getCheckingAccountTransactionsFromDb,
  getCategoriesFromDb,
  getCategoryAssignmentRulesFromDb,
  getCreditCardTransactionsFromDb,
  getDuplicateCreditCardTransactionsDb,
  removeDuplicateCreditCardTransactionsDb,
  getMinMaxCreditCardTransactionDatesFromDb,
  addCategoriesToDb,
  getMinMaxCheckingAccountTransactionDatesFromDb,
  deleteCategoryAssignmentRuleFromDb,
  updateCategoryAssignmentRuleInDb,
  getCreditCardStatementsFromDb,
  getCheckingAccountStatementsFromDb,
  addCreditCardStatementToDb,
  addCheckingAccountStatementToDb,
  getCategoryByNameFromDb
} from './dbInterface';
import { BankTransactionType, DisregardLevel, StatementType } from '../types/enums';
import { getIsoDate, isEmptyLine, isValidDate, roundTo } from '../utilities';

export const initializeDB = async (request: Request, response: Response, next: any) => {

  // add Ignore category if it does not already exist
  const ignoreCategoryName = 'Ignore';
  const ignoreCategory: Category | null = await getCategoryByNameFromDb(ignoreCategoryName);
  if (isNil(ignoreCategory)) {
    const id: string = uuidv4();
    const ignoreCategory: Category = {
      id: id,
      name: ignoreCategoryName,
      disregardLevel: DisregardLevel.None,
    };
    await addCategoryToDb(ignoreCategory);
  }
  return response.status(200).send();
}

export const getVersion = (request: Request, response: Response, next: any) => {
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getCategories = async (request: Request, response: Response, next: any) => {
  const allCategories: Category[] = await getCategoriesFromDb();
  const categories: Category[] = [];
  for (const category of allCategories) {
    if (category.disregardLevel === DisregardLevel.None) {
      categories.push(category);
    }
  }
  response.json(categories);
};

export const getCategoryAssignmentRules = async (request: Request, response: Response, next: any) => {
  const categoryAssignmentRules: CategoryAssignmentRule[] = await getCategoryAssignmentRulesFromDb();
  response.json(categoryAssignmentRules);
};

export const getCreditCardStatements = async (request: Request, response: Response, next: any) => {
  const creditCardStatements: CreditCardStatement[] = await getCreditCardStatementsFromDb();
  response.json(creditCardStatements);
};

export const getCheckingAccountStatements = async (request: Request, response: Response, next: any) => {
  const checkingAccountStatements: CheckingAccountStatement[] = await getCheckingAccountStatementsFromDb();
  response.json(checkingAccountStatements);
};

export const getCategorizedTransactions = async (request: Request, response: Response, next: any) => {
  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;

  const allCategories: Category[] = await getCategoriesFromDb();
  const categories: Category[] = [];
  for (const category of allCategories) {
    if (category.disregardLevel === DisregardLevel.None) {
      categories.push(category);
    }
  }

  const categoryAssignmentRules: CategoryAssignmentRule[] = await getCategoryAssignmentRulesFromDb();

  const checkingAccountTransactions: BankTransaction[] = await getCheckingAccountTransactionsFromDb(startDate, endDate);
  const creditCardTransactions: BankTransaction[] = await getCreditCardTransactionsFromDb(startDate, endDate);
  const allTransactions: BankTransaction[] = checkingAccountTransactions.concat(creditCardTransactions);

  const reviewedTransactionEntities: ReviewedTransactions = categorizeTransactions(allTransactions, categories, categoryAssignmentRules);
  const categorizedTransactions: CategorizedTransaction[] = reviewedTransactionEntities.categorizedTransactions;
  const uncategorizedTransactions: BankTransaction[] = reviewedTransactionEntities.uncategorizedTransactions;
  // TEDTODO - fetch the ignoredCategoryId from the database; support multiple ignored categories
  const ignoreCategoryName = 'Ignore';
  const ignoreCategory: Category | null = await getCategoryByNameFromDb(ignoreCategoryName);
  if (isNil(ignoreCategory)) {
    return response.status(500).send();
  }
  const unidentifiedBankTransactions: BankTransaction[] = getUnidentifiedTransactions(uncategorizedTransactions, ignoreCategory.id, categoryAssignmentRules);

  const transactions: CategorizedTransaction[] = [];
  let sum = 0;

  for (const categorizedTransaction of categorizedTransactions) {
    const transaction: CategorizedTransaction = {
      bankTransaction: categorizedTransaction.bankTransaction,
      category: categorizedTransaction.category,
    };
    transactions.push(transaction);
    sum += transaction.bankTransaction.amount;
  }

  sum = roundTo(-sum, 2)

  const categorizedStatementData: CategorizedStatementData = {
    startDate,
    endDate,
    transactions,
    netDebits: sum,
    unidentifiedBankTransactions,
  };

  response.json(categorizedStatementData);
};

const getUnidentifiedTransactions = (
  uncategorizedTransactions: BankTransaction[],
  ignoredCategoryId: string,
  categoryAssignmentRules: CategoryAssignmentRule[],
): BankTransaction[] => {

  const unidentifiedBankTransactionEntities: BankTransaction[] = [];

  for (const transaction of uncategorizedTransactions) {
    if (isUnidentifiedTransaction(transaction, ignoredCategoryId, categoryAssignmentRules)) {
      unidentifiedBankTransactionEntities.push(transaction);
    }
  }
  return unidentifiedBankTransactionEntities;
}

const isUnidentifiedTransaction = (uncategorizedTransaction: BankTransaction, ignoredCategoryId: string, categoryAssignmentRules: CategoryAssignmentRule[]): boolean => {

  const transactionDetails: string = uncategorizedTransaction.bankTransactionType === BankTransactionType.CreditCard ?
    (uncategorizedTransaction as CreditCardTransaction).description : (uncategorizedTransaction as CheckingAccountTransaction).name;

  for (const categoryAssignmentRule of categoryAssignmentRules) {
    if (transactionDetails.includes(categoryAssignmentRule.pattern)) {
      if (ignoredCategoryId === categoryAssignmentRule.categoryId) {
        return false;
      }
    }
  }

  return true;
}

const categorizeTransactions = (
  transactions: BankTransaction[],
  categories: Category[],
  categoryAssignmentRules: CategoryAssignmentRule[]
): ReviewedTransactions => {

  const categorizedTransactions: CategorizedTransaction[] = [];
  const uncategorizedTransactions: BankTransaction[] = [];

  let sum: number = 0;

  for (const transaction of transactions) {
    const category: Category | null = categorizeTransaction(transaction, categories, categoryAssignmentRules);
    if (!isNil(category)) {
      const categorizedTransaction: CategorizedTransaction = {
        bankTransaction: transaction,
        category: category,
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
  transaction: BankTransaction,
  categories: Category[],
  categoryAssignmentRules: CategoryAssignmentRule[]): Category | null => {

  const transactionDetails: string = transaction.bankTransactionType === BankTransactionType.CreditCard ?
    (transaction as CreditCardTransaction).description : (transaction as CheckingAccountTransaction).name;

  for (const categoryAssignmentRule of categoryAssignmentRules) {
    if (transactionDetails.includes(categoryAssignmentRule.pattern)) {
      const matchingCategoryAssignmentRule: CategoryAssignmentRule = categoryAssignmentRule;
      const categoryId = matchingCategoryAssignmentRule.categoryId;
      for (const category of categories) {
        if (category.id === categoryId) {
          return category;
        }
      }
    }
  }

  if (transaction.bankTransactionType === BankTransactionType.CreditCard) {
    if (!isNil((transaction as unknown as CreditCardTransaction).category)) {
      for (const category of categories) {
        if ((transaction as unknown as CreditCardTransaction).category === category.name) {
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

    if (name === 'CHECK') {
      checkCount++;
    }
    if (name.startsWith('ATM WITHDRAWAL')) {
      atmWithdrawalCount++;
    }
    netDebits += amount;

    const checkingAccountTransaction: CheckingAccountTransaction = {
      id: uuidv4(),
      statementId: checkingAccountStatement.id,
      transactionDate,
      transactionType,
      name,
      memo,
      amount,
      bankTransactionType: BankTransactionType.Checking,
    };

    transactions.push(checkingAccountTransaction);
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

export const addCategory = async (request: Request, response: Response, next: any) => {
  const { id, name } = request.body;
  const category: Category = {
    id,
    name,
    disregardLevel: DisregardLevel.None
  };
  const addedCategory: Category = await addCategoryToDb(category);
  return response.json(addedCategory)
}

export const addCategoryAssignmentRule = async (request: Request, response: Response, next: any) => {
  const { id, pattern, categoryId } = request.body;
  const categoryAssignmentRule: CategoryAssignmentRule = {
    id,
    pattern,
    categoryId,
  };
  await addCategoryAssignmentRuleToDb(categoryAssignmentRule);
  return response.status(200).send();
}

export const updateCategoryAssignmentRule = async (request: Request, response: Response, next: any) => {
  const { id, pattern, categoryId } = request.body;
  const categoryAssignmentRule: CategoryAssignmentRule = {
    id,
    pattern,
    categoryId,
  };
  await updateCategoryAssignmentRuleInDb(categoryAssignmentRule);
  return response.status(200).send();
}

export const deleteCategoryAssignmentRule = async (request: Request, response: Response, next: any) => {
  const { id, pattern, categoryId } = request.body;
  const categoryAssignmentRule: CategoryAssignmentRule = {
    id,
    pattern,
    categoryId,
  };
  await deleteCategoryAssignmentRuleFromDb(categoryAssignmentRule);
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
