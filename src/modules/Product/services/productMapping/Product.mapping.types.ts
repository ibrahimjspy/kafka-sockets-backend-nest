export interface ProductMappingsDto {
  shr_b2b_product_id?: string;
  shr_b2c_product_id?: string;
  retailer_id?: string;
  os_product_id?: string;
}

export interface SyncCategoryMappingDto {
  shr_retailer_shop_id?: string;
  shr_category_id?: string;
}

export interface CategoryMappingDto {
  shr_category_id: {
    raw: string;
  };
  shr_retailer_shop_id: {
    raw: string;
  };
  id: {
    raw: string;
  };
  _meta: {
    id: string;
    engine: string;
    score: number;
  };
}
export interface ProductMappingResponseDto {
  shr_b2c_product_id: {
    raw: string;
  };
  retailer_id: {
    raw: string;
  };
  id: {
    raw: string;
  };
  _meta: {
    id: string;
    engine: string;
    score: number;
  };
  shr_b2b_product_id: {
    raw: string;
  };
}

export interface OsMappingType {
  results: {
    tenant_id: {
      raw: string;
    };
    id: {
      raw: string;
    };
    _meta: {
      id: string;
      engine: string;
      score: number;
    };
    shr_b2b_product_id: {
      raw: string;
    };
    os_product_id: {
      raw: string;
    };
  }[];
}
