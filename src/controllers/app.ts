import { Request, Response } from 'express';

import { version } from '../version';
import multer from 'multer';
import * as fs from 'fs';
const path = require('node:path');
import Papa from 'papaparse';
import { isBoolean, isNumber, isString } from 'lodash';
import { CheckingAccountTransactionEntity, CreditCardTransactionEntity } from 'entities';
import { addCheckingAccountTransactionsToDb, addCreditCardTransactionsToDb } from './dbInterface';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const uploadStatement = async (request: Request, response: Response, next: any) => {

  console.log('uploadStatement');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // cb(null, 'public');
      cb(null, '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public');
    },
    filename: function (req, file, cb) {
      cb(null, 'statement.csv');
    }
  });

  const upload = multer({ storage: storage }).single('file');

  upload(request, response, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('MulterError: ', err);
      return response.status(500).json(err);
    } else if (err) {
      console.log('nonMulterError: ', err);
      return response.status(500).json(err);
    }
    console.log('return from upload: ', request.file);

    const originalFileName: string = request.file.originalname;
    // const filePath: string = path.join('public', 'creditCardStatement.csv');
    const filePath: string = '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public/statement.csv';
    const content: string = fs.readFileSync(filePath).toString();

    const result = Papa.parse(content,
      {
        header: false,
        dynamicTyping: true,
        transform,
      });


    return processStatement(originalFileName, result.data as any[]).then((errorList: string[]) => {
      if (errorList.length > 0) {
        return response.status(400).json(errorList);
      } else {
        const responseData = {
          uploadStatus: 'success',
        };
        return response.status(200).send(responseData);
      }
    });
  });
};

const processStatement = async (originalFileName: string, csvTransactions: any[]): Promise<string[]> => {

  // Chase7011_Activity20220601_20221231_20240521.csv
  // Cash Reserve - 2137_07-01-2023_12-31-2023.csv
  if (originalFileName.startsWith('Chase7011_Activity')) {
    console.log('Chase credit card statement');
    const errorList: string[] = await processCreditCardStatement(csvTransactions);
    return Promise.resolve(errorList);
  } else if (originalFileName.startsWith('Cash Reserve - 2137_')) {
    console.log('US Bank checking account');
    const errorList: string[] = await processCheckingAccountStatement(csvTransactions);
    return Promise.resolve(errorList);
  } else {
    console.log('originalFileName does not match expected pattern: ', originalFileName);
    return Promise.reject('Invalid file name');
  };
}

const processCreditCardStatement = async (csvTransactions: any[]): Promise<string[]> => {

  const transactions: CreditCardTransactionEntity[] = [];

  const errorList: string[] = [];

  console.log('processCreditCardStatement');

  for (let i = 0; i < csvTransactions.length; i++) {

    const parsedLine: any[] = csvTransactions[i];

    if (isEmptyLine(parsedLine)) {
      continue;
    }

    /*
      if (transactionDate.charCodeAt(0) === 65279) {
        transactionDate = (transactionDate as string).substring(1);
      }
    */
    const transactionDate = parsedLine[0];
    if (!isValidDate(transactionDate)) {
      continue;
    }
    const postDate = parsedLine[1];
    if (!isValidDate(postDate)) {
      continue;
    }
    const description = parsedLine[2];
    const category = parsedLine[3];
    const type = parsedLine[4];
    const amount = parsedLine[5];
    const creditCardTransaction: CreditCardTransactionEntity = {
      transactionDate,
      postDate,
      description,
      category,
      type,
      amount,
    };

    transactions.push(creditCardTransaction);
  }

  await addCreditCardTransactionsToDb(transactions);

  console.log('processCreditCardStatement complete');

  return Promise.resolve(errorList);
}

const processCheckingAccountStatement = async (csvTransactions: any[]): Promise<string[]> => {

  const transactions: CheckingAccountTransactionEntity[] = [];

  const errorList: string[] = [];

  console.log('processCheckingAccountStatement');

  for (let i = 0; i < csvTransactions.length; i++) {

    const parsedLine: any[] = csvTransactions[i];

    if (isEmptyLine(parsedLine)) {
      continue;
    }

    /*
      if (transactionDate.charCodeAt(0) === 65279) {
        transactionDate = (transactionDate as string).substring(1);
      }
    */
    const transactionDate = parsedLine[0];
    const transactionType = parsedLine[1];
    const name = parsedLine[2];
    const memo = parsedLine[3];
    const amount = parsedLine[4];
    if (!isNumber(amount)) {
      continue;
    }
    const checkingAccountTransaction: CheckingAccountTransactionEntity = {
      transactionDate,
      transactionType,
      name,
      memo,
      amount,
    };

    transactions.push(checkingAccountTransaction);
  }

  await addCheckingAccountTransactionsToDb(transactions);

  console.log('processCheckingAccountStatement complete');

  return Promise.resolve(errorList);
}

function isValidDate(dateString: string): boolean {
  // Check if the string can be parsed into a date
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return false;
  }

  // Additional check to ensure the parsed date matches the input string
  // This prevents cases where invalid dates like "2023-02-30" are parsed as valid dates
  const [month, day, year] = dateString.split('/').map(Number);

  if (year !== date.getFullYear() || month !== (date.getMonth() + 1) || day !== date.getDate()) {
    return false;
  }

  return true;
}

const isEmptyLine = (lineOfInput: any[]): boolean => {
  const columnValues: any[] = Object.values(lineOfInput);
  for (const columnValue of columnValues) {
    if (!isBoolean(columnValue)) {
      return false;
    }
  }
  return true;
}

const transform = (arg1: any, arg2: any) => {
  if (arg1 === '') {
    return 'FALSE';
  } else {
    return arg1;
  }
}

