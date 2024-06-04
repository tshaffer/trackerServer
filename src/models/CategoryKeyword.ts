import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CategoryKeywordSchema = new Schema(
  {
    id: { type: String, required: true },
    keyword: { type: String, required: true },
    categoryId: { type: String, required: true },
  },
);

export const getCategoryKeywordModel = () => {
  const categoryKeywordModel = connection.model('creditcarddescriptionkeyword', CategoryKeywordSchema);
  return categoryKeywordModel;
}


export default mongoose.model('CategoryKeyword', CategoryKeywordSchema);
