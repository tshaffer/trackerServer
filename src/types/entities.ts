export interface CreditCardTransactionEntity {
  transactionDate: string;
  postDate: string;
  description: string;
  category: string;
  type: string;
  amount: number;
}

export interface CheckingAccountTransactionEntity {
  transactionDate: string;
  transactionType: string;
  name: string;
  memo: string;
  amount: number;
}
