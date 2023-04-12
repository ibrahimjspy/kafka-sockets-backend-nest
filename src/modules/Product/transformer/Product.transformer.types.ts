import { ProductMedia, ProductThumbnail } from 'src/database/destination/media';
import { ProductVariantMediaDto } from '../services/productMedia/Product.media.types';
import { ProductVariantDto } from '../services/productVariant/Product.variant.types';

export interface ProductDto {
  id: string;
  slug: string;
  channelListings: {
    isAvailableForPurchase: boolean;
  }[];
  category: {
    id: string;
    ancestors: {
      edges: {
        node: {
          id: string;
          level: number;
          name: string;
        };
      }[];
    };
  };
  metadata: {
    key: string;
    value: string;
  }[];
  attributes: {
    attribute: {
      name: string;
    };
    values: {
      name: string;
    }[];
  }[];
  variants: {
    id: string;
    sku: string;
    media: any[];
    stocks: {
      quantity: number;
      warehouse: {
        id: string;
      };
    }[];
    channelListings: {
      costPrice: {
        amount: number;
      };
      price: {
        amount: number;
      };
    }[];
    attributes: {
      attribute: {
        name: string;
      };
      values: {
        name: string;
      }[];
    }[];
  }[];
  thumbnail: {
    url: string;
  };
  media: {
    url: string;
  }[];
  name: string;
  description: string;
}
export interface ShopDetailsDto {
  vendorId?: string;
  vendorName?: string;
}

export interface ProductTransformedDto {
  name?: string;
  description?: string;
  slug?: string;
  categoryId?: string;
  categoryTree?: string[];
  isAvailableForPurchase?: boolean;
  styleNumber?: string;
  sourceId?: string;
  thumbnail?: ProductThumbnail;
  vendorDetails?: ShopDetailsDto;
  mediaUrls?: ProductMedia[];
  variantMedia?: ProductVariantMediaDto[];
  variants?: ProductVariantDto[];
}

export interface UpdatedProductFieldsDto {
  name?: string;
  description?: string;
  categoryId?: string;
  isAvailableForPurchase?: boolean;
  resalePrice?: number;
  costPrice?: number;
}
