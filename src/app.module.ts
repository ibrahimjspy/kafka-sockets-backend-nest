import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TerminusModule } from '@nestjs/terminus';
import { HealthModule } from './health/health.module';
import { ProductModule } from './modules/Product/Product.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMedia, ProductThumbnail } from './database/destination/media';
import { ProductVariantShopMapping } from './database/destination/addProductToShop';
import { SyncMappings } from './database/destination/mapping';
import { ProductProduct } from './database/destination/product/product';
import { ProductProductChannelListing } from './database/destination/product/channnelListing';
import { ProductProductMedia } from './database/destination/product/media';
import { ProductProductVariant } from './database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from './database/destination/productVariant/channelListing';
import { WarehouseStock } from './database/destination/productVariant/warehouseStock';
import { AttributeAssignedProductAttribute } from './database/destination/product/attributes/assignment';
import { AttributeAssignedProductAttributeValue } from './database/destination/product/attributes/value';
import { AttributeAttributeValue } from './database/destination/attributes';
import { AttributeAssignedVariantAttribute } from './database/destination/productVariant/attributes/assignment';
import { AttributeAssignedVariantAttributeValue } from './database/destination/productVariant/attributes/value';
import { ProductCategory } from './database/destination/category';
@Module({
  imports: [
    TerminusModule,
    HealthModule,
    ProductModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: +configService.get<number>('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DATABASE'),
        entities: [
          ProductMedia,
          ProductThumbnail,
          ProductVariantShopMapping,
          SyncMappings,
          ProductProduct,
          ProductProductChannelListing,
          ProductProductMedia,
          ProductProductVariant,
          ProductProductVariantChannelListing,
          WarehouseStock,
          AttributeAssignedProductAttribute,
          AttributeAssignedProductAttributeValue,
          AttributeAttributeValue,
          AttributeAssignedVariantAttribute,
          AttributeAssignedVariantAttributeValue,
          ProductCategory,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
