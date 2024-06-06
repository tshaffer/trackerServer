import { DisregardLevel, StatementType } from "enums";

export interface CategorizedStatementData {
  startDate: string;
  endDate: string;
  transactions: CategorizedTransactionEntity[];
  total: number;
}

export interface CategorizedTransactionEntity extends TransactionEntity {
  description: string;
  category: string;
}

export interface TransactionEntity {
  id: string;
  statementId: string;
  transactionDate: string;
  amount: number;
  description: string;
}

export interface CreditCardTransactionEntity extends TransactionEntity {
  postDate: string;
  category: string;
  type: string;
}

export interface CheckingAccountTransactionEntity extends TransactionEntity {
  transactionType: string;
  name: string;
  memo: string;
}

export interface StatementEntity {
  id: string;
  type: StatementType;
  startDate: string;
  endDate: string;
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

