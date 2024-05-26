import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CreditCardCategoryKeywordSchema = new Schema(
  {
    keyword: { type: String, required: true },
  },
);

export const getCreditCardCategoryKeywordModel = () => {
  const creditCardCategoryKeywordModel = connection.model('creditCardCategoryKeyword', CreditCardCategoryKeywordSchema);
  return creditCardCategoryKeywordModel;
}


export default mongoose.model('CreditCardCategoryKeyword', CreditCardCategoryKeywordSchema);
