export interface ProductVariantInterface {
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
}

export interface ProductVariantDto {
  Color?: string;
  Commission?: string;
  Size?: string;
  'Cost Price'?: string;
  sku?: string;
  'Resale Price'?: string;
}
