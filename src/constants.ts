import * as dotenv from 'dotenv';
dotenv.config();

// kafka
export const KAFKA_CONSUMER_GROUP = process.env.KAFKA_CONSUMER_GROUP;

// application
export const SERVER_PORT = process.env.SERVER_PORT || '1010';

// source
export const SOURCE_GRAPHQL_ENDPOINT = process.env.SOURCE_GRAPHQL_ENDPOINT;
export const SOURCE_GRAPHQL_ALL_ACCESS_TOKEN =
  process.env.SOURCE_GRAPHQL_ALL_ACCESS_TOKEN;

// destination
export const DESTINATION_DB_SCHEMA_NAME = 'saleor';
export const DESTINATION_MEDIA_TABLE_NAME = 'product_productmedia';
export const MEDIA_URL_PREFIX = 'media/';

export const DESTINATION_GRAPHQL_ENDPOINT =
  process.env.DESTINATION_GRAPHQL_ENDPOINT;
export const DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN =
  process.env.DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN;
export const DEFAULT_PRODUCT_TYPE = process.env.DEFAULT_PRODUCT_TYPE;
export const STYLE_ATTRIBUTE_ID = process.env.STYLE_ATTRIBUTE_ID;
export const DEFAULT_CHANNEL_ID = process.env.DEFAULT_CHANNEL_ID;
export const COLOR_ATTRIBUTE_ID = process.env.COLOR_ATTRIBUTE_ID;
export const SIZE_ATTRIBUTE_ID = process.env.SIZE_ATTRIBUTE_ID;
export const SKU_ATTRIBUTE_ID = process.env.SKU_ATTRIBUTE_ID;
export const DEFAULT_WAREHOUSE_ID = process.env.DEFAULT_WAREHOUSE_ID;
export const MAPPING_MAPPING_TOKEN = process.env.MAPPING_MAPPING_TOKEN;
export const MAPPING_SERVICE_URL = process.env.MAPPING_SERVICE_URL;
export const mediaCreateDefaults = {
  type: 'IMAGE',
  alt: 'alt',
  oembed_data: {},
  to_remove: false,
};
