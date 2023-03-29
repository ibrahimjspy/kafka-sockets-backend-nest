import { Injectable, Logger } from '@nestjs/common';
import { AutoSyncDto, GetProductsDto, PaginationDto } from './Product.dto';
import { getProductsHandler } from 'src/graphql/source/handler/product';
import { ProductTransformer } from './transformer/Product.transformer';
import { ProductTransformedDto } from './transformer/Product.transformer.types';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';
import { ProductVariantService } from './services/productVariant/Product.variants.service';
import { ProductMediaService } from './services/productMedia/Product.media.service';
import { ProductMappingsDto } from './services/productMapping/Product.mapping.types';
import { PromisePool } from '@supercharge/promise-pool';
import { ProductMappingService } from './services/productMapping/Product.mapping.service';
import { ShopDestinationService } from 'src/graphql/destination/handlers/shop';

@Injectable()
export class ProductService {
  constructor(
    private readonly productTransformer: ProductTransformer,
    private readonly productDestinationApi: ProductDestinationService,
    private readonly shopDestinationApi: ShopDestinationService,
    private readonly productVariantService: ProductVariantService,
    private readonly productMediaService: ProductMediaService,
    private readonly productMappingService: ProductMappingService,
  ) {}
  private readonly logger = new Logger(ProductService.name);
  public async autoSync(autoSyncInput: AutoSyncDto): Promise<any> {
    try {
      const { storeId, categoryId } = autoSyncInput;
      const pagination: PaginationDto = {
        hasNextPage: true,
        endCursor: '',
        first: 100,
      };
      const addCategoryToShop = await this.shopDestinationApi.addCategoryToShop(
        storeId,
        categoryId,
      );
      while (pagination.hasNextPage) {
        const categoryData: GetProductsDto = await getProductsHandler(
          { first: pagination.first, after: pagination.endCursor },
          { categories: [`${autoSyncInput.categoryId}`] },
        );
        pagination.endCursor = categoryData.pageInfo.endCursor;
        pagination.hasNextPage = categoryData.pageInfo.hasNextPage;

        const productsData =
          this.productTransformer.payloadBuilder(categoryData);
        await this.createBulkProducts(
          autoSyncInput,
          productsData,
          addCategoryToShop,
        );
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async createBulkProducts(
    autoSyncInput: AutoSyncDto,
    productsData: ProductTransformedDto[],
    addCategoryToShop,
  ) {
    const BATCH_SIZE = 20;
    const { ...bulkProducts } = await PromisePool.for(productsData)
      .withConcurrency(BATCH_SIZE)
      .handleError((error) => {
        this.logger.error(error);
      })
      .onTaskFinished((product: ProductTransformedDto, pool) => {
        this.logger.log(`Progress: ${pool.processedPercentage()}%`);
      })
      .process(async (product: ProductTransformedDto) => {
        return await this.createSingleProduct(
          autoSyncInput,
          product,
          addCategoryToShop,
        );
      });
    const [...storeMappings] = await Promise.all([
      this.productDestinationApi.addProductsToStore(
        bulkProducts.results,
        autoSyncInput.storeId,
      ),
      this.productMappingService.storeBulkMappings(bulkProducts.results),
    ]);
    return storeMappings;
  }

  public async createSingleProduct(
    autoSyncInput: AutoSyncDto,
    productData: ProductTransformedDto,
    addCategoryToShop: string,
  ): Promise<ProductMappingsDto> {
    const productId = await this.productDestinationApi.createProduct(
      productData,
    );
    const { storeId } = autoSyncInput;

    await this.productDestinationApi.productChannelListing(productId);
    const [createProductVariants] = await Promise.all([
      this.productVariantService.bulkProductVariantCreate(
        productId,
        productData,
      ),
      this.productDestinationApi.storeProductBrand(productId, productData),
      this.productMediaService.bulkMediaCreate(productId, productData),
    ]);
    await this.productDestinationApi.addProductToShop(
      storeId,
      productId,
      addCategoryToShop,
      createProductVariants,
    );
    this.productDestinationApi.storeProductCreateStatus(productId);

    return this.productTransformer.transformCreatedProductForMapping(
      autoSyncInput,
      productId,
      productData,
    );
  }
}
