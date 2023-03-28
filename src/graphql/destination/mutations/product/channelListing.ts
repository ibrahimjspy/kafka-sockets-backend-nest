import { gql } from 'graphql-request';
import { DEFAULT_CHANNEL_ID } from 'src/constants';

export const productChannelListingMutation = (productId) => {
  return gql`
      mutation {
        productChannelListingUpdate(
          id: "${productId}"
          input: {
            updateChannels: {
              channelId: "${DEFAULT_CHANNEL_ID}"
              visibleInListings: true
              isAvailableForPurchase: true
              isPublished: true
            }
          }
        ) {
          product {
            id
            name
          }
          errors {
            message
          }
        }
      }
    `;
};
