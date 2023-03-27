import { gql } from 'graphql-request';
import { PaginationDto } from 'src/graphql/types/paginate';
import {
  transformGraphqlObject,
  validatePageFilter,
} from 'src/graphql/utils/transformers';

export const getProductsQuery = (
  paginate: PaginationDto = { first: 100, after: '' },
  filter = {
    isPublished: true,
    isAvailable: true,
    categories: [],
  },
): string => {
  return gql`
    query {
      products(${validatePageFilter(
        paginate,
      )}, filter: ${transformGraphqlObject(filter)}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
        edges {
          node {
            id
            slug
            category {
              id
            }
            metadata {
              key
              value
            }
            attributes {
                attribute {
                  name
                }
                values {
                  name
                }
              }
            variants {
              id
              sku
              media {
                url
              }
              stocks {
                quantity
              }
              channelListings {
                costPrice {
                  amount
                }
                price {
                  amount
                }
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
            thumbnail {
              url
            }
            media {
              url
            }
            name
            description
          }
        }
      }
    }
  `;
};
