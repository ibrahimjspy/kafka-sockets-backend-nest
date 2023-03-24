import { Logger } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import {
  DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN,
  DESTINATION_GRAPHQL_ENDPOINT,
} from 'src/constants';

export const graphqlCallDestination = async (
  query: string,
): Promise<object> => {
  const startTime = new Date().getTime();
  const logger = new Logger('Graphql client destination');
  const request = {
    endpoint: DESTINATION_GRAPHQL_ENDPOINT,
    queryName: query.split('(')[0],
  };
  const graphQLClient = new GraphQLClient(DESTINATION_GRAPHQL_ENDPOINT, {
    headers: {
      authorization: `Bearer ${DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN}`,
    },
  });
  const response = await graphQLClient.request(query);
  const endTime = new Date().getTime();
  logger.log('Request took ' + (endTime - startTime) + 'ms', { request });
  return response;
};
