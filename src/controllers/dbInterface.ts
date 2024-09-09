import {
  Category,
  CheckingAccountTransaction,
  CategoryAssignmentRule,
  CreditCardTransaction,
  CheckingAccountStatement,
  CreditCardStatement,
  MinMaxDates,
  BankTransaction,
  SplitTransaction,
} from '../types';

import {
  getCreditCardTransactionModel,
  getCheckingAccountTransactionModel,
  getCategoryModel,
  getCategoryAssignmentRuleModel,
  getCheckingAccountStatementModel,
  getCreditCardStatementModel
} from '../models';
import { BankTransactionType } from '../types/enums';
import { Model } from 'mongoose';

export const addCheckingAccountStatementToDb = async (statement: CheckingAccountStatement): Promise<void> => {
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

export const addCreditCardStatementToDb = async (statement: CreditCardStatement): Promise<void> => {
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

export const addCreditCardTransactionsToDb = async (creditCardTransactions: CreditCardTransaction[]): Promise<any> => {
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

export const updateTransactionInDb = async (transaction: BankTransaction): Promise<void> => {

  if (transaction.bankTransactionType === BankTransactionType.CreditCard) {
    return updateCreditCardTransactionInDb(transaction as CreditCardTransaction);
  } else {
    return updateCheckingAccountTransactionInDb(transaction as CheckingAccountTransaction);
  }
}

const getTransactionUpdateFields = (transaction: BankTransaction) => {

  const updateFields: any = { ...transaction }; // Spread the general transaction fields

  // Determine which fields to set and unset for Importance properties
  if (transaction.consensusImportance === undefined) {
    updateFields.$set = {
      loriImportance: transaction.loriImportance,
      tedImportance: transaction.tedImportance,
    };
    updateFields.$unset = { consensusImportance: "" };
  } else {
    updateFields.$set = {
      consensusImportance: transaction.consensusImportance,
    };
    updateFields.$unset = { loriImportance: "", tedImportance: "" };
  }

  return updateFields;
}

export const updateCreditCardTransactionInDb = async (transaction: CreditCardTransaction): Promise<void> => {

  const updateFields = getTransactionUpdateFields(transaction);

  await getCreditCardTransactionModel().findOneAndUpdate(
    { id: transaction.id },
    updateFields,
    { new: true }
  ).exec();
};

export const updateCheckingAccountTransactionInDb = async (transaction: CheckingAccountTransaction): Promise<void> => {

  const updateFields = getTransactionUpdateFields(transaction);

  await getCheckingAccountTransactionModel().findOneAndUpdate(
    { id: transaction.id },
    updateFields,
    { new: true }
  ).exec();
};

export const updateCategoryInTransactionsInDb = async (categoryId: string, transactionIds: string[]): Promise<void> => {
  try {
    const creditCardTransactionModel = getCreditCardTransactionModel();
    await creditCardTransactionModel.updateMany(
      { id: { $in: transactionIds } },
      { $set: { overrideCategory: true, overrideCategoryId: categoryId } }
    );
    console.log(`Updated transactions with ids ${transactionIds.join(', ')} to have category id ${categoryId}`);
  } catch (error) {
    console.error('Error updating transactions:', error);
    throw error;
  }
};

export const getCheckingAccountTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CheckingAccountTransaction[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getCheckingAccountTransactionsFromDb: ', querySpec);

  const checkingAccountTransactionModel = getCheckingAccountTransactionModel();

  const query = checkingAccountTransactionModel.find(querySpec);

  const documents: any = await query.exec();
  const transactions: CheckingAccountTransaction[] = [];
  for (const document of documents) {
    const transaction: CheckingAccountTransaction = document.toObject() as any;
    transaction.bankTransactionType = BankTransactionType.Checking;
    transactions.push(transaction);
  }
  return transactions;
};

const getAllTransactionsFromDb = async (model: Model<any>, bankTransactionType: BankTransactionType): Promise<BankTransaction[]> => {
  const query = model.find({});
  const documents: any = await query.exec();
  const transactions: BankTransaction[] = [];
  for (const document of documents) {
    const transaction: BankTransaction = document.toObject() as BankTransaction;
    transaction.bankTransactionType = bankTransactionType;
    transactions.push(transaction);
  }
  return transactions
}
export const getAllCreditCardTransactionsFromDb = async (): Promise<BankTransaction[]> => {
  const creditCardTransactionModel = getCreditCardTransactionModel();
  return await getAllTransactionsFromDb(creditCardTransactionModel, BankTransactionType.CreditCard);
}

export const getAllCheckingAccountTransactionsFromDb = async (): Promise<BankTransaction[]> => {
  const checkingAccountTransactionModel = getCheckingAccountTransactionModel();
  return await getAllTransactionsFromDb(checkingAccountTransactionModel, BankTransactionType.Checking);
}

export const getCreditCardTransactionsFromDb = async (
  startDate: string,
  endDate: string,
): Promise<CreditCardTransaction[]> => {

  let querySpec = {};

  querySpec = { transactionDate: { $gte: startDate, $lte: endDate } }

  console.log('getCreditCardTransactionsFromDb: ', querySpec);

  const creditCardTransactionModel = getCreditCardTransactionModel();

  const query = creditCardTransactionModel.find(querySpec);

  const documents: any = await query.exec();
  const transactions: CreditCardTransaction[] = [];
  for (const document of documents) {
    const transaction: CreditCardTransaction = document.toObject() as CreditCardTransaction;
    transaction.bankTransactionType = BankTransactionType.CreditCard;
    transactions.push(transaction);
  }
  return transactions;
}

export const getCreditCardStatementsFromDb = async (
): Promise<CreditCardStatement[]> => {

  const statementModel = getCreditCardStatementModel();

  const query = statementModel.find();

  const documents: any = await query.exec();
  const statements: CreditCardStatement[] = [];
  for (const document of documents) {
    const statement: CreditCardStatement = document.toObject() as CreditCardStatement;
    statements.push(statement);
  }
  return statements;
}

export const getCheckingAccountStatementsFromDb = async (
): Promise<CheckingAccountStatement[]> => {

  const statementModel = getCheckingAccountStatementModel();

  const query = statementModel.find();

  const documents: any = await query.exec();
  const statements: CheckingAccountStatement[] = [];
  for (const document of documents) {
    const statement: CheckingAccountStatement = document.toObject() as CheckingAccountStatement;
    statements.push(statement);
  }
  return statements;
}

export const getCategoryByNameFromDb = async (categoryName: string): Promise<Category | null> => {
  const categoryModel = getCategoryModel();
  const querySpec = { name: categoryName }
  const query = categoryModel.find(querySpec);

  const documents: any = await query.exec();
  if (documents.length === 0) {
    return null;
  }
  const category: Category = documents[0].toObject() as Category;
  return category;
}

export const getCategoriesFromDb = async (
): Promise<Category[]> => {

  const categoryModel = getCategoryModel();

  const query = categoryModel.find();

  const documents: any = await query.exec();
  const categories: Category[] = [];
  for (const document of documents) {
    const category: Category = document.toObject() as Category;
    categories.push(category);
  }
  return categories;
}

export const getCategoryAssignmentRulesFromDb = async (
): Promise<CategoryAssignmentRule[]> => {

  const categoryAssignmentRuleModel = getCategoryAssignmentRuleModel();

  const query = categoryAssignmentRuleModel.find();

  const documents: any = await query.exec();
  const categoryAssignmentRules: CategoryAssignmentRule[] = [];
  for (const document of documents) {
    const categoryAssignmentRule: CategoryAssignmentRule = document.toObject() as CategoryAssignmentRule;
    categoryAssignmentRules.push(categoryAssignmentRule);
  }
  return categoryAssignmentRules;
}

export const addCategoryToDb = async (category: Category): Promise<Category> => {
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

const getCategoryUpdateFields = (category: Category) => {

  const updateFields: any = { ...category };

  // Determine which fields to set and unset for Importance properties
  if (category.consensusImportance === undefined) {
    updateFields.$set = {
      loriImportance: category.loriImportance,
      tedImportance: category.tedImportance,
    };
    updateFields.$unset = { consensusImportance: "" };
  } else {
    updateFields.$set = {
      consensusImportance: category.consensusImportance,
    };
    updateFields.$unset = { loriImportance: "", tedImportance: "" };
  }

  return updateFields;
}

export const updateCategoryInDb = async (category: Category): Promise<void> => {

  const updateFields = getCategoryUpdateFields(category);

  return await getCategoryModel().findOneAndUpdate(
    { id: category.id },
    updateFields,
    { new: true }
  )
}

export const deleteCategoryFromDb = async (id: string): Promise<void> => {
  const categoryModel = getCategoryModel();
  const filter = { id };
  await categoryModel.deleteOne(filter);
}


export const addCategoriesToDb = async (categories: Category[]): Promise<any> => {
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

export const addCategoryAssignmentRuleToDb = async (categoryAssignmentRule: CategoryAssignmentRule): Promise<any> => {
  const categoryAssignmentModel = getCategoryAssignmentRuleModel();
  return categoryAssignmentModel.collection.insertOne(categoryAssignmentRule)
    .then(() => {
      return Promise.resolve();
    })
    .catch((error: any) => {
      console.log('db add error: ', error);
      debugger;
      return Promise.reject();
    });
}

export const replaceCategoryAssignmentRulesInDb = async (categoryAssignmentRules: CategoryAssignmentRule[]): Promise<any> => {

  const categoryAssignmentModel = getCategoryAssignmentRuleModel();

  try {
    // Delete all existing documents in the collection
    await categoryAssignmentModel.collection.deleteMany({});

    // Insert the new rules
    if (categoryAssignmentRules.length > 0) {
      await categoryAssignmentModel.collection.insertMany(categoryAssignmentRules);
    }

    return Promise.resolve();
  } catch (error: any) {
    console.log('db replace error: ', error);
    debugger;
    return Promise.reject(error);
  }
};

export const updateCategoryAssignmentRuleInDb = async (categoryAssignmentRule: CategoryAssignmentRule): Promise<void> => {
  const categoryAssignmentRuleModel = getCategoryAssignmentRuleModel();
  const query = categoryAssignmentRuleModel.findOneAndUpdate(
    { id: categoryAssignmentRule.id },
    categoryAssignmentRule
  )
  await query.exec();
}

export const deleteCategoryAssignmentRuleFromDb = async (categoryAssignmentRule: CategoryAssignmentRule): Promise<void> => {
  const categoryAssignmentRuleModel = getCategoryAssignmentRuleModel();
  const filter = { id: categoryAssignmentRule.id };
  await categoryAssignmentRuleModel.deleteOne(filter);
}

export const getDuplicateCreditCardTransactionsDb = async (): Promise<CreditCardTransaction[]> => {

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

  const transactions: CreditCardTransaction[] = await query.exec();
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

const getMinMaxTransactionDatesFromDb = async (model: any): Promise<MinMaxDates | null> => {

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

  console.log('getMinMaxTransactionDatesFromDb: ', result);

  if (result.length === 0) {
    return null;
  }

  return {
    minDate: result[0].minTransactionDate,
    maxDate: result[0].maxTransactionDate
  };
}

export const splitTransactionInDb = async (parentTransactionId: string, splitTransactions: SplitTransaction[]) => {
  await setIsSplitInDb(parentTransactionId);
  await addCheckingAccountTransactionsToDb(splitTransactions);
}

const setIsSplitInDb = async (transactionId: string) => {
  const model = getCheckingAccountTransactionModel();
  try {
    await model.updateOne(
      { id: transactionId },
      { $set: { isSplit: true } }
    );
    console.log('Transaction updated successfully');
  } catch (error) {
    console.error('Error updating transaction:', error);
  }
}

export const getTransactionsByCategoryAssignmentRuleIdFromDb = async (ruleId: string): Promise<CreditCardTransaction[]> => {
  try {
    // Find the category assignment rule by ID
    const categoryAssignmentRule = await getCategoryAssignmentRuleModel().findOne({ id: ruleId });

    if (!categoryAssignmentRule) {
      throw new Error(`CategoryAssignmentRule with ID ${ruleId} not found`);
    }

    const { pattern } = categoryAssignmentRule;

    // Find transactions that match the pattern in the userDescription
    const matchingTransactionsModels = await getCreditCardTransactionModel().find({
      userDescription: { $regex: pattern, $options: 'i' }, // Case-insensitive matching
    });
    const matchingTransactions: CreditCardTransaction[] = matchingTransactionsModels.map((model: any) => model.toObject());

    console.log('getTransactionsByCategoryAssignmentRuleId');
    console.log('rule:', categoryAssignmentRule);
    console.log('matchingTransactions:', matchingTransactions);

    return matchingTransactions;
  } catch (error) {
    console.error('Error finding transactions by category assignment rule:', error);
    throw error;
  }
};