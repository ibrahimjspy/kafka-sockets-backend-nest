import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductProduct } from 'src/database/destination/product/product';
import { ProductProductChannelListing } from 'src/database/destination/product/channnelListing';
import { ProductProductMedia } from 'src/database/destination/product/media';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';
import { ProductThumbnail } from 'src/database/destination/media';
import { WarehouseStock } from 'src/database/destination/productVariant/warehouseStock';
import { ProductCopyTransformerService } from './Copy.transformers';
import { ProductAttributeCopyService } from './Attributes.copy.service';
import { ProductVariantAttributeCopyService } from './Variant.attribute.copy.service';

@Injectable()
export class ProductCopyService {
  private readonly logger = new Logger(ProductCopyService.name);

  constructor(
    @InjectRepository(ProductProduct)
    private productRepository: Repository<ProductProduct>,
    @InjectRepository(ProductProductChannelListing)
    private productChannelListingRepository: Repository<ProductProductChannelListing>,
    @InjectRepository(ProductProductMedia)
    private productMediaRepository: Repository<ProductProductMedia>,
    @InjectRepository(ProductProductVariant)
    private productVariantRepository: Repository<ProductProductVariant>,
    @InjectRepository(ProductProductVariantChannelListing)
    private productVariantChannelListingRepository: Repository<ProductProductVariantChannelListing>,
    @InjectRepository(ProductThumbnail)
    private productThumbnailRepository: Repository<ProductThumbnail>,
    @InjectRepository(WarehouseStock)
    private warehouseStockRepository: Repository<WarehouseStock>,
    private transformerService: ProductCopyTransformerService,
    private productAttributeCopyService: ProductAttributeCopyService,
    private variantAttributeCopyService: ProductVariantAttributeCopyService,
  ) {}

  /**
   * Creates copies of products for a given category or a single product.
   * @param id The ID of the category or the single product.
   * @param isCategory Indicates whether the ID represents a category or a single product.
   * @returns A Promise that resolves to the copied products.
   */
  async createCopiesForCategoryOrProduct(
    id: number | string,
    isCategory = true,
  ): Promise<ProductProduct[]> {
    try {
      const logPrefix = isCategory ? `category ID ${id}` : `product ID ${id}`;
      this.logger.log(`Creating copies of products for ${logPrefix}`);

      let productQuery = this.productRepository
        .createQueryBuilder('product')
        .andWhere('product.metadata ->> :isMasterKey = :isMasterValue', {
          isMasterKey: 'isMaster',
          isMasterValue: 'true',
        });

      if (isCategory) {
        this.logger.log(`Filtering by category ID ${id}`);
        productQuery = productQuery.andWhere(
          'product.category_id = :categoryId',
          { categoryId: id },
        );
      } else {
        this.logger.log(`Filtering by product ID ${id}`);
        productQuery = productQuery.andWhere('product.id = :productId', {
          productId: id,
        });
      }

      // Retrieve the master products based on the query
      const masterProducts = await productQuery.getMany();

      this.logger.log(`Retrieved ${masterProducts.length} master products`);

      // Create copies of the master products
      const copiedProducts: ProductProduct[] = masterProducts.map(
        (masterProduct) => {
          const copiedProduct: ProductProduct = {
            ...masterProduct,
            id: undefined,
            slug: this.transformerService.getProductSlug(masterProduct),
            default_variant_id: null,
            metadata: {
              ...masterProduct.metadata,
              parentId: masterProduct.id,
              isMaster: 'false',
            },
          };

          return copiedProduct;
        },
      );

      this.logger.log(`Created ${copiedProducts.length} copied products`);

      // Save the copied products
      const copiedProductsResult = await this.productRepository.save(
        copiedProducts,
      );

      this.logger.log(`Saved ${copiedProductsResult.length} copied products`);

      // Perform additional copying tasks
      await Promise.all([
        this.productAttributeCopyService.copyProductAttributes(
          copiedProductsResult,
        ),
        this.copyChannelListingsForCopiedProducts(copiedProductsResult),
        this.copyVariants(copiedProductsResult, masterProducts),
        this.copyProductMedia(copiedProductsResult),
      ]);

      this.logger.log(`Completed additional copying tasks`);

      return copiedProductsResult;
    } catch (error) {
      this.logger.error(`An error occurred while creating copies `, error);
      throw error;
    }
  }

  /**
   * Copies channel listings for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the channel listing copying is complete.
   */
  async copyChannelListingsForCopiedProducts(
    copiedProducts: ProductProduct[],
  ): Promise<void> {
    try {
      this.logger.log('Copying channel listings for copied products');

      // Retrieve the product IDs of the master products and create a mapping
      const productIds =
        this.transformerService.getMasterProducts(copiedProducts);
      const productMapping =
        this.transformerService.getProductMapping(copiedProducts);

      this.logger.log(`Retrieved ${productIds.length} master product IDs`);

      // Retrieve the original channel listings for the master products
      const originalChannelListings =
        await this.productChannelListingRepository.find({
          where: { product_id: In(productIds) },
        });

      this.logger.log(
        `Retrieved ${originalChannelListings.length} original channel listings`,
      );

      // Create copies of the channel listings and update the product IDs
      const copiedChannelListings = originalChannelListings.map(
        (originalChannelListing) => {
          const copyChannelListing = {
            ...originalChannelListing,
            id: undefined,
            product_id: productMapping.get(originalChannelListing.product_id),
          };

          return copyChannelListing;
        },
      );

      this.logger.log(
        `Created ${copiedChannelListings.length} copied channel listings`,
      );

      // Save the copied channel listings
      await this.productChannelListingRepository.save(copiedChannelListings);

      this.logger.log('Copied channel listings successfully');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying channel listings for copied products',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies product media for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the product media copying is complete.
   */
  async copyProductMedia(copiedProducts: ProductProduct[]): Promise<void> {
    try {
      this.logger.log('Copying product media for copied products');

      // Retrieve the product IDs of the master products and create a mapping
      const productIds =
        this.transformerService.getMasterProducts(copiedProducts);
      const productMapping =
        this.transformerService.getProductMapping(copiedProducts);

      this.logger.log(`Retrieved ${productIds.length} master product IDs`);

      // Retrieve all media for the master products
      const allMedia = await this.productMediaRepository.find({
        where: { product_id: In(productIds) },
      });

      this.logger.log(`Retrieved ${allMedia.length} media for copying`);

      // Create copies of the media and update the product IDs
      const copiedMedia = allMedia.map((media) => {
        const copyMedia = {
          ...media,
          id: undefined,
          product_id: productMapping.get(media.product_id),
          oembed_data: {
            ...media.oembed_data,
            parentId: media.id,
          },
        };

        return copyMedia;
      });

      // Save the copied media
      const copiedMediaResult = await this.productMediaRepository.save(
        copiedMedia,
      );

      this.logger.log(`Copied ${copiedMediaResult.length} media successfully`);

      // Copy the product thumbnails for the copied media
      await this.copyProductThumbnails(copiedMediaResult);

      this.logger.log('Product media copying is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying product media for copied products',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies variants for the copied products.
   * @param copiedProducts The copied products.
   * @param masterProducts The master products used for mapping.
   * @returns A Promise that resolves when the variant copying is complete.
   */
  async copyVariants(
    copiedProducts: ProductProduct[],
    masterProducts: ProductProduct[],
  ): Promise<void> {
    try {
      this.logger.log('Copying variants for copied products');

      // Retrieve the product IDs of the master products and create a mapping
      const productIds =
        this.transformerService.getMasterProducts(copiedProducts);
      const productMapping =
        this.transformerService.getProductMapping(copiedProducts);

      this.logger.log(`Retrieved ${productIds.length} master product IDs`);

      // Retrieve all variants for the master products
      const allVariants = await this.productVariantRepository.find({
        where: { product_id: In(productIds) },
      });

      this.logger.log(`Retrieved ${allVariants.length} variants for copying`);

      // Create copies of the variants and update the product IDs
      const copiedVariants = allVariants.map((variant) => {
        const copyVariant = {
          ...variant,
          id: undefined,
          product_id: productMapping.get(variant.product_id),
          metadata: {
            ...variant.metadata,
            parentId: variant.id,
          },
        };

        return copyVariant;
      });

      // Save the copied variants
      const copiedVariantsResult = await this.productVariantRepository.save(
        copiedVariants,
      );

      this.logger.log(
        `Copied ${copiedVariantsResult.length} variants successfully`,
      );

      // Perform additional operations on the copied variants
      await Promise.all([
        this.variantAttributeCopyService.copyVariantAttributes(
          copiedVariantsResult,
        ),
        this.copyVariantChannelListing(copiedVariantsResult),
        this.copyVariantsStockListing(copiedVariantsResult),
        this.assignDefaultVariant(masterProducts, copiedVariantsResult),
      ]);

      this.logger.log('Variant copying is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying variants for copied products',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies variant channel listings for the copied variants.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves when the variant channel listing copying is complete.
   */
  async copyVariantChannelListing(
    copiedVariants: ProductProductVariant[],
  ): Promise<void> {
    try {
      this.logger.log('Copying variant channel listings for copied variants');

      // Retrieve the variant IDs of the master variants and create a mapping
      const variantIds =
        this.transformerService.getMasterProductVariants(copiedVariants);
      const variantMapping =
        this.transformerService.getProductVariantMapping(copiedVariants);

      this.logger.log(`Retrieved ${variantIds.length} master variant IDs`);

      // Retrieve all variant channel listings for the master variants
      const allListings =
        await this.productVariantChannelListingRepository.find({
          where: { variant_id: In(variantIds) },
        });

      this.logger.log(
        `Retrieved ${allListings.length} variant channel listings for copying`,
      );

      // Create copies of the variant channel listings and update the variant IDs
      const copiedListings = allListings.map((listing) => {
        const copyListing = {
          ...listing,
          id: undefined,
          variant_id: variantMapping.get(listing.variant_id),
        };

        return copyListing;
      });

      // Save the copied variant channel listings
      await this.productVariantChannelListingRepository.save(copiedListings);

      this.logger.log('Variant channel listing copying is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying variant channel listings for copied variants',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies product thumbnails for the copied media.
   * @param copiedMedia The copied media.
   * @returns A Promise that resolves when the product thumbnail copying is complete.
   */
  async copyProductThumbnails(
    copiedMedia: ProductProductMedia[],
  ): Promise<void> {
    try {
      this.logger.log('Copying product thumbnails for copied media');

      // Retrieve the media IDs of the master media and create a mapping
      const mediaIds =
        this.transformerService.getMasterProductMedia(copiedMedia);
      const mediaMapping =
        this.transformerService.getProductMediaMapping(copiedMedia);

      this.logger.log(`Retrieved ${mediaIds.length} master media IDs`);

      // Retrieve all product thumbnails for the master media
      const allThumbnails = await this.productThumbnailRepository.find({
        where: { product_media_id: In(mediaIds) },
      });

      this.logger.log(
        `Retrieved ${allThumbnails.length} product thumbnails for copying`,
      );

      // Create copies of the product thumbnails and update the media IDs
      const copiedThumbnails = allThumbnails.map((thumbnail) => {
        const copyThumbnail = {
          ...thumbnail,
          id: undefined,
          product_media_id: mediaMapping.get(thumbnail.product_media_id),
        };

        return copyThumbnail;
      });

      // Save the copied product thumbnails
      await this.productThumbnailRepository.save(copiedThumbnails);

      this.logger.log('Product thumbnail copying is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying product thumbnails for copied media',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies variants' stock listings for the copied variants.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves when the variants' stock listing copying is complete.
   */
  async copyVariantsStockListing(
    copiedVariants: ProductProductVariant[],
  ): Promise<void> {
    try {
      this.logger.log("Copying variants' stock listings for copied variants");

      // Retrieve the variant IDs of the master variants and create a mapping
      const variantIds =
        this.transformerService.getMasterProductVariants(copiedVariants);
      const variantMapping =
        this.transformerService.getProductVariantMapping(copiedVariants);

      this.logger.log(`Retrieved ${variantIds.length} master variant IDs`);

      // Retrieve the stock listings for the master variants
      const stockListings = await this.warehouseStockRepository.find({
        where: { product_variant_id: In(variantIds) },
      });

      this.logger.log(
        `Retrieved ${stockListings.length} stock listings for copying`,
      );

      // Create copies of the stock listings and update the variant IDs
      const copiedListings = stockListings.map((stockListing) => {
        const copyListing = {
          ...stockListing,
          id: undefined,
          product_variant_id: variantMapping.get(
            stockListing.product_variant_id,
          ),
        };

        return copyListing;
      });

      // Save the copied stock listings
      await this.warehouseStockRepository.save(copiedListings);

      this.logger.log("Variants' stock listing copying is complete");
    } catch (error) {
      this.logger.error(
        "An error occurred while copying variants' stock listings for copied variants",
        error,
      );
      throw error;
    }
  }

  /**
   * Assigns the default variant for the copied products.
   * @param masterProducts The master products.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves when the default variant assignment is complete.
   */
  async assignDefaultVariant(
    masterProducts: ProductProduct[],
    copiedVariants: ProductProductVariant[],
  ): Promise<void> {
    try {
      this.logger.log('Assigning default variant for copied products');

      const variantMapping =
        this.transformerService.getProductVariantMapping(copiedVariants);
      const productMapping =
        this.transformerService.getProductByVariantMapping(copiedVariants);

      const updatePromises = masterProducts.map(async (masterProduct) => {
        const copiedVariantId = variantMapping.get(
          masterProduct.default_variant_id,
        );
        const updatedProduct: Partial<ProductProduct> = {
          id: productMapping.get(copiedVariantId),
          default_variant_id: variantMapping.get(
            masterProduct.default_variant_id,
          ),
        };

        await this.productRepository.update(updatedProduct.id, updatedProduct);
      });

      await Promise.all(updatePromises);

      this.logger.log('Default variant assignment is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while assigning default variant for copied products',
        error,
      );
      throw error;
    }
  }
}
