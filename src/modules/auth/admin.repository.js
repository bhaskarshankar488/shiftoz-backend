import User from "../../models/User.model.js";
import { USER_ROLES } from "../../shared/constants/auth.constants.js";

export const ADMIN_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT];

export const findAdminByEmail = (email, projection = "") =>
  User.findOne({
    email: email?.toLowerCase(),
    role: { $in: ADMIN_ROLES },
  }).select(projection);

export const findAdminById = (id, projection = "") =>
  User.findOne({ _id: id, role: { $in: ADMIN_ROLES } }).select(projection);

export const createAdminUser = (payload) => User.create(payload);

export const updateAdminById = (id, payload, options = { new: true }) =>
  User.findByIdAndUpdate(id, payload, options);

export const incrementAdminLoginAttempts = (id, lockUntil = null) =>
  User.findByIdAndUpdate(
    id,
    {
      $inc: { loginAttempts: 1 },
      ...(lockUntil ? { lockUntil } : {}),
    },
    { new: true },
  );

export const resetAdminLoginSecurity = (id) =>
  User.findByIdAndUpdate(
    id,
    {
      loginAttempts: 0,
      $unset: { lockUntil: 1 },
    },
    { new: true },
  );
