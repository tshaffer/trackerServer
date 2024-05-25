import { StatementType } from "enums";

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
