import { BankTransactionType, CheckingAccountTransactionType, DisregardLevel, StatementType } from "./enums";

interface Transaction {
  id: string;
  statementId: string;
  transactionDate: string;
  amount: number;
  bankTransactionType: BankTransactionType;
  userDescription: string;
  overrideCategory: boolean;
  overrideCategoryId: string;
}

export interface SplitTransaction {
  id: string;
  parentTransactionId: string;
  amount: number;
  userDescription: string;
}

export interface CreditCardTransaction extends Transaction {
  postDate: string;
  category: string;
  description: string;
  type: string;
}

export interface CheckingAccountTransaction extends Transaction {
  transactionType: string;
  name: string;
  memo: string;
  checkingAccountTransactionType: CheckingAccountTransactionType;
  isSplit: boolean;
  parentTransactionId: string;
}

export interface CheckTransaction extends CheckingAccountTransaction {
  checkNumber: string;
  payee: string;
}

export type BankTransaction = CreditCardTransaction | CheckingAccountTransaction;

interface Statement {
  id: string;
  fileName: string;
  type: StatementType;
  startDate: string;
  endDate: string;
  transactionCount: number;
  netDebits: number;
}

export type CreditCardStatement = Statement;

export interface CheckingAccountStatement extends Statement {
  checkCount: number;
  atmWithdrawalCount: number;
}

export interface Category {
  id: string
  name: string;
  parentId: string;
  transactionsRequired: boolean;
  disregardLevel: DisregardLevel;
}

export interface CategoryAssignmentRule {
  id: string;
  pattern: string;
  categoryId: string;
}

export interface MinMaxDates {
  minDate: string;
  maxDate: string;
}

