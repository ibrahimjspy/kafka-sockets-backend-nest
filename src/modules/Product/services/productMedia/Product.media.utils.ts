/**
 * @example 'UHJvZHVjdFZhcmlhbnQ6ODc1MDI=' => '87502'
 */
export const idBase64Decode = (productId: string): string => {
  if (!productId) return;
  return atob(productId)?.split(':')[1];
};

export const mediaUrlTransformer = (url: string): string => {
  if (!url) return;
  const MEDIA_URL_PREFIX = 'media/';
  return url.split(MEDIA_URL_PREFIX)[1];
};
