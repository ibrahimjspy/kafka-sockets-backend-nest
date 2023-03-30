import { PaginationDto } from '../types/paginate';

/**
 * It removes the quotes from the keys of a dictionary object
 * @param {object} obj - The object to be converted to a string.
 * @returns A string with all the keys in the object without quotes.
 */
export const transformGraphqlObject = (obj: object) => {
  if (typeof obj !== 'object')
    throw new Error('`obj` should be a dictionary object');

  const re = /"(\w+)"(?=:)/gi;
  const json_str = JSON.stringify(obj);

  return json_str.replace(re, (match: string) => match.replaceAll(/"/gi, ''));
};

/**
 * If the user doesn't provide a filter, we'll default to the first page of results. If the user
 * provides a filter, we'll use that instead
 * @param {PaginationDto} filter - PaginationDto - This is the filter object that we're going to
 * validate.
 * @returns A string
 */
export const validatePageFilter = (filter: PaginationDto): string => {
  let pageFilter = ``;
  const DEFAULT_PAGE_SIZE = 10;

  if (!filter?.first && !filter?.last) {
    pageFilter += `first: ${DEFAULT_PAGE_SIZE}`;
  } else if (filter.first) pageFilter += `first: ${filter.first}`;
  else if (filter.last) pageFilter += `last: ${filter.last}`;

  if (filter?.before) pageFilter += `\nbefore: "${filter.before}"`;
  else if (filter?.after) pageFilter += `\nafter: "${filter.after}"`;

  return pageFilter;
};
