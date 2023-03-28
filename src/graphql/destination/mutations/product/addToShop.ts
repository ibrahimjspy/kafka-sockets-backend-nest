import { gql } from 'graphql-request';

export const addProductToStoreMutation = (
  productIds: string[],
  storeId: string,
) => {
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
