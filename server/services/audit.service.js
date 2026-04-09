const AuditLog = require('../models/AuditLog.model');

const logCoordinatorAction = async ({ req, action, entityType, entityId, summary = '', details = {} }) => {
  if (!req?.user?.id || req.user.role !== 'coordinator') return;

  try {
    await AuditLog.create({
      actor: req.user.id,
      actorRole: req.user.role,
      action,
      entityType,
      entityId: entityId || null,
      summary,
      details,
      college: req.user.college || '',
    });
  } catch {
    // Non-blocking: audit failures should not break user actions
  }
};

module.exports = { logCoordinatorAction };
