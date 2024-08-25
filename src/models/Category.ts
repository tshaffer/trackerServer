import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CategorySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    parentId: { type: String, required: true },
    transactionsRequired: { type: Boolean, required: true },
    disregardLevel: { type: Number, required: true },
    consensusDiscretionariness: { type: Number },
    loriDiscretionariness: { type: Number },
    tedDiscretionariness: { type: Number },
    },
);

export const getCategoryModel = () => {
  const categoryModel = connection.model('categories', CategorySchema);
  return categoryModel;
}

export default mongoose.model('Category', CategorySchema);
