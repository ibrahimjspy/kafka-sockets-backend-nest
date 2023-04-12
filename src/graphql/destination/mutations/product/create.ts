import { gql } from 'graphql-request';
import { DEFAULT_PRODUCT_TYPE, STYLE_ATTRIBUTE_ID } from 'src/constants';
import { ProductTransformedDto } from 'src/modules/Product/transformer/Product.transformer.types';

export const createProductMutation = (productData: ProductTransformedDto) => {
  const { name, categoryId, description, styleNumber, slug } = productData;
  return gql`
      mutation {
        productCreate(
          input: {
            productType: "${DEFAULT_PRODUCT_TYPE}"
            description:${JSON.stringify(description)}
            name: "${name}"
            slug: "${slug}"
            attributes:[{
              id:"${STYLE_ATTRIBUTE_ID}",
              values:["${styleNumber}"]
            }]
            category:"${categoryId}"
            rating: 4
          }
        ) {
          product {
            name
            id
            slug
          }
          errors {
            field
            message
          }
        }
      }
    `;
};
