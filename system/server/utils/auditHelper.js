const db = require('../config/db');

/**
 * Helper to manually insert audit logs when triggers are not enough
 * or for actions that don't map 1:1 to a table change (e.g. login).
 */
exports.logAction = (userId, role, action, tableName, recordId, changes, req) => {
  const userAgent = req ? req.headers['user-agent'] : null;

  const query = `
    INSERT INTO audit_logs (user_id, actor_role, action, table_name, record_id, changes, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const changesJson = changes ? JSON.stringify(changes) : null;

  // Use the global pool for this, as it's a fire-and-forget log usually
  db.query(query, [userId, role, action, tableName, recordId, changesJson, userAgent], (err) => {
    if (err) {
      console.error('Error writing audit log:', err);
    }
  });
};

exports.logLogin = (userId, success, failureReason, req) => {
  const userAgent = req ? req.headers['user-agent'] : null;

  const query = `
    INSERT INTO login_history (user_id, user_agent, success, failure_reason)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [userId, userAgent, success, failureReason], (err) => {
    if (err) {
      console.error('Error writing login history:', err);
    }
  });
};
