import { CreditCardTransactionEntity, StatementEntity } from 'entities';

import { getCreditCardTransactionModel, getCheckingAccountTransactionModel } from '../models';
import Statement, { getStatementModel } from '../models/Statement';

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
