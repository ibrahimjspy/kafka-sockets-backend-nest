import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductProduct } from 'src/database/destination/product/product';
import { ProductProductChannelListing } from 'src/database/destination/product/channnelListing';
import { ProductProductMedia } from 'src/database/destination/product/media';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';
import { ProductThumbnail } from 'src/database/destination/media';
import { WarehouseStock } from 'src/database/destination/productVariant/warehouseStock';
import { ProductCopyTransformerService } from './product.copy.transformers';
import { ProductAttributeCopyService } from './product.attributes.copy.service';
import { ProductVariantAttributeCopyService } from './product.variant.attribute.copy.service';

@Injectable()
export class ProductCopyService {
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
   * Creates copies of products for a given category.
   * @param categoryId The ID of the category.
   * @returns A Promise that resolves to the copied products.
   */
  async createCopiesForCategory(categoryId: number): Promise<ProductProduct[]> {
    // Retrieve the master products for the given category
    const masterProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.metadata ->> :isMasterKey = :isMasterValue', {
        isMasterKey: 'isMaster',
        isMasterValue: 'true',
      })
      .getMany();

    // Create copies of the master products
    const copiedProducts: ProductProduct[] = masterProducts.map(
      (masterProduct) => {
        const copiedProduct: ProductProduct = {
          ...masterProduct,
          id: undefined,
          slug: this.transformerService.getProductSlug(masterProduct),
          default_variant_id: null,
          category_id: null,
          metadata: {
            ...masterProduct.metadata,
            parentId: masterProduct.id,
            isMaster: 'false',
          },
        };

        return copiedProduct;
      },
    );

    // Save the copied products
    const copiedProductsResult = await this.productRepository.save(
      copiedProducts,
    );

    // Perform additional copying tasks
    await Promise.all([
      this.productAttributeCopyService.copyProductAttributes(
        copiedProductsResult,
      ),
      this.copyChannelListingsForCopiedProducts(copiedProductsResult),
      this.copyVariants(copiedProductsResult, masterProducts),
      this.copyProductMedia(copiedProductsResult),
    ]);

    return copiedProductsResult;
  }

  /**
   * Copies channel listings for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the channel listing copying is complete.
   */
  async copyChannelListingsForCopiedProducts(
    copiedProducts: ProductProduct[],
  ): Promise<void> {
    // Retrieve the product IDs of the master products and create a mapping
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);

    // Retrieve the original channel listings for the master products
    const originalChannelListings =
      await this.productChannelListingRepository.find({
        where: { product_id: In(productIds) },
      });

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

    // Save the copied channel listings
    await this.productChannelListingRepository.save(copiedChannelListings);
  }

  /**
   * Copies product media for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the product media copying is complete.
   */
  async copyProductMedia(copiedProducts: ProductProduct[]): Promise<void> {
    // Retrieve the product IDs of the master products and create a mapping
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);

    // Retrieve all media for the master products
    const allMedia = await this.productMediaRepository.find({
      where: { product_id: In(productIds) },
    });

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

    // Copy the product thumbnails for the copied media
    await this.copyProductThumbnails(copiedMediaResult);
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
    // Retrieve the product IDs of the master products and create a mapping
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);

    // Retrieve all variants for the master products
    const allVariants = await this.productVariantRepository.find({
      where: { product_id: In(productIds) },
    });

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

    // Perform additional operations on the copied variants
    await Promise.all([
      this.variantAttributeCopyService.copyVariantAttributes(
        copiedVariantsResult,
      ),
      this.copyVariantChannelListing(copiedVariantsResult),
      this.copyVariantsStockListing(copiedVariantsResult),
      this.assignDefaultVariant(masterProducts, copiedVariantsResult),
    ]);
  }

  /**
   * Copies variant channel listings for the copied variants.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves when the variant channel listing copying is complete.
   */
  async copyVariantChannelListing(
    copiedVariants: ProductProductVariant[],
  ): Promise<void> {
    // Retrieve the variant IDs of the master variants and create a mapping
    const variantIds =
      this.transformerService.getMasterProductVariants(copiedVariants);
    const variantMapping =
      this.transformerService.getProductVariantMapping(copiedVariants);

    // Retrieve all variant channel listings for the master variants
    const allListings = await this.productVariantChannelListingRepository.find({
      where: { variant_id: In(variantIds) },
    });

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
  }

  /**
   * Copies product thumbnails for the copied media.
   * @param copiedMedia The copied media.
   * @returns A Promise that resolves when the product thumbnail copying is complete.
   */
  async copyProductThumbnails(
    copiedMedia: ProductProductMedia[],
  ): Promise<void> {
    // Retrieve the media IDs of the master media and create a mapping
    const mediaIds = this.transformerService.getMasterProductMedia(copiedMedia);
    const mediaMapping =
      this.transformerService.getProductMediaMapping(copiedMedia);

    // Retrieve all product thumbnails for the master media
    const allThumbnails = await this.productThumbnailRepository.find({
      where: { product_media_id: In(mediaIds) },
    });

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
  }

  /**
   * Copies variants' stock listings for the copied variants.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves when the variants' stock listing copying is complete.
   */
  async copyVariantsStockListing(
    copiedVariants: ProductProductVariant[],
  ): Promise<void> {
    // Retrieve the variant IDs of the master variants and create a mapping
    const variantIds =
      this.transformerService.getMasterProductVariants(copiedVariants);
    const variantMapping =
      this.transformerService.getProductVariantMapping(copiedVariants);

    // Retrieve the stock listings for the master variants
    const stockListings = await this.warehouseStockRepository.find({
      where: { product_variant_id: In(variantIds) },
    });

    // Create copies of the stock listings and update the variant IDs
    const copiedListings = stockListings.map((stockListing) => {
      const copyListing = {
        ...stockListing,
        id: undefined,
        product_variant_id: variantMapping.get(stockListing.product_variant_id),
      };

      return copyListing;
    });

    // Save the copied stock listings
    await this.warehouseStockRepository.save(copiedListings);
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
  }
}
