export interface ProductVariantInterface {
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
      slug: string;
    };
    values: {
      name: string;
    }[];
  }[];
}

export interface ProductVariantDto {
  color?: string;
  commission?: string;
  size?: string;
  costPrice?: number;
  sku?: string;
  resalePrice?: number;
  stock?: ProductVariantStockDto[];
}

export interface ProductVariantStockDto {
  warehouseId?: string;
  quantity?: number;
}
