import * as dotenv from 'dotenv';
dotenv.config();

// kafka
export const KAFKA_CONSUMER_GROUP = 'auto-sync-kafka-consumer-13';
export const KAFKA_BROKER_ENDPOINT = process.env.KAFKA_BROKER_ENDPOINT;
export const KAFKA_BULK_PRODUCT_CREATE_TOPIC = 'autoSyncBulkCreate';
export const KAFKA_CREATE_PRODUCT_BATCHES_TOPIC = 'autoSyncCreateBatches';
export const KAFKA_HEARTBEAT_INTERVAL =
  Number(process.env.KAFKA_HEARTBEAT_INTERVAL) || 1000;
export const KAFKA_RETRIES = Number(process.env.KAFKA_RETRIES) || 5;
export const KAFKA_SESSION_TIMEOUT =
  Number(process.env.KAFKA_SESSION_TIMEOUT) || 100000;

// application
export const PRODUCT_BATCH_SIZE = Number(process.env.PRODUCT_BATCH_SIZE) || 25;
export const PRODUCT_UPDATE_BATCH_SIZE =
  Number(process.env.PRODUCT_UPDATE_BATCH_SIZE) || 5;
export const RETRY_COUNT = 4;
export const SERVER_PORT = process.env.SERVER_PORT || '1010';
export const SOCKET_PORT = process.env.SOCKET_PORT || '3000';
export const SOCKET_ENDPOINT =
  process.env.SOCKET_ENDPOINT || 'http://localhost:3000/autosync';
export const SOCKET_NAMESPACE = process.env.SOCKET_NAMESPACE || 'autosync';
export const SOCKET_CLIENT_MESSAGE_NAME =
  process.env.SOCKET_CLIENT_MESSAGE_NAME || 'autoSyncStatus';

// source
export const STYLE_NUMBER_ATTRIBUTE_NAME =
  process.env.STYLE_NUMBER_ATTRIBUTE_NAME || 'Style Number';
export const VENDOR_ID_METADATA_KEY =
  process.env.VENDOR_ID_METADATA_KEY || 'vendorId';
export const VENDOR_NAME_METADATA_KEY =
  process.env.VENDOR_NAME_METADATA_KEY || 'vendorName';

export const SOURCE_GRAPHQL_ENDPOINT = process.env.SOURCE_GRAPHQL_ENDPOINT;
export const SOURCE_GRAPHQL_ALL_ACCESS_TOKEN =
  process.env.SOURCE_GRAPHQL_ALL_ACCESS_TOKEN;

// destination
export const VARIANT_PRICE_RULE = Number(process.env.VARIANT_PRICE_RULE) || 1.6;

export const DESTINATION_DB_SCHEMA_NAME = 'saleor';
export const DESTINATION_MEDIA_TABLE_NAME = 'product_productmedia';
export const DESTINATION_THUMBNAIL_TABLE_NAME = 'thumbnail_thumbnail';
export const MEDIA_URL_PREFIX = 'media/';

export const DESTINATION_GRAPHQL_ENDPOINT =
  process.env.DESTINATION_GRAPHQL_ENDPOINT;
export const DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN =
  process.env.DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN;
export const DEFAULT_PRODUCT_TYPE = process.env.DEFAULT_PRODUCT_TYPE;
export const STYLE_ATTRIBUTE_ID = process.env.STYLE_ATTRIBUTE_ID;
export const DEFAULT_CHANNEL_ID = process.env.DEFAULT_CHANNEL_ID;
export const COLOR_ATTRIBUTE_ID = process.env.COLOR_ATTRIBUTE_ID;
export const COST_ATTRIBUTE_ID = process.env.COST_ATTRIBUTE_ID;
export const SIZE_ATTRIBUTE_ID = process.env.SIZE_ATTRIBUTE_ID;
export const SKU_ATTRIBUTE_ID = process.env.SKU_ATTRIBUTE_ID;
export const DEFAULT_WAREHOUSE_ID = process.env.DEFAULT_WAREHOUSE_ID;
export const MAPPING_MAPPING_TOKEN = process.env.MAPPING_MAPPING_TOKEN;
export const MAPPING_SERVICE_URL = process.env.MAPPING_SERVICE_URL;
export const AUTO_SYNC_MAPPING_URL = process.env.AUTO_SYNC_MAPPING_URL;
export const PRODUCT_THUMBNAIL_SIZE = 512;
export const mediaCreateDefaults = {
  type: 'IMAGE',
  alt: 'alt',
  oembed_data: {},
  to_remove: false,
};
export const MAPPING_SERVICE_HEADERS = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer private-${MAPPING_MAPPING_TOKEN}`,
  },
};
