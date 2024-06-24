import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CheckingAccountStatementSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true },
    type: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    transactionCount: { type: Number, required: true },
    netDebits: { type: Number, required: true },
  },
);

export const getCheckingAccountStatementModel = () => {
  const checkingAccountStatementModel = connection.model('checkingaccountstatement', CheckingAccountStatementSchema);
  return checkingAccountStatementModel;
}


export default mongoose.model('CheckingAccountStatement', CheckingAccountStatementSchema);
