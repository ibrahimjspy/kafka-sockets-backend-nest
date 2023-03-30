import { Module } from '@nestjs/common';
import { ProductController } from './Product.controller';
import { ProductService } from './Product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMedia } from 'src/database/destination/media';
import { ProductTransformer } from './transformer/Product.transformer';
import { ProductMediaTransformer } from './services/productMedia/Product.media.transformer';
import { ProductVariantTransformer } from './services/productVariant/Product.variant.transformer';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';
import { ProductVariantService } from './services/productVariant/Product.variants.service';
import { ProductVariantDestinationService } from 'src/graphql/destination/handlers/productVariant';
import { ProductMediaService } from './services/productMedia/Product.media.service';
import { ProductMappingService } from './services/productMapping/Product.mapping.service';
import { ShopDestinationService } from 'src/graphql/destination/handlers/shop';
import { RollbackService } from './services/rollback/Rollback.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductMedia])],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductTransformer,
    ProductMediaTransformer,
    ProductVariantTransformer,
    ProductDestinationService,
    ProductVariantService,
    ProductVariantDestinationService,
    ProductMediaService,
    ProductMappingService,
    RollbackService,
    ShopDestinationService,
  ],
})
export class ProductModule {}
