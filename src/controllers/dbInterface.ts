import {
  CategoryEntity,
  CheckingAccountTransactionEntity,
  CategoryKeywordEntity,
  CreditCardTransactionEntity,
  StatementEntity,
  MinMaxStartDates
} from 'entities';

import {
  getCreditCardTransactionModel,
  getCheckingAccountTransactionModel,
  getCategoryModel,
  getCategoryKeywordModel,
  getStatementModel
} from '../models';
import { BankTransactionType } from '../types/enums';

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
    transaction.bankTransactionType = BankTransactionType.Checking;
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
    transaction.bankTransactionType = BankTransactionType.CreditCard;
    transactions.push(transaction);
  }
  return transactions;
}

export const getCategoriesFromDb = async (
): Promise<CategoryEntity[]> => {

  console.log('getCategoriesFromDb: ');

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
  const categoryKeywordEntities: CategoryKeywordEntity[] = [];
  for (const document of documents) {
    const categoryKeywordEntity: CategoryKeywordEntity = document.toObject() as CategoryKeywordEntity;
    categoryKeywordEntities.push(categoryKeywordEntity);
  }
  return categoryKeywordEntities;
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

export const addCategoriesToDb = async (categories: CategoryEntity[]): Promise<any> => {
  const categoryModel = getCategoryModel();
  return categoryModel.collection.insertMany(categories)
    .then((retVal: any) => {
      return Promise.resolve(retVal);
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

export const getDuplicateCreditCardTransactionsDb = async (): Promise<CreditCardTransactionEntity[]> => {

  const creditCardTransactionModel = getCreditCardTransactionModel();

  const query = creditCardTransactionModel.aggregate([
    {
      $group: {
        _id: {
          amount: "$amount",
          postDate: "$postDate",
          description: "$description"
        },
        count: { $sum: 1 },
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    },
    {
      $unwind: "$docs"
    },
    {
      $replaceRoot: { newRoot: "$docs" }
    }
  ]);

  const transactions: CreditCardTransactionEntity[] = await query.exec();
  return transactions;
}

export const removeDuplicateCreditCardTransactionsDb = async (idsToDelete: string[]): Promise<void> => {
  const creditCardTransactionModel = getCreditCardTransactionModel();
  return creditCardTransactionModel.deleteMany({ _id: { $in: idsToDelete } })
    .then((deleteResult) => {
      console.log('Deleted documents count:', deleteResult.deletedCount);
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db deleteMany error: ', error);
      debugger;
      return null;
    });
}

export const getMinMaxCreditCardTransactionDatesFromDb = async (): Promise<MinMaxStartDates> => {
  return getMinMaxTransactionDatesFromDb(getCreditCardTransactionModel());
}

export const getMinMaxCheckingAccountTransactionDatesFromDb = async (): Promise<MinMaxStartDates> => {
  return getMinMaxTransactionDatesFromDb(getCheckingAccountTransactionModel());
}

const getMinMaxTransactionDatesFromDb = async (model: any): Promise<MinMaxStartDates> => {

  const query = model.aggregate([
    {
      $group: {
        _id: null,
        minTransactionDate: { $min: "$transactionDate" },
        maxTransactionDate: { $max: "$transactionDate" }
      }
    }
  ]);

  const result: any = await query.exec();

  return {
    minDate: result[0].minTransactionDate,
    maxDate: result[0].maxTransactionDate
  };
}



