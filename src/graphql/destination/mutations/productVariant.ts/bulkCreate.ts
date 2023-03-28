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
            attributes {
              attribute {
                id
                name
              }
              values {
                value
                name
              }
            }
          }
          errors {
            message
            code
          }
        }
      }
    `;
};
