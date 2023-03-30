import { Injectable } from '@nestjs/common';
import { ProductTransformedDto } from '../../transformer/Product.transformer.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMedia } from 'src/database/destination/media';
import { ProductMediaTransformer } from './Product.media.transformer';

@Injectable()
export class ProductMediaService {
  @InjectRepository(ProductMedia)
  private readonly repository: Repository<ProductMedia>;
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
    this.productMediaTransformer.addDestinationProductIdToMedia(
      productId,
      transformedProduct.mediaUrls,
    );
    await this.repository.save(transformedProduct.mediaUrls);
  }
}
