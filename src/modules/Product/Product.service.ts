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
import { RollbackService } from './services/rollback/Rollback.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productTransformer: ProductTransformer,
    private readonly productDestinationApi: ProductDestinationService,
    private readonly shopDestinationApi: ShopDestinationService,
    private readonly productVariantService: ProductVariantService,
    private readonly productMediaService: ProductMediaService,
    private readonly productMappingService: ProductMappingService,
    private readonly productRollbackService: RollbackService,
  ) {}
  private readonly logger = new Logger(ProductService.name);

  /**
   * @description -- this returns sync a category for a retailer and imports bulk products against that category
   * @step -- add category to shop
   * @step -- fetch bulk products from source
   * @step -- transform bulk products
   * @step -- create bulk products
   */
  public async autoSync(autoSyncInput: AutoSyncDto): Promise<void> {
    try {
      const { storeId, categoryId } = autoSyncInput;
      const pagination: PaginationDto = {
        hasNextPage: true,
        endCursor: '',
        first: 80,
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

  /**
   * @description -- this method creates bulk products using promise pooling
   * @step -- create products
   * @step -- store product mappings
   * @link -- createSingleProduct()
   */
  public async createBulkProducts(
    autoSyncInput: AutoSyncDto,
    productsData: ProductTransformedDto[],
    addCategoryToShop,
  ) {
    const BATCH_SIZE = 50;
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
      this.productMappingService.storeBulkMappings(bulkProducts.results),
    ]);
    return storeMappings;
  }

  /**
   * @description -- this method creates a single product
   * @step -- create product
   * @step -- add product to channel
   * @step -- add product to shop
   * @step -- create product variants
   * @step -- create product media
   * @step -- store product status
   * @return  -- product which should be mapped in our services
   */
  public async createSingleProduct(
    autoSyncInput: AutoSyncDto,
    productData: ProductTransformedDto,
    addCategoryToShop: string,
  ): Promise<ProductMappingsDto> {
    const productId = await this.productDestinationApi.createProduct(
      productData,
    );
    const { storeId } = autoSyncInput;

    const addProductToChannel = await Promise.allSettled([
      await this.productDestinationApi.productChannelListing(productId),
    ]);

    const [createProductVariants, storeProductBrand, createProductMedia] =
      await Promise.allSettled([
        this.productVariantService.bulkProductVariantCreate(
          productId,
          productData,
        ),
        this.productDestinationApi.storeProductBrand(productId, productData),
        this.productMediaService.bulkMediaCreate(productId, productData),
      ]);
    const [addProductToShop, storeProductStatus] = await Promise.allSettled([
      this.productDestinationApi.addProductToShop(
        storeId,
        productId,
        addCategoryToShop,
        createProductVariants['value'],
      ),
      this.productDestinationApi.storeProductCreateStatus(productId),
    ]);

    await this.productRollbackService.handleProductCreateRollbacks(productId, [
      addProductToChannel,
      storeProductBrand,
      createProductMedia,
      addProductToShop,
      storeProductStatus,
    ]);

    return this.productTransformer.transformCreatedProductForMapping(
      autoSyncInput,
      productId,
      productData,
    );
  }
}
