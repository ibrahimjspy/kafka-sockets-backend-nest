import { Injectable, Logger } from '@nestjs/common';
import {
  CategoryMappingDto,
  OsMappingType,
  ProductMappingResponseDto,
  ProductMappingsDto,
  SyncCategoryMappingDto,
} from './Product.mapping.types';
import axios from 'axios';
import {
  AUTO_SYNC_MAPPING_URL,
  B2B_MAPPING_URL,
  MAPPING_SERVICE_HEADERS,
  MAPPING_SERVICE_URL,
  PRODUCT_BATCH_SIZE,
  RETRY_COUNT,
} from '../../../../constants';
import { AutoSyncDto, DeActivateAutoSyncDto } from '../../Product.dto';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import polly from 'polly-js';
import {
  chunkArray,
  convertMapToProductMapping,
  getElasticSearchDocumentIds,
  getProductMappingFilter,
  transformCopiedProductMapping,
  validateSaveMappingsList,
  validateSingleProductMappings,
  validateSyncedRetailerMappings,
} from './Product.mapping.service.utils';
import { ProductVariantShopMapping } from 'src/database/destination/addProductToShop';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isArrayEmpty } from '../../Product.utils';
import PromisePool from '@supercharge/promise-pool/dist';
import { getShopDetails } from 'src/graphql/source/handler/shop';
import { getShopFieldValues } from 'src/graphql/utils/getShop';
import { ProductProduct } from 'src/database/destination/product/product';
@Injectable()
export class ProductMappingService {
  private readonly logger = new Logger(ProductMappingService.name);
  @InjectRepository(ProductVariantShopMapping)
  private readonly productVariantMappingRepository: Repository<ProductVariantShopMapping>;

  /**
   * @description -- this method stores mapping in bulk in destination mapping service which we are currently using Elastic search
   * @warn -- this can crete mappings using falsy vales as well , because of how ES stores its documents
   */
  public async saveBulkMappings(mappingsList: ProductMappingsDto[]) {
    return polly()
      .logger(function (error) {
        console.dir(error, { depth: null });
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        if (!validateSaveMappingsList(mappingsList)) return;
        const addProductMapping = await axios.post(
          `${MAPPING_SERVICE_URL}/documents`,
          JSON.stringify(mappingsList),
          {
            headers: MAPPING_SERVICE_HEADERS.headers,
          },
        );
        return addProductMapping.data;
      });
  }

  /**
   * @description -- this method stores mapping for retailer against its category
   */
  public async saveSyncCategoryMapping(mappingData: AutoSyncDto) {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        const mappingObject: SyncCategoryMappingDto = {
          shr_category_id: mappingData.categoryId,
          shr_retailer_shop_id: mappingData.shopId,
        };
        const addProductMapping = await axios.post(
          `${AUTO_SYNC_MAPPING_URL}/documents`,
          JSON.stringify(mappingObject),
          {
            headers: MAPPING_SERVICE_HEADERS.headers,
          },
        );
        return addProductMapping.data;
      });
  }

  /**
   * @description -- this method returns product mapping against product ids and retailer
   */
  public async getProductsMapping(
    productsData: ProductTransformedDto[],
    autoSyncInput: AutoSyncDto,
  ) {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        const productIds = productsData.map((product) => {
          return product.sourceId;
        });
        const filters = JSON.stringify({
          query: '',
          page: { size: 100 },
          filters: {
            all: [
              {
                shr_b2b_product_id: productIds,
              },
              {
                retailer_id: autoSyncInput.shopId,
              },
            ],
          },
        });
        const getProductsMapping = await axios.post(
          `${MAPPING_SERVICE_URL}/search`,
          filters,
          MAPPING_SERVICE_HEADERS,
        );
        return getProductsMapping.data;
      });
  }

  /**
   * @description -- this method fetches whether a category is synced against retailer or not
   */
  private async getSyncCategoryMappings(autoSyncInput: AutoSyncDto) {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        const filters = JSON.stringify({
          query: '',
          page: { size: 100 },
          filters: {
            all: [
              {
                shr_category_id: autoSyncInput.categoryId,
              },
              {
                shr_retailer_shop_id: autoSyncInput.shopId,
              },
            ],
          },
        });
        const getSyncedCategoriesMapping = await axios.post(
          `${AUTO_SYNC_MAPPING_URL}/search`,
          filters,
          MAPPING_SERVICE_HEADERS,
        );
        return getSyncedCategoriesMapping.data;
      });
  }

  /**
   * @description -- this method fetches whether a category is synced against retailer or not
   */
  public async validateMappings(
    autoSyncInput: AutoSyncDto,
    productsList: ProductTransformedDto[],
  ) {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        const [productMappings, categoryMappings] = await Promise.all([
          this.getProductsMapping(productsList, autoSyncInput),
          this.getSyncCategoryMappings(autoSyncInput),
        ]);
        if (categoryMappings?.results?.length == 0) return [];
        return productsList.filter((product) => {
          if (
            productMappings?.results?.some(
              (mapping) =>
                mapping?.shr_b2b_product_id?.raw === product.sourceId,
            )
          ) {
            return;
          }
          return product;
        });
      });
  }

  /**
   * @description -- this method returns all synced retailers against a category
   */
  public async getSyncedRetailers(
    categoryId: string,
    currentPage = 1,
  ): Promise<CategoryMappingDto[]> {
    return polly()
      .logger(function (error) {
        console.dir(error, { depth: null });
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        let results = [];
        const filters = JSON.stringify({
          query: '',
          page: { size: 1000, current: currentPage },
          filters: {
            all: [
              {
                shr_category_id: `${categoryId}`,
              },
            ],
          },
        });
        const syncedRetailers = await axios.post(
          `${AUTO_SYNC_MAPPING_URL}/search`,
          filters,
          MAPPING_SERVICE_HEADERS,
        );
        const totalPages = syncedRetailers.data.meta.page.total_pages;
        results = results.concat(syncedRetailers.data.results);
        if (currentPage !== totalPages && totalPages !== 0) {
          const nextPageRetailer = await this.getSyncedRetailers(
            categoryId,
            currentPage + 1,
          );
          results = results.concat(nextPageRetailer);
        }
        return validateSyncedRetailerMappings(results);
      });
  }

  /**
   * @description -- this method returns product mapping against a single source product
   */
  public async getAllProductMappings(
    { productId, shopId },
    currentPage = 1,
  ): Promise<ProductMappingResponseDto[]> {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        let results = [];
        const filters = JSON.stringify({
          query: '',
          page: { size: 1000, current: currentPage },
          filters: getProductMappingFilter(productId, shopId),
        });
        const productMappings = await axios.post(
          `${MAPPING_SERVICE_URL}/search`,
          filters,
          MAPPING_SERVICE_HEADERS,
        );
        results = results.concat(productMappings.data.results);
        const totalPages = productMappings.data.meta.page.total_pages;
        if (currentPage !== totalPages && totalPages !== 0) {
          const nextPageProductIds = await this.getAllProductMappings(
            { productId, shopId },
            currentPage + 1,
          );
          results = results.concat(nextPageProductIds);
        }
        return validateSingleProductMappings({ shopId }, results);
      });
  }

  /**
   * @description -- this method removes product mapping against retailer
   */
  public async removeProductMappingsFromElasticSearch(shopId: string) {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        const allMappings = await this.getAllProductMappings({
          productId: '',
          shopId: shopId,
        });
        const documentIdsArray = await getElasticSearchDocumentIds(allMappings);
        if (isArrayEmpty(documentIdsArray[0])) return;
        const { ...documentIds } = await PromisePool.for(documentIdsArray)
          .withConcurrency(PRODUCT_BATCH_SIZE)
          .handleError((error) => {
            this.logger.error(error);
          })
          .process(async (documentIds: string[]) => {
            const deleteProductMapping = await axios({
              method: 'delete',
              url: `${MAPPING_SERVICE_URL}/documents`,
              headers: MAPPING_SERVICE_HEADERS.headers,
              data: documentIds,
            });
            return deleteProductMapping?.data;
          });
        return documentIds.results;
      });
  }

  /**
   * @description -- this method fetches whether a category is synced against retailer or not
   */
  public async removeSyncedCategoryMapping(
    shopId: string,
    categoryId?: string,
  ) {
    return polly()
      .logger(function (error) {
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        const filters = JSON.stringify({
          query: '',
          page: { size: 100 },
          filters: {
            all: [
              {
                shr_retailer_shop_id: shopId,
              },
              ...(categoryId ? [{ shr_category_id: categoryId }] : []),
            ],
          },
        });
        const syncedCategoryMappings = await axios.post(
          `${AUTO_SYNC_MAPPING_URL}/search`,
          filters,
          MAPPING_SERVICE_HEADERS,
        );
        const documentIds = getElasticSearchDocumentIds(
          syncedCategoryMappings.data.results,
        );
        if (isArrayEmpty(documentIds)) return documentIds;
        const deleteCategoryMapping = await axios({
          method: 'delete',
          url: `${AUTO_SYNC_MAPPING_URL}/documents`,
          headers: MAPPING_SERVICE_HEADERS.headers,
          data: documentIds,
        });
        return deleteCategoryMapping?.data;
      });
  }

  public async removeMappings(deActivateAutoSync: DeActivateAutoSyncDto) {
    try {
      let { shopId, storeId } = deActivateAutoSync;
      const { email } = deActivateAutoSync;
      if (email) {
        const shopDetails = await getShopDetails(email);
        shopId = shopDetails['id'];
        storeId =
          getShopFieldValues(shopDetails['fields'], 'storefrontids')[0] || null;
      }
      return await Promise.all([
        this.removeProductMappingsFromElasticSearch(shopId),
        this.productVariantMappingRepository.delete({
          shop_id: storeId,
        }),
        this.removeSyncedCategoryMapping(shopId),
      ]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Fetches all mappings for the given products from the mapping service, with retry functionality.
   * @param productsList2d An array of arrays containing ProductProduct objects.
   * @param currentPage The current page number for pagination (default: 1).
   * @returns A Promise that resolves to an array of mapping results.
   * @throws An error if the request fails after retries.
   */
  private async getMappingsCopyProducts(
    productsList2d: ProductProduct[][],
    currentPage = 1,
  ): Promise<ProductMappingResponseDto[]> {
    try {
      return await polly()
        .logger((error) => {
          console.log(error);
          Logger.error(error);
        })
        .waitAndRetry(RETRY_COUNT)
        .executeForPromise(async () => {
          const validProducts = productsList2d.flat(1);
          const productChunks = chunkArray(validProducts, 500); // Split validProducts into chunks of 32

          const results: ProductMappingResponseDto[] = [];
          const pool = new PromisePool();

          await pool
            .for(productChunks)
            .withConcurrency(10) // Adjust the concurrency as needed
            .process(async (chunk) => {
              const productMappings = this.getProductMapping(chunk);
              const filters = JSON.stringify({
                query: '',
                page: { size: 1000, current: currentPage },
                filters: convertMapToProductMapping(productMappings),
              });

              const elasticSearchResponse: any = await axios.post(
                `${MAPPING_SERVICE_URL}/search`,
                filters,
                MAPPING_SERVICE_HEADERS,
              );

              results.push(...elasticSearchResponse.data.results);

              const totalPages =
                elasticSearchResponse.data.meta?.page?.total_pages;
              if (currentPage !== totalPages && totalPages !== 0) {
                const nextPageProductIds = await this.getMappingsCopyProducts(
                  productsList2d,
                  currentPage + 1,
                );
                results.push(...nextPageProductIds);
              }
            })
            .catch((error) => {
              console.dir(error, { depth: null });
              Logger.error(error);
              throw error;
            });

          return results;
        });
    } catch (error) {
      console.dir(error, { depth: null });
      Logger.error(error);
      throw error;
    }
  }

  /**
   * @description -- This method stores mappings in bulk in the destination mapping service (Elasticsearch).
   * @warn -- This can create mappings using falsy values due to how Elasticsearch stores documents.
   */
  public async saveBulkMappingsCopiedProducts({ retailerId, productsList }) {
    try {
      const batchSize = 100;
      const validProducts = productsList.flat(1);
      this.logger.log(
        `storing elastic search mapping for ${validProducts.length} products`,
      );

      const productMappings = this.getProductMapping(validProducts);
      const masterProductDocuments = await this.getMappingsCopyProducts(
        productsList,
      );
      const createMappingsPayload = transformCopiedProductMapping(
        retailerId,
        productMappings,
        masterProductDocuments,
      );
      if (!validateSaveMappingsList(createMappingsPayload)) return;

      const chunkedPayload = chunkArray(createMappingsPayload, batchSize);

      const pool = await new PromisePool()
        .for(chunkedPayload)
        .withConcurrency(10)
        .process(async (mapping) => {
          return await axios.post(
            `${MAPPING_SERVICE_URL}/documents`,
            JSON.stringify(mapping),
            {
              headers: MAPPING_SERVICE_HEADERS.headers,
            },
          );
        });
      this.logger.log(
        `stored elastic search mapping for ${validProducts.length} products !!`,
      );
      return pool;
    } catch (error) {
      this.logger.log(error);
    }
  }

  /**
   * Generates a mapping between original and copied product IDs.
   * @param copiedProducts - The copied products.
   * @param key - The key used to determine the type of mapping. Default is 'parent'.
   * @returns A mapping between original and copied product IDs.
   */
  public getProductMapping(
    copiedProducts: ProductProduct[],
    key = 'parent',
  ): Map<number, number> {
    const mapping: Map<number, number> = new Map();
    copiedProducts.forEach((copiedProduct) => {
      const originalId =
        key === 'parent' ? copiedProduct.metadata.parentId : copiedProduct.id;
      const copiedId =
        key === 'parent' ? copiedProduct.id : copiedProduct.metadata.parentId;
      mapping.set(originalId, copiedId);
    });
    return mapping;
  }

  /**
   * returns os product id against a b2b product id from elastic search mapping
   */
  public async getOSIdMapping(b2bProductId: string) {
    try {
      const filters = JSON.stringify({
        query: '',
        page: { size: 100 },
        filters: {
          all: [
            {
              shr_b2b_product_id: b2bProductId,
            },
          ],
        },
      });
      const getB2BMapping = await axios.post(
        `${B2B_MAPPING_URL}/search`,
        filters,
        MAPPING_SERVICE_HEADERS,
      );
      const response: OsMappingType = getB2BMapping.data;
      return response.results[0]?.os_product_id.raw || null;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * returns b2c master product id against an os product id
   */
  public async getMasterProductId(osProductId: string): Promise<string> {
    try {
      const filters = JSON.stringify({
        query: '',
        page: { size: 10 },
        filters: {
          all: [
            {
              os_product_id: osProductId,
            },
            {
              retailer_id: 'master',
            },
          ],
        },
      });
      const productMappings = await axios.post(
        `${MAPPING_SERVICE_URL}/search`,
        filters,
        MAPPING_SERVICE_HEADERS,
      );
      const response = productMappings.data;
      return response.results[0]?.shr_b2c_product_id.raw || null;
    } catch (error) {
      this.logger.error('getting master id failed', error);
    }
  }

  /**
   * @description -- this method validates whether thus category is synced or not
   * @param -- auto sync input for syncing category
   * @returns -- boolean whether category is synced or not
   */
  public async validateSyncCategoryMapping(
    autoSyncInout: AutoSyncDto,
  ): Promise<boolean> {
    const syncCategoriesMapping = await this.getSyncCategoryMappings(
      autoSyncInout,
    );
    return syncCategoriesMapping?.results?.length;
  }
}
