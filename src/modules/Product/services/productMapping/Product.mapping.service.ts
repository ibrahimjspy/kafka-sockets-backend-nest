import { Injectable, Logger } from '@nestjs/common';
import {
  ProductMappingsDto,
  SyncCategoryMappingDto,
} from './Product.mapping.types';
import axios from 'axios';
import {
  AUTO_SYNC_MAPPING_URL,
  MAPPING_MAPPING_TOKEN,
  MAPPING_SERVICE_HEADERS,
  MAPPING_SERVICE_URL,
} from '../../../../constants';
import axiosRetry from 'axios-retry';
import { AutoSyncDto } from '../../Product.dto';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
@Injectable()
export class ProductMappingService {
  private readonly logger = new Logger(ProductMappingService.name);

  /**
   * @description -- this method stores mapping in bulk in destination mapping service which we are currently using Elastic search
   * @warn -- this can crete mappings using falsy vales as well , because of how ES stores its documents
   */
  public async storeBulkMappings(mappingsList: ProductMappingsDto[]) {
    try {
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
      axiosRetry(axios, { retries: 3 });
      return addProductMapping.data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method stores mapping for retailer against its category
   */
  public async storeSyncCategoryMapping(mappingData: AutoSyncDto) {
    try {
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
      axiosRetry(axios, { retries: 3 });
      return addProductMapping.data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method returns product mapping against product ids and retailer
   */
  public async getProductsMapping(
    productsData: ProductTransformedDto[],
    autoSyncInput: AutoSyncDto,
  ) {
    try {
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
      axiosRetry(axios, { retries: 3 });
      return getProductsMapping.data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method fetches whether a category is synced against retailer or not
   */
  public async getSyncCategoryMappings(autoSyncInput: AutoSyncDto) {
    try {
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
      axiosRetry(axios, { retries: 3 });
      return getSyncedCategoriesMapping.data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description -- this method fetches whether a category is synced against retailer or not
   */
  public async validateMappings(
    autoSyncInput: AutoSyncDto,
    productsList: ProductTransformedDto[],
  ) {
    try {
      const [productMappings, categoryMappings] = await Promise.all([
        this.getProductsMapping(productsList, autoSyncInput),
        this.getSyncCategoryMappings(autoSyncInput),
      ]);
      if (categoryMappings.results.length == 0) return [];
      return productsList.filter((product) => {
        if (
          productMappings.results.some(
            (mapping) => mapping.shr_b2b_product_id.raw === product.sourceId,
          )
        ) {
          return;
        }
        return product;
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
