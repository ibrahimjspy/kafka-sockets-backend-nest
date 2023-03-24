import { Logger } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import {
  SOURCE_GRAPHQL_ALL_ACCESS_TOKEN,
  SOURCE_GRAPHQL_ENDPOINT,
} from 'src/constants';

export const graphqlCallSource = async (query: string): Promise<object> => {
  const startTime = new Date().getTime();
  const logger = new Logger('Graphql client source');
  const request = {
    endpoint: SOURCE_GRAPHQL_ENDPOINT,
    queryName: query.split('(')[0],
  };
  const graphQLClient = new GraphQLClient(SOURCE_GRAPHQL_ENDPOINT, {
    headers: {
      authorization: `Bearer ${SOURCE_GRAPHQL_ALL_ACCESS_TOKEN}`,
    },
  });
  const response = await graphQLClient.request(query);
  const endTime = new Date().getTime();
  logger.log('Request took ' + (endTime - startTime) + 'ms', { request });
  return response;
};
