import { Test, TestingModule } from '@nestjs/testing';
import { ProductMappingService } from './Product.mapping.service';

describe('This tests product mapping are correctly getting stored in elastic search', () => {
  let service: ProductMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductMappingService],
    }).compile();

    service = module.get<ProductMappingService>(ProductMappingService);
  });

  describe('root 2', () => {
    it('should insert mappings correctly after transforming"', async () => {
      const data = await service.saveBulkMappings([
        {
          shr_b2b_product_id: 'test',
          shr_b2c_product_id: 'testb2c',
          retailer_id: 'retailerId',
        },
        {
          shr_b2b_product_id: 'test2',
          shr_b2c_product_id: 'testb2c2',
          retailer_id: 'retailerI2d',
        },
      ]);
      expect(data).toBeDefined();
    });
  });
});
