export interface productCreate {
  productCreate?: {
    product: {
      name: string;
      id: string;
      seoTitle: string;
      slug: string;
    };
    errors: any[];
  };
}

export interface bulkVariantCreate {
  productVariantBulkCreate?: {
    productVariants: {
      id: string;
      attributes: {
        attribute: {
          id: string;
          name: string;
        };
        values: {
          value: string;
          name: string;
        }[];
      }[];
    }[];
    errors: any[];
  };
}

export interface ProductDetailInterface {
  name: string;
  metadata: {
    key: string;
    value: string;
  }[];
  variants: {
    id: string;
    stocks: any[];
    attributes: {
      attribute: {
        name: string;
      };
      values: {
        name: string;
      }[];
    }[];
  }[];
}
