import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CategorySchema = new Schema(
  {
    id: { type: String, required: true },
    keyword: { type: String, required: true },
    disregardLevel: { type: Number, required: true },
  },
);

export const getCategoryModel = () => {
  const categoryKeywordModel = connection.model('categories', CategorySchema);
  return categoryKeywordModel;
}


export default mongoose.model('Category', CategorySchema);
