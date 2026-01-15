import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const connectSQL = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('PostgreSQL database connected successfully!');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    throw error;
  }
};

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};