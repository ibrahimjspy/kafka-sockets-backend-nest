import { Injectable, Logger } from '@nestjs/common';
import {
  COLOR_ATTRIBUTE_ID,
  SIZE_ATTRIBUTE_ID,
  DEFAULT_CHANNEL_ID,
  DEFAULT_WAREHOUSE_ID,
  SKU_ATTRIBUTE_ID,
  COST_ATTRIBUTE_ID,
} from 'src/constants';
import { ProductTransformedDto } from 'src/modules/Product/transformer/Product.transformer.types';
import { graphqlCallDestination } from '../proxies/client';
import { productVariantBulkCreateMutation } from '../mutations/productVariant.ts/bulkCreate';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';
import { bulkVariantCreate } from '../types/product';

@Injectable()
export class ProductVariantDestinationService {
  private readonly logger = new Logger(ProductVariantDestinationService.name);

  /**
   * @description -- this creates variant in bulk using destination bulk create
   */
  public async createBulkVariants(
    productId: string,
    transformedProduct: ProductTransformedDto,
  ) {
    try {
      const createBulkVariants: bulkVariantCreate =
        await graphqlCallDestination(
          productVariantBulkCreateMutation(
            productId,
            this.transformVariants(transformedProduct),
          ),
        );
      return createBulkVariants;
    } catch (err) {
      this.logger.error(
        'Product bulk create call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  /**
   * @description -- this method transforms product variant attributes that are transformed according to destination api inout type
   */
  private transformVariants(transformedProduct: ProductTransformedDto) {
    // we are using default variant price if a variant has not specified selling price
    const defaultVariantResalePrice =
      transformedProduct.variants[0].resalePrice;
    const defaultVariantCostPrice = transformedProduct.variants[0].costPrice;
    return transformedProduct.variants.map((variant) => {
      const { color, sku, size, resalePrice, costPrice } = variant;
      return `
        {
          attributes: [
          { id: "${COLOR_ATTRIBUTE_ID}", values:["${color}"] }
          { id: "${SIZE_ATTRIBUTE_ID}", values:["${size}"] }
          { id: "${SKU_ATTRIBUTE_ID}", values:["${sku}"] } 
          { id: "${COST_ATTRIBUTE_ID}", values:["${
        costPrice || defaultVariantCostPrice
      }"] } 
        ]
          channelListings: { channelId: "${DEFAULT_CHANNEL_ID}", price: ${
        resalePrice || defaultVariantResalePrice
      }}
         stocks: { warehouse:"${DEFAULT_WAREHOUSE_ID}"  quantity: 1000 }
        }
      `;
    });
  }
}
