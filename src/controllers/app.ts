import { Request, Response } from 'express';

import { version } from '../version';
import multer from 'multer';
import * as fs from 'fs';
const path = require('node:path');
import Papa from 'papaparse';
import { isBoolean, isNumber, isString } from 'lodash';
import { CreditCardTransactionEntity } from 'entities';
import { addCreateCreditCardTransactionsToDb } from './dbInterface';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const uploadCreditCardStatement = async (request: Request, response: Response, next: any) => {

  console.log('uploadCreditCardStatement');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // cb(null, 'public');
      cb(null, '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public');
    },
    filename: function (req, file, cb) {
      cb(null, 'creditCardStatement.csv');
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
    const filePath: string = '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public/creditCardStatement.csv';
    const content: string = fs.readFileSync(filePath).toString();

    const result = Papa.parse(content,
      {
        header: false,
        dynamicTyping: true,
        transform,
      });


    return processCreditCardStatement(originalFileName, result.data as any[]).then((errorList: string[]) => {
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

const processCreditCardStatement = async (originalFileName: string, transactions: any[]): Promise<string[]> => {

  // Chase7011_Activity20220601_20221231_20240521.csv
  // Cash Reserve - 2137_07-01-2023_12-31-2023.csv
  if (originalFileName.startsWith('Chase7011_Activity')) {
    console.log('Chase credit card statement');
    return Promise.resolve([]);
  } else if (originalFileName.startsWith('Cash Reserve - 2137_')) {
    console.log('US Bank checking account');
    return Promise.resolve([]);
  } else {
    console.log('originalFileName does not match expected pattern: ', originalFileName);
    return Promise.reject('Invalid file name');
  };

  const creditCardTransactions: CreditCardTransactionEntity[] = [];

  const errorList: string[] = [];

  console.log('processCreditCardStatement');

  for (let i = 0; i < transactions.length; i++) {

    const parsedLine: any[] = transactions[i];

    if (isEmptyLine(parsedLine)) {
      continue;
    }

    let transactionDate = parsedLine[0];
    if (isString(transactionDate)) {
      if (transactionDate.charCodeAt(0) === 65279) {
        transactionDate = (transactionDate as string).substring(1);
      }
    }
    if (!isValidDate(transactionDate)) {
      continue;
    }

    let postDate = parsedLine[1];
    if (isString(postDate)) {
      if (postDate.charCodeAt(0) === 65279) {
        postDate = (postDate as string).substring(1);
      }
    }
    if (!isValidDate(postDate)) {
      continue;
    }

    let description = parsedLine[2];
    if (isString(description)) {
      if (description.charCodeAt(0) === 65279) {
        description = (description as string).substring(1);
      }
    }
    let category = parsedLine[3];
    if (isString(category)) {
      if (category.charCodeAt(0) === 65279) {
        category = (category as string).substring(1);
      }
    }
    let type = parsedLine[4];
    if (isString(type)) {
      if (type.charCodeAt(0) === 65279) {
        type = (type as string).substring(1);
      }
    }
    let amount = parsedLine[5];
    if (isString(amount)) {
      if (amount.charCodeAt(0) === 65279) {
        amount = (amount as string).substring(1);
      }
    }
    const creditCardTransaction: CreditCardTransactionEntity = {
      transactionDate,
      postDate,
      description,
      category,
      type,
      amount,
    };

    creditCardTransactions.push(creditCardTransaction);
  }

  await addCreateCreditCardTransactionsToDb(creditCardTransactions);

  console.log('processCreditCardStatement complete');

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

