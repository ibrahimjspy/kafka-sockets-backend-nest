import { gql } from 'graphql-request';
import { ShopFilterDto } from 'src/graphql/types/shop';

export const getShopQuery = (shopFilters: ShopFilterDto): string => {
  const { email, id } = shopFilters;
  const filter = email
    ? `filter: { email: "${email}" }`
    : `filter: { id: "${id}" }`;
  return gql`
    query {
      marketplaceShop(${filter}) {
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
