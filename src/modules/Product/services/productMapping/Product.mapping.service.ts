import { Injectable, Logger } from '@nestjs/common';
import {
  CategoryMappingDto,
  ProductMappingResponseDto,
  ProductMappingsDto,
  SyncCategoryMappingDto,
} from './Product.mapping.types';
import axios from 'axios';
import {
  AUTO_SYNC_MAPPING_URL,
  MAPPING_SERVICE_HEADERS,
  MAPPING_SERVICE_TOKEN,
  MAPPING_SERVICE_URL,
  PRODUCT_BATCH_SIZE,
  RETRY_COUNT,
} from '../../../../constants';
import { AutoSyncDto } from '../../Product.dto';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import polly from 'polly-js';
import {
  getElasticSearchDocumentIds,
  getProductMappingFilter,
  validateSaveMappingsList,
  validateSingleProductMappings,
  validateSyncedRetailerMappings,
} from './Product.mapping.service.utils';
import { ProductVariantShopMapping } from 'src/database/destination/addProductToShop';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isArrayEmpty } from '../../Product.utils';
import PromisePool from '@supercharge/promise-pool/dist';
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
        Logger.error(error);
      })
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        if (!validateSaveMappingsList(mappingsList)) return;
        const addProductMapping = await axios.post(
          `${MAPPING_SERVICE_URL}/documents`,
          JSON.stringify(mappingsList),
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer private-${MAPPING_SERVICE_TOKEN}`,
            },
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
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer private-${MAPPING_SERVICE_TOKEN}`,
            },
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
  public async getSyncCategoryMappings(autoSyncInput: AutoSyncDto) {
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
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer private-${MAPPING_SERVICE_TOKEN}`,
              },
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
  public async removeSyncedCategoryMapping(shopId: string) {
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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer private-${MAPPING_SERVICE_TOKEN}`,
          },
          data: documentIds,
        });
        return deleteCategoryMapping?.data;
      });
  }

  public async removeMappings({ shopId, storeId }) {
    try {
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
}
