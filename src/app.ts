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

const app: Application = express();
app.set("query parser", (str: string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

app.use(
  cors({
    origin: [
      envVariables.FRONTEND_URL,
      envVariables.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", toNodeHandler(auth));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachRequestUser);

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
