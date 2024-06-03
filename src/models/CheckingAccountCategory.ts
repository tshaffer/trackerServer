import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CheckingAccountCategorySchema = new Schema(
  {
    id: { type: String, required: true },
    keyword: { type: String, required: true },
  },
);

export const getCheckingAccountCategoryModel = () => {
  const categoryKeywordModel = connection.model('checkingaccountcategories', CheckingAccountCategorySchema);
  return categoryKeywordModel;
}


export default mongoose.model('CheckingAccountCategory', CheckingAccountCategorySchema);
