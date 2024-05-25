import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const StatementSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
  },
);

export const getStatementModel = () => {
  const statementModel = connection.model('statement', StatementSchema);
  return statementModel;
}


export default mongoose.model('Statement', StatementSchema);
