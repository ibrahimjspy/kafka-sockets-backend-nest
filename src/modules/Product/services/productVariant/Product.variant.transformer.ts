import { Injectable } from '@nestjs/common';
import { ProductDto } from '../../transformer/Product.transformer.types';
import {
  ProductVariantDto,
  ProductVariantInterface,
} from './Product.variant.types';

@Injectable()
export class ProductVariantTransformer {
  public addVariants(product: ProductDto, transformedProduct) {
    const productVariantsList = [];
    product.variants.map((variant: ProductVariantInterface) => {
      let productVariant: ProductVariantDto = {};
      productVariant = this.addVariantAttributes(variant, productVariant);
      productVariant.sku = variant.sku;
      productVariantsList.push(productVariant);
    });
    transformedProduct.variants = productVariantsList;
  }

  public addVariantAttributes(
    productVariant: ProductVariantInterface,
    transformedProductVariant,
  ) {
    const productVariantAttributes: ProductVariantDto = {};
    productVariant.attributes.map((attribute) => {
      const attributeName = attribute.attribute.name;
      let attributeValue;
      attribute.values.map((value) => {
        attributeValue = value.name;
      });
      productVariantAttributes[`${attributeName}`] = attributeValue;
    });
    return { ...transformedProductVariant, ...productVariantAttributes };
  }

  public addVariantPricing(product: ProductDto, transformedProduct) {
    const variantMedia = [];
    product.variants.map((variant) => {
      variantMedia.push({ sku: variant.sku, url: variant.media[0]?.url });
    });
    transformedProduct.variantMedia = variantMedia;
  }

  public addVariantChannelListing(product: ProductDto, transformedProduct) {
    const variantMedia = [];
    product.variants.map((variant) => {
      variantMedia.push({ sku: variant.sku, url: variant.media[0]?.url });
    });
    transformedProduct.variantMedia = variantMedia;
  }
}
