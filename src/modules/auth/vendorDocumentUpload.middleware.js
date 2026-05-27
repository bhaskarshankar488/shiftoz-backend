import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import ApiError from "../../shared/utils/ApiError.js";

const uploadRoot = path.resolve("uploads", "vendor-documents");
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadRoot),
  filename: (req, file, callback) => {
    const vendorId = req.auth?.id?.toString() || "vendor";
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${vendorId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    callback(null, safeName);
  },
});

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(new ApiError(400, "Only PDF, JPG, PNG, and WEBP documents are allowed"));
  }

  return callback(null, true);
};

export const uploadVendorDocumentsMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
}).any();
