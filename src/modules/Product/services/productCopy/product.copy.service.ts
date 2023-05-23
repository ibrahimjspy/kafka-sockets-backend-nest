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
    const masterProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.metadata ->> :isMasterKey = :isMasterValue', {
        isMasterKey: 'isMaster',
        isMasterValue: 'true',
      })
      .getMany();

    const copiedProducts: ProductProduct[] = [];

    for (const masterProduct of masterProducts) {
      const copiedProduct = { ...masterProduct };
      delete copiedProduct.id;
      copiedProduct.slug =
        this.transformerService.getProductSlug(masterProduct);
      copiedProduct.default_variant_id = null;
      copiedProduct.category_id = null;
      copiedProduct.metadata = {
        ...copiedProduct.metadata,
        parentId: masterProduct.id,
        isMaster: 'false',
      };

      copiedProducts.push(copiedProduct);
    }

    const copyProducts = await this.productRepository.save(copiedProducts);
    await Promise.all([
      this.productAttributeCopyService.copyProductAttributes(copyProducts),
      this.copyChannelListingsForCopiedProducts(copyProducts),
      this.copyVariants(copiedProducts, masterProducts),
      this.copyProductMedia(copyProducts),
    ]);

    return copyProducts;
  }

  /**
   * Copies channel listings for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the channel listing copying is complete.
   */
  async copyChannelListingsForCopiedProducts(
    copiedProducts: ProductProduct[],
  ): Promise<void> {
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);
    const originalChannelListings =
      await this.productChannelListingRepository.find({
        where: { product_id: In(productIds) },
      });

    const copiedChannelListings = originalChannelListings.map(
      (originalChannelListing) => {
        const copyChannelListing = { ...originalChannelListing };
        delete copyChannelListing.id;
        copyChannelListing.product_id = productMapping.get(
          originalChannelListing.product_id,
        );
        return copyChannelListing;
      },
    );

    await this.productChannelListingRepository.save(copiedChannelListings);
  }

  /**
   * Copies product media for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the product media copying is complete.
   */
  async copyProductMedia(copiedProducts: ProductProduct[]): Promise<void> {
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);
    const allMedia = await this.productMediaRepository.find({
      where: { product_id: In(productIds) },
    });

    const copiedMedia = allMedia.map((media) => {
      const copyMedia = { ...media };
      copyMedia.oembed_data.parentId = media.id;
      delete copyMedia.id;
      copyMedia.product_id = productMapping.get(media.product_id);
      return copyMedia;
    });

    const copiedMediaResponse = await this.productMediaRepository.save(
      copiedMedia,
    );
    await this.copyProductThumbnails(copiedMediaResponse);
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
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);
    const allVariants = await this.productVariantRepository.find({
      where: { product_id: In(productIds) },
    });

    const copiedVariants = allVariants.map((variant) => {
      const copyVariant = { ...variant };
      copyVariant.metadata.parentId = variant.id;
      delete copyVariant.id;
      copyVariant.product_id = productMapping.get(variant.product_id);
      return copyVariant;
    });

    const copiedVariantsResponse = await this.productVariantRepository.save(
      copiedVariants,
    );
    await Promise.all([
      this.variantAttributeCopyService.copyVariantAttributes(
        copiedVariantsResponse,
      ),
      this.copyVariantChannelListing(copiedVariantsResponse),
      this.copyVariantsStockListing(copiedVariantsResponse),
      this.assignDefaultVariant(masterProducts, copiedVariantsResponse),
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
    const variantIds =
      this.transformerService.getMasterProductVariants(copiedVariants);
    const variantMapping =
      this.transformerService.getProductVariantMapping(copiedVariants);
    const allListings = await this.productVariantChannelListingRepository.find({
      where: { variant_id: In(variantIds) },
    });

    const copiedListings = allListings.map((listing) => {
      const copyListing = { ...listing };
      delete copyListing.id;
      copyListing.variant_id = variantMapping.get(listing.variant_id);
      return copyListing;
    });

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
    const mediaIds = this.transformerService.getMasterProductMedia(copiedMedia);
    const mediaMapping =
      this.transformerService.getProductMediaMapping(copiedMedia);
    const allThumbnails = await this.productThumbnailRepository.find({
      where: { product_media_id: In(mediaIds) },
    });

    const copiedThumbnails = allThumbnails.map((thumbnail) => {
      const copyThumbnail = { ...thumbnail };
      delete copyThumbnail.id;
      copyThumbnail.product_media_id = mediaMapping.get(
        thumbnail.product_media_id,
      );
      return copyThumbnail;
    });

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
    const variantIds =
      this.transformerService.getMasterProductVariants(copiedVariants);
    const variantMapping =
      this.transformerService.getProductVariantMapping(copiedVariants);
    const stockListings = await this.warehouseStockRepository.find({
      where: { product_variant_id: In(variantIds) },
    });

    const copiedListings = stockListings.map((stockListing) => {
      const copyListing = { ...stockListing };
      delete copyListing.id;
      copyListing.product_variant_id = variantMapping.get(
        stockListing.product_variant_id,
      );
      return copyListing;
    });

    await this.warehouseStockRepository.save(copiedListings);
  }

  /**
   * Assigns the default variant to copied products.
   * @param masterProducts The master products used for mapping.
   * @param copiedVariants The copied variants to update.
   * @returns A Promise that resolves when the update is completed.
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

    console.log('Bulk update completed successfully.');
  }
}
