import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantShopMapping } from '../addProductToShop';

@Injectable()
export class ProductVariantMappingRepository {
  @InjectRepository(ProductVariantShopMapping)
  private readonly repository: Repository<ProductVariantShopMapping>;
  private readonly logger = new Logger(ProductVariantMappingRepository.name);

  /**
   * @description -- this method saves mappings for product variants
   */
  public async saveProductVariantMappings(
    productVariantMappings: ProductVariantShopMapping[],
  ) {
    try {
      return this.repository.save(productVariantMappings);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
