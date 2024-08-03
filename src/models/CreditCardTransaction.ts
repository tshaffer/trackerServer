import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CreditCardTransactionSchema = new Schema(
  {
    id: { type: String, required: true },
    statementId: { type: String, required: true },
    transactionDate: { type: String, required: true },
    amount: { type: Number, required: true },
    postDate: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    userDescription: { type: String, required: true },
    overrideCategory:  { type: Boolean, required: true },
    overrideCategoryId:  { type: String, required: true },
    overrideFixedExpense:  { type: Boolean, required: true },
    overriddenFixedExpense:  { type: Boolean, required: true },
    excludeFromReportCalculations: { type: Boolean, required: true },
  },
);

export const getCreditCardTransactionModel = () => {
  const creditCardTransactionModel = connection.model('creditcardtransaction', CreditCardTransactionSchema);
  return creditCardTransactionModel;
}


export default mongoose.model('CreditCardTransaction', CreditCardTransactionSchema);
