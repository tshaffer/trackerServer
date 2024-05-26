import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CreditCardDescriptionKeywordSchema = new Schema(
  {
    keyword: { type: String, required: true },
  },
);

export const getCreditCardDescriptionKeywordModel = () => {
  const creditCardDescriptionKeywordModel = connection.model('creditCardDescriptionKeyword', CreditCardDescriptionKeywordSchema);
  return creditCardDescriptionKeywordModel;
}


export default mongoose.model('CreditCardDescriptionKeyword', CreditCardDescriptionKeywordSchema);
