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
  console.error(`[API ERROR] ${req.method} ${req.originalUrl}`, error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Please check the submitted information.',
      errors: error.issues,
    });
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Check DATABASE_URL and make sure PostgreSQL/Supabase is reachable.',
    });
  }

  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with the same unique value already exists.',
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  if (error.code === '42P01') {
    return res.status(500).json({
      success: false,
      message: 'A required database table is missing. Run the PrintStation database migrations in Supabase.',
    });
  }

  if (error.code === '22P02') {
    return res.status(400).json({ success: false, message: 'Invalid data format.' });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Uploaded file is too large.' });
  }

  const status = Number(error.statusCode || error.status || 500);
  return res.status(status >= 400 && status < 600 ? status : 500).json({
    success: false,
    message: error.message || 'Internal server error.',
  });
}
