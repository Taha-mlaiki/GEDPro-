import dotenv from 'dotenv';
dotenv.config();
export const config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI as string,
  PG_HOST: process.env.PG_HOST,
  PG_PORT: process.env.PG_PORT,
  PG_USERNAME: process.env.PG_USERNAME || 'root',
  PG_PASSWORD: process.env.PG_PASSWORD || '',
  PG_DATABASE: process.env.PG_DATABASE,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_TOKEN: process.env.JWT_REFRESH_TOKEN,
};
