import { Request, Response } from 'express';

import { BankTransaction } from "entities";
import { getAllCheckingAccountTransactionsFromDb, getAllCreditCardTransactionsFromDb, getCheckingAccountTransactionsFromDb, getCreditCardTransactionsFromDb } from "./dbInterface";

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

export const getAllTransactions = async (request: Request, response: Response, next: any) => {

  const checkingAccountTransactions: BankTransaction[] = await getAllCheckingAccountTransactionsFromDb();
  const creditCardTransactions: BankTransaction[] = await getAllCreditCardTransactionsFromDb();

  const allTransactions: any = {
    checkingAccountTransactions,
    creditCardTransactions,
  };
  
  response.json(allTransactions);
}

