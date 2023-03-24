import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packageInfo from '../package.json';
import { HttpExceptionFilter } from './app.filters';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SERVER_PORT } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = new DocumentBuilder()
    .setTitle('autosync')
    .setDescription(packageInfo.description)
    .setVersion(packageInfo.version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // add exception filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // enable auto validation
  app.useGlobalPipes(new ValidationPipe());
  app
    .listen(SERVER_PORT || 6003)
    .then(() => {
      Logger.verbose('kafka client connected');
    })
    .catch((err) => {
      Logger.error(err);
    });
}
bootstrap();
