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
