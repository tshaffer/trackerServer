import mongoose from 'mongoose';

export let connection: mongoose.Connection;

import { transactionsDbConfiguration } from './config';

async function connectDB() {

  console.log('mongo uri is:');
  console.log(transactionsDbConfiguration.MONGO_URI);
  connection = await mongoose.createConnection(transactionsDbConfiguration.MONGO_URI, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  });
  console.log(`MongoDB new db connected`);

  mongoose.Promise = global.Promise;
};

export default connectDB;
