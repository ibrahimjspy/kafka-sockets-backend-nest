import {
  ProductMappingResponseDto,
  ProductMappingsDto,
} from './Product.mapping.types';

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

/**
 * Converts a Map<number, number> into an object with keys added as shr_b2b_product_id.
 * @param map The Map<number, number> to convert.
 * @returns An object with keys added as shr_b2b_product_id in ElasticSearch filter format.
 */
export const convertMapToProductMapping = (
  map: Map<number, number>,
): { all: { shr_b2b_product_id: number }[] } => {
  const filter: { all: { shr_b2b_product_id: number }[] } = {
    all: [],
  };
  for (const key of map.keys()) {
    filter.all.push({ shr_b2b_product_id: key });
  }
  return filter;
};

/**
 * Transforms the copied product mapping data into the desired format.
 * @param retailerId The ID of the retailer.
 * @param productsMapping A map of product IDs from B2B to B2C.
 * @param elasticSearchResponse The response from Elasticsearch containing product mapping data.
 * @returns An array of transformed product mappings.
 */
export const transformCopiedProductMapping = (
  retailerId: string,
  productsMapping: Map<number, number>,
  elasticSearchResponse: ProductMappingResponseDto[],
): ProductMappingsDto[] => {
  const mappings: ProductMappingsDto[] = [];

  elasticSearchResponse.forEach((document) => {
    mappings.push({
      shr_b2b_product_id: document.shr_b2b_product_id.raw,
      shr_b2c_product_id: String(
        productsMapping.get(Number(document.shr_b2c_product_id.raw)),
      ),
      retailer_id: retailerId,
    });
  });

  return mappings;
};

/**
 * Breaks an array into chunks of a specified size.
 * @param array The array to be chunked.
 * @param size The size of each chunk.
 * @returns An array of chunked arrays.
 */
export const chunkArray = <T>(array: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
