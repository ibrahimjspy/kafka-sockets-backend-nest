import { Injectable } from '@nestjs/common';
import { ProductDto } from '../../transformer/Product.transformer.types';

@Injectable()
export class ProductMediaTransformer {
  public addMedia(product: ProductDto, transformedProduct) {
    this.addProductMedia(product, transformedProduct);
    this.addVariantMedia(product, transformedProduct);
  }

  public addProductMedia(product: ProductDto, transformedProduct) {
    const mediaUrls: string[] = [];
    product.media.map((media) => {
      mediaUrls.push(media.url);
    });
    transformedProduct.mediaUrls = mediaUrls;
  }

  public addVariantMedia(product: ProductDto, transformedProduct) {
    const variantMedia = [];
    product.variants.map((variant) => {
      variantMedia.push({ sku: variant.sku, url: variant.media[0]?.url });
    });
    transformedProduct.variantMedia = variantMedia;
  }
}
