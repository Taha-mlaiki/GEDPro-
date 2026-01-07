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
  // MinIO Configuration
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'gedpro_minio',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'gedpro_minio_secret',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
};
