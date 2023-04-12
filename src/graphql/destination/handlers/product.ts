import {
  ProductTransformedDto,
  UpdatedProductFieldsDto,
} from 'src/modules/Product/transformer/Product.transformer.types';

import { Injectable, Logger } from '@nestjs/common';
import { graphqlCallDestination } from '../proxies/client';
import { createProductMutation } from '../mutations/product/create';
import { productCreate } from '../types/product';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';
import { productChannelListingMutation } from '../mutations/product/channelListing';
import {
  addProductToStoreMutation,
  addProductsToStoreMutation,
} from '../mutations/product/addToShop';
import { storeProductCreateStatusMutation } from '../mutations/product/storeProductStatus';
import { storeProductBrandMutation } from '../mutations/product/addProductBrand';
import { ProductMappingsDto } from 'src/modules/Product/services/productMapping/Product.mapping.types';
import { deleteProductMutation } from '../mutations/product/deleteProduct';
import { getProductsQuery } from '../queries/products/getList';
import { PaginationDto } from 'src/graphql/types/paginate';
import { updateProductMutation } from '../mutations/product/updateProduct';
import { updateProductListingMutation } from '../mutations/product/updateProductListing';
import { ValidationService } from 'src/modules/Product/services/validation/Product.validation.service';

/**
 * @description -- this layer connects with destination graphql api for and exposes handlers to perform transactions related to product such as create, metadata update etc
 */
@Injectable()
export class ProductDestinationService {
  private readonly logger = new Logger(ProductDestinationService.name);
  constructor(private readonly validationService: ValidationService) {}

  /**
   * @description -- this method creates product in destination
   * @warn -- this product is still not available for purchase as it is not listed in channels or any variants are added
   * @return - product id :: string -- which was created
   */
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

  /**
   * @description -- this method adds product to channel
   * @warn -- this product is still without media and variants
   */
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

  /**
   * @description -- this method adds product to marketplace shop that is created
   * @warn -- this method even though allows bulk addition but it fails when you add more than 50 products
   * @deprecated -- this api will be deprecated as it does not use product categories
   */
  public async addProductsToStore(products: ProductMappingsDto[], storeId) {
    try {
      return await graphqlCallDestination(
        addProductsToStoreMutation(products, storeId),
      );
    } catch (err) {
      this.logger.error(
        'product add to store call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  /**
   * @description -- this method store private metadata for product which we use to store status about product -- whether it is created successfully
   */
  public async saveProductCreateStatus(productId: string) {
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

  /**
   * @description -- this method store vendor information of product in its metadata
   * @warn -- it assumes that vendor details in transformed product is not null
   */
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

  /**
   * @description -- this method links product with shop but it also has ability to add category and variants as well
   * @warn -- this method does not uses category id of destination but rather a uuid which was generated by service itself
   * @deprecated - this api will be deprecated because it does not support bulk create and uses category id in wrong format
   */
  public async addProductToShop(
    storeId: string,
    product: string,
    categoryId: string,
    productVariantIds: string[],
  ) {
    try {
      if (!this.validationService.addProductToShop(product, productVariantIds))
        return;
      return await graphqlCallDestination(
        addProductToStoreMutation(
          storeId,
          product,
          categoryId,
          productVariantIds,
        ),
      );
    } catch (err) {
      this.logger.error(
        'product add to shop call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  /**
   * @description -- this method deletes product from destination
   */
  public async deleteProductHandler(productId: string) {
    try {
      return await graphqlCallDestination(deleteProductMutation(productId));
    } catch (err) {
      this.logger.error(
        'product delete call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  /**
   * @description -- this method returns product from destination
   */
  public async getProducts(paginate: PaginationDto, filter) {
    try {
      const productsList = await graphqlCallDestination(
        getProductsQuery(paginate, {
          ...filter,
        }),
      );
      return productsList['products'];
    } catch (err) {
      this.logger.error(
        'product fetch call failed',
        graphqlExceptionHandler(err),
      );
    }
  }

  /**
   * @description -- this method updates product information such as name description etc
   */
  public async updateProduct(
    productId: string,
    updatedProductFields: UpdatedProductFieldsDto,
  ) {
    try {
      const productsList = await graphqlCallDestination(
        updateProductMutation(productId, updatedProductFields),
      );
      return productsList['productUpdate'];
    } catch (err) {
      this.logger.error(
        'product update call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  /**
   * @description -- this method updates product listing such as whether it available for purchase or not
   */
  public async updateProductListing(
    productId: string,
    updatedProductFields: UpdatedProductFieldsDto,
  ) {
    try {
      const productsList = await graphqlCallDestination(
        updateProductListingMutation(productId, updatedProductFields),
      );
      return productsList['productChannelListingUpdate'];
    } catch (err) {
      this.logger.error(
        'product update call failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }
}
