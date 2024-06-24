import {
  CategoryEntity,
  CheckingAccountTransactionEntity,
  CategoryAssignmentRule,
  CreditCardTransactionEntity,
  CheckingAccountStatementEntity,
  CreditCardStatementEntity,
  MinMaxDates
} from 'entities';

import {
  getCreditCardTransactionModel,
  getCheckingAccountTransactionModel,
  getCategoryModel,
  getCategoryAssignmentRuleModel,
  getCheckingAccountStatementModel,
  getCreditCardStatementModel
} from '../models';
import { BankTransactionType } from '../types/enums';

export const addCheckingAccountStatementToDb = async (statement: CheckingAccountStatementEntity): Promise<void> => {
  const statementModel = getCheckingAccountStatementModel();
  return statementModel.collection.insertOne(statement)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCreditCardStatementToDb = async (statement: CreditCardStatementEntity): Promise<void> => {
  const statementModel = getCreditCardStatementModel();
  return statementModel.collection.insertOne(statement)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCreditCardTransactionsToDb = async (creditCardTransactions: CreditCardTransactionEntity[]): Promise<any> => {
  const creditCardTransactionModel = getCreditCardTransactionModel();
  return creditCardTransactionModel.collection.insertMany(creditCardTransactions)
    .then((retVal: any) => {
      return Promise.resolve(retVal);
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCheckingAccountTransactionsToDb = async (checkingAccountTransactions: any[]): Promise<any> => {
  const checkingAccountTransactionModel = getCheckingAccountTransactionModel();
  return checkingAccountTransactionModel.collection.insertMany(checkingAccountTransactions)
    .then((retVal: any) => {
      return Promise.resolve(retVal);
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const getCheckingAccountTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CheckingAccountTransactionEntity[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getCheckingAccountTransactionsFromDb: ', querySpec);

  const checkingAccountTransactionModel = getCheckingAccountTransactionModel();

  const query = checkingAccountTransactionModel.find(querySpec);

  const documents: any = await query.exec();
  const transactions: CheckingAccountTransactionEntity[] = [];
  for (const document of documents) {
    const transaction: CheckingAccountTransactionEntity = document.toObject() as any;
    transaction.bankTransactionType = BankTransactionType.Checking;
    transactions.push(transaction);
  }
  return transactions;
};

export const getCreditCardTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CreditCardTransactionEntity[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getCreditCardTransactionsFromDb: ', querySpec);

  const creditCardTransactionModel = getCreditCardTransactionModel();

  const query = creditCardTransactionModel.find(querySpec);

  const documents: any = await query.exec();
  const transactions: CreditCardTransactionEntity[] = [];
  for (const document of documents) {
    const transaction: CreditCardTransactionEntity = document.toObject() as CreditCardTransactionEntity;
    transaction.bankTransactionType = BankTransactionType.CreditCard;
    transactions.push(transaction);
  }
  return transactions;
}

export const getCreditCardStatementsFromDb = async (
): Promise<CreditCardStatementEntity[]> => {

  const statementModel = getCreditCardStatementModel();

  const query = statementModel.find();

  const documents: any = await query.exec();
  const statements: CreditCardStatementEntity[] = [];
  for (const document of documents) {
    const statement: CreditCardStatementEntity = document.toObject() as CreditCardStatementEntity;
    statements.push(statement);
  }
  return statements;
}

export const getCheckingAccountStatementsFromDb = async (
): Promise<CheckingAccountStatementEntity[]> => {

  const statementModel = getCheckingAccountStatementModel();

  const query = statementModel.find();

  const documents: any = await query.exec();
  const statements: CheckingAccountStatementEntity[] = [];
  for (const document of documents) {
    const statement: CheckingAccountStatementEntity = document.toObject() as CheckingAccountStatementEntity;
    statements.push(statement);
  }
  return statements;
}

export const getCategoryByNameFromDb = async (categoryName: string): Promise<CategoryEntity | null> => {
  const categoryModel = getCategoryModel();
  const querySpec = { keyword: categoryName }
  const query = categoryModel.find(querySpec);

  const documents: any = await query.exec();
  if (documents.length === 0) {
    return null;
  }
  const category: CategoryEntity = documents[0].toObject() as CategoryEntity;
  return category;
}

export const getCategoriesFromDb = async (
): Promise<CategoryEntity[]> => {

  const categoryModel = getCategoryModel();

  const query = categoryModel.find();

  const documents: any = await query.exec();
  const categories: CategoryEntity[] = [];
  for (const document of documents) {
    const category: CategoryEntity = document.toObject() as CategoryEntity;
    categories.push(category);
  }
  return categories;
}

export const getCategoryKeywordsFromDb = async (
): Promise<CategoryAssignmentRule[]> => {

  console.log('getCategoryKeywordsFromDb: ');

  const categoryKeywordModel = getCategoryAssignmentRuleModel();

  const query = categoryKeywordModel.find();

  const documents: any = await query.exec();
  const categoryKeywordEntities: CategoryAssignmentRule[] = [];
  for (const document of documents) {
    const categoryKeywordEntity: CategoryAssignmentRule = document.toObject() as CategoryAssignmentRule;
    categoryKeywordEntities.push(categoryKeywordEntity);
  }
  return categoryKeywordEntities;
}

export const addCategoryToDb = async (category: CategoryEntity): Promise<CategoryEntity> => {
  const categoryModel = getCategoryModel();
  return categoryModel.collection.insertOne(category)
    .then(() => {
      return Promise.resolve(category);
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCategoriesToDb = async (categories: CategoryEntity[]): Promise<any> => {
  const categoryModel = getCategoryModel();
  return categoryModel.collection.insertMany(categories)
    .then((retVal: any) => {
      return Promise.resolve(retVal);
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return null;
    });
}

export const addCategoryKeywordToDb = async (categoryKeywordEntity: CategoryAssignmentRule): Promise<any> => {
  const categoryKeywordModel = getCategoryAssignmentRuleModel();
  return categoryKeywordModel.collection.insertOne(categoryKeywordEntity)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return Promise.reject();
    });
}

export const updateCategoryKeywordInDb = async (categoryKeywordEntity: CategoryAssignmentRule): Promise<void> => {
  const categoryKeywordModel = getCategoryAssignmentRuleModel();
  const query = categoryKeywordModel.findOneAndUpdate(
    { id: categoryKeywordEntity.id },
    categoryKeywordEntity
  )
  await query.exec();
}

export const deleteCategoryKeywordFromDb = async (categoryKeywordEntity: CategoryAssignmentRule): Promise<void> => {
  const categoryKeywordModel = getCategoryAssignmentRuleModel();
  const filter = { id: categoryKeywordEntity.id };
  await categoryKeywordModel.deleteOne(filter);
}

export const getDuplicateCreditCardTransactionsDb = async (): Promise<CreditCardTransactionEntity[]> => {

  const creditCardTransactionModel = getCreditCardTransactionModel();

  const query = creditCardTransactionModel.aggregate([
    {
      $group: {
        _id: {
          amount: "$amount",
          postDate: "$postDate",
          description: "$description"
        },
        count: { $sum: 1 },
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    },
    {
      $unwind: "$docs"
    },
    {
      $replaceRoot: { newRoot: "$docs" }
    }
  ]);

  const transactions: CreditCardTransactionEntity[] = await query.exec();
  return transactions;
}

export const removeDuplicateCreditCardTransactionsDb = async (idsToDelete: string[]): Promise<void> => {
  const creditCardTransactionModel = getCreditCardTransactionModel();
  return creditCardTransactionModel.deleteMany({ _id: { $in: idsToDelete } })
    .then((deleteResult) => {
      console.log('Deleted documents count:', deleteResult.deletedCount);
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db deleteMany error: ', error);
      debugger;
      return null;
    });
}

export const getMinMaxCreditCardTransactionDatesFromDb = async (): Promise<MinMaxDates> => {
  return getMinMaxTransactionDatesFromDb(getCreditCardTransactionModel());
}

export const getMinMaxCheckingAccountTransactionDatesFromDb = async (): Promise<MinMaxDates> => {
  return getMinMaxTransactionDatesFromDb(getCheckingAccountTransactionModel());
}

const getMinMaxTransactionDatesFromDb = async (model: any): Promise<MinMaxDates> => {

  const query = model.aggregate([
    {
      $group: {
        _id: null,
        minTransactionDate: { $min: "$transactionDate" },
        maxTransactionDate: { $max: "$transactionDate" }
      }
    }
  ]);

  const result: any = await query.exec();

  return {
    minDate: result[0].minTransactionDate,
    maxDate: result[0].maxTransactionDate
  };
}



