import { Request, Response } from 'express';

import { version } from '../version';
import multer from 'multer';
import * as fs from 'fs';
const path = require('node:path');
import Papa from 'papaparse';
import { isBoolean, isNumber, isString } from 'lodash';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const uploadCreditCardStatement = (request: Request, response: Response, next: any) => {
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public');
    },
    filename: function (req, file, cb) {
      cb(null, 'creditCardStatement.csv');
    }
  });

  const upload = multer({ storage: storage }).single('file');

  upload(request, response, function (err) {
    if (err instanceof multer.MulterError) {
      return response.status(500).json(err);
    } else if (err) {
      return response.status(500).json(err);
    }
    console.log('return from upload: ', request.file);
    const filePath: string = path.join('public', 'creditCardStatement.csv');
    const content: string = fs.readFileSync(filePath).toString();

    const result = Papa.parse(content,
      {
        header: false,
        dynamicTyping: true,
        transform,
      });

    const errorList: string[] = processCreditCardStatement(result.data as any[]);
    if (errorList.length > 0) {
      return response.status(400).json(errorList);
    }

    const responseData = {
      uploadStatus: 'success',
    };
    return response.status(200).send(responseData);
  });
}

const transform = (arg1: any, arg2: any) => {
  if (arg1 === '') {
    return 'FALSE';
  } else {
    return arg1;
  }
}

const processCreditCardStatement = (transactions: any[]): string[] => {
  
  const errorList: string[] = [];

  console.log('processCreditCardStatement');
  // console.log('creditCardTransactions: ');
  // console.log(transactions);

  for (let i = 0; i < transactions.length; i++) {

    const parsedLine: any[] = transactions[i];

    if (isEmptyLine(parsedLine)) {
      continue;
    }

    let transactionDate = parsedLine[0];
    if (isString(transactionDate)) {
      if (transactionDate.charCodeAt(0) === 65279) {
        transactionDate = (transactionDate as string).substring(1);
        console.log('transactionDate: special character encountered');
      }
    }
    if (!isValidDate(transactionDate)) {
      console.log('invalid transactionDate: ', transactionDate);
    }

    let postDate = parsedLine[1];
    if (isString(postDate)) {
      if (postDate.charCodeAt(0) === 65279) {
        postDate = (postDate as string).substring(1);
        console.log('postDate: special character encountered');
      }
    }
    if (!isValidDate(postDate)) {
      console.log('invalid postDate: ', postDate);
    }

    let description = parsedLine[2];
    if (isString(description)) {
      if (description.charCodeAt(0) === 65279) {
        description = (description as string).substring(1);
        console.log('description: special character encountered');
      }
    }
    let category = parsedLine[3];
    if (isString(category)) {
      if (category.charCodeAt(0) === 65279) {
        category = (category as string).substring(1);
        console.log('category: special character encountered');
      }
    }
    let type = parsedLine[4];
    if (isString(type)) {
      if (type.charCodeAt(0) === 65279) {
        type = (type as string).substring(1);
        console.log('type: special character encountered');
      }
    }
    let amount = parsedLine[5];
    if (isString(amount)) {
      if (amount.charCodeAt(0) === 65279) {
        amount = (amount as string).substring(1);
        console.log('amount: special character encountered');
      }
    }
    if (isNumber(amount)) {
      console.log('amount is number'); 
    }

    // console.log(transactionDate, postDate, description, category, type, amount);

  }

  console.log('parseComplete');

  return errorList;
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

function isValidDate(dateString: string): boolean {
  // Check if the string can be parsed into a date
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
      console.log('failed first check for date: ', dateString);
      return false;
  }

  // Additional check to ensure the parsed date matches the input string
  // This prevents cases where invalid dates like "2023-02-30" are parsed as valid dates
  const [month, day, year] = dateString.split('/').map(Number);

  if (year !== date.getFullYear() || month !== (date.getMonth() + 1) || day !== date.getDate()) {
    console.log(year, date.getFullYear(), month, date.getMonth() + 1, day, date.getDate());
    return false;
  }

  return true;
}

