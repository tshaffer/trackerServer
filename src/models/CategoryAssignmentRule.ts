import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CategoryAssignmentRuleSchema = new Schema(
  {
    id: { type: String, required: true },
    pattern: { type: String, required: true },
    categoryId: { type: String, required: true },
  },
);

export const getCategoryAssignmentRuleModel = () => {
  const categoryAssignmentRuleModel = connection.model('categoryassignmentrule', CategoryAssignmentRuleSchema);
  return categoryAssignmentRuleModel;
}


export default mongoose.model('CategoryAssignmentRule', CategoryAssignmentRuleSchema);
