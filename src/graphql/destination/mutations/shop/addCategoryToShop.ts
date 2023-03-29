import { gql } from 'graphql-request';

export const addCategoryToShopMutation = (
  shopId: string,
  categoryId: string,
) => {
  return gql`
    mutation {
      addCategoryToShop(
        Input: { categoryId: "${categoryId}", shopId: "${shopId}" }
      ) {
        ... on CategoryShopMappingType {
          id
        }
      }
    }
  `;
};
