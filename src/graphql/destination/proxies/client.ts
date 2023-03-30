import { Logger } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import polly from 'polly-js';
import {
  DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN,
  DESTINATION_GRAPHQL_ENDPOINT,
} from 'src/constants';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';

export const graphqlCallDestination = async (
  query: string,
): Promise<object> => {
  return polly()
    .logger(function (err) {
      const logger = new Logger('graphqlCallDestination');
      logger.warn(
        `retrying :: ${query.split('(')[0]}`,
        graphqlExceptionHandler(err),
      );
    })
    .waitAndRetry(4)
    .executeForPromise(async () => {
      const graphQLClient = new GraphQLClient(DESTINATION_GRAPHQL_ENDPOINT, {
        headers: {
          authorization: `Bearer ${DESTINATION_GRAPHQL_ALL_ACCESS_TOKEN}`,
        },
      });
      const response: object = await graphQLClient.request(query);
      return response;
    });
};
