import { Injectable, Logger } from '@nestjs/common';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';

@Injectable()
export class RollbackService {
  constructor(
    private readonly productDestinationApi: ProductDestinationService,
  ) {}
  private readonly logger = new Logger(RollbackService.name);

  /**
   * @description -- this takes all the promises which were resolved with either failure or success
   * if any of promises is not successful it rollback product that is created and returns error which caused the failure
   */
  public async handleProductCreateRollbacks(productId, promises = []) {
    const FAILED_STATUS = 'rejected';
    return await Promise.all(
      promises.map(async (promise) => {
        if (promise.status == FAILED_STATUS) {
          this.logger.warn(
            `rolling back product :: ${productId}`,
            promise.reason,
          );
          await this.productDestinationApi.deleteProductHandler(productId);
          throw promise.reason;
        }
      }),
    );
  }
}
