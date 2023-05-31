import { Body, Controller, Delete, Logger, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './Product.service';
import {
  AutoSyncDto,
  DeActivateAutoSyncDto,
  ImportBulkCategoriesDto,
  ProductIdDto,
} from './Product.dto';
import PromisePool from '@supercharge/promise-pool/dist';
import { ProductMappingService } from './services/productMapping/Product.mapping.service';
import { ProductCopyService } from './services/productCopy/Service';
import { ProducerService } from './services/kafka/Kafka.producer.service';
import { KAFKA_NEW_PRODUCT_SYNC_TOPIC } from 'src/constants';

@Controller()
@ApiTags('auto-sync-product-api')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly productMappingService: ProductMappingService,
    private readonly productCopyService: ProductCopyService,
    private readonly kafkaProductService: ProducerService,
  ) {}
  @Post('api/v3/auto/sync')
  async autoSync(@Body() autoSyncInput: ImportBulkCategoriesDto) {
    const BATCH_SIZE = 1;
    const { ...syncCategories } = await PromisePool.for(
      autoSyncInput.categoryIds,
    )
      .withConcurrency(BATCH_SIZE)
      .handleError((error) => {
        this.logger.error(error);
      })
      .process(async (category: string) => {
        const syncCategoriesRequest: AutoSyncDto = {
          shopId: autoSyncInput.shopId,
          storeId: autoSyncInput.storeId,
          categoryId: category,
        };
        return this.productService.autoSync(syncCategoriesRequest);
      });
    return syncCategories.results;
  }

  @Post('api/v1/product')
  async handleNewProduct(@Body() productInput: ProductIdDto) {
    try {
      return await this.kafkaProductService.produce({
        topic: KAFKA_NEW_PRODUCT_SYNC_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              productId: productInput.productId,
            }),
          },
        ],
      });
    } catch (error) {}
  }

  @Put('api/v1/product')
  async handleProductUpdate(@Body() productInput: ProductIdDto) {
    return await this.productService.handleProductUpdateCDC(
      productInput.productId,
    );
  }

  @Delete('api/v1/auto/sync')
  async removeAutoSyncMapping(
    @Body() deActivateAutoSync: DeActivateAutoSyncDto,
  ) {
    return await this.productMappingService.removeMappings(deActivateAutoSync);
  }

  @Post('api/v2/auto/sync')
  async autoSyncV2(@Body() autoSyncInput: ImportBulkCategoriesDto) {
    const BATCH_SIZE = 1;
    const { ...syncCategories } = await PromisePool.for(
      autoSyncInput.categoryIds,
    )
      .withConcurrency(BATCH_SIZE)
      .handleError((error) => {
        this.logger.error(error);
      })
      .process(async (category: string) => {
        const syncCategoriesRequest: AutoSyncDto = {
          shopId: autoSyncInput.shopId,
          storeId: autoSyncInput.storeId,
          categoryId: category,
        };
        return this.productService.autoSyncV2(syncCategoriesRequest);
      });
    return syncCategories.results;
  }
}
