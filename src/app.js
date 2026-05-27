const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

const routes = require("./routes");

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
| Health Check Route
|--------------------------------------------------------------------------
*/
app.use("/api/v1", routes);

/*
|--------------------------------------------------------------------------
| Global Error Middleware
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

module.exports = app;