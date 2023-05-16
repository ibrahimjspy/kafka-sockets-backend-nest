import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantShopMapping } from '../addProductToShop';

@Injectable()
export class ProductVariantMappingRepository {
  @InjectRepository(ProductVariantShopMapping)
  private readonly repository: Repository<ProductVariantShopMapping>;

  /**
   * @description -- this method saves mappings for product variants
   */
  public async saveProductVariantMappings(
    productVariantMappings: ProductVariantShopMapping[],
  ) {
    return this.repository.save(productVariantMappings);
  }
}
