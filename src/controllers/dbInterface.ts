import { CreditCardCategoryEntity, CreditCardDescriptionKeywordEntity, CreditCardTransactionEntity, StatementEntity } from 'entities';

import { getCreditCardTransactionModel, getCheckingAccountTransactionModel, getCreditCardCategoryKeywordModel, getCreditCardDescriptionKeywordModel } from '../models';
import Statement, { getStatementModel } from '../models/Statement';
import { start } from 'repl';

export const createStatement = async (statementEntity: StatementEntity): Promise<string> => {
  return Statement.create(statementEntity)
    .then((statement) => {
      console.log(statement);
      return statementEntity.id;
    }).catch((err: any) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        console.log('Duplicate key error in createStatement: ', statementEntity);
      }
      return Promise.reject(err);
    });
}

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


// export const createCreditCardTransaction = (creditCardTransactionEntity: CreditCardTransactionEntity): Promise<Document | void> => {
//   return CreditCardTransaction.create(creditCardTransactionEntity)
//     .then((creditCardTransaction: Document) => {
//       return Promise.resolve(creditCardTransaction);
//     }).catch((err: any) => {
//       if (err.name === 'MongoError' && err.code === 11000) {
//         console.log('Duplicate key error in createScheduledMealDocument: ', creditCardTransactionEntity);
//       }
//       // return Promise.reject(err);
//       return Promise.resolve();
//     });
// }

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
): Promise<CreditCardCategoryEntity[]> => {

  console.log('getCreditCardCategoriesFromDb: ');

  const creditCardCategoryModel = getCreditCardCategoryKeywordModel();

  const query = creditCardCategoryModel.find();

  const documents: any = await query.exec();
  const categories: CreditCardCategoryEntity[] = [];
  for (const document of documents) {
    const category: CreditCardCategoryEntity = document.toObject() as CreditCardCategoryEntity;
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


