import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductProduct } from 'src/database/destination/product/product';
import { In, Repository } from 'typeorm';
import { ProductProductChannelListing } from 'src/database/destination/product/channnelListing';
import { ProductProductMedia } from 'src/database/destination/product/media';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { ProductProductVariantChannelListing } from 'src/database/destination/productVariant/channelListing';
import { ProductThumbnail } from 'src/database/destination/media';

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
  ) {}

  async createCopiesForCategory(categoryId: number): Promise<ProductProduct[]> {
    const masterProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.metadata ->> :isMasterKey = :isMasterValue', {
        isMasterKey: 'isMaster',
        isMasterValue: 'true',
      })
      .getMany();
    console.log(masterProducts);
    // return;
    const copiedProducts: ProductProduct[] = [];
    // const Mappings = [];
    console.log(masterProducts);

    for (const masterProduct of masterProducts) {
      const copiedProduct = { ...masterProduct };
      delete copiedProduct.id;
      copiedProduct.slug = this.getProductSlug(masterProduct);
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
    console.log(' was called');
    // const t = await this.copyChannelListingsForCopiedProducts(copyProducts);
    const m = await this.copyProductMedia(copyProducts);
    console.log(m);
    // console.log(t);
    // const k = await this.copyVariants(copiedProducts);
    // console.log(k);
    return copyProducts;
  }

  public getProductSlug(product: ProductProduct) {
    const uniqueString = (Math.random() + 1).toString(36).substring(7); //e.g ~~ jce4r
    const validProductName = product.slug.replace(/\s+/g, '').toLowerCase();
    return `${validProductName}${uniqueString}`;
  }

  public getMasterProducts(copiedProducts: ProductProduct[]) {
    return copiedProducts.map((copiedProduct) => {
      return copiedProduct.metadata.parentId;
    });
  }

  public getMasterProductVariants(
    copiedProductVariants: ProductProductVariant[],
  ) {
    return copiedProductVariants.map((copiedProductVariant) => {
      return copiedProductVariant.metadata.parentId;
    });
  }

  public getMasterProductMedia(copiedMedia: ProductProductMedia[]) {
    return copiedMedia.map((media) => {
      return media.oembed_data.parentId, media.id;
    });
  }

  public getProductMapping(copiedProducts: ProductProduct[]) {
    const Mapping: Map<number, number> = new Map();
    copiedProducts.map((copiedProduct) => {
      Mapping.set(copiedProduct.metadata.parentId, copiedProduct.id);
    });
    return Mapping;
  }

  public getProductMediaMapping(copiedMedia: ProductProductMedia[]) {
    const Mapping: Map<number, number> = new Map();
    copiedMedia.map((media) => {
      Mapping.set(media.oembed_data.parentId, media.id);
    });
    return Mapping;
  }

  public getProductVariantMapping(
    copiedProductVariants: ProductProductVariant[],
  ) {
    const Mapping: Map<number, number> = new Map();
    copiedProductVariants.map((copiedProductVariant) => {
      Mapping.set(
        copiedProductVariant.metadata.parentId,
        copiedProductVariant.id,
      );
    });
    return Mapping;
  }

  async copyChannelListingsForCopiedProducts(
    copiedProducts: ProductProduct[],
  ): Promise<any> {
    const channelListings = [];
    const productIds = this.getMasterProducts(copiedProducts);
    const productMapping = this.getProductMapping(copiedProducts);
    const originalChannelListings =
      await this.productChannelListingRepository.find({
        where: { product_id: In(productIds) },
      });
    console.log(originalChannelListings);
    for (const originalChannelListing of originalChannelListings) {
      // Create a copy of the channel listing
      const copyChannelListing = { ...originalChannelListing };
      delete copyChannelListing.id;
      copyChannelListing.product_id = productMapping.get(
        originalChannelListing.product_id,
      );
      channelListings.push(copyChannelListing);
    }
    // Save the copied channel listing
    return await this.productChannelListingRepository.save(channelListings);
  }

  async copyProductMedia(copiedProducts: ProductProduct[]): Promise<any> {
    const mediaList = [];
    const productIds = this.getMasterProducts(copiedProducts);
    const productMapping = this.getProductMapping(copiedProducts);
    const allMedia = await this.productMediaRepository.find({
      where: {
        product_id: In(productIds),
      },
    });
    console.log(allMedia);
    for (const media of allMedia) {
      // Create a copy of media
      const copyMedia = { ...media };
      copyMedia.oembed_data.parentId = media.id;
      delete copyMedia.id;
      copyMedia.product_id = productMapping.get(media.product_id);
      mediaList.push(copyMedia);
    }

    // Save the copied media
    const copyMedia = await this.productMediaRepository.save(mediaList);
    const copyThumbnails = await this.copyProductThumbnails(copyMedia);
    return { copyMedia, copyThumbnails };
  }

  async copyVariants(copiedProducts: ProductProduct[]): Promise<any> {
    const variantsList = [];
    const productIds = this.getMasterProducts(copiedProducts);
    const productMapping = this.getProductMapping(copiedProducts);
    const allVariants = await this.productVariantRepository.find({
      where: {
        product_id: In(productIds),
      },
    });
    // console.log(allVariants);
    for (const variant of allVariants) {
      // Create a copy of media
      const copyVariant = { ...variant };
      copyVariant.metadata.parentId = variant.id;
      delete copyVariant.id;
      copyVariant.product_id = productMapping.get(variant.product_id);
      variantsList.push(copyVariant);
    }

    // // Save the copied media
    const copyVariants = await this.productVariantRepository.save(variantsList);
    await this.copyVariantChannelListing(copyVariants);
    return copyVariants;
  }

  async copyVariantChannelListing(
    copiedVariants: ProductProductVariant[],
  ): Promise<any> {
    const channelListings = [];
    const productVariantIds = this.getMasterProductVariants(copiedVariants);
    const productVariantMapping = this.getProductVariantMapping(copiedVariants);
    const allListings = await this.productVariantChannelListingRepository.find({
      where: {
        variant_id: In(productVariantIds),
      },
    });
    for (const listing of allListings) {
      // Create a copy of media
      const copyListing = { ...listing };
      delete copyListing.id;
      copyListing.variant_id = productVariantMapping.get(listing.variant_id);
      channelListings.push(copyListing);
    }
    // // // Save the copied media
    return await this.productVariantChannelListingRepository.save(
      channelListings,
    );
  }

  async copyProductThumbnails(
    copiedMedia: ProductProductMedia[],
  ): Promise<any> {
    const thumbnails = [];
    const productMediaIds = this.getMasterProductMedia(copiedMedia);
    const productMediaMapping = this.getProductMediaMapping(copiedMedia);
    const allThumbnails = await this.productThumbnailRepository.find({
      where: {
        product_media_id: In(productMediaIds),
      },
    });
    for (const thumbnail of allThumbnails) {
      // Create a copy of media
      const copyThumbnail = { ...thumbnail };
      delete copyThumbnail.id;
      copyThumbnail.product_media_id = productMediaMapping.get(
        thumbnail.product_media_id,
      );
      thumbnails.push(copyThumbnail);
    }
    // Save the copied media
    return await this.productThumbnailRepository.save(thumbnails);
  }
}
