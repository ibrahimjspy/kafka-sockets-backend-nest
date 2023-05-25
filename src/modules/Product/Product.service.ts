import { Injectable, Logger } from '@nestjs/common';
import { AutoSyncDto, GetProductsDto, PaginationDto } from './Product.dto';
import { getProductsHandler } from 'src/graphql/source/handler/product';
import { ProductTransformer } from './transformer/Product.transformer';
import {
  ProductTransformedDto,
  UpdatedProductFieldsDto,
} from './transformer/Product.transformer.types';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';
import { ProductVariantService } from './services/productVariant/Product.variants.service';
import { ProductMediaService } from './services/productMedia/Product.media.service';
import {
  CategoryMappingDto,
  ProductMappingResponseDto,
  ProductMappingsDto,
} from './services/productMapping/Product.mapping.types';
import { PromisePool } from '@supercharge/promise-pool';
import { ProductMappingService } from './services/productMapping/Product.mapping.service';
import { ShopDestinationService } from 'src/graphql/destination/handlers/shop';
import { RollbackService } from './services/rollback/Rollback.service';
import { SocketClientService } from '../Socket/Socket.client.service';
import { KafkaController } from './services/kafka/Kafka.controller';
import { v4 as uuidv4 } from 'uuid';
import {
  KAFKA_BULK_PRODUCT_CREATE_TOPIC,
  KAFKA_CREATE_PRODUCT_BATCHES_TOPIC,
  KAFKA_CREATE_PRODUCT_COPIES_TOPIC,
  PRODUCT_BATCH_SIZE,
  PRODUCT_UPDATE_BATCH_SIZE,
} from 'src/constants';
import {
  getCategoryIds,
  isArrayEmpty,
  productTotalCountTransformer,
  transformMappings,
  transformProductsListSync,
} from './Product.utils';
import { getStoreIdFromShop } from 'src/graphql/source/handler/shop';
import { ProductVariantInterface } from './services/productVariant/Product.variant.types';
import { ValidationService } from './services/validation/Product.validation.service';
import { idBase64Decode } from './services/productMedia/Product.media.utils';
import { SyncMappingsRepository } from 'src/database/destination/repositories/syncProducts';
import { ProductVariantMappingRepository } from 'src/database/destination/repositories/addProductToShop';
import { CreateProductCopiesRepository } from 'src/database/destination/repositories/copyProducts';
import { ProductCategoryRepository } from 'src/database/destination/repositories/category';
import { ProductCategory } from 'src/database/destination/category';
import { ProductCopyService } from './services/productCopy/Service';
import { ProductVariantShopMapping } from 'src/database/destination/addProductToShop';

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
    private readonly validationService: ValidationService,
    private readonly syncMappingsRepository: SyncMappingsRepository,
    private readonly productVariantMappingRepository: ProductVariantMappingRepository,
    private readonly createProductCopiesRepository: CreateProductCopiesRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productCopyService: ProductCopyService,
  ) {}
  private readonly logger = new Logger(ProductService.name);

  /**
   * @description -- this sync a category for a retailer and imports bulk products against that category
   * @step -- it send message to kafka to create bulk products
   * @step -- add category to shop
   * @step -- fetch bulk products from source
   * @step -- transform bulk products
   * @step -- create bulk products
   */
  public async autoSync(autoSyncInput: AutoSyncDto): Promise<object> {
    try {
      const { storeId, categoryId } = autoSyncInput;
      const eventId = uuidv4();
      const [addCategoryToShop] = await Promise.all([
        this.shopDestinationApi.addCategoryToShop(storeId, categoryId),
        this.productMappingService.saveSyncCategoryMapping(autoSyncInput),
      ]);
      await this.kafkaService.createProductBatches({
        topic: KAFKA_CREATE_PRODUCT_BATCHES_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              autoSyncInput,
              addCategoryToShop,
              eventId,
            }),
          },
        ],
      });
      return { categoryId, eventId };
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method creates bulk product batches
   * @step -- fetches products against a category
   * @step -- send a kafka message which creates product in bulk against that batch
   * @link -- createBulkProducts()
   */
  public async createProductBatches({
    autoSyncInput,
    addCategoryToShop,
    eventId,
  }) {
    try {
      const pagination: PaginationDto = {
        hasNextPage: true,
        endCursor: '',
        first: 50,
        totalCount: 0,
        batchNumber: 0,
      };
      while (pagination.hasNextPage && pagination.batchNumber < 40) {
        const categoryData: GetProductsDto = await getProductsHandler(
          { first: pagination.first, after: pagination.endCursor },
          {
            categories: [`${autoSyncInput.categoryId}`],
            ids: [],
            isAvailable: true,
          },
        );

        pagination.endCursor = categoryData.pageInfo.endCursor;
        pagination.hasNextPage = categoryData.pageInfo.hasNextPage;
        pagination.totalCount = productTotalCountTransformer(
          categoryData.totalCount,
        );
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
    const validateProducts = this.validationService.transformedProducts(
      productsData,
      addCategoryToShop,
    );

    const { ...bulkProducts } = await PromisePool.for(validateProducts)
      .withConcurrency(PRODUCT_BATCH_SIZE)
      .handleError((error) => {
        this.logger.error(error);
      })
      .onTaskFinished((product: ProductTransformedDto, pool) => {
        const completedCount = pool.processedCount();
        this.webSocketService.sendAutoSyncProgress(
          pagination,
          autoSyncInput,
          eventId,
          completedCount,
        );
        this.logger.log(`Progress: ${pool.processedPercentage()}%`);
      })
      .process(async (product: ProductTransformedDto) => {
        return await this.createSingleProduct(autoSyncInput, product);
      });

    return bulkProducts;
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
  ): Promise<ProductMappingsDto> {
    const productId = await this.productDestinationApi.createProduct(
      productData,
    );

    const addProductToChannel = await Promise.allSettled([
      await this.productDestinationApi.productChannelListing(productId),
    ]);

    const [storeProductBrand, createProductMedia] = await Promise.allSettled([
      this.productVariantService.bulkProductVariantCreate(
        productId,
        productData,
      ),
      this.productDestinationApi.storeProductBrand(productId, productData),
      this.productMediaService.bulkMediaCreate(productId, productData),
    ]);

    const productMapping =
      this.productTransformer.transformCreatedProductForMapping(
        autoSyncInput,
        productId,
        productData,
      );

    const [storeProductStatus, saveMappings] = await Promise.allSettled([
      this.productDestinationApi.saveProductCreateStatus(productId),
      this.productMappingService.saveBulkMappings([productMapping]), //TODO move these mappings to bulk once shop service is updated
    ]);

    await this.productRollbackService.handleProductCreateRollbacks(productId, [
      addProductToChannel,
      storeProductBrand,
      createProductMedia,
      saveMappings,
      storeProductStatus,
    ]);

    return productMapping;
  }

  /**
   * @description -- this method handles if a new product is added in b2b it adds it against all retailers subscribed against its category
   * @step -- fetch that product details
   * @step -- transform that product
   * @step -- fetch that product details
   * @step -- fetch retailers that are synced to that product's category
   * @step -- fetch stores against each retailer synced
   * @step -- create product using transformed product and retailer shop and store ids
   * @step -- store product mappings
   * @link -- createSingleProduct()
   * @link -- createNewProductCDC()
   */
  public async handleNewProductCDC(productId: string) {
    const productData = await getProductsHandler(
      { first: 1 },
      { categories: [], ids: [productId] },
    );
    let syncedRetailerIds: CategoryMappingDto[] = [];
    const transformedProduct =
      this.productTransformer.payloadBuilder(productData)[0];
    const categoryIds = transformedProduct.categoryTree;
    await Promise.all(
      categoryIds.map(async (categoryId) => {
        const retailerIds = await this.productMappingService.getSyncedRetailers(
          categoryId,
        );
        syncedRetailerIds = syncedRetailerIds.concat(retailerIds);
      }),
    );
    if (isArrayEmpty(syncedRetailerIds)) return syncedRetailerIds;

    return await this.createNewProductCDC(
      syncedRetailerIds,
      transformedProduct,
    );
  }

  /**
   * @description -- this method takes in new product that is created and retailer ids against whom we need to add this product
   * @step -- creates product copies
   * @step -- store product mappings
   * @link -- createSingleProduct()
   * @link -- handleNewProductCDC()
   */
  public async createNewProductCDC(
    syncedRetailerIds: CategoryMappingDto[],
    newProduct: ProductTransformedDto,
  ) {
    try {
      const { ...bulkProducts } = await PromisePool.for(syncedRetailerIds)
        .withConcurrency(PRODUCT_BATCH_SIZE)
        .handleError((error) => {
          this.logger.error(error);
        })
        .process(async (retailer: CategoryMappingDto) => {
          const categoryId = newProduct.categoryId;
          const shopId = retailer.shr_retailer_shop_id.raw;
          const storeId = await getStoreIdFromShop(shopId);
          const autoSyncInput: AutoSyncDto = {
            shopId,
            storeId,
            categoryId,
          };
          const validateProduct =
            await this.productMappingService.validateMappings(autoSyncInput, [
              newProduct,
            ]);
          if (isArrayEmpty(validateProduct)) return;

          return await this.createSingleProduct(autoSyncInput, newProduct);
        });
      await this.productMappingService.saveBulkMappings(bulkProducts.results);
      return syncedRetailerIds;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method updates product information against b2c copies which needs to be updated
   * @step -- get product mappings
   * @step -- compare product information
   * @link -- update changes
   * @link -- updateProductFields()
   */
  public async handleProductUpdateCDC(productId: string) {
    try {
      const sourceProductData = await getProductsHandler(
        { first: 1 },
        { categories: [], ids: [productId] },
      );
      const transformedProductSource =
        this.productTransformer.payloadBuilder(sourceProductData)[0];
      const productMappings =
        await this.productMappingService.getAllProductMappings({
          productId: transformedProductSource.sourceId,
          shopId: null,
        });
      return await PromisePool.for(productMappings)
        .withConcurrency(PRODUCT_BATCH_SIZE)
        .handleError((error) => {
          this.logger.error(error);
        })
        .process(async (destinationProduct: ProductMappingResponseDto) => {
          const destinationProductId =
            destinationProduct.shr_b2c_product_id.raw;
          const destinationProductsData =
            await this.productDestinationApi.getProducts(
              { first: 1 },
              { categories: [], ids: [destinationProductId] },
            );
          const transformedProductDestination =
            this.productTransformer.payloadBuilder(destinationProductsData)[0];
          const updatedProductFields =
            this.productTransformer.getUpdatedProductFields(
              transformedProductSource,
              transformedProductDestination,
              this.productTransformer.removeEdges(destinationProductsData)[0],
            );
          return await this.updateProductFields(
            destinationProductId,
            updatedProductFields,
            destinationProductsData,
          );
        });
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method handles product updates separately
   * @step -- product basic information update
   * @step -- pricing update
   * @step -- listing update
   * @link -- handleProductUpdateCDC()
   */
  public async updateProductFields(
    productId: string,
    updatedProductFields: UpdatedProductFieldsDto,
    destinationProductData: GetProductsDto,
  ) {
    const { name, description, categoryId, resalePrice } = updatedProductFields;
    if (name || description || categoryId) {
      await this.productDestinationApi.updateProduct(
        productId,
        updatedProductFields,
      );
    }
    if (resalePrice) {
      const productData = this.productTransformer.removeEdges(
        destinationProductData,
      )[0];
      const productVariants = productData.variants;
      await PromisePool.for(productVariants)
        .withConcurrency(PRODUCT_UPDATE_BATCH_SIZE)
        .handleError((error) => {
          this.logger.error(error);
        })
        .process(async (productVariant: ProductVariantInterface) => {
          const variantId = productVariant.id;
          return await this.productVariantService.updateProductVariantPrice(
            variantId,
            updatedProductFields,
          );
        });
    }
    if (updatedProductFields.hasOwnProperty('isAvailableForPurchase')) {
      await this.productDestinationApi.updateProductListing(
        productId,
        updatedProductFields,
      );
    }

    return productId;
  }

  /**
   * @description -- this syncs a category by firstly getting all category ids and then calling a method
   * which creates copies of products and add those copied products to shop
   * after getting product mappings we then store mappings in elastic search and shop service
   */
  public async autoSyncV2(autoSyncInput: AutoSyncDto) {
    try {
      const { storeId, categoryId } = autoSyncInput;
      const eventId: string = uuidv4();
      const [addCategoryToShop] = await Promise.all([
        this.shopDestinationApi.addCategoryToShop(storeId, categoryId),
        this.productMappingService.saveSyncCategoryMapping(autoSyncInput),
      ]);
      await this.kafkaService.pushProductCopiesToShop({
        topic: KAFKA_CREATE_PRODUCT_COPIES_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              autoSyncInput,
              eventId,
              addCategoryToShop,
            }),
          },
        ],
      });
      return { categoryId, eventId };
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description Syncs a category by getting all category IDs and calling a stored procedure to create copies of products in the B2C database.
   * The product mappings are then stored in Elasticsearch and the shop service.
   * @param autoSyncInput The auto sync input object.
   * @param eventId The event ID.
   * @param addCategoryToShop add category to shop from shop service
   * @returns A Promise that resolves to an array of product variant shop mappings.
   */
  public async autoSyncV2ProductsCreate({
    autoSyncInput,
    eventId,
    addCategoryToShop,
  }): Promise<ProductVariantShopMapping[]> {
    try {
      const { storeId, categoryId } = autoSyncInput;
      const BATCH_SIZE = 1;
      const parentCategoryId = idBase64Decode(categoryId);
      const categories =
        await this.productCategoryRepository.fetchCategoriesInSameTree(
          Number(parentCategoryId),
        );
      const totalCount =
        await this.productCategoryRepository.getProductCountForCategories(
          getCategoryIds(categories),
        );
      let completedCount = 0;
      this.webSocketService.sendAutoSyncProgressV2(
        totalCount,
        completedCount,
        autoSyncInput,
        eventId,
      );
      const { ...bulkProducts } = await PromisePool.for(categories)
        .withConcurrency(BATCH_SIZE)
        .handleError((error) => {
          this.logger.error(error);
        })
        .onTaskFinished((category: ProductCategory, pool) => {
          this.webSocketService.sendAutoSyncProgressV2(
            totalCount,
            completedCount,
            autoSyncInput,
            eventId,
          );
          this.logger.log(`Progress: ${pool.processedPercentage()}%`);
        })
        .process(async (category: ProductCategory) => {
          const productCopiesCreate =
            await this.productCopyService.createCopiesForCategory(category.id);
          completedCount = completedCount + productCopiesCreate.length;
          return productCopiesCreate;
        });

      const saveMappings =
        await this.productVariantMappingRepository.saveProductVariantMappings(
          transformMappings(
            transformProductsListSync(bulkProducts.results),
            storeId,
            addCategoryToShop,
          ),
        );
      return saveMappings;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
