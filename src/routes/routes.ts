import express from 'express';
import {
  getIndex,
  getCSS,
  getBundle,
  getBundleMap,
  getCategorizedTransactions,
  getVersion,
  uploadStatement,
  addCategory,
  addCategoryKeyword,
  getCategories,
  getDuplicateCreditCardTransactions,
  removeDuplicateCreditCardTransactions,
  addReferencedCategories,
  getMinMaxCheckingAccountTransactionDates,
  getMinMaxCreditCardTransactionDates,
  getCategoryKeywords,
  deleteCategoryKeyword,
  updateCategoryKeyword,
  getStatements,
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
    app.get('/api/v1/categories', getCategories);
    app.get('/api/v1/categoryKeywords', getCategoryKeywords);
    app.get('/api/v1/statements', getStatements);
    app.get('/api/v1/categorizedTransactions', getCategorizedTransactions);
    app.get('/api/v1/duplicateCreditCardTransactions', getDuplicateCreditCardTransactions);
    app.get('/api/v1/minMaxCreditCardTransactionDates', getMinMaxCreditCardTransactionDates);
    app.get('/api/v1/minMaxCheckingAccountTransactionDates', getMinMaxCheckingAccountTransactionDates);

    app.post('/api/v1/creditCardStatement', uploadStatement);

    app.post('/api/v1/addCategory', addCategory);
    app.post('/api/v1/addCategoryKeyword', addCategoryKeyword);
    app.post('/api/v1/updateCategoryKeyword', updateCategoryKeyword);
    app.post('/api/v1/deleteCategoryKeyword', deleteCategoryKeyword);
    app.post('/api/v1/removeDuplicateCreditCardTransactions', removeDuplicateCreditCardTransactions);
    app.post('/api/v1/addReferencedCategories', addReferencedCategories);
  }
}
