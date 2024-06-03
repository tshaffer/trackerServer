import { CategoryEntity, CheckingAccountNameKeywordEntity, CheckingAccountTransactionEntity, CreditCardDescriptionKeywordEntity, CreditCardTransactionEntity, StatementEntity } from 'entities';

import {
  getCreditCardTransactionModel,
  getCheckingAccountTransactionModel,
  getCategoryModel,
  getCreditCardDescriptionKeywordModel,
  getStatementModel,
  getCheckingAccountNameKeywordModel,
  getCheckingAccountCategoryModel
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

export const addCategoryKeywordToDb = async (creditCardDescriptionKeywordEntity: CreditCardDescriptionKeywordEntity): Promise<void> => {
  const creditCardDescriptionKeywordModel = getCreditCardDescriptionKeywordModel();
  return creditCardDescriptionKeywordModel.collection.insertOne(creditCardDescriptionKeywordEntity)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const getCheckingAccountNameKeywordsFromDb = async (
): Promise<CheckingAccountNameKeywordEntity[]> => {

  console.log('getCheckingAccountNameKeywordsFromDb: ');

  const checkingAccountNameKeywordModel = getCheckingAccountNameKeywordModel();

  const query = checkingAccountNameKeywordModel.find();

  const documents: any = await query.exec();
  const descriptionKeywords: CheckingAccountNameKeywordEntity[] = [];
  for (const document of documents) {
    const descriptionKeyword: CheckingAccountNameKeywordEntity = document.toObject() as CheckingAccountNameKeywordEntity;
    descriptionKeywords.push(descriptionKeyword);
  }
  return descriptionKeywords;
}

export const getCheckingAccountCategoriesFromDb = async (
): Promise<CategoryEntity[]> => {

  console.log('getCheckingAccountCategoriesFromDb: ');

  const checkingAccountCategoryModel = getCheckingAccountCategoryModel();

  const query = checkingAccountCategoryModel.find();

  const documents: any = await query.exec();
  const categories: CategoryEntity[] = [];
  for (const document of documents) {
    const category: CategoryEntity = document.toObject() as CategoryEntity;
    categories.push(category);
  }
  return categories;
}



