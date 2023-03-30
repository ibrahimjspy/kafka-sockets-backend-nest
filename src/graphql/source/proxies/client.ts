import { GraphQLClient } from 'graphql-request';
import {
  SOURCE_GRAPHQL_ALL_ACCESS_TOKEN,
  SOURCE_GRAPHQL_ENDPOINT,
} from 'src/constants';
import polly from 'polly-js';
import { Logger } from '@nestjs/common';
import { graphqlExceptionHandler } from 'src/graphql/utils/exceptionHandler';

export const graphqlCallSource = async (query: string): Promise<object> => {
  return polly()
    .logger(function (err) {
      const logger = new Logger('graphqlCallSource');
      logger.warn(
        `retrying :: ${query.split('(')[0]}`,
        graphqlExceptionHandler(err),
      );
    })
    .waitAndRetry(4)
    .executeForPromise(async () => {
      const graphQLClient = new GraphQLClient(SOURCE_GRAPHQL_ENDPOINT, {
        headers: {
          authorization: `Bearer ${SOURCE_GRAPHQL_ALL_ACCESS_TOKEN}`,
        },
      });
      const response: object = await graphQLClient.request(query);
      return response;
    });
};
