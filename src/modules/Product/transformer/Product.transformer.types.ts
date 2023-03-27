export interface ProductDto {
  id: string;
  slug: string;
  category: {
    id: string;
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
  categoryId?: string;
  styleNumber?: string;
  vendorDetails?: {
    vendorId?: string;
    vendorName?: string;
  };
}
