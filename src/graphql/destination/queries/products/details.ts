import { gql } from 'graphql-request';
export const getProductDetailQuery = (id: string): string => {
  return gql`
    query {
      product(id: "${id}") {
        name
        metadata {
          key
          value
        }
        variants {
          id
          stocks {
            quantity
            quantityAllocated
          }
          attributes {
            attribute {
              name
            }
            values {
              name
            }
          }
        }
      }
    }
  `;
};
