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

/*
const mongoose = require('mongoose');

const creditCardTransactionSchema = new mongoose.Schema({
    id: String,
    postDate: String,
    amount: Number
});

const CreditCardTransaction = mongoose.model('CreditCardTransaction', creditCardTransactionSchema);

mongoose.connect('mongodb://localhost:27017/yourdbname', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');

    return CreditCardTransaction.aggregate([
        {
            $group: {
                _id: "$amount",
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
}).then(results => {
    console.log(results);
}).catch(error => {
    console.error(error);
}).finally(() => {
    mongoose.connection.close();
});
*/

export const getDuplicateCreditCardTransactionsDb = async (): Promise<CreditCardTransactionEntity[]> => {
  const creditCardTransactionModel = getCreditCardTransactionModel();

  const query = creditCardTransactionModel.aggregate([
    {
      $group: {
        _id: {
          amount: "$amount",
          postDate: "$postDate"
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

  // const documents: any = await query.exec();
  // const transactions: CreditCardTransactionEntity[] = [];
  // for (const document of documents) {
  //   const transaction: CreditCardTransactionEntity = document.toObject() as CreditCardTransactionEntity;
  //   transactions.push(transaction);
  // }
  // return transactions;
  const transactions: CreditCardTransactionEntity[] = await query.exec();
  return transactions;
}

/*
db.creditcardtransactions.aggregate([
    {
        $group: {
            _id: "$amount",
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
])
*/