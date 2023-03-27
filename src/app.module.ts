import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TerminusModule } from '@nestjs/terminus';
import { HealthModule } from './health/health.module';
import { ProductModule } from './modules/Product/Product.module';
@Module({
  imports: [TerminusModule, HealthModule, ProductModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
