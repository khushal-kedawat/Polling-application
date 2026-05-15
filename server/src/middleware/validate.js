import { HttpError } from '../utils/httpError.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(
      new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.flatten()),
    );
  }
  req[source] = result.data;
  next();
};
