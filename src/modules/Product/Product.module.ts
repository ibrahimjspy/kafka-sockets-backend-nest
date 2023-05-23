import { Module } from '@nestjs/common';
import { ProductController } from './Product.controller';
import { ProductService } from './Product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMedia, ProductThumbnail } from 'src/database/destination/media';
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
import { SocketClientService } from '../Socket/Socket.client.service';
import { KafkaController } from './services/kafka/Kafka.controller';
import { ProducerService } from './services/kafka/Kafka.producer.service';
import { ValidationService } from './services/validation/Product.validation.service';
import { ProductVariantShopMapping } from 'src/database/destination/addProductToShop';
import { SyncMappings } from 'src/database/destination/mapping';
import { ProductVariantMappingRepository } from 'src/database/destination/repositories/addProductToShop';
import { CreateProductCopiesRepository } from 'src/database/destination/repositories/copyProducts';
import { SyncMappingsRepository } from 'src/database/destination/repositories/syncProducts';
import { ProductProduct } from 'src/database/destination/product/product';
import { ProductCopyService } from './services/productCopy/product.copy.service';
import { ProductProductChannelListing } from 'src/database/destination/product/channnelListing';
import { ProductProductMedia } from 'src/database/destination/product/media';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductMedia]),
    TypeOrmModule.forFeature([ProductThumbnail]),
    TypeOrmModule.forFeature([ProductVariantShopMapping]),
    TypeOrmModule.forFeature([SyncMappings]),
    TypeOrmModule.forFeature([ProductProduct]),
    TypeOrmModule.forFeature([ProductProductChannelListing]),
    TypeOrmModule.forFeature([ProductProductMedia]),
    TypeOrmModule.forFeature([ProductProductVariant]),
    TypeOrmModule.forFeature([ProductProductVariantChannelListing]),
  ],
  controllers: [KafkaController, ProductController],
  providers: [
    ProductService,
    ProductTransformer,
    ProductCopyService,
    ProductMediaTransformer,
    ProductVariantTransformer,
    ProductDestinationService,
    ProductVariantService,
    ProductVariantDestinationService,
    ProductMediaService,
    ProductMappingService,
    RollbackService,
    ShopDestinationService,
    SocketClientService,
    KafkaController,
    ProducerService,
    ValidationService,
    SyncMappingsRepository,
    ProductVariantMappingRepository,
    CreateProductCopiesRepository,
    ProductProductChannelListing,
    ProductProductMedia,
    ProductProductVariant,
    ProductProductVariantChannelListing,
  ],
})
export class ProductModule {}
