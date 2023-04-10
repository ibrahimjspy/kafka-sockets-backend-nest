import { gql } from 'graphql-request';
import { PaginationDto } from 'src/graphql/types/paginate';
import {
  transformGraphqlObject,
  validatePageFilter,
} from 'src/graphql/utils/transformers';

export const getProductsQuery = (
  paginate: PaginationDto = { first: 100, after: '' },
  filter = {
    categories: [],
  },
): string => {
  const THUMBNAIL_SIZE = 512;
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
            channelListings {
              isAvailableForPurchase
            }
            thumbnail ( size: ${THUMBNAIL_SIZE} ){
              url
            }
            category {
              id
              ancestors(first: 100) {
                edges {
                  node {
                    id
                    level
                    name
                  }
                }
              }
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
