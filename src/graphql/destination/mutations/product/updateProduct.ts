import { gql } from 'graphql-request';
import { UpdatedProductFieldsDto } from 'src/modules/Product/transformer/Product.transformer.types';

export const updateProductMutation = (
  productId: string,
  updatedProductFields: UpdatedProductFieldsDto,
) => {
  const { name, description, categoryId } = updatedProductFields;
  return gql`
    mutation {
      productUpdate(
        id: "${productId}"
        input: { name: "${name}", description: ${JSON.stringify(
    description,
  )}, category: "${categoryId}" }
      ) {
        product {
          id
        }
        errors {
          message
        }
      }
    }
  `;
};
