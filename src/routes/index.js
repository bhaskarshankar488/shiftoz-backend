import express from "express";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Health Route
|--------------------------------------------------------------------------
*/

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShiftOz API v1 Running",
  });
});

export default router;