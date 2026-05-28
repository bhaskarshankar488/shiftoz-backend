import Vendor from "../../models/Vendor.model.js";

export const createVendor = (payload) => Vendor.create(payload);

export const findVendorById = (id, projection = "") => Vendor.findById(id).select(projection);

export const findVendorByEmail = (email, projection = "") =>
  Vendor.findOne({ email: email?.toLowerCase() }).select(projection);

export const findVendorByPhone = (phone, projection = "") => Vendor.findOne({ phone }).select(projection);

export const findVendorByEmailOrPhone = ({ email, phone }, projection = "") => {
  const conditions = [];

  if (email) conditions.push({ email: email.toLowerCase() });
  if (phone) conditions.push({ phone });

  if (conditions.length === 0) return null;

  return Vendor.findOne({ $or: conditions }).select(projection);
};

export const updateVendorById = (id, payload, options = { new: true }) =>
  Vendor.findByIdAndUpdate(id, payload, options);

export const setVendorRefreshTokenHash = (id, refreshTokenHash) =>
  updateVendorById(id, { refreshTokenHash });

export const clearVendorRefreshTokenHash = (id) =>
  updateVendorById(id, { $unset: { refreshTokenHash: 1 } });
