import { Injectable, Logger } from '@nestjs/common';
import { graphqlCallDestination } from '../proxies/client';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';
import { addCategoryToShopMutation } from '../mutations/shop/addCategoryToShop';

@Injectable()
export class ShopDestinationService {
  private readonly logger = new Logger(ShopDestinationService.name);

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
}
