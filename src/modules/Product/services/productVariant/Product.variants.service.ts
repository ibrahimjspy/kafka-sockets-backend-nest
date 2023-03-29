import { Injectable } from '@nestjs/common';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import { ProductVariantDestinationService } from 'src/graphql/destination/handlers/productVariant';
import { bulkVariantCreate } from 'src/graphql/destination/types/product';

@Injectable()
export class ProductVariantService {
  constructor(
    private readonly productVariantApi: ProductVariantDestinationService,
  ) {}
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
    createBulkVariants.productVariantBulkCreate.productVariants.map(
      (variant) => [variantIds.push(variant.id)],
    );
    return variantIds;
  }

  public getVariantResalePrice(variantCostPrice: number): number {
    const VARIANT_PRICE_RULE = 1.6;
    return (
      Math.round(
        (Number(variantCostPrice) * VARIANT_PRICE_RULE + Number.EPSILON) * 100,
      ) / 100
    );
  }
}
