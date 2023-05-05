import { ProductMappingResponseDto } from './Product.mapping.types';

/**
 * @description -- this method removes duplicate retailer ids against a category id if any
 */
export const validateSyncedRetailerMappings = (mappingsArray): any[] => {
  const RETAILER_KEY = 'shr_retailer_shop_id';
  const VALUE_TYPE = 'raw';
  return [
    ...new Map(
      mappingsArray.map((item) => [item[RETAILER_KEY][VALUE_TYPE], item]),
    ).values(),
  ];
};

/**
 * @description -- this method removes duplicate product ids against a retailer
 */
export const validateSingleProductMappings = (
  { shopId },
  mappingsArray,
): any[] => {
  if (shopId) return mappingsArray;
  const RETAILER_KEY = 'retailer_id';
  const VALUE_TYPE = 'raw';
  return [
    ...new Map(
      mappingsArray.map((item) => [item[RETAILER_KEY][VALUE_TYPE], item]),
    ).values(),
  ];
};

/**
 * @description -- this method validates mapping list to check if it has any falsy value or if array is empty
 */
export const validateSaveMappingsList = (mappingsArray) => {
  let isValidMapping = true;
  mappingsArray.map((mapping) => {
    if (!mapping) {
      isValidMapping = false;
    }
  });
  if (!mappingsArray.length) {
    isValidMapping = false;
  }
  return isValidMapping;
};

/**
 * @description -- this method parses elastic search documents and return document ids in a 2d array with each sub array
 * having maximum of 90 document ids
 */
export const getElasticSearchDocumentIds = (
  documents: ProductMappingResponseDto[],
) => {
  const documentIds: string[][] = [[]];
  let key = 0;
  (documents || []).map((document) => {
    if (documentIds[key].length > 90) {
      key = key + 1;
      documentIds[key] = [];
    }
    documentIds[key].push(document.id.raw);
  });
  return documentIds;
};

/**
 * @description -- this method returns get all product mappings filter based on whether product id or shop id is filtered in parmas
 */
export const getProductMappingFilter = (productId, shopId) => {
  if (productId) {
    return {
      all: [
        {
          shr_b2b_product_id: productId,
        },
      ],
    };
  }
  return {
    all: [
      {
        retailer_id: shopId,
      },
    ],
  };
};
