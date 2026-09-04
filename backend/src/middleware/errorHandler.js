import { ZodError } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) return next(result.error);
    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;
    next();
  };
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: error.issues });
  }
  if (error.code === '23505') return res.status(409).json({ success: false, message: 'A record with the same unique value already exists.' });
  if (error.code === '23503') return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'Uploaded file is too large.' });
  res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error.' });
}
