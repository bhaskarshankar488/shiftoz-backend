import AuthAuditLog from "../../models/AuthAuditLog.model.js";

export const writeAuditLog = async ({
  accountId,
  accountType,
  role,
  event,
  status,
  sessionId,
  ip,
  userAgent,
  deviceName,
  metadata = {},
}) => {
  if (!accountId || !accountType || !event || !status) return null;

  return AuthAuditLog.create({
    accountId,
    accountType,
    role,
    event,
    status,
    sessionId,
    ip,
    userAgent,
    deviceName,
    metadata,
  });
};

export const getRecentAuditLogs = ({ accountId, accountType, days = 30, limit = 20 }) =>
  AuthAuditLog.find({
    accountId,
    accountType,
    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  })
    .sort({ createdAt: -1 })
    .limit(limit);
