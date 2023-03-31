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
import { SocketClientService } from '../Socket/Socket.client.service';
import { KafkaController } from './services/kafka/Kafka.controller';
import { v4 as uuidv4 } from 'uuid';
import { KAFKA_BULK_PRODUCT_CREATE_TOPIC } from 'src/constants';

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
    private readonly webSocketService: SocketClientService,
    private readonly kafkaService: KafkaController,
  ) {}
  private readonly logger = new Logger(ProductService.name);

  /**
   * @description -- this returns sync a category for a retailer and imports bulk products against that category
   * @step -- add category to shop
   * @step -- fetch bulk products from source
   * @step -- transform bulk products
   * @step -- create bulk products
   */
  public async autoSync(autoSyncInput: AutoSyncDto): Promise<object> {
    try {
      const { storeId, categoryId } = autoSyncInput;
      const pagination: PaginationDto = {
        hasNextPage: true,
        endCursor: '',
        first: 50,
        totalCount: 0,
        batchNumber: 0,
      };
      const eventId = uuidv4();
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
        pagination.hasNextPage = categoryData.pageInfo.hasNextPage;
        pagination.totalCount = categoryData.totalCount;
        pagination.batchNumber = pagination.batchNumber + 1;

        const productsData =
          this.productTransformer.payloadBuilder(categoryData);
        await this.kafkaService.pushProductBatch({
          topic: KAFKA_BULK_PRODUCT_CREATE_TOPIC,
          messages: [
            {
              value: JSON.stringify({
                autoSyncInput,
                productsData,
                addCategoryToShop,
                pagination,
                eventId,
              }),
            },
          ],
        });
      }
      return { eventId };
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
  public async createBulkProducts({
    autoSyncInput,
    productsData,
    addCategoryToShop,
    pagination,
    eventId,
  }) {
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
      this.webSocketService.sendAutoSyncProgress(
        pagination,
        autoSyncInput,
        eventId,
      ),
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
