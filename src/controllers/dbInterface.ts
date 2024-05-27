import { CategoryEntity, CreditCardDescriptionKeywordEntity, CreditCardTransactionEntity, StatementEntity } from 'entities';

import {
  getCreditCardTransactionModel,
  getCheckingAccountTransactionModel,
  getCategoryModel,
  getCreditCardDescriptionKeywordModel,
  getStatementModel,
} from '../models';

export const addStatementToDb = async (statement: StatementEntity): Promise<void> => {
  const statementModel = getStatementModel();
  return statementModel.collection.insertOne(statement)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCreditCardTransactionsToDb = async (creditCardTransactions: CreditCardTransactionEntity[]): Promise<any> => {
  const creditCardTransactionModel = getCreditCardTransactionModel();
  return creditCardTransactionModel.collection.insertMany(creditCardTransactions)
    .then((retVal: any) => {
      return Promise.resolve(retVal);
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCheckingAccountTransactionsToDb = async (checkingAccountTransactions: any[]): Promise<any> => {
  const checkingAccountTransactionModel = getCheckingAccountTransactionModel();
  return checkingAccountTransactionModel.collection.insertMany(checkingAccountTransactions)
    .then((retVal: any) => {
      return Promise.resolve(retVal);
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const getTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CreditCardTransactionEntity[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getTransactionsFromDb: ', querySpec);

  const creditCardTransactionModel = getCreditCardTransactionModel();

  const query = creditCardTransactionModel.find(querySpec);

  const documents: any = await query.exec();
  const transactions: CreditCardTransactionEntity[] = [];
  for (const document of documents) {
    const transaction: CreditCardTransactionEntity = document.toObject() as CreditCardTransactionEntity;
    transactions.push(transaction);
  }
  return transactions;
}

export const getCreditCardCategoriesFromDb = async (
): Promise<CategoryEntity[]> => {

  console.log('getCreditCardCategoriesFromDb: ');

  const creditCardCategoryModel = getCategoryModel();

  const query = creditCardCategoryModel.find();

  const documents: any = await query.exec();
  const categories: CategoryEntity[] = [];
  for (const document of documents) {
    const category: CategoryEntity = document.toObject() as CategoryEntity;
    categories.push(category);
  }
  return categories;
}

export const getCreditCardDescriptionKeywordsFromDb = async (
): Promise<CreditCardDescriptionKeywordEntity[]> => {

  console.log('getCreditCardDescriptionKeywordsFromDb: ');

  const creditCardDescriptionKeywordModel = getCreditCardDescriptionKeywordModel();

  const query = creditCardDescriptionKeywordModel.find();

  const documents: any = await query.exec();
  const descriptionKeywords: CreditCardDescriptionKeywordEntity[] = [];
  for (const document of documents) {
    const descriptionKeyword: CreditCardDescriptionKeywordEntity = document.toObject() as CreditCardDescriptionKeywordEntity;
    descriptionKeywords.push(descriptionKeyword);
  }
  return descriptionKeywords;
}


export const addCategoryToDb = async (category: CategoryEntity): Promise<void> => {
  const categoryModel = getCategoryModel();
  return categoryModel.collection.insertOne(category)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

