import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packageInfo from '../package.json';
import { HttpExceptionFilter } from './app.filters';
import { Logger, ValidationPipe } from '@nestjs/common';
import {
  KAFKA_BROKER_ENDPOINT,
  KAFKA_CONSUMER_GROUP,
  SERVER_PORT,
  SOCKET_PORT,
} from './constants';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { SocketModule } from './modules/Socket/Socket.module';
import { join } from 'path';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';

export class SocketAdapter extends IoAdapter {
  createIOServer(
    port: number,
    options?: ServerOptions & {
      namespace?: string;
      server?: any;
    },
  ) {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    return server;
  }
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [KAFKA_BROKER_ENDPOINT],
      },

      consumer: {
        groupId: KAFKA_CONSUMER_GROUP || 'auto-sync-kafka-consumer',
      },
    },
  });
  await app.startAllMicroservices();
  const config = new DocumentBuilder()
    .setTitle('autosync')
    .setDescription(packageInfo.description)
    .setVersion(packageInfo.version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // setting up web socket server
  const socketApp = await NestFactory.create<NestExpressApplication>(
    SocketModule,
  );
  socketApp.useStaticAssets(join(__dirname, '..', 'static'));
  socketApp.enableCors({
    origin: '*',
  });
  socketApp.useWebSocketAdapter(new SocketAdapter(socketApp));
  socketApp
    .listen(SOCKET_PORT)
    .then(() => {
      Logger.verbose('Auto sync web socket is up');
    })
    .catch((err) => {
      Logger.error(err);
    });
  // add exception filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // enable auto validation
  app.useGlobalPipes(new ValidationPipe());
  app
    .listen(SERVER_PORT)
    .then(() => {
      Logger.verbose('kafka client connected');
    })
    .catch((err) => {
      Logger.error(err);
    });
}
bootstrap();
