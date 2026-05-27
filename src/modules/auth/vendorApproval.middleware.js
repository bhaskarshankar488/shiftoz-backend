import { VENDOR_STATUSES } from "../../shared/constants/auth.constants.js";
import ApiError from "../../shared/utils/ApiError.js";

export const requireApprovedVendor = (req, _res, next) => {
  const status = req.user?.vendorStatus || req.auth?.tokenPayload?.vendorStatus;

  if (status !== VENDOR_STATUSES.APPROVED) {
    return next(new ApiError(403, "Vendor approval is required for this action"));
  }

  return next();
};

export const restrictTemporaryVendor = (req, _res, next) => {
  const status = req.user?.vendorStatus || req.auth?.tokenPayload?.vendorStatus;

  if ([VENDOR_STATUSES.TEMPORARY, VENDOR_STATUSES.DOCUMENT_PENDING, VENDOR_STATUSES.UNDER_REVIEW].includes(status)) {
    return next(new ApiError(403, "Vendor account is under review and has limited access"));
  }

  return next();
};
