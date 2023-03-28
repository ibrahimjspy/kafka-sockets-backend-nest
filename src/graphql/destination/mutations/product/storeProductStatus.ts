import { gql } from 'graphql-request';

export const storeProductCreateStatusMutation = (productId: string) => {
  return gql`
      mutation {
        updatePrivateMetadata(
          id: "${productId}"
          input: { key: "status", value: "product_created" }
        ) {
          item {
            id
            metadata {
              key
              value
            }
          }
        }
      }
    `;
};
