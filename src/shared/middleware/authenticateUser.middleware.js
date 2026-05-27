import User from "../../models/User.model.js";
import Vendor from "../../models/Vendor.model.js";
import { USER_ROLES } from "../constants/auth.constants.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import env from "../../config/env.js";

const getAccessTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return req.cookies?.[env.cookies.accessTokenName] || null;
};

const getAccountModel = (role) => {
  if (role === USER_ROLES.VENDOR) return Vendor;
  return User;
};

const getAccountRole = (account, tokenRole) => tokenRole || account.role || USER_ROLES.VENDOR;

export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const decoded = verifyAccessToken(token);
  const accountId = decoded.id || decoded._id || decoded.userId || decoded.sub;

  if (!accountId) {
    throw new ApiError(401, "Invalid authentication token payload");
  }

  const AccountModel = getAccountModel(decoded.role);
  const account = await AccountModel.findById(accountId).select("-passwordHash");

  if (!account) {
    throw new ApiError(401, "Authenticated account no longer exists");
  }

  if (account.isBlocked || account.isActive === false) {
    throw new ApiError(403, "Account is not allowed to access this resource");
  }

  req.user = account;
  req.auth = {
    id: account._id,
    role: getAccountRole(account, decoded.role),
    tokenPayload: decoded,
  };

  next();
});

export default authenticateUser;
