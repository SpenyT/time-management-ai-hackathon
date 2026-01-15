import app from './app';
import { connectSQL } from '@database/pgDb';

import 'dotenv/config';

const PORT = process.env.PORT || 3000;

const connectDatabases = async () => {
  console.log('Attempting to connect databases...');
  
  await Promise.all([
    connectSQL(),
  ]);

  console.log('All databases connected. Starting server...');
};


connectDatabases()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Application failed to start due to a database error.', error);
    process.exit(1); 
  });