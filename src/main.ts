/* eslint-disable import/first */
process.env.TZ = 'UTC';

import { NestFactory } from '@nestjs/core';

import { setupCors } from '&back/addons/setupCors';
import { setupLogger } from '&back/addons/setupLogger';
import { setupSwagger } from '&back/addons/setupSwagger';
import { AppModule } from '&back/app.module';

import { setupTelegram } from './addons/setupTelegram';
import { setupProxy } from './addons/setupProxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupCors(app);
  setupLogger(app);
  setupSwagger(app, 'docs');
  setupTelegram(app);
  setupProxy(app);

  await app.listen(3000);
}

bootstrap();
