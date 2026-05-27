import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import errorMiddleware from "./middlewares/error.middleware.js";

import routes from "./routes/index.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/v1", routes);

/*
|--------------------------------------------------------------------------
| Global Error Middleware
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

export default app;