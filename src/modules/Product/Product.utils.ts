import { ProductVariantShopMapping } from 'src/database/destination/addProductToShop';
import { SyncMappings } from 'src/database/destination/mapping';
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
      created_at: `${+new Date()}`,
      updated_at: `${+new Date()}`,
      is_deleted: false,
      channel_slug: 'default-channel',
    });
  });
  return transformedMappings;
};
