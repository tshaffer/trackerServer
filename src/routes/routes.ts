import express from 'express';
import {
  getIndex,
  getCSS,
  getBundle,
  getBundleMap,
  getVersion,
  uploadStatement,
  addCategory,
  addCategoryAssignmentRule,
  getCategories,
  getDuplicateCreditCardTransactions,
  removeDuplicateCreditCardTransactions,
  addReferencedCategories,
  getMinMaxCheckingAccountTransactionDates,
  getMinMaxCreditCardTransactionDates,
  getCategoryAssignmentRules,
  deleteCategoryAssignmentRule,
  updateCategoryAssignmentRule,
  getCheckingAccountStatements,
  getCreditCardStatements,
  initializeDB,
  updateTransaction,
  splitTransaction,
  getTransactions,
  replaceCategoryAssignmentRules,
  addCategories,
} from '../controllers';

export class Routes {

  public routes(app: express.Application): void {
    this.createRoutes(app);
  }

  createRoutes(app: express.Application) {
    app.get('/', getIndex);
    app.get('/app', getIndex);
    app.get('/index.html', getIndex);
    app.get('/css/app.css', getCSS);
    app.get('/build/bundle.js', getBundle);
    app.get('/build/bundle.js.map', getBundleMap);

    app.get('/api/v1/version', getVersion);
    app.get('/api/v1/transactions', getTransactions);
    app.get('/api/v1/categories', getCategories);
    app.get('/api/v1/categoryAssignmentRules', getCategoryAssignmentRules);
    app.get('/api/v1/checkingAccountStatements', getCheckingAccountStatements);
    app.get('/api/v1/creditCardStatements', getCreditCardStatements);
    app.get('/api/v1/duplicateCreditCardTransactions', getDuplicateCreditCardTransactions);
    app.get('/api/v1/minMaxCreditCardTransactionDates', getMinMaxCreditCardTransactionDates);
    app.get('/api/v1/minMaxCheckingAccountTransactionDates', getMinMaxCheckingAccountTransactionDates);

    app.post('/api/v1/initializeDB', initializeDB);

    app.post('/api/v1/statement', uploadStatement);

    app.post('/api/v1/addCategory', addCategory);
    app.post('/api/v1/addCategories', addCategories);
    app.post('/api/v1/addCategoryAssignmentRule', addCategoryAssignmentRule);
    app.post('/api/v1/updateCategoryAssignmentRule', updateCategoryAssignmentRule);
    app.post('/api/v1/deleteCategoryAssignmentRule', deleteCategoryAssignmentRule);
    app.post('/api/v1/replaceCategoryAssignmentRules', replaceCategoryAssignmentRules);
    app.post('/api/v1/removeDuplicateCreditCardTransactions', removeDuplicateCreditCardTransactions);
    app.post('/api/v1/addReferencedCategories', addReferencedCategories);
    app.post('/api/v1/updateTransaction', updateTransaction);
    app.post('/api/v1/splitTransaction', splitTransaction);
  }
}
