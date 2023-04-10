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
export const validateSingleProductMappings = (mappingsArray): any[] => {
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
