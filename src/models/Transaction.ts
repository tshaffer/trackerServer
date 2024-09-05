import * as mongoose from 'mongoose';

const { Schema } = mongoose;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

// Define a base schema with common fields
const TransactionBaseSchema = new Schema({
  id: { type: String, required: true },
  statementId: { type: String, required: true },
  transactionDate: { type: String, required: true },
  amount: { type: Number, required: true },
  userDescription: { type: String, required: true },
  overrideCategory: { type: Boolean, required: true },
  overrideCategoryId: { type: String, required: true },
  excludeFromReportCalculations: { type: Boolean, required: true },
  consensusImportance: { type: Number },
  loriImportance: { type: Number },
  tedImportance: { type: Number },
}, { _id: false }); // _id: false to prevent creation of a new _id field in nested schema

const CheckingAccountTransactionSchema = new Schema({
  ...TransactionBaseSchema.obj, // Spread the base schema fields
  transactionType: { type: String, required: true },
  name: { type: String, required: true },
  memo: { type: String, required: true },
  checkingAccountTransactionType: { type: String, required: true },
  checkNumber: { type: String, required: true },
  payee: { type: String, required: true },
  isSplit: { type: Boolean, required: true },
  parentTransactionId: { type: String, required: true },
});

const CreditCardTransactionSchema   = new Schema({
  ...TransactionBaseSchema.obj, // Spread the base schema fields
  postDate: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
});

export const CreditCardTransactionModel = mongoose.model('CreditCardTransaction', CreditCardTransactionSchema);
export const CheckingAccountTransactionModel = mongoose.model('CheckingAccountTransaction', CheckingAccountTransactionSchema);
