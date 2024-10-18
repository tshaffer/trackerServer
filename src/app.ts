import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import dotenv from 'dotenv';

const bodyParser = require('body-parser');

import { Routes } from './routes/routes';

class App {

  public app: express.Application;
  public route: Routes = new Routes();

  constructor() {

    dotenv.config(); // Load environment variables

    console.log('mongo environment variable: ');
    console.log(process.env.MONGO_URI);
    console.log('port: ', process.env.PORT);

    connectDB();

    this.app = express();
    this.config();

    this.app.use(express.static('public'))
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.route.routes(this.app);
  }

  private config(): void {
    let port: any = process.env.PORT;
    if (port === undefined || port === null || port === '') {
      port = 8888;
    }
    this.app.set('port', port);
  }
}

export default new App().app;
