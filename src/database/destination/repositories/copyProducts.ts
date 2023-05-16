import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMedia } from 'src/database/destination/media';

@Injectable()
export class CreateProductCopiesRepository {
  private readonly logger = new Logger(CreateProductCopiesRepository.name);
  @InjectRepository(ProductMedia)
  private readonly repository: Repository<ProductMedia>;

  /**
   * @description -- this method create copies for product against their masters
   */
  public async createProductCopies(categoryId: string, eventId: string) {
    const storeProcedureQuery = `call saleor.Sync_Products(${categoryId},'${eventId}')`;
    const startTime = new Date().getTime();
    await this.repository.query(storeProcedureQuery);
    const endTime = new Date().getTime();
    this.logger.log('product copies call took ' + (endTime - startTime) + 'ms');
  }
}
