import { gql } from 'graphql-request';
import { DEFAULT_CHANNEL_ID } from 'src/constants';
import { UpdatedProductFieldsDto } from 'src/modules/Product/transformer/Product.transformer.types';

export const updateProductListingMutation = (
  productId: string,
  updatedProductFields: UpdatedProductFieldsDto,
) => {
  const { isAvailableForPurchase } = updatedProductFields;
  return gql`
    mutation {
      productChannelListingUpdate(
        id: "${productId}"
        input: {
          updateChannels: { channelId: "${DEFAULT_CHANNEL_ID}", isAvailableForPurchase: ${isAvailableForPurchase} }
        }
      ) {
        product {
          id
        }
        errors {
          message
          field
        }
      }
    }
  `;
};
