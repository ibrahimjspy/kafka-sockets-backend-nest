import { gql } from 'graphql-request';
import { ProductMappingsDto } from 'src/modules/Product/services/productMapping/Product.mapping.types';

export const addProductsToStoreMutation = (
  products: ProductMappingsDto[],
  storeId: string,
) => {
  const productIds = products.map((product) => {
    return product.shr_b2c_product_id;
  });
  return gql`
      mutation {
        addProductsToShop(Input: { productIds: ${JSON.stringify(
          productIds,
        )}, shopId: "${storeId}" }) {
          id
        }
      }
    `;
};

export const addProductToStoreMutation = (
  storeId: string,
  product: string,
  categoryId: string,
  productVariantIds: string[],
) => {
  return gql`
    mutation {
      addProductVariantsToShop(
        input: {
          shopId: "${storeId}",
          productId: "${product}"
          categoryId: "${categoryId}"
          productVariantIds: ${JSON.stringify(productVariantIds)} }
      ) {
        id
      }
    }
  `;
};
