import { getRequestSecurityMeta } from "../helpers/requestSecurity.helper.js";

export const attachSecurityContext = (req, _res, next) => {
  req.security = getRequestSecurityMeta(req);
  next();
};
