import { HttpStatus } from '@nestjs/common';

class ResultError extends Error {
  errors: Array<object>;

  constructor(message: string, errors: Array<object>) {
    super(message);

    // assign given errors to class variable.
    this.errors = errors;

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ResultError;

/**
 * It takes an error object and returns a response object with the error message, error code, and
 * errors array
 * @param {Error | ResultError | any} error - Error | ResultError | any
 * @param {HttpStatus} [status] - The HTTP status code to return.
 * @returns A function that takes in an error and a status and returns an object with a message,
 * status, and errors.
 */
export const graphqlExceptionHandler = (
  error: Error | ResultError | any,
  status?: HttpStatus,
): any => {
  // Used to handle all the expected errors.
  if (error instanceof ResultError) {
    return error.message;
  }

  // Used to handle all the unexpected errors.
  const response = error?.response;
  const message = error.message;
  let error_code: number = error.type ? 500 : response?.status;
  if (status) {
    error_code = status;
  } else if (error_code === 200) {
    error_code = 400;
  }

  return {
    status: error_code == 200 ? 405 : error_code,
    graphql_error: message || 'something went wrong',
  };
};

/**
 * It takes a GraphQL response object, checks if it contains an expected error,
 * and if it does, it throws a ResultError exception.
 */
export const graphqlInternalErrorHandler = async (
  response: object,
): Promise<any> => {
  const error = response[Object.keys(response)[0]] || {};

  if (error.errors?.length > 0) {
    throw new ResultError(error?.errors[0]?.message, error?.errors);
  }
  return response;
};
