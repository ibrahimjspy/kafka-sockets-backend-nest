import { gql } from 'graphql-request';
export const shopDetailQuery = (id: string): string => {
  return gql`
    query {
      marketplaceShop(filter: { id: "${id}" }) {
        id
      }
    }
  `;
};
