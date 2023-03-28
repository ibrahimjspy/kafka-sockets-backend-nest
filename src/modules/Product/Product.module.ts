import { Module } from '@nestjs/common';
import { ProductController } from './Product.controller';
import { ProductService } from './Product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMedia } from 'src/database/destination/media';

@Module({
  imports: [TypeOrmModule.forFeature([ProductMedia])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
