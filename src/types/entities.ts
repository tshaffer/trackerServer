import { BankTransactionType, DisregardLevel, StatementType } from "enums";

export interface CategorizedStatementData {
  startDate: string;
  endDate: string;
  transactions: CategorizedTransactionEntity[];
  unidentifiedBankTransactions: BankTransactionEntity[];
  netDebits: number;
}

interface TransactionEntity {
  id: string;
  statementId: string;
  transactionDate: string;
  amount: number;
  bankTransactionType: BankTransactionType;
}

export interface CreditCardTransactionEntity extends TransactionEntity {
  postDate: string;
  category: string;
  description: string;
  type: string;
}

export interface CheckingAccountTransactionEntity extends TransactionEntity {
  transactionType: string;
  name: string;
  memo: string;
}

export type BankTransactionEntity = CreditCardTransactionEntity | CheckingAccountTransactionEntity;

export interface CategorizedTransactionEntity {
  bankTransactionEntity: BankTransactionEntity;
  categoryEntity: CategoryEntity;
}

interface StatementEntity {
  id: string;
  fileName: string;
  type: StatementType;
  startDate: string;
  endDate: string;
  transactionCount: number;
  netDebits: number;
}

export type CreditCardStatementEntity = StatementEntity

export interface CheckingAccountStatementEntity extends StatementEntity {
  checkCount: number;
  atmWithdrawalCount: number;
}

export interface CategoryEntity {
  id: string
  name: string;
  disregardLevel: DisregardLevel;
}

export interface CategoryAssignmentRule {
  id: string;
  pattern: string;
  categoryId: string;
}

export interface ReviewedTransactionEntities {
  categorizedTransactions: CategorizedTransactionEntity[];
  uncategorizedTransactions: BankTransactionEntity[]
}

export interface MinMaxDates {
  minDate: string;
  maxDate: string;
}

