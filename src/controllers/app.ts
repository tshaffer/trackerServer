import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';
import { version } from '../version';

import { isNil } from 'lodash';
import {
  Category,
  CategoryAssignmentRule,
  CheckingAccountStatement,
  CreditCardStatement,
  CreditCardTransaction,
  SplitTransaction,
  Transaction
} from '../types';
import {
  addCategoryAssignmentRuleToDb,
  addCategoryToDb,
  getCategoriesFromDb,
  getCategoryAssignmentRulesFromDb,
  getMinMaxCreditCardTransactionDatesFromDb,
  getMinMaxCheckingAccountTransactionDatesFromDb,
  deleteCategoryAssignmentRuleFromDb,
  updateCategoryAssignmentRuleInDb,
  getCreditCardStatementsFromDb,
  getCheckingAccountStatementsFromDb,
  getCategoryByNameFromDb,
  updateTransactionInDb,
  splitTransactionInDb,
  replaceCategoryAssignmentRulesInDb,
  addCategoriesToDb,
  updateCategoryInTransactionsInDb,
  updateCategoryInDb,
  deleteCategoryFromDb,
  getTransactionsByCategoryAssignmentRuleIdFromDb,
  updateCategoryInCategoryAssignmentRuleInDb,
  updatePatternInCategoryAssignmentRuleInDb
} from './dbInterface';

export const initializeDB = async (request: Request, response: Response, next: any) => {

  // add Ignore category if it does not already exist
  const ignoreCategoryName = 'Ignore';
  const ignoreCategory: Category | null = await getCategoryByNameFromDb(ignoreCategoryName);
  if (isNil(ignoreCategory)) {
    const id: string = uuidv4();
    const ignoreCategory: Category = {
      id: id,
      name: ignoreCategoryName,
      parentId: '',
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
  response.json(allCategories);
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

export const addCategory = async (request: Request, response: Response, next: any) => {
  const { id, name, parentId, consensusImportance, loriImportance, tedImportance } = request.body;
  const category: Category = {
    id,
    name,
    parentId,
    consensusImportance,
    loriImportance,
    tedImportance,

  };
  const addedCategory: Category = await addCategoryToDb(category);
  return response.json(addedCategory)
}

export const updateCategory = async (request: Request, response: Response, next: any) => {
  const { id, name, parentId, consensusImportance, loriImportance, tedImportance } = request.body;
  const category: Category = {
    id,
    name,
    parentId,
    consensusImportance,
    loriImportance,
    tedImportance,

  };
  await updateCategoryInDb(category);
  return response.status(200).send();
}

export const deleteCategory = async (request: Request, response: Response, next: any) => {
  const { id } = request.body;
  await deleteCategoryFromDb(id);
  return response.status(200).send();
}

export const addCategories = async (request: Request, response: Response, next: any) => {
  const categories = request.body;
  await addCategoriesToDb(categories);
  return response.status(200).send();
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

export const replaceCategoryAssignmentRules = async (request: Request, response: Response, next: any) => {
  const categoryAssignmentRules = request.body;
  await replaceCategoryAssignmentRulesInDb(categoryAssignmentRules);
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

export const updatePatternInCategoryAssignmentRule = async (request: Request, response: Response, next: any) => {
  const { id, pattern } = request.body;
  await updatePatternInCategoryAssignmentRuleInDb(id, pattern);
  return response.status(200).send();
}

export const updateCategoryInCategoryAssignmentRule = async (request: Request, response: Response, next: any) => {
  const { id, categoryId } = request.body;
  await updateCategoryInCategoryAssignmentRuleInDb(id, categoryId);
  return response.status(200).send();
}

export const deleteCategoryAssignmentRule = async (request: Request, response: Response, next: any) => {
  const { id } = request.body;
  await deleteCategoryAssignmentRuleFromDb(id);
  return response.status(200).send();
}

export const getMinMaxCreditCardTransactionDates = async (request: Request, response: Response, next: any) => {
  const minMaxTransactionDates = await getMinMaxCreditCardTransactionDatesFromDb();
  response.json(minMaxTransactionDates);
}

export const getMinMaxCheckingAccountTransactionDates = async (request: Request, response: Response, next: any) => {
  const minMaxTransactionDates = await getMinMaxCheckingAccountTransactionDatesFromDb();
  response.json(minMaxTransactionDates);
}

export const updateTransaction = async (request: Request, response: Response, next: any) => {
  if (request.body.transaction) {
    await updateTransactionInDb(request.body.transaction);
  } else {
    await updateTransactionInDb(request.body.checkTransaction);
  }
  return response.status(200).send();
}

export const updateCategoryInTransactions = async (request: Request, response: Response, next: any) => {
  await updateCategoryInTransactionsInDb(request.body.categoryId, request.body.transactionIds);

  return response.status(200).send();
}

export const splitTransaction = async (request: Request, response: Response, next: any) => {
  console.log('splitTransaction');
  console.log(request.body);

  const parentTransactionId = request.body.parentTransactionId;
  const splitTransactions: SplitTransaction[] = request.body.newTransactions
  await splitTransactionInDb(parentTransactionId, splitTransactions);

  return response.status(200).send();
}

export const getTransactionsByCategoryAssignmentRuleId = async (request: Request, response: Response, next: any) => {
  const categoryAssignmentRuleId: string | null = request.query.categoryAssignmentRuleId ? request.query.categoryAssignmentRuleId as string : '';
  const transactions: Transaction[] = await getTransactionsByCategoryAssignmentRuleIdFromDb(categoryAssignmentRuleId);
  response.json(transactions);
}