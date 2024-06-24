import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CheckingAccountTransactionSchema = new Schema(
  {
    id: { type: String, required: true },
    statementId: { type: String, required: true },
    transactionDate: { type: String, required: true },
    transactionType: { type: String, required: true },
    name: { type: String, required: true },
    memo: { type: String, required: true },
    netDebits: { type: Number, required: true },
  },
);

export const getCheckingAccountTransactionModel = () => {
  const checkingAccountTransactionModel = connection.model('checkingaccounttransaction', CheckingAccountTransactionSchema);
  return checkingAccountTransactionModel;
}


export default mongoose.model('CheckingAccountTransaction', CheckingAccountTransactionSchema);
