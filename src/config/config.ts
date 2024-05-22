import * as dotenv from 'dotenv';
import { isNil } from 'lodash';
import { TransactionsDbConfiguration } from '../types';

export let transactionsDbConfiguration: TransactionsDbConfiguration; 

export const readConfig = (pathToConfigFile: string): void => {

  try {
    const configOutput: dotenv.DotenvConfigOutput = dotenv.config({ path: pathToConfigFile });
    const parsedConfig: dotenv.DotenvParseOutput | undefined = configOutput.parsed;

    if (!isNil(parsedConfig)) {
      transactionsDbConfiguration = {
        PORT: Number(parsedConfig.PORT),
        MONGO_URI: parsedConfig.MONGO_URI,
      };
      console.log(transactionsDbConfiguration);
    }
  }
  catch (err) {
    console.log('Dotenv config error: ' + err.message);
  }
};
