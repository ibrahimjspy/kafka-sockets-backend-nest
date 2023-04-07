import { Injectable, Logger } from '@nestjs/common';
import {
  CategoryMappingDto,
  ProductMappingsDto,
  SyncCategoryMappingDto,
} from './Product.mapping.types';
import axios from 'axios';
import {
  AUTO_SYNC_MAPPING_URL,
  MAPPING_MAPPING_TOKEN,
  MAPPING_SERVICE_HEADERS,
  MAPPING_SERVICE_URL,
  RETRY_COUNT,
} from '../../../../constants';
import { AutoSyncDto } from '../../Product.dto';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import polly from 'polly-js';
import { validateSyncedRetailerMappings } from './Product.mapping.service.utils';
@Injectable()
export class ProductMappingService {
  private readonly logger = new Logger(ProductMappingService.name);

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
        if (mappingsList.length == 0) return;
        const addProductMapping = await axios.post(
          `${MAPPING_SERVICE_URL}/documents`,
          JSON.stringify(mappingsList),
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer private-${MAPPING_MAPPING_TOKEN}`,
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
              Authorization: `Bearer private-${MAPPING_MAPPING_TOKEN}`,
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
          page: { size: 50, current: currentPage },
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
}
