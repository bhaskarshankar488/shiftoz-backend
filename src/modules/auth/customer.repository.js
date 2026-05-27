import User from "../../models/User.model.js";
import { USER_ROLES } from "../../shared/constants/auth.constants.js";

export const findCustomerByPhone = (phone, projection = "") =>
  User.findOne({ phone, role: USER_ROLES.CUSTOMER }).select(projection);

export const findCustomerById = (id, projection = "") =>
  User.findOne({ _id: id, role: USER_ROLES.CUSTOMER }).select(projection);

export const createCustomer = (payload) =>
  User.create({
    ...payload,
    role: USER_ROLES.CUSTOMER,
  });

export const updateCustomerById = (id, payload, options = { new: true }) =>
  User.findByIdAndUpdate(id, payload, options);
