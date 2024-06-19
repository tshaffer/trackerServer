import { BankTransactionType, DisregardLevel, StatementType } from "enums";

export interface CategorizedStatementData {
  startDate: string;
  endDate: string;
  transactions: CategorizedTransactionEntity[];
  unidentifiedBankTransactions: BankTransactionEntity[];
  total: number;
}

interface RawTransactionEntity {
  id: string;
  statementId: string;
  transactionDate: string;
  amount: number;
  bankTransactionType: BankTransactionType;
}

export interface CreditCardTransactionEntity extends RawTransactionEntity {
  postDate: string;
  category: string;
  description: string;
  type: string;
}

export interface CheckingAccountTransactionEntity extends RawTransactionEntity {
  transactionType: string;
  name: string;
  memo: string;
}

export type BankTransactionEntity = CreditCardTransactionEntity | CheckingAccountTransactionEntity;

export interface CategorizedTransactionEntity {
  bankTransactionEntity: BankTransactionEntity;
  categoryEntity: CategoryEntity;
}

export interface StatementEntity {
  id: string;
  fileName: string;
  type: StatementType;
  startDate: string;
  endDate: string;
  transactionCount: number;
  netSpent: number;

  checkCount?: number;  // or null?
  atmWithdrawalCount?: number; // or null?
}

export interface CategoryEntity {
  id: string
  keyword: string;
  disregardLevel: DisregardLevel;
}

export interface CategoryKeywordEntity {
  id: string;
  keyword: string;
  categoryId: string;
}

export interface ReviewedTransactionEntities {
  categorizedTransactions: CategorizedTransactionEntity[];
  uncategorizedTransactions: BankTransactionEntity[]
}

export interface MinMaxStartDates {
  minDate: string;
  maxDate: string;
}

