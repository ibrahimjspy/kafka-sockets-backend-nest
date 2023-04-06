import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './Product.service';
import { AutoSyncDto, ImportBulkCategoriesDto } from './Product.dto';
import PromisePool from '@supercharge/promise-pool/dist';
import { productCreateMock } from 'test/mocks/createProduct';

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

  @Get('hello')
  getHello(): any {
    return this.productService.createSingleProduct(
      productCreateMock.autoSyncInput,
      productCreateMock.productData,
      productCreateMock.addCategoryToShop,
    );
  }
}
