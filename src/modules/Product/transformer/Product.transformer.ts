import { Injectable } from '@nestjs/common';
import { AutoSyncDto, GetProductsDto } from '../Product.dto';
import {
  ProductDto,
  ProductTransformedDto,
  ShopDetailsDto,
} from './Product.transformer.types';
import { ProductMediaTransformer } from '../services/productMedia/Product.media.transformer';
import { ProductVariantTransformer } from '../services/productVariant/Product.variant.transformer';
import { ProductMappingsDto } from '../services/productMapping/Product.mapping.types';
import {
  VENDOR_ID_METADATA_KEY,
  VENDOR_NAME_METADATA_KEY,
  STYLE_NUMBER_ATTRIBUTE_NAME,
} from 'src/constants';

@Injectable()
export class ProductTransformer {
  constructor(
    private readonly mediaTransformer: ProductMediaTransformer,
    private readonly variantTransformer: ProductVariantTransformer,
  ) {}

  public payloadBuilder(productsData: GetProductsDto) {
    const transformedProducts: ProductTransformedDto[] = [];
    const productsList: ProductDto[] = this.removeEdges(productsData);
    productsList.map((product: ProductDto) => {
      const transformedProduct: ProductTransformedDto = {};
      this.addProductDetails(product, transformedProduct);
      this.addShopDetails(product, transformedProduct);
      this.mediaTransformer.addMedia(product, transformedProduct);
      this.variantTransformer.addVariants(product, transformedProduct);
      transformedProducts.push(transformedProduct);
    });
    return transformedProducts;
  }

  public removeEdges(products: GetProductsDto): ProductDto[] {
    const productsList: ProductDto[] = [];
    products.edges.map((product) => {
      productsList.push(product.node);
    });
    return productsList;
  }

  public addShopDetails(product: ProductDto, transformedProduct) {
    const vendorDetails: ShopDetailsDto = {};

    product.metadata.map((meta) => {
      if (meta.key == VENDOR_ID_METADATA_KEY) {
        vendorDetails.vendorId = meta.value;
      }
      if (meta.key == VENDOR_NAME_METADATA_KEY) {
        vendorDetails.vendorName = meta.value;
      }
    });
    transformedProduct.vendorDetails = vendorDetails;
  }

  public addProductDetails(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    transformedProduct.name = product.name;
    transformedProduct.sourceId = product.id;
    transformedProduct.description = product.description;
    transformedProduct.categoryId = product.category.id;
    transformedProduct.styleNumber = this.getProductStyleNumber(product);
  }

  public getProductStyleNumber(product: ProductDto) {
    let styleNumber: string;
    product.attributes.map((attribute) => {
      if (attribute.attribute.name == STYLE_NUMBER_ATTRIBUTE_NAME) {
        attribute.values.map((value) => {
          styleNumber = value.name;
        });
      }
    });
    return styleNumber;
  }

  public transformCreatedProductForMapping(
    autoSyncInput: AutoSyncDto,
    createdProductId: string,
    transformedProduct: ProductTransformedDto,
  ): ProductMappingsDto {
    return {
      shr_b2b_product_id: transformedProduct.sourceId,
      shr_b2c_product_id: createdProductId,
      retailer_id: autoSyncInput.shopId,
    };
  }
}
