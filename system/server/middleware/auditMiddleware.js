const db = require('../config/db');

/**
 * Middleware to attach a dedicated database connection to the request.
 * This allows setting session variables (like @app_user_id) for triggers to use.
 */
const auditMiddleware = (req, res, next) => {
  // Only attach for authenticated routes that might modify data
  // or if we want to be safe, for all routes.
  // For performance, we might want to limit this, but for correctness, let's do it for all.
  
  // However, getting a connection for EVERY request might be heavy if not needed.
  // Let's only do it if the user is authenticated (req.userId exists).
  // Note: This middleware must run AFTER authMiddleware.
  
  if (!req.userId) {
    // If not logged in, just use the global pool (req.db will be undefined, controllers should fallback or use db)
    // Or we can just assign the pool to req.db, but triggers won't have user info.
    req.db = db; 
    return next();
  }

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting db connection:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Attach connection to request
    req.db = connection;

    // Set session variables for audit triggers
    const query = 'SET @app_user_id = ?, @app_user_role = ?';
    connection.query(query, [req.userId, req.userRole || 'User'], (err) => {
      if (err) {
        connection.release();
        console.error('Error setting audit session vars:', err);
        return res.status(500).json({ message: 'Audit setup error' });
      }

      // Ensure connection is released when response is finished
      res.on('finish', () => {
        if (req.db) {
            // We can't easily check if it's already released, but mysql2 handles double release gracefully usually,
            // or we can set a flag.
            try {
                req.db.release();
            } catch (e) {
                // ignore
            }
        }
      });

      next();
    });
  });
};

module.exports = auditMiddleware;
