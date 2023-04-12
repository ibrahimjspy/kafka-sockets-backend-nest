import { Injectable } from '@nestjs/common';
import { AutoSyncDto, GetProductsDto } from '../Product.dto';
import {
  ProductDto,
  ProductTransformedDto,
  ShopDetailsDto,
  UpdatedProductFieldsDto,
} from './Product.transformer.types';
import { ProductMediaTransformer } from '../services/productMedia/Product.media.transformer';
import { ProductVariantTransformer } from '../services/productVariant/Product.variant.transformer';
import { ProductMappingsDto } from '../services/productMapping/Product.mapping.types';
import {
  VENDOR_ID_METADATA_KEY,
  VENDOR_NAME_METADATA_KEY,
  STYLE_NUMBER_ATTRIBUTE_NAME,
} from 'src/constants';

@Injectable()
export class ProductTransformer {
  constructor(
    private readonly mediaTransformer: ProductMediaTransformer,
    private readonly variantTransformer: ProductVariantTransformer,
  ) {}

  public payloadBuilder(productsData: GetProductsDto) {
    const transformedProducts: ProductTransformedDto[] = [];
    const productsList: ProductDto[] = this.removeEdges(productsData);
    productsList.map((product: ProductDto) => {
      const transformedProduct: ProductTransformedDto = {};
      this.addProductDetails(product, transformedProduct);
      this.addShopDetails(product, transformedProduct);
      this.addProductSlug(product, transformedProduct);
      this.mediaTransformer.addMedia(product, transformedProduct);
      this.variantTransformer.addVariants(product, transformedProduct);
      this.addCategoryIds(product, transformedProduct);
      transformedProducts.push(transformedProduct);
    });
    return transformedProducts;
  }

  public removeEdges(products: GetProductsDto): ProductDto[] {
    const productsList: ProductDto[] = [];
    products.edges.map((product) => {
      productsList.push(product.node);
    });
    return productsList;
  }

  public addShopDetails(product: ProductDto, transformedProduct) {
    const vendorDetails: ShopDetailsDto = {};

    product.metadata.map((meta) => {
      if (meta.key == VENDOR_ID_METADATA_KEY) {
        vendorDetails.vendorId = meta.value;
      }
      if (meta.key == VENDOR_NAME_METADATA_KEY) {
        vendorDetails.vendorName = meta.value;
      }
    });
    transformedProduct.vendorDetails = vendorDetails;
  }

  public addProductDetails(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    transformedProduct.name = product.name;
    transformedProduct.sourceId = product.id;
    transformedProduct.description = product.description;
    transformedProduct.styleNumber = this.getProductStyleNumber(product);
    transformedProduct.isAvailableForPurchase =
      product.channelListings[0]?.isAvailableForPurchase;
  }

  public getProductStyleNumber(product: ProductDto) {
    let styleNumber: string;
    product.attributes.map((attribute) => {
      if (attribute.attribute.name == STYLE_NUMBER_ATTRIBUTE_NAME) {
        attribute.values.map((value) => {
          styleNumber = value.name;
        });
      }
    });
    return styleNumber;
  }

  public transformCreatedProductForMapping(
    autoSyncInput: AutoSyncDto,
    createdProductId: string,
    transformedProduct: ProductTransformedDto,
  ): ProductMappingsDto {
    return {
      shr_b2b_product_id: transformedProduct.sourceId,
      shr_b2c_product_id: createdProductId,
      retailer_id: autoSyncInput.shopId,
    };
  }

  public addCategoryIds(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ): void {
    transformedProduct.categoryId = product.category.id;
    transformedProduct.categoryTree = product.category.ancestors.edges.map(
      (category) => {
        return category.node.id;
      },
    );
    transformedProduct.categoryTree = [
      ...transformedProduct.categoryTree,
      transformedProduct.categoryId,
    ];
  }

  public getUpdatedProductFields(
    sourceProduct: ProductTransformedDto,
    destinationTransformedProduct: ProductTransformedDto,
    destinationProduct: ProductDto,
  ): UpdatedProductFieldsDto {
    const updatedProductFields: UpdatedProductFieldsDto = {};
    if (
      sourceProduct.name !== destinationTransformedProduct.name ||
      sourceProduct.description !== destinationTransformedProduct.description ||
      sourceProduct.categoryId !== destinationTransformedProduct.categoryId
    ) {
      updatedProductFields.name = sourceProduct.name;
      updatedProductFields.description = sourceProduct.description;
      updatedProductFields.categoryId = sourceProduct.categoryId;
    }

    if (
      sourceProduct.isAvailableForPurchase !==
      destinationTransformedProduct.isAvailableForPurchase
    ) {
      updatedProductFields.isAvailableForPurchase =
        sourceProduct.isAvailableForPurchase;
    }

    if (
      sourceProduct.variants[0]?.resalePrice !==
      destinationProduct.variants[0]?.channelListings[0]?.price?.amount
    ) {
      updatedProductFields.resalePrice = sourceProduct.variants[0].resalePrice;
      updatedProductFields.costPrice = sourceProduct.variants[0].costPrice;
    }
    return updatedProductFields;
  }

  public addProductSlug(
    product: ProductDto,
    transformedProduct: ProductTransformedDto,
  ) {
    const uniqueString = (Math.random() + 1).toString(36).substring(7); //e.g ~~ jce4r
    const validProductName = product.slug.replace(/\s+/g, '').toLowerCase();
    transformedProduct.slug = `${validProductName}${uniqueString}`;
  }
}
