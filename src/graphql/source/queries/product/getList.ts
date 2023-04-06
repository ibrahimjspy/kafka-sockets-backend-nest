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
            thumbnail ( size: 512 ){
              url
            }
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
                  slug
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
                warehouse {
                  id
                }
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
                  slug
                }
                values {
                  name
                }
              }
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
