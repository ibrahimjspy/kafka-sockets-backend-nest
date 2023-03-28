import { Injectable, Logger } from '@nestjs/common';
import { AutoSyncDto } from './Product.dto';
import { getProductsHandler } from 'src/graphql/source/handler/product';
import { ProductTransformer } from './transformer/Product.transformer';
import { ProductTransformedDto } from './transformer/Product.transformer.types';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';
import { ProductVariantService } from './services/productVariant/Product.variants.service';
import { ProductMediaService } from './services/productMedia/Product.media.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productTransformer: ProductTransformer,
    private readonly productDestinationApi: ProductDestinationService,
    private readonly productVariantService: ProductVariantService,
    private readonly productMediaService: ProductMediaService,
  ) {}
  private readonly logger = new Logger(ProductService.name);
  public async autoSync(autoSyncInput: AutoSyncDto): Promise<any> {
    try {
      const productData = await getProductsHandler(
        { first: 1 },
        { categories: [`${autoSyncInput.categoryId}`] },
      );
      const productsData = this.productTransformer.payloadBuilder(productData);
      return await this.createBulkProducts(productsData);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async createBulkProducts(
    productsData: ProductTransformedDto[],
  ): Promise<any> {
    try {
      return Promise.all(
        productsData.map(async (product: ProductTransformedDto) => {
          const productId = await this.productDestinationApi.createProduct(
            product,
          );
          await this.productDestinationApi.productChannelListing(productId);
          await this.productMediaService.bulkMediaCreate(productId, product);
          await this.productVariantService.bulkProductVariantCreate(
            productId,
            product,
          );
          return productId;
        }),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
