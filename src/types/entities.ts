import { DisregardLevel, StatementType } from "enums";

export interface CategorizedStatementData {
  startDate: string;
  endDate: string;
  transactions: TransactionEntity[];
  total: number;
}

export interface TransactionEntity {
  id: string;
  statementId: string;
  transactionDate: string;
  amount: number;
  description: string;
  category: string;
}

export interface CreditCardTransactionEntity {
  id: string;
  statementId: string;
  transactionDate: string;
  postDate: string;
  description: string;
  category: string;
  type: string;
  amount: number;
}

export interface CheckingAccountTransactionEntity {
  id: string;
  statementId: string;
  transactionDate: string;
  transactionType: string;
  name: string;
  memo: string;
  amount: number;
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

export interface CategorizedTransactionEntity {
  transaction: CreditCardTransactionEntity;
  category: CategoryEntity;
}

export interface CategorizedCheckingAccountTransactionEntity {
  transaction: CheckingAccountTransactionEntity;
  category: CategoryEntity;
}

