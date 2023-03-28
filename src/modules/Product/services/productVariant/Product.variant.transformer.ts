import { Injectable } from '@nestjs/common';
import { ProductDto } from '../../transformer/Product.transformer.types';
import {
  ProductVariantDto,
  ProductVariantInterface,
} from './Product.variant.types';

@Injectable()
export class ProductVariantTransformer {
  public addVariants(product: ProductDto, transformedProduct) {
    const transformedVariantsList = [];
    product.variants.map((rawProductVariant: ProductVariantInterface) => {
      let transformedProductVariant: ProductVariantDto = {};
      transformedProductVariant = this.addVariantAttributes(
        rawProductVariant,
        transformedProductVariant,
      );
      this.addVariantChannelListing(
        rawProductVariant,
        transformedProductVariant,
      );
      transformedProductVariant.sku = rawProductVariant.sku;
      transformedVariantsList.push(transformedProductVariant);
    });
    transformedProduct.variants = transformedVariantsList;
  }

  public addVariantAttributes(
    rawProductVariant: ProductVariantInterface,
    transformedProductVariant: ProductVariantDto,
  ) {
    const productVariantAttributes: ProductVariantDto = {};
    rawProductVariant.attributes.map((attribute) => {
      const attributeName = attribute.attribute.slug;
      let attributeValue;
      attribute.values.map((value) => {
        attributeValue = value.name;
      });
      productVariantAttributes[`${attributeName}`] = attributeValue;
    });
    return { ...transformedProductVariant, ...productVariantAttributes };
  }

  public addVariantChannelListing(
    rawProductVariant: ProductVariantInterface,
    transformedProductVariant: ProductVariantDto,
  ) {
    rawProductVariant.stocks.map((warehouseListing) => {
      transformedProductVariant.stock = [];
      transformedProductVariant.stock.push({
        warehouseId: warehouseListing.warehouse.id,
        quantity: warehouseListing.quantity,
      });
    });
  }
}
