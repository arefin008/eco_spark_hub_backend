import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import path from "path";
import qs from "qs";
import { auth } from "./app/lib/auth";
import { envVariables } from "./app/config/env";
import { attachRequestUser } from "./app/middleware/attachRequestUser";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { IndexRoutes } from "./app/routes";

const toOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, "");
  }
};

const allowedCorsOrigins = new Set([
  toOrigin(envVariables.FRONTEND_URL),
  toOrigin(envVariables.BETTER_AUTH_URL),
  "http://localhost:3000",
  "http://localhost:5000",
]);

const getTrustedFrontendRedirect = (value?: string) => {
  if (!value) {
    return envVariables.FRONTEND_URL;
  }

  try {
    const requestedUrl = new URL(value);
    const frontendUrl = new URL(envVariables.FRONTEND_URL);

    if (requestedUrl.origin !== frontendUrl.origin) {
      return envVariables.FRONTEND_URL;
    }

    return requestedUrl.toString();
  } catch {
    return envVariables.FRONTEND_URL;
  }
};

const getBrokenGoogleRedirectTarget = (req: Request) => {
  const directCandidates = [
    req.query.redirectTo,
    req.query.callbackUrl,
    req.query.callbackURL,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return getTrustedFrontendRedirect(candidate);
    }
  }

  const decodedUrl = decodeURIComponent(req.originalUrl);
  const match = decodedUrl.match(
    /(?:redirectTo|callbackUrl|callbackURL|ctTo)=([^&]+)/i,
  );

  return getTrustedFrontendRedirect(match?.[1]);
};

const app: Application = express();
app.set("query parser", (str: string) => qs.parse(str));
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request).rawBody = buf;
    },
  }),
);
app.use(cookieParser());
app.use(attachRequestUser);
app.get("/api/auth/sign-in/social", (req, res, next) => {
  const provider =
    typeof req.query.provider === "string" ? req.query.provider : "";

  if (!provider.toLowerCase().startsWith("goog")) {
    return next();
  }

  const redirectUrl = new URL(
    `${envVariables.FRONTEND_URL.replace(/\/$/, "")}/api/v1/auth/google`,
  );

  redirectUrl.searchParams.set(
    "callbackUrl",
    getBrokenGoogleRedirectTarget(req),
  );

  return res.redirect(307, redirectUrl.toString());
});
app.use("/api/auth/sign-up/email", (req, res, next) => {
  if (req.body?.role && req.body.role !== "MEMBER") {
    return res.status(403).json({
      success: false,
      message: "Admin accounts can only be created via seeding",
    });
  }

  req.body.role = "MEMBER";
  req.body.status = "ACTIVE";

  return next();
});
app.use("/api/auth", toNodeHandler(auth));

app.use("/api/v1", IndexRoutes);

app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "EcoSpark Hub backend is running",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
