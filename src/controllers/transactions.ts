import { Request, Response } from 'express';

import { Category, CategoryAssignmentRule, BankTransaction, ReviewedTransactions, CategorizedTransaction, CategorizedStatementData, CreditCardTransaction, CheckingAccountTransaction } from "entities";
import { DisregardLevel, BankTransactionType } from "../types/";
import { isNil } from "lodash";
import { roundTo } from "../utilities";
import { getCategoriesFromDb, getCategoryAssignmentRulesFromDb, getCheckingAccountTransactionsFromDb, getCreditCardTransactionsFromDb, getCategoryByNameFromDb } from "./dbInterface";

export const getTransactions = async (request: Request, response: Response, next: any) => {

  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;
  const includeCreditCardTransactions: boolean = request.query.includeCreditCardTransactions ? request.query.includeCreditCardTransactions as string === 'true' : false;
  const includeCheckingAccountTransactions: boolean = request.query.includeCheckingAccountTransactions ? request.query.includeCheckingAccountTransactions as string === 'true' : false;

  const checkingAccountTransactions: BankTransaction[] = includeCheckingAccountTransactions ? await getCheckingAccountTransactionsFromDb(startDate, endDate): [];
  const creditCardTransactions: BankTransaction[] = includeCreditCardTransactions ? await getCreditCardTransactionsFromDb(startDate, endDate) : [];

  const allTransactions: any = {
    checkingAccountTransactions,
    creditCardTransactions,
  };
  
  response.json(allTransactions);
}

export const getCategorizedTransactions = async (request: Request, response: Response, next: any) => {

  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;
  const includeCreditCardTransactions: boolean = request.query.includeCreditCardTransactions ? request.query.includeCreditCardTransactions as string === 'true' : false;
  const includeCheckingAccountTransactions: boolean = request.query.includeCheckingAccountTransactions ? request.query.includeCheckingAccountTransactions as string === 'true' : false;
  
  const allCategories: Category[] = await getCategoriesFromDb();
  const categories: Category[] = [];
  for (const category of allCategories) {
    if (category.disregardLevel === DisregardLevel.None) {
      categories.push(category);
    }
  }

  // TEDTODO - fetch the ignoredCategoryId from the database; support multiple ignored categories
  const ignoreCategoryName = 'Ignore';
  const ignoreCategory: Category | null = await getCategoryByNameFromDb(ignoreCategoryName);
  if (isNil(ignoreCategory)) {
    return response.status(500).send();
  }

  const categoryAssignmentRules: CategoryAssignmentRule[] = await getCategoryAssignmentRulesFromDb();

  const checkingAccountTransactions: BankTransaction[] = includeCheckingAccountTransactions ? await getCheckingAccountTransactionsFromDb(startDate, endDate): [];
  const creditCardTransactions: BankTransaction[] = includeCreditCardTransactions ? await getCreditCardTransactionsFromDb(startDate, endDate) : [];
  const allTransactions: BankTransaction[] = checkingAccountTransactions.concat(creditCardTransactions);

  const reviewedTransactionEntities: ReviewedTransactions = categorizeTransactions(allTransactions, categories, ignoreCategory, categoryAssignmentRules);
  const categorizedTransactions: CategorizedTransaction[] = reviewedTransactionEntities.categorizedTransactions;
  const unidentifiedBankTransactions: BankTransaction[] = reviewedTransactionEntities.uncategorizedTransactions;

  const transactions: CategorizedTransaction[] = [];
  let sum = 0;

  for (const categorizedTransaction of categorizedTransactions) {
    const transaction: CategorizedTransaction = {
      bankTransaction: categorizedTransaction.bankTransaction,
      category: categorizedTransaction.category,
    };
    transactions.push(transaction);
    sum += transaction.bankTransaction.amount;
  }

  sum = roundTo(-sum, 2)

  const categorizedStatementData: CategorizedStatementData = {
    startDate,
    endDate,
    transactions,
    netDebits: sum,
    unidentifiedBankTransactions,
  };

  response.json(categorizedStatementData);
};

const categorizeTransactions = (
  transactions: BankTransaction[],
  categories: Category[],
  ignoreCategory: Category,
  categoryAssignmentRules: CategoryAssignmentRule[]
): ReviewedTransactions => {

  const categorizedTransactions: CategorizedTransaction[] = [];
  const uncategorizedTransactions: BankTransaction[] = [];
  const ignoredTransactions: BankTransaction[] = [];

  let sum: number = 0;

  for (const transaction of transactions) {
    const category: Category | null = categorizeTransaction(transaction, categories, categoryAssignmentRules);
    if (!isNil(category)) {
      if (category.id === ignoreCategory.id) {
        ignoredTransactions.push(transaction);
      } else {
        const categorizedTransaction: CategorizedTransaction = {
          bankTransaction: transaction,
          category: category,
        };
        categorizedTransactions.push(categorizedTransaction);

        sum += transaction.amount;
      }
    } else {
      uncategorizedTransactions.push(transaction);
    }
  }

  return {
    categorizedTransactions,
    uncategorizedTransactions,
    ignoredTransactions,
  };
};

const categorizeTransaction = (
  transaction: BankTransaction,
  categories: Category[],
  categoryAssignmentRules: CategoryAssignmentRule[]): Category | null => {

  const transactionDetails: string = transaction.bankTransactionType === BankTransactionType.CreditCard ?
    (transaction as CreditCardTransaction).description : (transaction as CheckingAccountTransaction).name;

  for (const categoryAssignmentRule of categoryAssignmentRules) {
    if (transactionDetails.includes(categoryAssignmentRule.pattern)) {
      const categoryId = categoryAssignmentRule.categoryId;
      for (const category of categories) {
        if (category.id === categoryId) {
          return category;
        }
      }
    }
  }

  if (transaction.bankTransactionType === BankTransactionType.CreditCard) {
    if (!isNil((transaction as unknown as CreditCardTransaction).category)) {
      for (const category of categories) {
        if ((transaction as unknown as CreditCardTransaction).category === category.name) {
          return category;
        }
      }
    }
  }

  return null;
};
