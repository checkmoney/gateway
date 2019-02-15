import { Inject } from '@nestjs/common'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'

import { Configuration } from '@back/config/Configuration'

export class DbOptionsFactory implements TypeOrmOptionsFactory {
  public constructor(
    @Inject(Configuration) private readonly config: Configuration,
  ) {}

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.config.getStringOrElse('DB_HOST', '127.0.0.1'),
      port: this.config.getNumberOrElse('DB_PORT', 5432),
      username: this.config.getStringOrElse('DB_USER', 'admin'),
      password: this.config.getStringOrElse('DB_PASSWORD', 'admin'),
      database: this.config.getStringOrElse('DB_NAME', 'oncohelp'),
      entities: [__dirname + `/../**/*.{entity,vo}.{ts,js}`],
      synchronize: !this.config.getBooleanOrElse('PRODUCTION_READY', true),
    }
  }
}
