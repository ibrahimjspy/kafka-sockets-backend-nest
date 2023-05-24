import { ProductVariantShopMapping } from 'src/database/destination/addProductToShop';
import { ProductCategory } from 'src/database/destination/category';
import { SyncMappings } from 'src/database/destination/mapping';
import { ProductProduct } from 'src/database/destination/product/product';
import { v4 as uuidv4 } from 'uuid';

export const isArrayEmpty = (array) => {
  return array.length == 0;
};

/**
 * @description -- this method is based on requirement that we set total count as maximum to 100;
 * this ensures that we do not import more than 100 products against a category
 * @post_condition -- this return total count which less than or equal to 100
 */
export const productTotalCountTransformer = (totalCount: number) => {
  const DEFAULT_TOTAL_COUNT = 100;
  if (totalCount < DEFAULT_TOTAL_COUNT) {
    return totalCount;
  }
  return DEFAULT_TOTAL_COUNT;
};

/**
 * @description -- this method transforms mappings stored in cdc table which are generated after stored procedure is completed
 * it transforms these mappings according to variant mapping table which adds products against shop
 * @post_condition -- this returns empty array if there is no mappings from cdc mapping table
 */
export const transformMappings = (
  mappings: SyncMappings[],
  storeId: string,
  categoryId: string,
): ProductVariantShopMapping[] => {
  const transformedMappings: ProductVariantShopMapping[] = [];
  mappings.map((mapping) => {
    const transformProduct = btoa(`Product:${mapping.new_product_id}`);
    transformedMappings.push({
      product_variant_id: uuidv4(),
      shop_id: storeId,
      product_id: transformProduct,
      category_id: categoryId,
      created_at: `${new Date().toISOString()}`,
      updated_at: `${new Date().toISOString()}`,
      is_deleted: false,
      channel_slug: 'default-channel',
    });
  });
  return transformedMappings;
};

/**
 * Returns an array of category IDs extracted from the given array of ProductCategory objects.
 * @param categories An array of ProductCategory objects.
 * @returns An array of category IDs.
 */
export const getCategoryIds = (categories: ProductCategory[]): number[] => {
  return categories.map((category) => category.id);
};

/**
 * Transforms a 2D array of ProductProduct objects into an array of SyncMappings objects.
 * @param products2dArray A 2D array of ProductProduct objects.
 * @returns An array of SyncMappings objects.
 */
export const transformProductsListSync = (
  products2dArray: ProductProduct[][],
): SyncMappings[] => {
  const mappings = [];
  for (const productArray of products2dArray) {
    for (const product of productArray) {
      mappings.push({ new_product_id: String(product.id) });
    }
  }
  return mappings as SyncMappings[];
};
