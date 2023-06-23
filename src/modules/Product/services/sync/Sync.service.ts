import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { idBase64Decode } from '../productMedia/Product.media.utils';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';
import { ProductProductChannelListing } from 'src/database/destination/product/channnelListing';
import { ProductProduct } from 'src/database/destination/product/product';

@Injectable()
export class SyncService {
  @InjectRepository(ProductProductVariant)
  private readonly productVariantRepository: Repository<ProductProductVariant>;
  @InjectRepository(ProductProductVariantChannelListing)
  private readonly productVariantChannelListingRepository: Repository<ProductProductVariantChannelListing>;
  @InjectRepository(ProductProductChannelListing)
  private readonly productChannelListingRepository: Repository<ProductProductChannelListing>;
  @InjectRepository(ProductProduct)
  private productRepository: Repository<ProductProduct>;
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

  /**
   * Syncs the child product listings with the master product listing.
   * @param {string} productId - The ID of the master product.
   * @returns {Promise<void>} - A Promise that resolves once the synchronization is completed.
   * @throws {Error} - If the master product listing is not found or an error occurs during the synchronization process.
   */
  public async syncChildListingWithMaster(productId: string): Promise<void> {
    try {
      this.logger.log(
        `Syncing child listings with master product ${productId}`,
      );
      const decodedProductId = idBase64Decode(productId);

      // Retrieve the master product listing
      const masterProductListing =
        await this.productChannelListingRepository.findOne({
          where: {
            product_id: Number(decodedProductId),
          },
        });

      if (!masterProductListing) {
        throw new Error(
          `Master product listing not found for product ID: ${decodedProductId}`,
        );
      }

      // Retrieve all child products associated with the master product
      const childProducts = await this.productRepository
        .createQueryBuilder('product')
        .where('product.metadata ->> :parentKey = :parentId', {
          parentKey: 'parentId',
          parentId: `${decodedProductId}`,
        })
        .getMany();

      // Iterate over the child products and update their channel listings
      for (const childProduct of childProducts) {
        const childProductListing =
          await this.productChannelListingRepository.findOne({
            where: {
              product_id: childProduct.id,
            },
          });

        if (!childProductListing) {
          this.logger.log(
            `Channel listing not found for child product ${childProduct.id}`,
          );
          continue;
        }

        const updatedProductListing: Partial<ProductProductChannelListing> = {
          ...masterProductListing,
          id: childProductListing.id,
        };

        await this.productChannelListingRepository.save(updatedProductListing);
        this.logger.log(
          `Updated channel listing for child product ${childProduct.id}`,
        );
      }

      this.logger.log('Child pricing synchronization with master completed');
    } catch (error) {
      this.logger.error(
        `Error occurred during child listing synchronization: ${error}`,
      );
    }
  }
}
