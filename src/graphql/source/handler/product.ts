import { Logger } from '@nestjs/common';
import { graphqlCallSource } from '../proxies/client';
import { getProductsQuery } from '../queries/product/getList';
import { PaginationDto } from 'src/graphql/types/paginate';

/**
 * @description -- this method fetches products from source with built in pagination support
 */
export const getProductsHandler = async (paginate: PaginationDto, filter) => {
  try {
    const productsList = await graphqlCallSource(
      getProductsQuery(paginate, {
        ...filter,
      }),
    );
    return productsList['products'];
  } catch (err) {
    Logger.warn('Product fetch call failed');
  }
};
