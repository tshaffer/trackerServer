import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const CheckingAccountNameKeywordSchema = new Schema(
  {
    id: { type: String, required: true },
    keyword: { type: String, required: true },
    categoryId: { type: String, required: true },
  },
);

export const getCheckingAccountNameKeywordModel = () => {
  const checkingAccountNameKeywordModel = connection.model('checkingaccountnamekeyword', CheckingAccountNameKeywordSchema);
  return checkingAccountNameKeywordModel;
}


export default mongoose.model('CheckingAccountNameKeyword', CheckingAccountNameKeywordSchema);
