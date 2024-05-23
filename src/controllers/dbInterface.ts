import { isArray, isNil, isString } from 'lodash';
import { Document } from 'mongoose';
import { CreditCardTransactionEntity } from 'entities';

import CreditCardTransaction, { getCreditCardTransactionModel } from '../models/CreditCardTransaction';

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

export const addCreateCreditCardTransactionsToDb = async (creditCardTransactions: CreditCardTransactionEntity[]): Promise<any> => {
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

