import express from 'express';
import {
  getIndex,
  getCSS,
  getBundle,
  getBundleMap,
  getTransactions,
  getVersion,
  uploadStatement,
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

    app.post('/api/v1/creditCardStatement', uploadStatement);

  }
}
