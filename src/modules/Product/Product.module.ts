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
import { ProductCopyService } from './services/productCopy/Service';
import { ProductProductChannelListing } from 'src/database/destination/product/channnelListing';
import { ProductProductMedia } from 'src/database/destination/product/media';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';
import { WarehouseStock } from 'src/database/destination/productVariant/warehouseStock';
import { AttributeAssignedProductAttribute } from 'src/database/destination/product/attributes/assignment';
import { AttributeAssignedProductAttributeValue } from 'src/database/destination/product/attributes/value';
import { ProductCopyTransformerService } from './services/productCopy/Copy.transformers';
import { ProductAttributeCopyService } from './services/productCopy/Attributes.copy.service';
import { AttributeAttributeValue } from 'src/database/destination/attributes';
import { AttributeAssignedVariantAttribute } from 'src/database/destination/productVariant/attributes/assignment';
import { AttributeAssignedVariantAttributeValue } from 'src/database/destination/productVariant/attributes/value';
import { ProductVariantAttributeCopyService } from './services/productCopy/Variant.attribute.copy.service';
import { ProductCategory } from 'src/database/destination/category';
import { ProductCategoryRepository } from 'src/database/destination/repositories/category';

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
    TypeOrmModule.forFeature([WarehouseStock]),
    TypeOrmModule.forFeature([AttributeAssignedProductAttribute]),
    TypeOrmModule.forFeature([AttributeAssignedProductAttributeValue]),
    TypeOrmModule.forFeature([AttributeAttributeValue]),
    TypeOrmModule.forFeature([AttributeAssignedVariantAttribute]),
    TypeOrmModule.forFeature([AttributeAssignedVariantAttributeValue]),
    TypeOrmModule.forFeature([ProductCategory]),
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
    WarehouseStock,
    ProductProductMedia,
    ProductProductVariant,
    ProductProductVariantChannelListing,
    AttributeAssignedProductAttribute,
    AttributeAssignedProductAttributeValue,
    ProductCopyTransformerService,
    AttributeAttributeValue,
    ProductVariantAttributeCopyService,
    AttributeAssignedVariantAttribute,
    ProductAttributeCopyService,
    AttributeAssignedVariantAttributeValue,
    ProductCategoryRepository,
    ProductCategory,
  ],
})
export class ProductModule {}
