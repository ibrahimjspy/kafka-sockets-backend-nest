import { Injectable, Logger } from '@nestjs/common';
import { AutoSyncDto } from './Product.dto';
import { getProductsHandler } from 'src/graphql/source/handler/product';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  public async autoSync(autoSyncInput: AutoSyncDto): Promise<any> {
    try {
      const productData = await getProductsHandler(
        { first: 10 },
        { categories: [`${autoSyncInput.categoryId}`] },
      );
      console.dir(productData, { depth: null });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
