import { Logger } from '@nestjs/common';
import { graphqlCallSource } from '../proxies/client';
import { getShopQuery } from '../queries/shop/getShop';
import { getShopFieldValues } from 'src/graphql/utils/getShop';

/**
 * @description -- this method fetches store id from shop
 */
export const getStoreIdFromShop = async (shopId: string) => {
  try {
    const shopData = await graphqlCallSource(getShopQuery(shopId));
    return (
      getShopFieldValues(
        shopData['marketplaceShop']['fields'],
        'storefrontids',
      )[0] || null
    );
  } catch (err) {
    Logger.warn('could not fetch store id from shop');
  }
};
