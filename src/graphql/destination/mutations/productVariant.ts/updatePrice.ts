import { gql } from 'graphql-request';
import { DEFAULT_CHANNEL_ID } from 'src/constants';
import { UpdatedProductFieldsDto } from 'src/modules/Product/transformer/Product.transformer.types';

export const productVariantPriceUpdateMutation = (
  productVariantId: string,
  productUpdatedFields: UpdatedProductFieldsDto,
) => {
  const { resalePrice, costPrice } = productUpdatedFields;
  return gql`
    mutation {
      productVariantChannelListingUpdate(
        id: "${productVariantId}"
        input: { channelId: "${DEFAULT_CHANNEL_ID}", costPrice: ${costPrice}, price: ${resalePrice} }
      ) {
        variant {
          id
        }
        errors {
          code
          message
        }
      }
    }
  `;
};
