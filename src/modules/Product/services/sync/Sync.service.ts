import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { idBase64Decode } from '../productMedia/Product.media.utils';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';

@Injectable()
export class SyncService {
  @InjectRepository(ProductProductVariant)
  private readonly productVariantRepository: Repository<ProductProductVariant>;
  @InjectRepository(ProductProductVariantChannelListing)
  private readonly productVariantChannelListingRepository: Repository<ProductProductVariantChannelListing>;
  private readonly logger = new Logger(SyncService.name);

  /**
   * Synchronizes the pricing of child variants with the master variant.
   *
   * @param {string} productId - The ID of the product.
   * @returns {Promise<void>} - A promise that resolves when the synchronization is complete.
   */
  public async syncChildPricingWithMaster(productId: string): Promise<void> {
    // Decode the product ID
    const decodedProductId = idBase64Decode(productId);

    // Retrieve the master variants for the product
    const masterVariants = await this.productVariantRepository.find({
      where: {
        product_id: Number(decodedProductId),
      },
    });

    // Iterate over the master variants
    for (const masterVariant of masterVariants) {
      // Get the ID of the master variant
      const masterVariantId = masterVariant.id;
      // Retrieve the channel listing of the master variant
      const masterChannelListing =
        await this.productVariantChannelListingRepository.findOne({
          where: {
            variant_id: masterVariantId,
          },
        });

      // Retrieve the child variants associated with the master variant
      const childVariants = await this.productVariantRepository.find({
        where: {
          metadata: { masterVariantId },
        },
      });

      // Iterate over the child variants
      for (const childVariant of childVariants) {
        // Retrieve the channel listing of the child variant
        const childChannelListing =
          await this.productVariantChannelListingRepository.findOne({
            where: {
              variant_id: childVariant.id,
            },
          });

        // Create an updated child variant listing object with pricing from the master variant
        const updatedChildVariantListing = {
          ...masterChannelListing,
        };
        updatedChildVariantListing.id = childChannelListing.id;
        updatedChildVariantListing.variant_id = childChannelListing.variant_id;

        // Update the child variant's channel listing with the pricing from the master variant
        await this.productVariantChannelListingRepository.update(
          childChannelListing.id,
          updatedChildVariantListing,
        );
        this.logger.log(
          `Child variant ${childVariant.id} synchronized with master variant ${masterVariant.id}`,
        );
      }
    }
    this.logger.log('Child pricing synchronization with master completed');
  }
}
