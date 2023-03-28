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
