import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from '../config/config';

@Module({
  imports: [MongooseModule.forRoot(config.MONGO_URI)],
})
export class MongooseDatabaseModule {}
