import express from 'express';
import cors from 'cors';
import connectDB from './config/db';

import { readConfig } from './config';

const bodyParser = require('body-parser');

import { Routes } from './routes/routes';
import path from 'path';

class App {

  public app: express.Application;
  public route: Routes = new Routes();

  constructor() {

    try {
      readConfig('/Users/tedshaffer/Documents/Projects/tracker/trackerServer/src/config/config.env');
    } catch (err: any) {
      console.log('readConfig error');
    }

    console.log('mongo environment variable: ', process.env.MONGO_URI);

    console.log('patht to build folder:');
    console.log(path.join(__dirname, 'build'));
    
    connectDB();

    this.app = express();
    this.config();

    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // this.app.use(express.static('public'))
    this.app.use(express.static(path.join(__dirname, 'public')));

    this.route.routes(this.app);

    // const pathToIndex = '/Users/tedshaffer/Documents/Projects/tracker/trackerServer/public/index.html';
    // this.app.get('*', (req, res) => {
    //   res.sendFile(pathToIndex);
    // });
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
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
