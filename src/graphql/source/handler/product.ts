import { Logger } from '@nestjs/common';
import { graphqlCallSource } from '../proxies/client';
import { getProductsQuery } from '../queries/product/getList';
import { PaginationDto } from 'src/graphql/types/paginate';

export const getProductsHandler = async (
  paginate: PaginationDto,
  filter = {
    categories: [],
  },
) => {
  try {
    const productsList = await graphqlCallSource(
      getProductsQuery(paginate, {
        ...filter,
        isAvailable: true,
        isPublished: true,
      }),
    );
    return productsList['products'];
  } catch (err) {
    console.log(err);
    Logger.warn('Product fetch call failed');
  }
};
