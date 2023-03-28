import { Injectable } from '@nestjs/common';
import {
  ProductDto,
  ProductTransformedDto,
} from '../../transformer/Product.transformer.types';
import { ProductVariantMediaDto } from './Product.media.types';

@Injectable()
export class ProductMediaTransformer {
  public addMedia(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    this.addProductMedia(product, transformedProduct);
    this.addVariantMedia(product, transformedProduct);
  }

  public addProductMedia(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    const mediaUrls: string[] = [];
    product.media.map((media) => {
      mediaUrls.push(media.url);
    });
    transformedProduct.mediaUrls = mediaUrls;
  }

  public addVariantMedia(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    const variantMedia: ProductVariantMediaDto[] = [];
    product.variants.map((variant) => {
      variantMedia.push({ sku: variant.sku, url: variant.media[0]?.url });
    });
    transformedProduct.variantMedia = variantMedia;
  }
}
