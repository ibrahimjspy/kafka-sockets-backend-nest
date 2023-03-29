import { Test, TestingModule } from '@nestjs/testing';
import { ProductTransformer } from './Product.transformer';
import {
  expectedTransformedProductsList,
  mockProductsList,
} from '../../../../test/mocks/products';
import { ProductMediaTransformer } from '../services/productMedia/Product.media.transformer';
import { ProductVariantTransformer } from '../services/productVariant/Product.variant.transformer';
import { ProductVariantService } from '../services/productVariant/Product.variants.service';
import { ProductVariantDestinationService } from 'src/graphql/destination/handlers/productVariant';

describe('This tests whether product transformer is working properly', () => {
  let service: ProductTransformer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTransformer,
        ProductMediaTransformer,
        ProductVariantTransformer,
        ProductVariantService,
        ProductVariantDestinationService,
      ],
    }).compile();

    service = module.get<ProductTransformer>(ProductTransformer);
  });

  describe('product transformer tests', () => {
    it('complete product transformation is working fine, this tests using multiple products with different input variations"', () => {
      const data = service.payloadBuilder(mockProductsList);
      console.dir(data, { depth: null });
      expect(data).toBeDefined();
      expect(data).toStrictEqual(expectedTransformedProductsList);
    });
  });
});
