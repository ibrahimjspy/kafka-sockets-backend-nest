import { ProductTransformedDto } from 'src/modules/Product/transformer/Product.transformer.types';

import { Injectable, Logger } from '@nestjs/common';
import { graphqlCallDestination } from '../proxies/client';
import { createProductMutation } from '../mutations/product/create';
import { productCreate } from '../types/product';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';
import { productChannelListingMutation } from '../mutations/product/channelListing';
import { addProductToStoreMutation } from '../mutations/product/addToShop';
import { storeProductCreateStatusMutation } from '../mutations/product/storeProductStatus';
import { storeProductBrandMutation } from '../mutations/product/addProductBrand';

@Injectable()
export class ProductDestinationService {
  private readonly logger = new Logger(ProductDestinationService.name);

  public async createProduct(transformedProduct: ProductTransformedDto) {
    try {
      const createProduct: productCreate = await graphqlCallDestination(
        createProductMutation(transformedProduct),
      );
      const productId = createProduct?.productCreate?.product?.id;

      this.logger.verbose('Product created', createProduct);
      return productId;
    } catch (err) {
      this.logger.error(
        'Product create call failed',
        graphqlExceptionHandler(err),
      );
    }
  }

  public async productChannelListing(productId: string) {
    try {
      return await graphqlCallDestination(
        productChannelListingMutation(productId),
      );
    } catch (err) {
      this.logger.warn(
        'product channel update call failed',
        graphqlExceptionHandler(err),
      );
    }
  }

  public async addProductsToStore(productIds: string[], storeId) {
    try {
      return await graphqlCallDestination(
        addProductToStoreMutation(productIds, storeId),
      );
    } catch (err) {
      this.logger.error(
        'product add to store call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  public async storeProductCreateStatus(productId: string) {
    try {
      return await graphqlCallDestination(
        storeProductCreateStatusMutation(productId),
      );
    } catch (err) {
      this.logger.error(
        'product create status could not be stored',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  public async storeProductBrand(
    productId: string,
    transformedProduct: ProductTransformedDto,
  ) {
    try {
      const { vendorId, vendorName } = transformedProduct.vendorDetails;
      return await graphqlCallDestination(
        storeProductBrandMutation(productId, vendorId, vendorName),
      );
    } catch (err) {
      this.logger.error(
        'product brand information could not be stored',
        graphqlExceptionHandler(err),
      );
      return;
    }
  }
}
