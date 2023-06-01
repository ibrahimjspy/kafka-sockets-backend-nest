import { Logger } from '@nestjs/common';
import { graphqlCallSource } from '../proxies/client';
import { getShopQuery } from '../queries/shop/getShop';
import { getShopFieldValues } from 'src/graphql/utils/getShop';

/**
 * @description -- this method fetches store id from shop
 */
export const getStoreIdFromShop = async (id: string) => {
  try {
    const shopData = await graphqlCallSource(getShopQuery({ id }), false);
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

/**
 * @description -- this method returns shop details against a email
 */
export const getShopDetails = async (email: string) => {
  try {
    const response = await graphqlCallSource(getShopQuery({ email }));
    return response['marketplaceShop'];
  } catch (err) {
    Logger.warn('could not fetch store id from shop');
  }
};
