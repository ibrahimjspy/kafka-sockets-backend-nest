import { Injectable } from '@nestjs/common';
import { GetProductsDto } from '../Product.dto';
import {
  ProductDto,
  ProductTransformedDto,
  ShopDetailsDto,
} from './Product.transformer.types';

@Injectable()
export class ProductTransformer {
  public payloadBuilder(productsData: GetProductsDto) {
    const transformedProducts: ProductTransformedDto[] = [];
    const productsList: ProductDto[] = this.removeEdges(productsData);
    productsList.map((product: ProductDto) => {
      const transformedProduct: ProductTransformedDto = {};
      this.addProductDetails(product, transformedProduct);
      this.addShopDetails(product, transformedProduct);
      console.log(transformedProduct);
      transformedProducts.push(transformedProduct);
    });
    console.log(transformedProducts);
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
    const VENDOR_ID_METADATA_KEY = 'vendorId';
    const VENDOR_NAME_METADATA_KEY = 'vendorName';

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

  public addProductDetails(product: ProductDto, transformedProduct) {
    transformedProduct.name = product.name;
    transformedProduct.description = product.description;
    transformedProduct.categoryId = product.category.id;
    transformedProduct.styleNumber = this.getProductStyleNumber(product);
  }

  public getProductStyleNumber(product: ProductDto) {
    const STYLE_NUMBER_ATTRIBUTE_NAME = 'Style Number';
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
}
