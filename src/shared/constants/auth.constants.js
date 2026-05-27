export const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  VENDOR: "vendor",
  ADMIN: "admin",
  SUPPORT: "support",
});

export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));

export const TOKEN_TYPES = Object.freeze({
  ACCESS: "access",
  REFRESH: "refresh",
});
