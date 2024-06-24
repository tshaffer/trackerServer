import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CategorySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    disregardLevel: { type: Number, required: true },
  },
);

export const getCategoryModel = () => {
  const categoryModel = connection.model('categories', CategorySchema);
  return categoryModel;
}

export default mongoose.model('Category', CategorySchema);
