import { gql } from 'graphql-request';

export const storeProductBrandMutation = (
  productId: string,
  vendorId: string,
  vendorName: string,
) => {
  return gql`
    mutation {
      updateMetadata(
        id: "${productId}"
        input: [{ key: "vendorId", value: "${vendorId}" }, { key: "vendorName", value: "${vendorName}" }
        { key: "isMaster", value: "true" }, { key: "parentId", value: "null" }]
      ) {
        item {
          metadata {
            key
            value
          }
        }
      }
    }
  `;
};
