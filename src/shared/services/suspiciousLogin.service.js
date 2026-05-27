import env from "../../config/env.js";
import { AUDIT_EVENTS } from "../constants/auth.constants.js";
import { getRecentAuditLogs, writeAuditLog } from "./auditLog.service.js";

export const detectSuspiciousLogin = async ({
  accountId,
  accountType,
  role,
  ip,
  userAgent,
  deviceName,
  sessionId,
}) => {
  const recentLogs = await getRecentAuditLogs({
    accountId,
    accountType,
    days: env.security.suspiciousLoginLookbackDays,
    limit: 50,
  });

  const hasKnownIp = recentLogs.some((log) => log.ip === ip);
  const hasKnownDevice = recentLogs.some((log) => log.userAgent === userAgent);
  const isSuspicious = recentLogs.length > 0 && (!hasKnownIp || !hasKnownDevice);

  if (isSuspicious) {
    await writeAuditLog({
      accountId,
      accountType,
      role,
      event: AUDIT_EVENTS.SUSPICIOUS_LOGIN,
      status: "warning",
      sessionId,
      ip,
      userAgent,
      deviceName,
      metadata: {
        reason: !hasKnownIp ? "new_ip" : "new_device",
      },
    });
  }

  return {
    isSuspicious,
    reason: isSuspicious ? (!hasKnownIp ? "new_ip" : "new_device") : null,
  };
};
