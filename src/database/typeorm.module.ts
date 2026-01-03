import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from '../config/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config.PG_HOST,
      port: parseInt(config.PG_PORT as string, 10),
      username: config.PG_USERNAME,
      password: config.PG_PASSWORD,
      database: config.PG_DATABASE,
      autoLoadEntities: true,
      //! I should remove it in the production
      synchronize: true,
    }),
  ],
})
export class TypeOrmDatabaseModule {}
