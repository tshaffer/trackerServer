import { BankTransactionType, DisregardLevel, StatementType } from "enums";

export interface CategorizedStatementData {
  startDate: string;
  endDate: string;
  transactions: CategorizedTransaction[];
  unidentifiedBankTransactions: BankTransaction[];
  netDebits: number;
}

interface Transaction {
  id: string;
  statementId: string;
  transactionDate: string;
  amount: number;
  bankTransactionType: BankTransactionType;
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
}

export type BankTransaction = CreditCardTransaction | CheckingAccountTransaction;

export interface CategorizedTransaction {
  bankTransaction: BankTransaction;
  category: Category;
}

interface Statement {
  id: string;
  fileName: string;
  type: StatementType;
  startDate: string;
  endDate: string;
  transactionCount: number;
  netDebits: number;
}

export type CreditCardStatement = Statement

export interface CheckingAccountStatement extends Statement {
  checkCount: number;
  atmWithdrawalCount: number;
}

export interface Category {
  id: string
  name: string;
  disregardLevel: DisregardLevel;
}

export interface CategoryAssignmentRule {
  id: string;
  pattern: string;
  categoryId: string;
}

export interface ReviewedTransactions {
  categorizedTransactions: CategorizedTransaction[];
  ignoredTransactions: BankTransaction[];
  uncategorizedTransactions: BankTransaction[]
}

export interface MinMaxDates {
  minDate: string;
  maxDate: string;
}

