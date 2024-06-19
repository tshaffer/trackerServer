import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CreditCardStatementSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
  },
);

export const getCreditCardStatementModel = () => {
  const creditCardStatementModel = connection.model('creditcardstatement', CreditCardStatementSchema);
  return creditCardStatementModel;
}


export default mongoose.model('CreditCardStatement', CreditCardStatementSchema);
