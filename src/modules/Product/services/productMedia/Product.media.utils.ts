import { MEDIA_URL_PREFIX } from 'src/constants';

/**
 * @example 'UHJvZHVjdFZhcmlhbnQ6ODc1MDI=' => '87502'
 */
export const idBase64Decode = (productId: string): string => {
  if (!productId) return;
  return atob(productId)?.split(':')[1];
};

/**
 * @description -- this method transforms media url which should be added in database
 */
export const mediaUrlTransformer = (url: string): string => {
  if (!url) return;
  return url.split(MEDIA_URL_PREFIX)[1];
};
