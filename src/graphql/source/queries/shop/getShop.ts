import { gql } from 'graphql-request';

export const getShopQuery = (shopId: string): string => {
  return gql`
    query {
      marketplaceShop(filter: { id: "${shopId}" }) {
        id
        url
        fields {
          name
          values
        }
      }
    }
  `;
};
