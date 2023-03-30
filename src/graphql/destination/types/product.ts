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
