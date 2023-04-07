import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './Product.service';
import {
  AutoSyncDto,
  ImportBulkCategoriesDto,
  ProductIdDto,
} from './Product.dto';
import PromisePool from '@supercharge/promise-pool/dist';

@Controller()
@ApiTags('auto-sync-product-api')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}
  @Post('api/v1/auto/sync')
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
    return await this.productService.handleNewProductCDC(
      productInput.productId,
    );
  }
}
