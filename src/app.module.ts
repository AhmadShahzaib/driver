import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import {
  ConfigurationService,
  SharedModule,
  MessagePatternResponseInterceptor,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import AwsClient from './shared/config';
import { DriverSchema } from './mongoDb/schema/schema';
import { AppController } from './app.controller';
import { Transport, ClientProxyFactory } from '@nestjs/microservices';
import { CodriverController } from './codriver.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: 'Driver', schema: DriverSchema }]),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigurationService) => ({
        uri: configService.mongoUri,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigurationService],
    }),
  ],
  controllers: [AppController, CodriverController],
  providers: [
    AppService,
    AwsClient,
    ConfigurationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MessagePatternResponseInterceptor,
    },
    {
      provide: 'VEHICLE_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const vehicleServicePort = config.get('VEHICLE_MICROSERVICE_PORT');
        const vehicleServiceHost = config.get('VEHICLE_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(vehicleServicePort),
            host: vehicleServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'ELD_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const vehicleServicePort = config.get('ELD_MICROSERVICE_PORT');
        const vehicleServiceHost = config.get('ELD_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(vehicleServicePort),
            host: vehicleServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'HOS_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const port: number = Number(config.get('HOS_MICROSERVICE_PORT'));
        const host = config.get('HOS_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port,
            host,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'OFFICE_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const officeServicePort = config.get('OFFICE_MICROSERVICE_PORT');
        const officeServiceHost = config.get('OFFICE_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(officeServicePort),
            host: officeServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'PUSH_NOTIFICATION_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const officeServicePort = config.get('PUSH_NOTIFICATION_MICROSERVICE_PORT');
        const officeServiceHost = config.get('PUSH_NOTIFICATION_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(officeServicePort),
            host: officeServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'UNIT_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const unitServicePort = config.get('UNIT_MICROSERVICE_PORT');
        const unitServiceHost = config.get('UNIT_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(unitServicePort),
            host: unitServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
  ],
})
export class AppModule {
  static port: number | string;
  static isDev: boolean;

  constructor(private readonly _configurationService: ConfigurationService) {
    AppModule.port = AppModule.normalizePort(_configurationService.port);
    AppModule.isDev = _configurationService.isDevelopment;
  }

  /**
   * Normalize port or return an error if port is not valid
   * @param val The port to normalize
   */
  private static normalizePort(val: number | string): number | string {
    const port: number = typeof val === 'string' ? parseInt(val, 10) : val;

    if (Number.isNaN(port)) {
      return val;
    }

    if (port >= 0) {
      return port;
    }

    throw new Error(`Port "${val}" is invalid.`);
  }
}
