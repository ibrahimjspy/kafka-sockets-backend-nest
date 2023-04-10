import { Injectable } from '@nestjs/common';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMedia, ProductThumbnail } from 'src/database/destination/media';
import { ProductMediaTransformer } from './Product.media.transformer';
import polly from 'polly-js';
import { RETRY_COUNT } from 'src/constants';

@Injectable()
export class ProductMediaService {
  @InjectRepository(ProductMedia)
  private readonly repository: Repository<ProductMedia>;
  @InjectRepository(ProductThumbnail)
  private readonly thumbnailRepository: Repository<ProductThumbnail>;
  constructor(
    private readonly productMediaTransformer: ProductMediaTransformer,
  ) {}

  /**
   * @description -- this method create media in bulk using postgres orm
   */
  public async bulkMediaCreate(
    productId: string,
    transformedProduct: ProductTransformedDto,
  ): Promise<any> {
    polly()
      .waitAndRetry(RETRY_COUNT)
      .executeForPromise(async () => {
        this.productMediaTransformer.addDestinationProductIdToMedia(
          productId,
          transformedProduct.mediaUrls,
        );
        const media = await this.repository.save(transformedProduct.mediaUrls);
        const defaultImage = media[0];
        if (!defaultImage) return;
        const createThumbnail = await this.storeMediaThumbnail(
          defaultImage.id,
          transformedProduct,
        );
        return createThumbnail;
      });
  }

  /**
   * @description -- this method stores thumbnail against default image
   */
  public async storeMediaThumbnail(
    defaultImageId: number,
    transformedProduct: ProductTransformedDto,
  ): Promise<any> {
    this.productMediaTransformer.addMediaIdToThumbnail(
      defaultImageId,
      transformedProduct,
    );
    return await this.thumbnailRepository.save(transformedProduct.thumbnail);
  }
}
