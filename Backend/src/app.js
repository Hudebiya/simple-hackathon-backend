import "dotenv/config";
import express  from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";

import cookieParser from "cookie-parser";
const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const configuredClientUrls = process.env.CLIENT_URL
  ?.split(",")
  .map(origin => origin.trim())
  .filter(Boolean) ?? [];
const clientUrls = configuredClientUrls.length
  ? configuredClientUrls
  : process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173"]
    : [];
if (!clientUrls.length) {
  throw new Error("CLIENT_URL must be configured in production.");
}
app.use(cors({ origin: clientUrls, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" })
})

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  const candidateStatus = error.statusCode ?? error.status
  const status = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus < 600
    ? candidateStatus
    : 500
  const message = status >= 500 ? "Internal server error" : error.message || "Request failed"

  if (status >= 500) {
    console.error(error)
  }

  return res.status(status).json({ message })
})

export default app;