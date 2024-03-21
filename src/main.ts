import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import * as helmet from 'helmet';
import {
  ConfigurationService,
  MongoExceptionFilter,
  MessagePatternResponseInterceptor,
  HttpExceptionFilter,
  SnakeCaseInterceptor,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

import * as requestIp from 'request-ip';
import { AppModule } from './app.module';
import configureSwagger from './swaggerConfigurations';
import { CustomInterceptor } from 'utils/customIntercepter';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new MessagePatternResponseInterceptor());

  const conf = app.get<ConfigurationService>(ConfigurationService);
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      port: conf.get('DRIVER_MICROSERVICE_PORT'),
      retryAttempts: 5,
      retryDelay: 3000,
    },
  });

  // use to console queries
  // if (AppModule.isDev) {
  //   mongoose.set('debug', true);
  // }

  await app.startAllMicroservices();
  const logger = new Logger('Main');
  const globalPrefix = '/api';

  app.enableCors();
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
  app.use(requestIp.mw());

  // Build the swagger doc only in dev mode
  configureSwagger(app, logger);

  app.setGlobalPrefix(globalPrefix);

  // Validate query params and body
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Handle mongoose exceptions
  app.useGlobalFilters(new MongoExceptionFilter());

  // Convert exceptions to JSON readable format
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(CustomInterceptor);
  await app.listen(AppModule.port);

  // Log current url of app
  let baseUrl = app.getHttpServer().address().address;
  if (baseUrl === '0.0.0.0' || baseUrl === '::') {
    baseUrl = 'localhost';
  }

  logger.log(`Listening to http://${baseUrl}:${AppModule.port}${globalPrefix}`);
}
bootstrap();
