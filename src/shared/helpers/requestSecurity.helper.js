export const getClientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress;

export const getUserAgent = (req) => req.get?.("user-agent") || req.headers["user-agent"] || "unknown";

export const getDeviceName = (userAgent = "unknown") => {
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return "Mobile Browser";
  if (/postman/i.test(userAgent)) return "Postman";
  if (/curl/i.test(userAgent)) return "CLI Client";
  return "Web Browser";
};

export const getRequestSecurityMeta = (req) => {
  const userAgent = getUserAgent(req);

  return {
    ip: getClientIp(req),
    userAgent,
    deviceName: req.headers["x-device-name"] || getDeviceName(userAgent),
  };
};
