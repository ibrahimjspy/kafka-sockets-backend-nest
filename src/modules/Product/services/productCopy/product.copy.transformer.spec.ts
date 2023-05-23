import { ProductCopyTransformerService } from './product.copy.transformers';

describe('ProductCopyTransformerService', () => {
  let service: ProductCopyTransformerService;

  beforeEach(() => {
    service = new ProductCopyTransformerService();
  });

  describe('getMasterProducts', () => {
    it('should return an array of master product IDs', () => {
      const copiedProducts = [
        { metadata: { parentId: 1 } },
        { metadata: { parentId: 2 } },
        { metadata: { parentId: 3 } },
      ];
      const masterProductIds = service.getMasterProducts(copiedProducts as any);
      expect(masterProductIds).toEqual([1, 2, 3]);
    });

    it('should return an empty array if no copied products are provided', () => {
      const copiedProducts = [];
      const masterProductIds = service.getMasterProducts(copiedProducts);
      expect(masterProductIds).toEqual([]);
    });
  });

  describe('getMasterProductVariants', () => {
    it('should return an array of master product variant IDs', () => {
      const copiedProductVariants = [
        { metadata: { parentId: 10 } },
        { metadata: { parentId: 20 } },
        { metadata: { parentId: 30 } },
      ];
      const masterVariantIds = service.getMasterProductVariants(
        copiedProductVariants as any,
      );
      expect(masterVariantIds).toEqual([10, 20, 30]);
    });

    it('should return an empty array if no copied product variants are provided', () => {
      const copiedProductVariants = [];
      const masterVariantIds = service.getMasterProductVariants(
        copiedProductVariants,
      );
      expect(masterVariantIds).toEqual([]);
    });
  });

  describe('getMasterProductMedia', () => {
    it('should return an array of master product media IDs', () => {
      const copiedMedia = [
        { oembed_data: { parentId: 100 } },
        { oembed_data: { parentId: 200 } },
        { oembed_data: { parentId: 300 } },
      ];
      const masterMediaIds = service.getMasterProductMedia(copiedMedia as any);
      expect(masterMediaIds).toEqual([100, 200, 300]);
    });

    it('should return an empty array if no copied media are provided', () => {
      const copiedMedia = [];
      const masterMediaIds = service.getMasterProductMedia(copiedMedia);
      expect(masterMediaIds).toEqual([]);
    });
  });

  describe('getProductMapping', () => {
    it('should generate a mapping between original and copied product IDs (using "parent" key)', () => {
      const copiedProducts = [
        { id: 1, metadata: { parentId: 10 } },
        { id: 2, metadata: { parentId: 20 } },
        { id: 3, metadata: { parentId: 30 } },
      ];
      const mapping = service.getProductMapping(
        copiedProducts as any,
        'parent',
      );
      expect(mapping.get(10)).toEqual(1);
      expect(mapping.get(20)).toEqual(2);
      expect(mapping.get(30)).toEqual(3);
    });

    it('should generate a mapping between original and copied product IDs (using "child" key)', () => {
      const copiedProducts = [
        { id: 1, metadata: { parentId: 10 } },
        { id: 2, metadata: { parentId: 20 } },
        { id: 3, metadata: { parentId: 30 } },
      ];
      const mapping = service.getProductMapping(copiedProducts as any, 'child');
      expect(mapping.get(1)).toEqual(10);
      expect(mapping.get(2)).toEqual(20);
      expect(mapping.get(3)).toEqual(30);
    });
  });

  describe('getProductMediaMapping', () => {
    it('should generate a mapping between original and copied product media IDs', () => {
      const copiedMedia = [
        { id: 100, oembed_data: { parentId: 1000 } },
        { id: 200, oembed_data: { parentId: 2000 } },
        { id: 300, oembed_data: { parentId: 3000 } },
      ];
      const mapping = service.getProductMediaMapping(copiedMedia as any);
      expect(mapping.get(1000)).toEqual(100);
      expect(mapping.get(2000)).toEqual(200);
      expect(mapping.get(3000)).toEqual(300);
    });
  });

  describe('getProductVariantMapping', () => {
    it('should generate a mapping between original and copied product variant IDs (using "parent" key)', () => {
      const copiedProductVariants = [
        { id: 100, metadata: { parentId: 1000 } },
        { id: 200, metadata: { parentId: 2000 } },
        { id: 300, metadata: { parentId: 3000 } },
      ];
      const mapping = service.getProductVariantMapping(
        copiedProductVariants as any,
        'parent',
      );
      expect(mapping.get(1000)).toEqual(100);
      expect(mapping.get(2000)).toEqual(200);
      expect(mapping.get(3000)).toEqual(300);
    });

    it('should generate a mapping between original and copied product variant IDs (using "child" key)', () => {
      const copiedProductVariants = [
        { id: 100, metadata: { parentId: 1000 } },
        { id: 200, metadata: { parentId: 2000 } },
        { id: 300, metadata: { parentId: 3000 } },
      ];
      const mapping = service.getProductVariantMapping(
        copiedProductVariants as any,
        'child',
      );
      expect(mapping.get(100)).toEqual(1000);
      expect(mapping.get(200)).toEqual(2000);
      expect(mapping.get(300)).toEqual(3000);
    });
  });

  describe('getProductByVariantMapping', () => {
    it('should generate a mapping between copied product variant IDs and their corresponding product IDs', () => {
      const copiedProductVariants = [
        { id: 100, product_id: 1 },
        { id: 200, product_id: 2 },
        { id: 300, product_id: 3 },
      ];
      const mapping = service.getProductByVariantMapping(
        copiedProductVariants as any,
      );
      expect(mapping.get(100)).toEqual(1);
      expect(mapping.get(200)).toEqual(2);
      expect(mapping.get(300)).toEqual(3);
    });
  });
});
