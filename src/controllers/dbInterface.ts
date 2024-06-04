import {
  CategoryEntity,
  CheckingAccountTransactionEntity,
  CategoryKeywordEntity,
  CreditCardTransactionEntity,
  StatementEntity
} from 'entities';

import {
  getCreditCardTransactionModel,
  getCheckingAccountTransactionModel,
  getCategoryModel,
  getCategoryKeywordModel,
  getStatementModel} from '../models';

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

export const getCheckingAccountTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CheckingAccountTransactionEntity[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getCheckingAccountTransactionsFromDb: ', querySpec);

  const checkingAccountTransactionModel = getCheckingAccountTransactionModel();

  const query = checkingAccountTransactionModel.find(querySpec);

  const documents: any = await query.exec();
  const transactions: CheckingAccountTransactionEntity[] = [];
  for (const document of documents) {
    const transaction: CheckingAccountTransactionEntity = document.toObject() as any;
    transactions.push(transaction);
  }
  return transactions;
};

export const getCreditCardTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CreditCardTransactionEntity[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getCreditCardTransactionsFromDb: ', querySpec);

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

export const getCategoryKeywordsFromDb = async (
): Promise<CategoryKeywordEntity[]> => {

  console.log('getCategoryKeywordsFromDb: ');

  const categoryKeywordModel = getCategoryKeywordModel();

  const query = categoryKeywordModel.find();

  const documents: any = await query.exec();
  const descriptionKeywords: CategoryKeywordEntity[] = [];
  for (const document of documents) {
    const descriptionKeyword: CategoryKeywordEntity = document.toObject() as CategoryKeywordEntity;
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

export const addCategoryKeywordToDb = async (categoryKeywordEntity: CategoryKeywordEntity): Promise<void> => {
  const categoryKeywordModel = getCategoryKeywordModel();
  return categoryKeywordModel.collection.insertOne(categoryKeywordEntity)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

