import { Injectable } from '@nestjs/common';
import {
  ProductTransformedDto,
  UpdatedProductFieldsDto,
} from '../../transformer/Product.transformer.types';
import { ProductVariantDestinationService } from 'src/graphql/destination/handlers/productVariant';
import { bulkVariantCreate } from 'src/graphql/destination/types/product';
import { VARIANT_PRICE_RULE } from 'src/constants';

@Injectable()
export class ProductVariantService {
  constructor(
    private readonly productVariantApi: ProductVariantDestinationService,
  ) {}

  /**
   * @description -- this method creates variant in bulk using transformed product list and product id for which variants should be added
   */
  public async bulkProductVariantCreate(
    productId: string,
    transformedProduct: ProductTransformedDto,
  ): Promise<string[]> {
    const variantIds = [];
    const createBulkVariants: bulkVariantCreate =
      await this.productVariantApi.createBulkVariants(
        productId,
        transformedProduct,
      );

    if (createBulkVariants.productVariantBulkCreate.errors[0]) {
      throw new Error(
        createBulkVariants.productVariantBulkCreate.errors[0].message,
      );
    }
    createBulkVariants.productVariantBulkCreate.productVariants.map(
      (variant) => [variantIds.push(variant.id)],
    );
    return variantIds;
  }

  /**
   * @description -- this returns price which should be added to destination after transforming cost price received from source
   */
  public getVariantResalePrice(variantCostPrice: number): number {
    return (
      Math.round(
        (Number(variantCostPrice) * VARIANT_PRICE_RULE + Number.EPSILON) * 100,
      ) / 100
    );
  }

  public async updateProductVariantPrice(
    variantId: string,
    updatedProductData: UpdatedProductFieldsDto,
  ) {
    return await this.productVariantApi.updateProductVariantPricing(
      variantId,
      updatedProductData,
    );
  }
}
