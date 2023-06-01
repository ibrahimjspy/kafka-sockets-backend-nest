import { Injectable, Logger } from '@nestjs/common';
import { graphqlCallDestination } from '../proxies/client';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';
import { addCategoryToShopMutation } from '../mutations/shop/addCategoryToShop';
import { shopDetailQuery } from '../queries/shop/details';

@Injectable()
export class ShopDestinationService {
  private readonly logger = new Logger(ShopDestinationService.name);

  /**
   * @description -- this method adds a category to shop in destination
   */
  public async addCategoryToShop(
    shopId: string,
    categoryId: string,
  ): Promise<string> {
    try {
      const addCategoryToShop = await graphqlCallDestination(
        addCategoryToShopMutation(shopId, categoryId),
      );
      const id = addCategoryToShop['addCategoryToShop'].id;
      return id;
    } catch (err) {
      this.logger.error(
        'add category to shop failed',
        graphqlExceptionHandler(err),
      );
      throw err;
    }
  }

  /**
   * @description -- this method validates whether shop exists or not
   * @warn -- it relies on marketplace shop to throw error to return false
   */
  public async validateStoreId(storeId: string): Promise<boolean> {
    try {
      await graphqlCallDestination(shopDetailQuery(storeId), false);
      return true;
    } catch (err) {
      this.logger.log('No shop was found', storeId);
      return false;
    }
  }
}
