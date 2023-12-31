import { Injectable, Logger } from '@nestjs/common';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import { isArrayEmpty } from '../../Product.utils';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * @description -- this method validates transformed products list and returns products that are valid for import
   */
  public transformedProducts(
    transformedProducts: ProductTransformedDto[],
    addCategoryToShop: string,
  ) {
    if (isArrayEmpty(transformedProducts) || !addCategoryToShop) return [];
    return transformedProducts.filter((product) => {
      if (!isArrayEmpty(product.mediaUrls) && !isArrayEmpty(product.variants)) {
        return product;
      }
      this.logger.log('product validation failed', product.sourceId);
    });
  }

  /**
   * @description -- this method validates products before adding to shop
   */
  public addProductToShop(product: string, productVariantIds: string[]) {
    if (!product || !productVariantIds || isArrayEmpty(productVariantIds)) {
      this.logger.log('product validation failed', product);
      return false;
    }
    return true;
  }
}
