import { Injectable } from '@nestjs/common';
import {
  ProductDto,
  ProductTransformedDto,
} from '../../transformer/Product.transformer.types';
import { ProductVariantMediaDto } from './Product.media.types';
import { ProductMedia } from 'src/database/destination/media';
import { idBase64Decode, mediaUrlTransformer } from './Product.media.utils';
import { mediaCreateDefaults } from 'src/constants';

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
    const mediaUrls: ProductMedia[] = [];
    product.media.map((media) => {
      mediaUrls.push({
        image: mediaUrlTransformer(media.url),
        ...mediaCreateDefaults,
      });
    });
    transformedProduct.mediaUrls = mediaUrls;
  }

  public addVariantMedia(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    const variantMedia: ProductVariantMediaDto[] = [];
    product.variants.map((variant) => {
      variantMedia.push({
        sku: variant.sku,
        url: mediaUrlTransformer(variant.media[0]?.url),
      });
    });
    transformedProduct.variantMedia = variantMedia;
  }

  /**
   * @description -- this method adds product id which is created to media list which was transformed previously
   */
  public addDestinationProductIdToMedia(
    productId: string,
    productMediaList: ProductMedia[],
  ) {
    productMediaList.map((media) => {
      media.product_id = idBase64Decode(productId);
    });
  }
}
