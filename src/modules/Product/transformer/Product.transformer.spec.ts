import { Test, TestingModule } from '@nestjs/testing';
import { ProductTransformer } from './Product.transformer';
import { mockProductsList } from '../../../../test/mocks/products';

describe('This tests whether product transformer is working properly', () => {
  let service: ProductTransformer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductTransformer],
    }).compile();

    service = module.get<ProductTransformer>(ProductTransformer);
  });

  describe('root 2', () => {
    it('should return "Hello World! 2"', () => {
      const data = service.payloadBuilder(mockProductsList);
      console.dir(data, { depth: null });
      expect(data).toBeDefined();
    });
  });
});
