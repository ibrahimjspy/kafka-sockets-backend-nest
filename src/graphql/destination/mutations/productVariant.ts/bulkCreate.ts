import { gql } from 'graphql-request';

export const productVariantBulkCreateMutation = (
  productId: string,
  productVariantData,
) => {
  return gql`
      mutation {
        productVariantBulkCreate(
          product: "${productId}"
          variants: [${productVariantData}]
        ) {
          productVariants {
            id
            sku
          }
          errors {
            message
            code
          }
        }
      }
    `;
};
