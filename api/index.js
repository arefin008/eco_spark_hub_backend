var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path3 from "path";
import qs from "qs";

// src/app/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";

// src/generated/prisma/enums.ts
var UserRole = {
  MEMBER: "MEMBER",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  DEACTIVATED: "DEACTIVATED"
};
var IdeaStatus = {
  DRAFT: "DRAFT",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};
var VoteType = {
  UPVOTE: "UPVOTE",
  DOWNVOTE: "DOWNVOTE"
};
var PurchaseStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
};

// src/app/config/env.ts
import dotenv from "dotenv";
import status from "http-status";

// src/app/errorHelpers/AppError.ts
var AppError = class extends Error {
  statusCode;
  constructor(statusCode, message, stack = "") {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var AppError_default = AppError;

// src/app/config/env.ts
dotenv.config();
var loadEnvVariables = () => {
  const requireEnvVariable = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL"
  ];
  requireEnvVariable.forEach((variable) => {
    if (!process.env[variable]) {
      throw new AppError_default(
        status.INTERNAL_SERVER_ERROR,
        `Environment variable ${variable} is required but not set in .env file.`
      );
    }
  });
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "dev-access-token-secret",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "dev-refresh-token-secret",
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h",
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN || "1d",
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE || "1h",
    EMAIL_SENDER: {
      SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER || "",
      SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS || "",
      SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST || "",
      SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT || "",
      SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM || ""
    },
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ""
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || ""
    },
    GEMINI: {
      API_KEY: process.env.GEMINI_API_KEY || "",
      MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
    },
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "",
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || ""
  };
};
var envVariables = loadEnvVariables();

// src/app/utils/authCookie.ts
var shouldUseSecureCookies = envVariables.BETTER_AUTH_URL.startsWith("https://") || envVariables.NODE_ENV === "production";
var sameSite = envVariables.NODE_ENV === "production" ? "none" : "lax";
var authCookieSettings = {
  shouldUseSecureCookies,
  sameSite
};

// src/app/utils/email.ts
import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "path";
var transporter = nodemailer.createTransport({
  host: envVariables.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVariables.EMAIL_SENDER.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS
  }
});
var sendEmail = async ({
  to,
  subject,
  html,
  templateName,
  templateData
}) => {
  if (!envVariables.EMAIL_SENDER.SMTP_USER || !envVariables.EMAIL_SENDER.SMTP_PASS) {
    console.warn("Email sender is not configured. Skipping email send.");
    return;
  }
  let renderedHtml = html || "";
  if (!renderedHtml && templateName) {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`
    );
    renderedHtml = await ejs.renderFile(templatePath, templateData || {});
  }
  if (!renderedHtml && subject) {
    renderedHtml = `<p>${subject}</p>`;
  }
  await transporter.sendMail({
    from: envVariables.EMAIL_SENDER.SMTP_FROM || envVariables.EMAIL_SENDER.SMTP_USER,
    to,
    subject,
    html: renderedHtml
  });
};

// src/app/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/prisma/client.ts
import * as path2 from "path";
import { fileURLToPath } from "url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.5.0",
  "engineVersion": "280c870be64f457428992c43c1f6d557fab6e29e",
  "activeProvider": "postgresql",
  "inlineSchema": 'model Category {\n  id          String   @id @default(cuid())\n  name        String   @unique\n  description String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n  ideas       Idea[]\n}\n\nenum UserRole {\n  MEMBER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  DEACTIVATED\n}\n\nenum IdeaStatus {\n  DRAFT\n  UNDER_REVIEW\n  APPROVED\n  REJECTED\n}\n\nenum VoteType {\n  UPVOTE\n  DOWNVOTE\n}\n\nenum PurchaseStatus {\n  PENDING\n  PAID\n  FAILED\n  REFUNDED\n}\n\nmodel Idea {\n  id               String         @id @default(cuid())\n  title            String\n  problemStatement String\n  proposedSolution String\n  description      String\n  isPaid           Boolean        @default(false)\n  price            Decimal?       @db.Decimal(10, 2)\n  status           IdeaStatus     @default(DRAFT)\n  rejectionReason  String?\n  isHighlighted    Boolean        @default(false)\n  submittedAt      DateTime?\n  approvedAt       DateTime?\n  createdAt        DateTime       @default(now())\n  updatedAt        DateTime       @updatedAt\n  authorId         String\n  categoryId       String\n  author           User           @relation(fields: [authorId], references: [id], onDelete: Cascade)\n  category         Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)\n  media            IdeaMedia[]\n  votes            IdeaVote[]\n  comments         IdeaComment[]\n  purchases        IdeaPurchase[]\n\n  @@index([authorId])\n  @@index([categoryId])\n  @@index([status])\n  @@index([isPaid])\n  @@index([isHighlighted])\n  @@index([createdAt])\n}\n\nmodel IdeaMedia {\n  id        String   @id @default(cuid())\n  ideaId    String\n  url       String\n  altText   String?\n  createdAt DateTime @default(now())\n  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n\n  @@index([ideaId])\n}\n\nmodel IdeaVote {\n  id        String   @id @default(cuid())\n  type      VoteType\n  ideaId    String\n  userId    String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([ideaId, userId])\n  @@index([ideaId])\n  @@index([userId])\n}\n\nmodel IdeaComment {\n  id        String        @id @default(cuid())\n  content   String\n  isDeleted Boolean       @default(false)\n  ideaId    String\n  userId    String\n  parentId  String?\n  createdAt DateTime      @default(now())\n  updatedAt DateTime      @updatedAt\n  idea      Idea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)\n  parent    IdeaComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)\n  replies   IdeaComment[] @relation("CommentReplies")\n\n  @@index([ideaId])\n  @@index([userId])\n  @@index([parentId])\n  @@index([createdAt])\n}\n\nmodel IdeaPurchase {\n  id              String         @id @default(cuid())\n  ideaId          String\n  userId          String\n  amount          Decimal        @db.Decimal(10, 2)\n  currency        String         @default("BDT")\n  status          PurchaseStatus @default(PENDING)\n  paymentProvider String\n  transactionId   String?        @unique\n  purchasedAt     DateTime?\n  createdAt       DateTime       @default(now())\n  updatedAt       DateTime       @updatedAt\n  idea            Idea           @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([ideaId, userId])\n  @@index([ideaId])\n  @@index([userId])\n  @@index([status])\n}\n\nmodel NewsletterSubscriber {\n  id           String   @id @default(cuid())\n  email        String   @unique\n  subscribed   Boolean  @default(true)\n  subscribedAt DateTime @default(now())\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id            String         @id @default(cuid())\n  name          String\n  email         String         @unique\n  emailVerified Boolean        @default(false)\n  image         String?\n  role          UserRole       @default(MEMBER)\n  status        UserStatus     @default(ACTIVE)\n  createdAt     DateTime       @default(now())\n  updatedAt     DateTime       @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n  ideas         Idea[]\n  votes         IdeaVote[]\n  comments      IdeaComment[]\n  purchases     IdeaPurchase[]\n\n  @@index([role])\n  @@index([status])\n}\n\nmodel Session {\n  id        String   @id @default(cuid())\n  expiresAt DateTime\n  token     String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([expiresAt])\n}\n\nmodel Account {\n  id                    String    @id @default(cuid())\n  accountId             String\n  providerId            String\n  userId                String\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([providerId, accountId])\n  @@index([userId])\n}\n\nmodel Verification {\n  id         String   @id @default(cuid())\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@index([expiresAt])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ideas","kind":"object","type":"Idea","relationName":"CategoryToIdea"}],"dbName":null},"Idea":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"problemStatement","kind":"scalar","type":"String"},{"name":"proposedSolution","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"isPaid","kind":"scalar","type":"Boolean"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"IdeaStatus"},{"name":"rejectionReason","kind":"scalar","type":"String"},{"name":"isHighlighted","kind":"scalar","type":"Boolean"},{"name":"submittedAt","kind":"scalar","type":"DateTime"},{"name":"approvedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"author","kind":"object","type":"User","relationName":"IdeaToUser"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToIdea"},{"name":"media","kind":"object","type":"IdeaMedia","relationName":"IdeaToIdeaMedia"},{"name":"votes","kind":"object","type":"IdeaVote","relationName":"IdeaToIdeaVote"},{"name":"comments","kind":"object","type":"IdeaComment","relationName":"IdeaToIdeaComment"},{"name":"purchases","kind":"object","type":"IdeaPurchase","relationName":"IdeaToIdeaPurchase"}],"dbName":null},"IdeaMedia":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"altText","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToIdeaMedia"}],"dbName":null},"IdeaVote":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"VoteType"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToIdeaVote"},{"name":"user","kind":"object","type":"User","relationName":"IdeaVoteToUser"}],"dbName":null},"IdeaComment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToIdeaComment"},{"name":"user","kind":"object","type":"User","relationName":"IdeaCommentToUser"},{"name":"parent","kind":"object","type":"IdeaComment","relationName":"CommentReplies"},{"name":"replies","kind":"object","type":"IdeaComment","relationName":"CommentReplies"}],"dbName":null},"IdeaPurchase":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PurchaseStatus"},{"name":"paymentProvider","kind":"scalar","type":"String"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"purchasedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToIdeaPurchase"},{"name":"user","kind":"object","type":"User","relationName":"IdeaPurchaseToUser"}],"dbName":null},"NewsletterSubscriber":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"subscribed","kind":"scalar","type":"Boolean"},{"name":"subscribedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"ideas","kind":"object","type":"Idea","relationName":"IdeaToUser"},{"name":"votes","kind":"object","type":"IdeaVote","relationName":"IdeaVoteToUser"},{"name":"comments","kind":"object","type":"IdeaComment","relationName":"IdeaCommentToUser"},{"name":"purchases","kind":"object","type":"IdeaPurchase","relationName":"IdeaPurchaseToUser"}],"dbName":null},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":null},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"}],"dbName":null},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","ideas","idea","votes","parent","replies","_count","comments","purchases","author","category","media","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","data","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","create","update","Category.upsertOne","Category.deleteOne","Category.deleteMany","having","_min","_max","Category.groupBy","Category.aggregate","Idea.findUnique","Idea.findUniqueOrThrow","Idea.findFirst","Idea.findFirstOrThrow","Idea.findMany","Idea.createOne","Idea.createMany","Idea.createManyAndReturn","Idea.updateOne","Idea.updateMany","Idea.updateManyAndReturn","Idea.upsertOne","Idea.deleteOne","Idea.deleteMany","_avg","_sum","Idea.groupBy","Idea.aggregate","IdeaMedia.findUnique","IdeaMedia.findUniqueOrThrow","IdeaMedia.findFirst","IdeaMedia.findFirstOrThrow","IdeaMedia.findMany","IdeaMedia.createOne","IdeaMedia.createMany","IdeaMedia.createManyAndReturn","IdeaMedia.updateOne","IdeaMedia.updateMany","IdeaMedia.updateManyAndReturn","IdeaMedia.upsertOne","IdeaMedia.deleteOne","IdeaMedia.deleteMany","IdeaMedia.groupBy","IdeaMedia.aggregate","IdeaVote.findUnique","IdeaVote.findUniqueOrThrow","IdeaVote.findFirst","IdeaVote.findFirstOrThrow","IdeaVote.findMany","IdeaVote.createOne","IdeaVote.createMany","IdeaVote.createManyAndReturn","IdeaVote.updateOne","IdeaVote.updateMany","IdeaVote.updateManyAndReturn","IdeaVote.upsertOne","IdeaVote.deleteOne","IdeaVote.deleteMany","IdeaVote.groupBy","IdeaVote.aggregate","IdeaComment.findUnique","IdeaComment.findUniqueOrThrow","IdeaComment.findFirst","IdeaComment.findFirstOrThrow","IdeaComment.findMany","IdeaComment.createOne","IdeaComment.createMany","IdeaComment.createManyAndReturn","IdeaComment.updateOne","IdeaComment.updateMany","IdeaComment.updateManyAndReturn","IdeaComment.upsertOne","IdeaComment.deleteOne","IdeaComment.deleteMany","IdeaComment.groupBy","IdeaComment.aggregate","IdeaPurchase.findUnique","IdeaPurchase.findUniqueOrThrow","IdeaPurchase.findFirst","IdeaPurchase.findFirstOrThrow","IdeaPurchase.findMany","IdeaPurchase.createOne","IdeaPurchase.createMany","IdeaPurchase.createManyAndReturn","IdeaPurchase.updateOne","IdeaPurchase.updateMany","IdeaPurchase.updateManyAndReturn","IdeaPurchase.upsertOne","IdeaPurchase.deleteOne","IdeaPurchase.deleteMany","IdeaPurchase.groupBy","IdeaPurchase.aggregate","NewsletterSubscriber.findUnique","NewsletterSubscriber.findUniqueOrThrow","NewsletterSubscriber.findFirst","NewsletterSubscriber.findFirstOrThrow","NewsletterSubscriber.findMany","NewsletterSubscriber.createOne","NewsletterSubscriber.createMany","NewsletterSubscriber.createManyAndReturn","NewsletterSubscriber.updateOne","NewsletterSubscriber.updateMany","NewsletterSubscriber.updateManyAndReturn","NewsletterSubscriber.upsertOne","NewsletterSubscriber.deleteOne","NewsletterSubscriber.deleteMany","NewsletterSubscriber.groupBy","NewsletterSubscriber.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","AND","OR","NOT","id","identifier","value","expiresAt","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","accountId","providerId","userId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","name","email","emailVerified","image","UserRole","role","UserStatus","status","every","some","none","subscribed","subscribedAt","ideaId","amount","currency","PurchaseStatus","paymentProvider","transactionId","purchasedAt","content","isDeleted","parentId","VoteType","type","url","altText","title","problemStatement","proposedSolution","description","isPaid","price","IdeaStatus","rejectionReason","isHighlighted","submittedAt","approvedAt","authorId","categoryId","ideaId_userId","providerId_accountId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "ugVhsAEJBgAA1AIAIMkBAADvAgAwygEAADIAEMsBAADvAgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHqAQEAAAABiAIBAM8CACEBAAAAAQAgGQgAANUCACAMAADWAgAgDQAA1wIAIA4AAPcCACAPAACDAwAgEAAAhAMAIMkBAACAAwAwygEAAAMAEMsBAACAAwAwzAEBALgCACHQAUAAuQIAIdEBQAC5AgAh8QEAAIIDjAIihQIBALgCACGGAgEAuAIAIYcCAQC4AgAhiAIBALgCACGJAiAAzgIAIYoCEACBAwAhjAIBAM8CACGNAiAAzgIAIY4CQAD2AgAhjwJAAPYCACGQAgEAuAIAIZECAQC4AgAhCggAAMMEACAMAADEBAAgDQAAxQQAIA4AAO8EACAPAADxBAAgEAAA8gQAIIoCAACKAwAgjAIAAIoDACCOAgAAigMAII8CAACKAwAgGQgAANUCACAMAADWAgAgDQAA1wIAIA4AAPcCACAPAACDAwAgEAAAhAMAIMkBAACAAwAwygEAAAMAEMsBAACAAwAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHxAQAAggOMAiKFAgEAuAIAIYYCAQC4AgAhhwIBALgCACGIAgEAuAIAIYkCIADOAgAhigIQAIEDACGMAgEAzwIAIY0CIADOAgAhjgJAAPYCACGPAkAA9gIAIZACAQC4AgAhkQIBALgCACEDAAAAAwAgAQAABAAwAgAABQAgDAMAAPcCACDJAQAA_wIAMMoBAAAHABDLAQAA_wIAMMwBAQC4AgAhzwFAALkCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACHnAQEAuAIAIegBAQDPAgAh6QEBAM8CACEDAwAA7wQAIOgBAACKAwAg6QEAAIoDACAMAwAA9wIAIMkBAAD_AgAwygEAAAcAEMsBAAD_AgAwzAEBAAAAAc8BQAC5AgAh0AFAALkCACHRAUAAuQIAId8BAQC4AgAh5wEBAAAAAegBAQDPAgAh6QEBAM8CACEDAAAABwAgAQAACAAwAgAACQAgEQMAAPcCACDJAQAA_gIAMMoBAAALABDLAQAA_gIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId0BAQC4AgAh3gEBALgCACHfAQEAuAIAIeABAQDPAgAh4QEBAM8CACHiAQEAzwIAIeMBQAD2AgAh5AFAAPYCACHlAQEAzwIAIeYBAQDPAgAhCAMAAO8EACDgAQAAigMAIOEBAACKAwAg4gEAAIoDACDjAQAAigMAIOQBAACKAwAg5QEAAIoDACDmAQAAigMAIBIDAAD3AgAgyQEAAP4CADDKAQAACwAQywEAAP4CADDMAQEAAAAB0AFAALkCACHRAUAAuQIAId0BAQC4AgAh3gEBALgCACHfAQEAuAIAIeABAQDPAgAh4QEBAM8CACHiAQEAzwIAIeMBQAD2AgAh5AFAAPYCACHlAQEAzwIAIeYBAQDPAgAhkwIAAP0CACADAAAACwAgAQAADAAwAgAADQAgAwAAAAMAIAEAAAQAMAIAAAUAIAsDAAD3AgAgBwAA8QIAIMkBAAD7AgAwygEAABAAEMsBAAD7AgAwzAEBALgCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACH3AQEAuAIAIYICAAD8AoICIgIDAADvBAAgBwAA7gQAIAwDAAD3AgAgBwAA8QIAIMkBAAD7AgAwygEAABAAEMsBAAD7AgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfcBAQC4AgAhggIAAPwCggIikgIAAPoCACADAAAAEAAgAQAAEQAwAgAAEgAgDwMAAPcCACAHAADxAgAgCQAA-QIAIAoAANYCACDJAQAA-AIAMMoBAAAUABDLAQAA-AIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId8BAQC4AgAh9wEBALgCACH-AQEAuAIAIf8BIADOAgAhgAIBAM8CACEFAwAA7wQAIAcAAO4EACAJAADwBAAgCgAAxAQAIIACAACKAwAgDwMAAPcCACAHAADxAgAgCQAA-QIAIAoAANYCACDJAQAA-AIAMMoBAAAUABDLAQAA-AIAMMwBAQAAAAHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACH3AQEAuAIAIf4BAQC4AgAh_wEgAM4CACGAAgEAzwIAIQMAAAAUACABAAAVADACAAAWACABAAAAFAAgAwAAABQAIAEAABUAMAIAABYAIAEAAAAUACAQAwAA9wIAIAcAAPECACDJAQAA8wIAMMoBAAAbABDLAQAA8wIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId8BAQC4AgAh8QEAAPUC-wEi9wEBALgCACH4ARAA9AIAIfkBAQC4AgAh-wEBALgCACH8AQEAzwIAIf0BQAD2AgAhBAMAAO8EACAHAADuBAAg_AEAAIoDACD9AQAAigMAIBEDAAD3AgAgBwAA8QIAIMkBAADzAgAwygEAABsAEMsBAADzAgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfEBAAD1AvsBIvcBAQC4AgAh-AEQAPQCACH5AQEAuAIAIfsBAQC4AgAh_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AAAAggICARYAAHsAMAEWAAB7ADAIAwAAjQQAIAcAANwDACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHfAQEAiAMAIfcBAQCIAwAhggIAANoDggIiAgAAABIAIBYAAH4AIAbMAQEAiAMAIdABQACJAwAh0QFAAIkDACHfAQEAiAMAIfcBAQCIAwAhggIAANoDggIiAgAAABAAIBYAAIABACACAAAAEAAgFgAAgAEAIAMAAAASACAdAAB5ACAeAAB-ACABAAAAEgAgAQAAABAAIAMLAADRBAAgIwAA0wQAICQAANIEACAJyQEAAOICADDKAQAAhwEAEMsBAADiAgAwzAEBALACACHQAUAAsQIAIdEBQACxAgAh3wEBALACACH3AQEAsAIAIYICAADjAoICIgMAAAAQACABAACGAQAwIgAAhwEAIAMAAAAQACABAAARADACAAASACABAAAAFgAgAQAAABYAIAMAAAAUACABAAAVADACAAAWACADAAAAFAAgAQAAFQAwAgAAFgAgAwAAABQAIAEAABUAMAIAABYAIAwDAADMAwAgBwAAywMAIAkAAM8DACAKAADNAwAgzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAfcBAQAAAAH-AQEAAAAB_wEgAAAAAYACAQAAAAEBFgAAjwEAIAjMAQEAAAAB0AFAAAAAAdEBQAAAAAHfAQEAAAAB9wEBAAAAAf4BAQAAAAH_ASAAAAABgAIBAAAAAQEWAACRAQAwARYAAJEBADABAAAAFAAgDAMAAMkDACAHAAC-AwAgCQAAvwMAIAoAAMADACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHfAQEAiAMAIfcBAQCIAwAh_gEBAIgDACH_ASAAmgMAIYACAQCOAwAhAgAAABYAIBYAAJUBACAIzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh3wEBAIgDACH3AQEAiAMAIf4BAQCIAwAh_wEgAJoDACGAAgEAjgMAIQIAAAAUACAWAACXAQAgAgAAABQAIBYAAJcBACABAAAAFAAgAwAAABYAIB0AAI8BACAeAACVAQAgAQAAABYAIAEAAAAUACAECwAAzgQAICMAANAEACAkAADPBAAggAIAAIoDACALyQEAAOECADDKAQAAnwEAEMsBAADhAgAwzAEBALACACHQAUAAsQIAIdEBQACxAgAh3wEBALACACH3AQEAsAIAIf4BAQCwAgAh_wEgAMQCACGAAgEAuwIAIQMAAAAUACABAACeAQAwIgAAnwEAIAMAAAAUACABAAAVADACAAAWACABAAAAHQAgAQAAAB0AIAMAAAAbACABAAAcADACAAAdACADAAAAGwAgAQAAHAAwAgAAHQAgAwAAABsAIAEAABwAMAIAAB0AIA0DAAD7AwAgBwAAsgMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAHxAQAAAPsBAvcBAQAAAAH4ARAAAAAB-QEBAAAAAfsBAQAAAAH8AQEAAAAB_QFAAAAAAQEWAACnAQAgC8wBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAHxAQAAAPsBAvcBAQAAAAH4ARAAAAAB-QEBAAAAAfsBAQAAAAH8AQEAAAAB_QFAAAAAAQEWAACpAQAwARYAAKkBADANAwAA-QMAIAcAALADACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHfAQEAiAMAIfEBAACuA_sBIvcBAQCIAwAh-AEQAK0DACH5AQEAiAMAIfsBAQCIAwAh_AEBAI4DACH9AUAAjwMAIQIAAAAdACAWAACsAQAgC8wBAQCIAwAh0AFAAIkDACHRAUAAiQMAId8BAQCIAwAh8QEAAK4D-wEi9wEBAIgDACH4ARAArQMAIfkBAQCIAwAh-wEBAIgDACH8AQEAjgMAIf0BQACPAwAhAgAAABsAIBYAAK4BACACAAAAGwAgFgAArgEAIAMAAAAdACAdAACnAQAgHgAArAEAIAEAAAAdACABAAAAGwAgBwsAAMkEACAjAADMBAAgJAAAywQAIDUAAMoEACA2AADNBAAg_AEAAIoDACD9AQAAigMAIA7JAQAA2gIAMMoBAAC1AQAQywEAANoCADDMAQEAsAIAIdABQACxAgAh0QFAALECACHfAQEAsAIAIfEBAADcAvsBIvcBAQCwAgAh-AEQANsCACH5AQEAsAIAIfsBAQCwAgAh_AEBALsCACH9AUAAvAIAIQMAAAAbACABAAC0AQAwIgAAtQEAIAMAAAAbACABAAAcADACAAAdACAJyQEAANkCADDKAQAAuwEAEMsBAADZAgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHrAQEAAAAB9QEgAM4CACH2AUAAuQIAIQEAAAC4AQAgAQAAALgBACAJyQEAANkCADDKAQAAuwEAEMsBAADZAgAwzAEBALgCACHQAUAAuQIAIdEBQAC5AgAh6wEBALgCACH1ASAAzgIAIfYBQAC5AgAhAAMAAAC7AQAgAQAAvAEAMAIAALgBACADAAAAuwEAIAEAALwBADACAAC4AQAgAwAAALsBACABAAC8AQAwAgAAuAEAIAbMAQEAAAAB0AFAAAAAAdEBQAAAAAHrAQEAAAAB9QEgAAAAAfYBQAAAAAEBFgAAwAEAIAbMAQEAAAAB0AFAAAAAAdEBQAAAAAHrAQEAAAAB9QEgAAAAAfYBQAAAAAEBFgAAwgEAMAEWAADCAQAwBswBAQCIAwAh0AFAAIkDACHRAUAAiQMAIesBAQCIAwAh9QEgAJoDACH2AUAAiQMAIQIAAAC4AQAgFgAAxQEAIAbMAQEAiAMAIdABQACJAwAh0QFAAIkDACHrAQEAiAMAIfUBIACaAwAh9gFAAIkDACECAAAAuwEAIBYAAMcBACACAAAAuwEAIBYAAMcBACADAAAAuAEAIB0AAMABACAeAADFAQAgAQAAALgBACABAAAAuwEAIAMLAADGBAAgIwAAyAQAICQAAMcEACAJyQEAANgCADDKAQAAzgEAEMsBAADYAgAwzAEBALACACHQAUAAsQIAIdEBQACxAgAh6wEBALACACH1ASAAxAIAIfYBQACxAgAhAwAAALsBACABAADNAQAwIgAAzgEAIAMAAAC7AQAgAQAAvAEAMAIAALgBACASBAAA0gIAIAUAANMCACAGAADUAgAgCAAA1QIAIAwAANYCACANAADXAgAgyQEAAM0CADDKAQAA1AEAEMsBAADNAgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHqAQEAuAIAIesBAQAAAAHsASAAzgIAIe0BAQDPAgAh7wEAANAC7wEi8QEAANEC8QEiAQAAANEBACABAAAA0QEAIBIEAADSAgAgBQAA0wIAIAYAANQCACAIAADVAgAgDAAA1gIAIA0AANcCACDJAQAAzQIAMMoBAADUAQAQywEAAM0CADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHqAQEAuAIAIesBAQC4AgAh7AEgAM4CACHtAQEAzwIAIe8BAADQAu8BIvEBAADRAvEBIgcEAADABAAgBQAAwQQAIAYAAMIEACAIAADDBAAgDAAAxAQAIA0AAMUEACDtAQAAigMAIAMAAADUAQAgAQAA1QEAMAIAANEBACADAAAA1AEAIAEAANUBADACAADRAQAgAwAAANQBACABAADVAQAwAgAA0QEAIA8EAAC6BAAgBQAAuwQAIAYAALwEACAIAAC9BAAgDAAAvgQAIA0AAL8EACDMAQEAAAAB0AFAAAAAAdEBQAAAAAHqAQEAAAAB6wEBAAAAAewBIAAAAAHtAQEAAAAB7wEAAADvAQLxAQAAAPEBAgEWAADZAQAgCcwBAQAAAAHQAUAAAAAB0QFAAAAAAeoBAQAAAAHrAQEAAAAB7AEgAAAAAe0BAQAAAAHvAQAAAO8BAvEBAAAA8QECARYAANsBADABFgAA2wEAMA8EAACdAwAgBQAAngMAIAYAAJ8DACAIAACgAwAgDAAAoQMAIA0AAKIDACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHqAQEAiAMAIesBAQCIAwAh7AEgAJoDACHtAQEAjgMAIe8BAACbA-8BIvEBAACcA_EBIgIAAADRAQAgFgAA3gEAIAnMAQEAiAMAIdABQACJAwAh0QFAAIkDACHqAQEAiAMAIesBAQCIAwAh7AEgAJoDACHtAQEAjgMAIe8BAACbA-8BIvEBAACcA_EBIgIAAADUAQAgFgAA4AEAIAIAAADUAQAgFgAA4AEAIAMAAADRAQAgHQAA2QEAIB4AAN4BACABAAAA0QEAIAEAAADUAQAgBAsAAJcDACAjAACZAwAgJAAAmAMAIO0BAACKAwAgDMkBAADDAgAwygEAAOcBABDLAQAAwwIAMMwBAQCwAgAh0AFAALECACHRAUAAsQIAIeoBAQCwAgAh6wEBALACACHsASAAxAIAIe0BAQC7AgAh7wEAAMUC7wEi8QEAAMYC8QEiAwAAANQBACABAADmAQAwIgAA5wEAIAMAAADUAQAgAQAA1QEAMAIAANEBACABAAAACQAgAQAAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAkDAACWAwAgzAEBAAAAAc8BQAAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAHnAQEAAAAB6AEBAAAAAekBAQAAAAEBFgAA7wEAIAjMAQEAAAABzwFAAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAecBAQAAAAHoAQEAAAAB6QEBAAAAAQEWAADxAQAwARYAAPEBADAJAwAAlQMAIMwBAQCIAwAhzwFAAIkDACHQAUAAiQMAIdEBQACJAwAh3wEBAIgDACHnAQEAiAMAIegBAQCOAwAh6QEBAI4DACECAAAACQAgFgAA9AEAIAjMAQEAiAMAIc8BQACJAwAh0AFAAIkDACHRAUAAiQMAId8BAQCIAwAh5wEBAIgDACHoAQEAjgMAIekBAQCOAwAhAgAAAAcAIBYAAPYBACACAAAABwAgFgAA9gEAIAMAAAAJACAdAADvAQAgHgAA9AEAIAEAAAAJACABAAAABwAgBQsAAJIDACAjAACUAwAgJAAAkwMAIOgBAACKAwAg6QEAAIoDACALyQEAAMICADDKAQAA_QEAEMsBAADCAgAwzAEBALACACHPAUAAsQIAIdABQACxAgAh0QFAALECACHfAQEAsAIAIecBAQCwAgAh6AEBALsCACHpAQEAuwIAIQMAAAAHACABAAD8AQAwIgAA_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_AgAg0gFAAAAAAdMBQAAAAAXUAUAAAAAF1QFAAAAAAdYBQAAAAAHXAUAAAAAB2AFAAAAAAdkBQAC9AgAhCwsAAL4CACAjAAC_AgAgJAAAvwIAINIBQAAAAAHTAUAAAAAF1AFAAAAABdUBQAAAAAHWAUAAAAAB1wFAAAAAAdgBQAAAAAHZAUAAvQIAIQjSAQIAAAAB0wECAAAABdQBAgAAAAXVAQIAAAAB1gECAAAAAdcBAgAAAAHYAQIAAAAB2QECAL4CACEI0gFAAAAAAdMBQAAAAAXUAUAAAAAF1QFAAAAAAdYBQAAAAAHXAUAAAAAB2AFAAAAAAdkBQAC_AgAhDgsAAL4CACAjAADBAgAgJAAAwQIAINIBAQAAAAHTAQEAAAAF1AEBAAAABdUBAQAAAAHWAQEAAAAB1wEBAAAAAdgBAQAAAAHZAQEAwAIAIdoBAQAAAAHbAQEAAAAB3AEBAAAAAQvSAQEAAAAB0wEBAAAABdQBAQAAAAXVAQEAAAAB1gEBAAAAAdcBAQAAAAHYAQEAAAAB2QEBAMECACHaAQEAAAAB2wEBAAAAAdwBAQAAAAELyQEAAMICADDKAQAA_QEAEMsBAADCAgAwzAEBALACACHPAUAAsQIAIdABQACxAgAh0QFAALECACHfAQEAsAIAIecBAQCwAgAh6AEBALsCACHpAQEAuwIAIQzJAQAAwwIAMMoBAADnAQAQywEAAMMCADDMAQEAsAIAIdABQACxAgAh0QFAALECACHqAQEAsAIAIesBAQCwAgAh7AEgAMQCACHtAQEAuwIAIe8BAADFAu8BIvEBAADGAvEBIgULAACzAgAgIwAAzAIAICQAAMwCACDSASAAAAAB2QEgAMsCACEHCwAAswIAICMAAMoCACAkAADKAgAg0gEAAADvAQLTAQAAAO8BCNQBAAAA7wEI2QEAAMkC7wEiBwsAALMCACAjAADIAgAgJAAAyAIAINIBAAAA8QEC0wEAAADxAQjUAQAAAPEBCNkBAADHAvEBIgcLAACzAgAgIwAAyAIAICQAAMgCACDSAQAAAPEBAtMBAAAA8QEI1AEAAADxAQjZAQAAxwLxASIE0gEAAADxAQLTAQAAAPEBCNQBAAAA8QEI2QEAAMgC8QEiBwsAALMCACAjAADKAgAgJAAAygIAINIBAAAA7wEC0wEAAADvAQjUAQAAAO8BCNkBAADJAu8BIgTSAQAAAO8BAtMBAAAA7wEI1AEAAADvAQjZAQAAygLvASIFCwAAswIAICMAAMwCACAkAADMAgAg0gEgAAAAAdkBIADLAgAhAtIBIAAAAAHZASAAzAIAIRIEAADSAgAgBQAA0wIAIAYAANQCACAIAADVAgAgDAAA1gIAIA0AANcCACDJAQAAzQIAMMoBAADUAQAQywEAAM0CADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHqAQEAuAIAIesBAQC4AgAh7AEgAM4CACHtAQEAzwIAIe8BAADQAu8BIvEBAADRAvEBIgLSASAAAAAB2QEgAMwCACEL0gEBAAAAAdMBAQAAAAXUAQEAAAAF1QEBAAAAAdYBAQAAAAHXAQEAAAAB2AEBAAAAAdkBAQDBAgAh2gEBAAAAAdsBAQAAAAHcAQEAAAABBNIBAAAA7wEC0wEAAADvAQjUAQAAAO8BCNkBAADKAu8BIgTSAQAAAPEBAtMBAAAA8QEI1AEAAADxAQjZAQAAyALxASID8gEAAAcAIPMBAAAHACD0AQAABwAgA_IBAAALACDzAQAACwAg9AEAAAsAIAPyAQAAAwAg8wEAAAMAIPQBAAADACAD8gEAABAAIPMBAAAQACD0AQAAEAAgA_IBAAAUACDzAQAAFAAg9AEAABQAIAPyAQAAGwAg8wEAABsAIPQBAAAbACAJyQEAANgCADDKAQAAzgEAEMsBAADYAgAwzAEBALACACHQAUAAsQIAIdEBQACxAgAh6wEBALACACH1ASAAxAIAIfYBQACxAgAhCckBAADZAgAwygEAALsBABDLAQAA2QIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAIesBAQC4AgAh9QEgAM4CACH2AUAAuQIAIQ7JAQAA2gIAMMoBAAC1AQAQywEAANoCADDMAQEAsAIAIdABQACxAgAh0QFAALECACHfAQEAsAIAIfEBAADcAvsBIvcBAQCwAgAh-AEQANsCACH5AQEAsAIAIfsBAQCwAgAh_AEBALsCACH9AUAAvAIAIQ0LAACzAgAgIwAA4AIAICQAAOACACA1AADgAgAgNgAA4AIAINIBEAAAAAHTARAAAAAE1AEQAAAABNUBEAAAAAHWARAAAAAB1wEQAAAAAdgBEAAAAAHZARAA3wIAIQcLAACzAgAgIwAA3gIAICQAAN4CACDSAQAAAPsBAtMBAAAA-wEI1AEAAAD7AQjZAQAA3QL7ASIHCwAAswIAICMAAN4CACAkAADeAgAg0gEAAAD7AQLTAQAAAPsBCNQBAAAA-wEI2QEAAN0C-wEiBNIBAAAA-wEC0wEAAAD7AQjUAQAAAPsBCNkBAADeAvsBIg0LAACzAgAgIwAA4AIAICQAAOACACA1AADgAgAgNgAA4AIAINIBEAAAAAHTARAAAAAE1AEQAAAABNUBEAAAAAHWARAAAAAB1wEQAAAAAdgBEAAAAAHZARAA3wIAIQjSARAAAAAB0wEQAAAABNQBEAAAAATVARAAAAAB1gEQAAAAAdcBEAAAAAHYARAAAAAB2QEQAOACACELyQEAAOECADDKAQAAnwEAEMsBAADhAgAwzAEBALACACHQAUAAsQIAIdEBQACxAgAh3wEBALACACH3AQEAsAIAIf4BAQCwAgAh_wEgAMQCACGAAgEAuwIAIQnJAQAA4gIAMMoBAACHAQAQywEAAOICADDMAQEAsAIAIdABQACxAgAh0QFAALECACHfAQEAsAIAIfcBAQCwAgAhggIAAOMCggIiBwsAALMCACAjAADlAgAgJAAA5QIAINIBAAAAggIC0wEAAACCAgjUAQAAAIICCNkBAADkAoICIgcLAACzAgAgIwAA5QIAICQAAOUCACDSAQAAAIICAtMBAAAAggII1AEAAACCAgjZAQAA5AKCAiIE0gEAAACCAgLTAQAAAIICCNQBAAAAggII2QEAAOUCggIiCMkBAADmAgAwygEAAHEAEMsBAADmAgAwzAEBALACACHQAUAAsQIAIfcBAQCwAgAhgwIBALACACGEAgEAuwIAIRPJAQAA5wIAMMoBAABbABDLAQAA5wIAMMwBAQCwAgAh0AFAALECACHRAUAAsQIAIfEBAADpAowCIoUCAQCwAgAhhgIBALACACGHAgEAsAIAIYgCAQCwAgAhiQIgAMQCACGKAhAA6AIAIYwCAQC7AgAhjQIgAMQCACGOAkAAvAIAIY8CQAC8AgAhkAIBALACACGRAgEAsAIAIQ0LAAC-AgAgIwAA7QIAICQAAO0CACA1AADtAgAgNgAA7QIAINIBEAAAAAHTARAAAAAF1AEQAAAABdUBEAAAAAHWARAAAAAB1wEQAAAAAdgBEAAAAAHZARAA7AIAIQcLAACzAgAgIwAA6wIAICQAAOsCACDSAQAAAIwCAtMBAAAAjAII1AEAAACMAgjZAQAA6gKMAiIHCwAAswIAICMAAOsCACAkAADrAgAg0gEAAACMAgLTAQAAAIwCCNQBAAAAjAII2QEAAOoCjAIiBNIBAAAAjAIC0wEAAACMAgjUAQAAAIwCCNkBAADrAowCIg0LAAC-AgAgIwAA7QIAICQAAO0CACA1AADtAgAgNgAA7QIAINIBEAAAAAHTARAAAAAF1AEQAAAABdUBEAAAAAHWARAAAAAB1wEQAAAAAdgBEAAAAAHZARAA7AIAIQjSARAAAAAB0wEQAAAABdQBEAAAAAXVARAAAAAB1gEQAAAAAdcBEAAAAAHYARAAAAAB2QEQAO0CACEIyQEAAO4CADDKAQAARQAQywEAAO4CADDMAQEAsAIAIdABQACxAgAh0QFAALECACHqAQEAsAIAIYgCAQC7AgAhCQYAANQCACDJAQAA7wIAMMoBAAAyABDLAQAA7wIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAIeoBAQC4AgAhiAIBAM8CACEJBwAA8QIAIMkBAADwAgAwygEAACUAEMsBAADwAgAwzAEBALgCACHQAUAAuQIAIfcBAQC4AgAhgwIBALgCACGEAgEAzwIAIRsIAADVAgAgDAAA1gIAIA0AANcCACAOAAD3AgAgDwAAgwMAIBAAAIQDACDJAQAAgAMAMMoBAAADABDLAQAAgAMAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAIfEBAACCA4wCIoUCAQC4AgAhhgIBALgCACGHAgEAuAIAIYgCAQC4AgAhiQIgAM4CACGKAhAAgQMAIYwCAQDPAgAhjQIgAM4CACGOAkAA9gIAIY8CQAD2AgAhkAIBALgCACGRAgEAuAIAIZQCAAADACCVAgAAAwAgAt8BAQAAAAH3AQEAAAABEAMAAPcCACAHAADxAgAgyQEAAPMCADDKAQAAGwAQywEAAPMCADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfEBAAD1AvsBIvcBAQC4AgAh-AEQAPQCACH5AQEAuAIAIfsBAQC4AgAh_AEBAM8CACH9AUAA9gIAIQjSARAAAAAB0wEQAAAABNQBEAAAAATVARAAAAAB1gEQAAAAAdcBEAAAAAHYARAAAAAB2QEQAOACACEE0gEAAAD7AQLTAQAAAPsBCNQBAAAA-wEI2QEAAN4C-wEiCNIBQAAAAAHTAUAAAAAF1AFAAAAABdUBQAAAAAHWAUAAAAAB1wFAAAAAAdgBQAAAAAHZAUAAvwIAIRQEAADSAgAgBQAA0wIAIAYAANQCACAIAADVAgAgDAAA1gIAIA0AANcCACDJAQAAzQIAMMoBAADUAQAQywEAAM0CADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHqAQEAuAIAIesBAQC4AgAh7AEgAM4CACHtAQEAzwIAIe8BAADQAu8BIvEBAADRAvEBIpQCAADUAQAglQIAANQBACAPAwAA9wIAIAcAAPECACAJAAD5AgAgCgAA1gIAIMkBAAD4AgAwygEAABQAEMsBAAD4AgAwzAEBALgCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACH3AQEAuAIAIf4BAQC4AgAh_wEgAM4CACGAAgEAzwIAIREDAAD3AgAgBwAA8QIAIAkAAPkCACAKAADWAgAgyQEAAPgCADDKAQAAFAAQywEAAPgCADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfcBAQC4AgAh_gEBALgCACH_ASAAzgIAIYACAQDPAgAhlAIAABQAIJUCAAAUACAC3wEBAAAAAfcBAQAAAAELAwAA9wIAIAcAAPECACDJAQAA-wIAMMoBAAAQABDLAQAA-wIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId8BAQC4AgAh9wEBALgCACGCAgAA_AKCAiIE0gEAAACCAgLTAQAAAIICCNQBAAAAggII2QEAAOUCggIiAt0BAQAAAAHeAQEAAAABEQMAAPcCACDJAQAA_gIAMMoBAAALABDLAQAA_gIAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId0BAQC4AgAh3gEBALgCACHfAQEAuAIAIeABAQDPAgAh4QEBAM8CACHiAQEAzwIAIeMBQAD2AgAh5AFAAPYCACHlAQEAzwIAIeYBAQDPAgAhDAMAAPcCACDJAQAA_wIAMMoBAAAHABDLAQAA_wIAMMwBAQC4AgAhzwFAALkCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACHnAQEAuAIAIegBAQDPAgAh6QEBAM8CACEZCAAA1QIAIAwAANYCACANAADXAgAgDgAA9wIAIA8AAIMDACAQAACEAwAgyQEAAIADADDKAQAAAwAQywEAAIADADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHxAQAAggOMAiKFAgEAuAIAIYYCAQC4AgAhhwIBALgCACGIAgEAuAIAIYkCIADOAgAhigIQAIEDACGMAgEAzwIAIY0CIADOAgAhjgJAAPYCACGPAkAA9gIAIZACAQC4AgAhkQIBALgCACEI0gEQAAAAAdMBEAAAAAXUARAAAAAF1QEQAAAAAdYBEAAAAAHXARAAAAAB2AEQAAAAAdkBEADtAgAhBNIBAAAAjAIC0wEAAACMAgjUAQAAAIwCCNkBAADrAowCIgsGAADUAgAgyQEAAO8CADDKAQAAMgAQywEAAO8CADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHqAQEAuAIAIYgCAQDPAgAhlAIAADIAIJUCAAAyACAD8gEAACUAIPMBAAAlACD0AQAAJQAgAAAAAZkCAQAAAAEBmQJAAAAAAQAAAAABmQIBAAAAAQGZAkAAAAABBR0AALYFACAeAAC5BQAglgIAALcFACCXAgAAuAUAIJwCAADRAQAgAx0AALYFACCWAgAAtwUAIJwCAADRAQAgAAAABR0AALEFACAeAAC0BQAglgIAALIFACCXAgAAswUAIJwCAADRAQAgAx0AALEFACCWAgAAsgUAIJwCAADRAQAgAAAAAZkCIAAAAAEBmQIAAADvAQIBmQIAAADxAQILHQAArgQAMB4AALMEADCWAgAArwQAMJcCAACwBAAwmAIAALEEACCZAgAAsgQAMJoCAACyBAAwmwIAALIEADCcAgAAsgQAMJ0CAAC0BAAwngIAALUEADALHQAAogQAMB4AAKcEADCWAgAAowQAMJcCAACkBAAwmAIAAKUEACCZAgAApgQAMJoCAACmBAAwmwIAAKYEADCcAgAApgQAMJ0CAACoBAAwngIAAKkEADALHQAA3wMAMB4AAOQDADCWAgAA4AMAMJcCAADhAwAwmAIAAOIDACCZAgAA4wMAMJoCAADjAwAwmwIAAOMDADCcAgAA4wMAMJ0CAADlAwAwngIAAOYDADALHQAA0AMAMB4AANUDADCWAgAA0QMAMJcCAADSAwAwmAIAANMDACCZAgAA1AMAMJoCAADUAwAwmwIAANQDADCcAgAA1AMAMJ0CAADWAwAwngIAANcDADALHQAAswMAMB4AALgDADCWAgAAtAMAMJcCAAC1AwAwmAIAALYDACCZAgAAtwMAMJoCAAC3AwAwmwIAALcDADCcAgAAtwMAMJ0CAAC5AwAwngIAALoDADALHQAAowMAMB4AAKgDADCWAgAApAMAMJcCAAClAwAwmAIAAKYDACCZAgAApwMAMJoCAACnAwAwmwIAAKcDADCcAgAApwMAMJ0CAACpAwAwngIAAKoDADALBwAAsgMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAfEBAAAA-wEC9wEBAAAAAfgBEAAAAAH5AQEAAAAB-wEBAAAAAfwBAQAAAAH9AUAAAAABAgAAAB0AIB0AALEDACADAAAAHQAgHQAAsQMAIB4AAK8DACABFgAAsAUAMBEDAAD3AgAgBwAA8QIAIMkBAADzAgAwygEAABsAEMsBAADzAgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfEBAAD1AvsBIvcBAQC4AgAh-AEQAPQCACH5AQEAuAIAIfsBAQC4AgAh_AEBAAAAAf0BQAD2AgAhkgIAAPICACACAAAAHQAgFgAArwMAIAIAAACrAwAgFgAArAMAIA7JAQAAqgMAMMoBAACrAwAQywEAAKoDADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfEBAAD1AvsBIvcBAQC4AgAh-AEQAPQCACH5AQEAuAIAIfsBAQC4AgAh_AEBAM8CACH9AUAA9gIAIQ7JAQAAqgMAMMoBAACrAwAQywEAAKoDADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfEBAAD1AvsBIvcBAQC4AgAh-AEQAPQCACH5AQEAuAIAIfsBAQC4AgAh_AEBAM8CACH9AUAA9gIAIQrMAQEAiAMAIdABQACJAwAh0QFAAIkDACHxAQAArgP7ASL3AQEAiAMAIfgBEACtAwAh-QEBAIgDACH7AQEAiAMAIfwBAQCOAwAh_QFAAI8DACEFmQIQAAAAAZ8CEAAAAAGgAhAAAAABoQIQAAAAAaICEAAAAAEBmQIAAAD7AQILBwAAsAMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIfEBAACuA_sBIvcBAQCIAwAh-AEQAK0DACH5AQEAiAMAIfsBAQCIAwAh_AEBAI4DACH9AUAAjwMAIQUdAACrBQAgHgAArgUAIJYCAACsBQAglwIAAK0FACCcAgAABQAgCwcAALIDACDMAQEAAAAB0AFAAAAAAdEBQAAAAAHxAQAAAPsBAvcBAQAAAAH4ARAAAAAB-QEBAAAAAfsBAQAAAAH8AQEAAAAB_QFAAAAAAQMdAACrBQAglgIAAKwFACCcAgAABQAgCgcAAMsDACAJAADPAwAgCgAAzQMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAfcBAQAAAAH-AQEAAAAB_wEgAAAAAYACAQAAAAECAAAAFgAgHQAAzgMAIAMAAAAWACAdAADOAwAgHgAAvQMAIAEWAACqBQAwDwMAAPcCACAHAADxAgAgCQAA-QIAIAoAANYCACDJAQAA-AIAMMoBAAAUABDLAQAA-AIAMMwBAQAAAAHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACH3AQEAuAIAIf4BAQC4AgAh_wEgAM4CACGAAgEAzwIAIQIAAAAWACAWAAC9AwAgAgAAALsDACAWAAC8AwAgC8kBAAC6AwAwygEAALsDABDLAQAAugMAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId8BAQC4AgAh9wEBALgCACH-AQEAuAIAIf8BIADOAgAhgAIBAM8CACELyQEAALoDADDKAQAAuwMAEMsBAAC6AwAwzAEBALgCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACH3AQEAuAIAIf4BAQC4AgAh_wEgAM4CACGAAgEAzwIAIQfMAQEAiAMAIdABQACJAwAh0QFAAIkDACH3AQEAiAMAIf4BAQCIAwAh_wEgAJoDACGAAgEAjgMAIQoHAAC-AwAgCQAAvwMAIAoAAMADACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACH3AQEAiAMAIf4BAQCIAwAh_wEgAJoDACGAAgEAjgMAIQUdAACeBQAgHgAAqAUAIJYCAACfBQAglwIAAKcFACCcAgAABQAgBx0AAJoFACAeAAClBQAglgIAAJsFACCXAgAApAUAIJoCAAAUACCbAgAAFAAgnAIAABYAIAsdAADBAwAwHgAAxQMAMJYCAADCAwAwlwIAAMMDADCYAgAAxAMAIJkCAAC3AwAwmgIAALcDADCbAgAAtwMAMJwCAAC3AwAwnQIAAMYDADCeAgAAugMAMAoDAADMAwAgBwAAywMAIAoAAM0DACDMAQEAAAAB0AFAAAAAAdEBQAAAAAHfAQEAAAAB9wEBAAAAAf4BAQAAAAH_ASAAAAABAgAAABYAIB0AAMoDACADAAAAFgAgHQAAygMAIB4AAMgDACABFgAAowUAMAIAAAAWACAWAADIAwAgAgAAALsDACAWAADHAwAgB8wBAQCIAwAh0AFAAIkDACHRAUAAiQMAId8BAQCIAwAh9wEBAIgDACH-AQEAiAMAIf8BIACaAwAhCgMAAMkDACAHAAC-AwAgCgAAwAMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAId8BAQCIAwAh9wEBAIgDACH-AQEAiAMAIf8BIACaAwAhBR0AAJwFACAeAAChBQAglgIAAJ0FACCXAgAAoAUAIJwCAADRAQAgCgMAAMwDACAHAADLAwAgCgAAzQMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAH3AQEAAAAB_gEBAAAAAf8BIAAAAAEDHQAAngUAIJYCAACfBQAgnAIAAAUAIAMdAACcBQAglgIAAJ0FACCcAgAA0QEAIAQdAADBAwAwlgIAAMIDADCYAgAAxAMAIJwCAAC3AwAwCgcAAMsDACAJAADPAwAgCgAAzQMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAfcBAQAAAAH-AQEAAAAB_wEgAAAAAYACAQAAAAEDHQAAmgUAIJYCAACbBQAgnAIAABYAIAYHAADeAwAgzAEBAAAAAdABQAAAAAHRAUAAAAAB9wEBAAAAAYICAAAAggICAgAAABIAIB0AAN0DACADAAAAEgAgHQAA3QMAIB4AANsDACABFgAAmQUAMAwDAAD3AgAgBwAA8QIAIMkBAAD7AgAwygEAABAAEMsBAAD7AgAwzAEBAAAAAdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfcBAQC4AgAhggIAAPwCggIikgIAAPoCACACAAAAEgAgFgAA2wMAIAIAAADYAwAgFgAA2QMAIAnJAQAA1wMAMMoBAADYAwAQywEAANcDADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHfAQEAuAIAIfcBAQC4AgAhggIAAPwCggIiCckBAADXAwAwygEAANgDABDLAQAA1wMAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAId8BAQC4AgAh9wEBALgCACGCAgAA_AKCAiIFzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh9wEBAIgDACGCAgAA2gOCAiIBmQIAAACCAgIGBwAA3AMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIfcBAQCIAwAhggIAANoDggIiBR0AAJQFACAeAACXBQAglgIAAJUFACCXAgAAlgUAIJwCAAAFACAGBwAA3gMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAfcBAQAAAAGCAgAAAIICAgMdAACUBQAglgIAAJUFACCcAgAABQAgFAgAAJ8EACAMAACgBAAgDQAAoQQAIA8AAJ0EACAQAACeBAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB8QEAAACMAgKFAgEAAAABhgIBAAAAAYcCAQAAAAGIAgEAAAABiQIgAAAAAYoCEAAAAAGMAgEAAAABjQIgAAAAAY4CQAAAAAGPAkAAAAABkQIBAAAAAQIAAAAFACAdAACcBAAgAwAAAAUAIB0AAJwEACAeAADrAwAgARYAAJMFADAZCAAA1QIAIAwAANYCACANAADXAgAgDgAA9wIAIA8AAIMDACAQAACEAwAgyQEAAIADADDKAQAAAwAQywEAAIADADDMAQEAAAAB0AFAALkCACHRAUAAuQIAIfEBAACCA4wCIoUCAQC4AgAhhgIBALgCACGHAgEAuAIAIYgCAQC4AgAhiQIgAM4CACGKAhAAgQMAIYwCAQDPAgAhjQIgAM4CACGOAkAA9gIAIY8CQAD2AgAhkAIBALgCACGRAgEAuAIAIQIAAAAFACAWAADrAwAgAgAAAOcDACAWAADoAwAgE8kBAADmAwAwygEAAOcDABDLAQAA5gMAMMwBAQC4AgAh0AFAALkCACHRAUAAuQIAIfEBAACCA4wCIoUCAQC4AgAhhgIBALgCACGHAgEAuAIAIYgCAQC4AgAhiQIgAM4CACGKAhAAgQMAIYwCAQDPAgAhjQIgAM4CACGOAkAA9gIAIY8CQAD2AgAhkAIBALgCACGRAgEAuAIAIRPJAQAA5gMAMMoBAADnAwAQywEAAOYDADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHxAQAAggOMAiKFAgEAuAIAIYYCAQC4AgAhhwIBALgCACGIAgEAuAIAIYkCIADOAgAhigIQAIEDACGMAgEAzwIAIY0CIADOAgAhjgJAAPYCACGPAkAA9gIAIZACAQC4AgAhkQIBALgCACEPzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh8QEAAOoDjAIihQIBAIgDACGGAgEAiAMAIYcCAQCIAwAhiAIBAIgDACGJAiAAmgMAIYoCEADpAwAhjAIBAI4DACGNAiAAmgMAIY4CQACPAwAhjwJAAI8DACGRAgEAiAMAIQWZAhAAAAABnwIQAAAAAaACEAAAAAGhAhAAAAABogIQAAAAAQGZAgAAAIwCAhQIAADuAwAgDAAA7wMAIA0AAPADACAPAADsAwAgEAAA7QMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIfEBAADqA4wCIoUCAQCIAwAhhgIBAIgDACGHAgEAiAMAIYgCAQCIAwAhiQIgAJoDACGKAhAA6QMAIYwCAQCOAwAhjQIgAJoDACGOAkAAjwMAIY8CQACPAwAhkQIBAIgDACEFHQAAgAUAIB4AAJEFACCWAgAAgQUAIJcCAACQBQAgnAIAAAEAIAsdAACQBAAwHgAAlQQAMJYCAACRBAAwlwIAAJIEADCYAgAAkwQAIJkCAACUBAAwmgIAAJQEADCbAgAAlAQAMJwCAACUBAAwnQIAAJYEADCeAgAAlwQAMAsdAACFBAAwHgAAiQQAMJYCAACGBAAwlwIAAIcEADCYAgAAiAQAIJkCAADUAwAwmgIAANQDADCbAgAA1AMAMJwCAADUAwAwnQIAAIoEADCeAgAA1wMAMAsdAAD8AwAwHgAAgAQAMJYCAAD9AwAwlwIAAP4DADCYAgAA_wMAIJkCAAC3AwAwmgIAALcDADCbAgAAtwMAMJwCAAC3AwAwnQIAAIEEADCeAgAAugMAMAsdAADxAwAwHgAA9QMAMJYCAADyAwAwlwIAAPMDADCYAgAA9AMAIJkCAACnAwAwmgIAAKcDADCbAgAApwMAMJwCAACnAwAwnQIAAPYDADCeAgAAqgMAMAsDAAD7AwAgzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAfEBAAAA-wEC-AEQAAAAAfkBAQAAAAH7AQEAAAAB_AEBAAAAAf0BQAAAAAECAAAAHQAgHQAA-gMAIAMAAAAdACAdAAD6AwAgHgAA-AMAIAEWAACPBQAwAgAAAB0AIBYAAPgDACACAAAAqwMAIBYAAPcDACAKzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh3wEBAIgDACHxAQAArgP7ASL4ARAArQMAIfkBAQCIAwAh-wEBAIgDACH8AQEAjgMAIf0BQACPAwAhCwMAAPkDACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHfAQEAiAMAIfEBAACuA_sBIvgBEACtAwAh-QEBAIgDACH7AQEAiAMAIfwBAQCOAwAh_QFAAI8DACEFHQAAigUAIB4AAI0FACCWAgAAiwUAIJcCAACMBQAgnAIAANEBACALAwAA-wMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAHxAQAAAPsBAvgBEAAAAAH5AQEAAAAB-wEBAAAAAfwBAQAAAAH9AUAAAAABAx0AAIoFACCWAgAAiwUAIJwCAADRAQAgCgMAAMwDACAJAADPAwAgCgAAzQMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAH-AQEAAAAB_wEgAAAAAYACAQAAAAECAAAAFgAgHQAAhAQAIAMAAAAWACAdAACEBAAgHgAAgwQAIAEWAACJBQAwAgAAABYAIBYAAIMEACACAAAAuwMAIBYAAIIEACAHzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh3wEBAIgDACH-AQEAiAMAIf8BIACaAwAhgAIBAI4DACEKAwAAyQMAIAkAAL8DACAKAADAAwAgzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh3wEBAIgDACH-AQEAiAMAIf8BIACaAwAhgAIBAI4DACEKAwAAzAMAIAkAAM8DACAKAADNAwAgzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAf4BAQAAAAH_ASAAAAABgAIBAAAAAQYDAACPBAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAYICAAAAggICAgAAABIAIB0AAI4EACADAAAAEgAgHQAAjgQAIB4AAIwEACABFgAAiAUAMAIAAAASACAWAACMBAAgAgAAANgDACAWAACLBAAgBcwBAQCIAwAh0AFAAIkDACHRAUAAiQMAId8BAQCIAwAhggIAANoDggIiBgMAAI0EACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHfAQEAiAMAIYICAADaA4ICIgUdAACDBQAgHgAAhgUAIJYCAACEBQAglwIAAIUFACCcAgAA0QEAIAYDAACPBAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAYICAAAAggICAx0AAIMFACCWAgAAhAUAIJwCAADRAQAgBMwBAQAAAAHQAUAAAAABgwIBAAAAAYQCAQAAAAECAAAAJwAgHQAAmwQAIAMAAAAnACAdAACbBAAgHgAAmgQAIAEWAACCBQAwCQcAAPECACDJAQAA8AIAMMoBAAAlABDLAQAA8AIAMMwBAQAAAAHQAUAAuQIAIfcBAQC4AgAhgwIBALgCACGEAgEAzwIAIQIAAAAnACAWAACaBAAgAgAAAJgEACAWAACZBAAgCMkBAACXBAAwygEAAJgEABDLAQAAlwQAMMwBAQC4AgAh0AFAALkCACH3AQEAuAIAIYMCAQC4AgAhhAIBAM8CACEIyQEAAJcEADDKAQAAmAQAEMsBAACXBAAwzAEBALgCACHQAUAAuQIAIfcBAQC4AgAhgwIBALgCACGEAgEAzwIAIQTMAQEAiAMAIdABQACJAwAhgwIBAIgDACGEAgEAjgMAIQTMAQEAiAMAIdABQACJAwAhgwIBAIgDACGEAgEAjgMAIQTMAQEAAAAB0AFAAAAAAYMCAQAAAAGEAgEAAAABFAgAAJ8EACAMAACgBAAgDQAAoQQAIA8AAJ0EACAQAACeBAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB8QEAAACMAgKFAgEAAAABhgIBAAAAAYcCAQAAAAGIAgEAAAABiQIgAAAAAYoCEAAAAAGMAgEAAAABjQIgAAAAAY4CQAAAAAGPAkAAAAABkQIBAAAAAQMdAACABQAglgIAAIEFACCcAgAAAQAgBB0AAJAEADCWAgAAkQQAMJgCAACTBAAgnAIAAJQEADAEHQAAhQQAMJYCAACGBAAwmAIAAIgEACCcAgAA1AMAMAQdAAD8AwAwlgIAAP0DADCYAgAA_wMAIJwCAAC3AwAwBB0AAPEDADCWAgAA8gMAMJgCAAD0AwAgnAIAAKcDADAMzAEBAAAAAdABQAAAAAHRAUAAAAAB3QEBAAAAAd4BAQAAAAHgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAUAAAAAB5AFAAAAAAeUBAQAAAAHmAQEAAAABAgAAAA0AIB0AAK0EACADAAAADQAgHQAArQQAIB4AAKwEACABFgAA_wQAMBIDAAD3AgAgyQEAAP4CADDKAQAACwAQywEAAP4CADDMAQEAAAAB0AFAALkCACHRAUAAuQIAId0BAQC4AgAh3gEBALgCACHfAQEAuAIAIeABAQDPAgAh4QEBAM8CACHiAQEAzwIAIeMBQAD2AgAh5AFAAPYCACHlAQEAzwIAIeYBAQDPAgAhkwIAAP0CACACAAAADQAgFgAArAQAIAIAAACqBAAgFgAAqwQAIBDJAQAAqQQAMMoBAACqBAAQywEAAKkEADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHdAQEAuAIAId4BAQC4AgAh3wEBALgCACHgAQEAzwIAIeEBAQDPAgAh4gEBAM8CACHjAUAA9gIAIeQBQAD2AgAh5QEBAM8CACHmAQEAzwIAIRDJAQAAqQQAMMoBAACqBAAQywEAAKkEADDMAQEAuAIAIdABQAC5AgAh0QFAALkCACHdAQEAuAIAId4BAQC4AgAh3wEBALgCACHgAQEAzwIAIeEBAQDPAgAh4gEBAM8CACHjAUAA9gIAIeQBQAD2AgAh5QEBAM8CACHmAQEAzwIAIQzMAQEAiAMAIdABQACJAwAh0QFAAIkDACHdAQEAiAMAId4BAQCIAwAh4AEBAI4DACHhAQEAjgMAIeIBAQCOAwAh4wFAAI8DACHkAUAAjwMAIeUBAQCOAwAh5gEBAI4DACEMzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh3QEBAIgDACHeAQEAiAMAIeABAQCOAwAh4QEBAI4DACHiAQEAjgMAIeMBQACPAwAh5AFAAI8DACHlAQEAjgMAIeYBAQCOAwAhDMwBAQAAAAHQAUAAAAAB0QFAAAAAAd0BAQAAAAHeAQEAAAAB4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wFAAAAAAeQBQAAAAAHlAQEAAAAB5gEBAAAAAQfMAQEAAAABzwFAAAAAAdABQAAAAAHRAUAAAAAB5wEBAAAAAegBAQAAAAHpAQEAAAABAgAAAAkAIB0AALkEACADAAAACQAgHQAAuQQAIB4AALgEACABFgAA_gQAMAwDAAD3AgAgyQEAAP8CADDKAQAABwAQywEAAP8CADDMAQEAAAABzwFAALkCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACHnAQEAAAAB6AEBAM8CACHpAQEAzwIAIQIAAAAJACAWAAC4BAAgAgAAALYEACAWAAC3BAAgC8kBAAC1BAAwygEAALYEABDLAQAAtQQAMMwBAQC4AgAhzwFAALkCACHQAUAAuQIAIdEBQAC5AgAh3wEBALgCACHnAQEAuAIAIegBAQDPAgAh6QEBAM8CACELyQEAALUEADDKAQAAtgQAEMsBAAC1BAAwzAEBALgCACHPAUAAuQIAIdABQAC5AgAh0QFAALkCACHfAQEAuAIAIecBAQC4AgAh6AEBAM8CACHpAQEAzwIAIQfMAQEAiAMAIc8BQACJAwAh0AFAAIkDACHRAUAAiQMAIecBAQCIAwAh6AEBAI4DACHpAQEAjgMAIQfMAQEAiAMAIc8BQACJAwAh0AFAAIkDACHRAUAAiQMAIecBAQCIAwAh6AEBAI4DACHpAQEAjgMAIQfMAQEAAAABzwFAAAAAAdABQAAAAAHRAUAAAAAB5wEBAAAAAegBAQAAAAHpAQEAAAABBB0AAK4EADCWAgAArwQAMJgCAACxBAAgnAIAALIEADAEHQAAogQAMJYCAACjBAAwmAIAAKUEACCcAgAApgQAMAQdAADfAwAwlgIAAOADADCYAgAA4gMAIJwCAADjAwAwBB0AANADADCWAgAA0QMAMJgCAADTAwAgnAIAANQDADAEHQAAswMAMJYCAAC0AwAwmAIAALYDACCcAgAAtwMAMAQdAACjAwAwlgIAAKQDADCYAgAApgMAIJwCAACnAwAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFHQAA-QQAIB4AAPwEACCWAgAA-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_QQAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIfEBAADqA4wCIoUCAQCIAwAhhgIBAIgDACGHAgEAiAMAIYgCAQCIAwAhiQIgAJoDACGKAhAA6QMAIYwCAQCOAwAhjQIgAJoDACGOAkAAjwMAIY8CQACPAwAhkAIBAIgDACGRAgEAiAMAIRUIAADuAwAgDAAA7wMAIA0AAPADACAOAADeBAAgDwAA7AMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIfEBAADqA4wCIoUCAQCIAwAhhgIBAIgDACGHAgEAiAMAIYgCAQCIAwAhiQIgAJoDACGKAhAA6QMAIYwCAQCOAwAhjQIgAJoDACGOAkAAjwMAIY8CQACPAwAhkAIBAIgDACGRAgEAiAMAIQfMAQEAAAABzwFAAAAAAdABQAAAAAHRAUAAAAAB5wEBAAAAAegBAQAAAAHpAQEAAAABDMwBAQAAAAHQAUAAAAAB0QFAAAAAAd0BAQAAAAHeAQEAAAAB4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wFAAAAAAeQBQAAAAAHlAQEAAAAB5gEBAAAAAQXMAQEAAAAB0AFAAAAAAdEBQAAAAAHqAQEAAAABiAIBAAAAAQIAAAABACAdAACABQAgBMwBAQAAAAHQAUAAAAABgwIBAAAAAYQCAQAAAAEOBAAAugQAIAUAALsEACAGAAC8BAAgDAAAvgQAIA0AAL8EACDMAQEAAAAB0AFAAAAAAdEBQAAAAAHqAQEAAAAB6wEBAAAAAewBIAAAAAHtAQEAAAAB7wEAAADvAQLxAQAAAPEBAgIAAADRAQAgHQAAgwUAIAMAAADUAQAgHQAAgwUAIB4AAIcFACAQAAAA1AEAIAQAAJ0DACAFAACeAwAgBgAAnwMAIAwAAKEDACANAACiAwAgFgAAhwUAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIeoBAQCIAwAh6wEBAIgDACHsASAAmgMAIe0BAQCOAwAh7wEAAJsD7wEi8QEAAJwD8QEiDgQAAJ0DACAFAACeAwAgBgAAnwMAIAwAAKEDACANAACiAwAgzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh6gEBAIgDACHrAQEAiAMAIewBIACaAwAh7QEBAI4DACHvAQAAmwPvASLxAQAAnAPxASIFzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAYICAAAAggICB8wBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAH-AQEAAAAB_wEgAAAAAYACAQAAAAEOBAAAugQAIAUAALsEACAGAAC8BAAgCAAAvQQAIAwAAL4EACDMAQEAAAAB0AFAAAAAAdEBQAAAAAHqAQEAAAAB6wEBAAAAAewBIAAAAAHtAQEAAAAB7wEAAADvAQLxAQAAAPEBAgIAAADRAQAgHQAAigUAIAMAAADUAQAgHQAAigUAIB4AAI4FACAQAAAA1AEAIAQAAJ0DACAFAACeAwAgBgAAnwMAIAgAAKADACAMAAChAwAgFgAAjgUAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIeoBAQCIAwAh6wEBAIgDACHsASAAmgMAIe0BAQCOAwAh7wEAAJsD7wEi8QEAAJwD8QEiDgQAAJ0DACAFAACeAwAgBgAAnwMAIAgAAKADACAMAAChAwAgzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh6gEBAIgDACHrAQEAiAMAIewBIACaAwAh7QEBAI4DACHvAQAAmwPvASLxAQAAnAPxASIKzAEBAAAAAdABQAAAAAHRAUAAAAAB3wEBAAAAAfEBAAAA-wEC-AEQAAAAAfkBAQAAAAH7AQEAAAAB_AEBAAAAAf0BQAAAAAEDAAAAMgAgHQAAgAUAIB4AAJIFACAHAAAAMgAgFgAAkgUAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIeoBAQCIAwAhiAIBAI4DACEFzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh6gEBAIgDACGIAgEAjgMAIQ_MAQEAAAAB0AFAAAAAAdEBQAAAAAHxAQAAAIwCAoUCAQAAAAGGAgEAAAABhwIBAAAAAYgCAQAAAAGJAiAAAAABigIQAAAAAYwCAQAAAAGNAiAAAAABjgJAAAAAAY8CQAAAAAGRAgEAAAABFQwAAKAEACANAAChBAAgDgAA3wQAIA8AAJ0EACAQAACeBAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB8QEAAACMAgKFAgEAAAABhgIBAAAAAYcCAQAAAAGIAgEAAAABiQIgAAAAAYoCEAAAAAGMAgEAAAABjQIgAAAAAY4CQAAAAAGPAkAAAAABkAIBAAAAAZECAQAAAAECAAAABQAgHQAAlAUAIAMAAAADACAdAACUBQAgHgAAmAUAIBcAAAADACAMAADvAwAgDQAA8AMAIA4AAN4EACAPAADsAwAgEAAA7QMAIBYAAJgFACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHxAQAA6gOMAiKFAgEAiAMAIYYCAQCIAwAhhwIBAIgDACGIAgEAiAMAIYkCIACaAwAhigIQAOkDACGMAgEAjgMAIY0CIACaAwAhjgJAAI8DACGPAkAAjwMAIZACAQCIAwAhkQIBAIgDACEVDAAA7wMAIA0AAPADACAOAADeBAAgDwAA7AMAIBAAAO0DACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHxAQAA6gOMAiKFAgEAiAMAIYYCAQCIAwAhhwIBAIgDACGIAgEAiAMAIYkCIACaAwAhigIQAOkDACGMAgEAjgMAIY0CIACaAwAhjgJAAI8DACGPAkAAjwMAIZACAQCIAwAhkQIBAIgDACEFzAEBAAAAAdABQAAAAAHRAUAAAAAB9wEBAAAAAYICAAAAggICCwMAAMwDACAHAADLAwAgCQAAzwMAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAH3AQEAAAAB_gEBAAAAAf8BIAAAAAGAAgEAAAABAgAAABYAIB0AAJoFACAOBAAAugQAIAUAALsEACAGAAC8BAAgCAAAvQQAIA0AAL8EACDMAQEAAAAB0AFAAAAAAdEBQAAAAAHqAQEAAAAB6wEBAAAAAewBIAAAAAHtAQEAAAAB7wEAAADvAQLxAQAAAPEBAgIAAADRAQAgHQAAnAUAIBUIAACfBAAgDQAAoQQAIA4AAN8EACAPAACdBAAgEAAAngQAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAfEBAAAAjAIChQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYkCIAAAAAGKAhAAAAABjAIBAAAAAY0CIAAAAAGOAkAAAAABjwJAAAAAAZACAQAAAAGRAgEAAAABAgAAAAUAIB0AAJ4FACADAAAA1AEAIB0AAJwFACAeAACiBQAgEAAAANQBACAEAACdAwAgBQAAngMAIAYAAJ8DACAIAACgAwAgDQAAogMAIBYAAKIFACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHqAQEAiAMAIesBAQCIAwAh7AEgAJoDACHtAQEAjgMAIe8BAACbA-8BIvEBAACcA_EBIg4EAACdAwAgBQAAngMAIAYAAJ8DACAIAACgAwAgDQAAogMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIeoBAQCIAwAh6wEBAIgDACHsASAAmgMAIe0BAQCOAwAh7wEAAJsD7wEi8QEAAJwD8QEiB8wBAQAAAAHQAUAAAAAB0QFAAAAAAd8BAQAAAAH3AQEAAAAB_gEBAAAAAf8BIAAAAAEDAAAAFAAgHQAAmgUAIB4AAKYFACANAAAAFAAgAwAAyQMAIAcAAL4DACAJAAC_AwAgFgAApgUAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAId8BAQCIAwAh9wEBAIgDACH-AQEAiAMAIf8BIACaAwAhgAIBAI4DACELAwAAyQMAIAcAAL4DACAJAAC_AwAgzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh3wEBAIgDACH3AQEAiAMAIf4BAQCIAwAh_wEgAJoDACGAAgEAjgMAIQMAAAADACAdAACeBQAgHgAAqQUAIBcAAAADACAIAADuAwAgDQAA8AMAIA4AAN4EACAPAADsAwAgEAAA7QMAIBYAAKkFACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHxAQAA6gOMAiKFAgEAiAMAIYYCAQCIAwAhhwIBAIgDACGIAgEAiAMAIYkCIACaAwAhigIQAOkDACGMAgEAjgMAIY0CIACaAwAhjgJAAI8DACGPAkAAjwMAIZACAQCIAwAhkQIBAIgDACEVCAAA7gMAIA0AAPADACAOAADeBAAgDwAA7AMAIBAAAO0DACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHxAQAA6gOMAiKFAgEAiAMAIYYCAQCIAwAhhwIBAIgDACGIAgEAiAMAIYkCIACaAwAhigIQAOkDACGMAgEAjgMAIY0CIACaAwAhjgJAAI8DACGPAkAAjwMAIZACAQCIAwAhkQIBAIgDACEHzAEBAAAAAdABQAAAAAHRAUAAAAAB9wEBAAAAAf4BAQAAAAH_ASAAAAABgAIBAAAAARUIAACfBAAgDAAAoAQAIA4AAN8EACAPAACdBAAgEAAAngQAIMwBAQAAAAHQAUAAAAAB0QFAAAAAAfEBAAAAjAIChQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYkCIAAAAAGKAhAAAAABjAIBAAAAAY0CIAAAAAGOAkAAAAABjwJAAAAAAZACAQAAAAGRAgEAAAABAgAAAAUAIB0AAKsFACADAAAAAwAgHQAAqwUAIB4AAK8FACAXAAAAAwAgCAAA7gMAIAwAAO8DACAOAADeBAAgDwAA7AMAIBAAAO0DACAWAACvBQAgzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh8QEAAOoDjAIihQIBAIgDACGGAgEAiAMAIYcCAQCIAwAhiAIBAIgDACGJAiAAmgMAIYoCEADpAwAhjAIBAI4DACGNAiAAmgMAIY4CQACPAwAhjwJAAI8DACGQAgEAiAMAIZECAQCIAwAhFQgAAO4DACAMAADvAwAgDgAA3gQAIA8AAOwDACAQAADtAwAgzAEBAIgDACHQAUAAiQMAIdEBQACJAwAh8QEAAOoDjAIihQIBAIgDACGGAgEAiAMAIYcCAQCIAwAhiAIBAIgDACGJAiAAmgMAIYoCEADpAwAhjAIBAI4DACGNAiAAmgMAIY4CQACPAwAhjwJAAI8DACGQAgEAiAMAIZECAQCIAwAhCswBAQAAAAHQAUAAAAAB0QFAAAAAAfEBAAAA-wEC9wEBAAAAAfgBEAAAAAH5AQEAAAAB-wEBAAAAAfwBAQAAAAH9AUAAAAABDgUAALsEACAGAAC8BAAgCAAAvQQAIAwAAL4EACANAAC_BAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB6gEBAAAAAesBAQAAAAHsASAAAAAB7QEBAAAAAe8BAAAA7wEC8QEAAADxAQICAAAA0QEAIB0AALEFACADAAAA1AEAIB0AALEFACAeAAC1BQAgEAAAANQBACAFAACeAwAgBgAAnwMAIAgAAKADACAMAAChAwAgDQAAogMAIBYAALUFACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHqAQEAiAMAIesBAQCIAwAh7AEgAJoDACHtAQEAjgMAIe8BAACbA-8BIvEBAACcA_EBIg4FAACeAwAgBgAAnwMAIAgAAKADACAMAAChAwAgDQAAogMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIeoBAQCIAwAh6wEBAIgDACHsASAAmgMAIe0BAQCOAwAh7wEAAJsD7wEi8QEAAJwD8QEiDgQAALoEACAGAAC8BAAgCAAAvQQAIAwAAL4EACANAAC_BAAgzAEBAAAAAdABQAAAAAHRAUAAAAAB6gEBAAAAAesBAQAAAAHsASAAAAAB7QEBAAAAAe8BAAAA7wEC8QEAAADxAQICAAAA0QEAIB0AALYFACADAAAA1AEAIB0AALYFACAeAAC6BQAgEAAAANQBACAEAACdAwAgBgAAnwMAIAgAAKADACAMAAChAwAgDQAAogMAIBYAALoFACDMAQEAiAMAIdABQACJAwAh0QFAAIkDACHqAQEAiAMAIesBAQCIAwAh7AEgAJoDACHtAQEAjgMAIe8BAACbA-8BIvEBAACcA_EBIg4EAACdAwAgBgAAnwMAIAgAAKADACAMAAChAwAgDQAAogMAIMwBAQCIAwAh0AFAAIkDACHRAUAAiQMAIeoBAQCIAwAh6wEBAIgDACHsASAAmgMAIe0BAQCOAwAh7wEAAJsD7wEi8QEAAJwD8QEiAgYGAgsADQcIKQYLAAwMKgcNKwkOAAMPAAEQKAsHBAoEBQ4FBg8CCBMGCwAKDBcHDR4JAQMAAwEDAAMCAwADBwACBQMAAwcAAgkYBwoZBwsACAEKGgACAwADBwACBgQfAAUgAAYhAAgiAAwjAA0kAAEHAAIECC0ADC4ADS8AECwAAQYwAAAAAAMLABIjABMkABQAAAADCwASIwATJAAUAg4AAw8AAQIOAAMPAAEFCwAZIwAcJAAdNQAaNgAbAAAAAAAFCwAZIwAcJAAdNQAaNgAbAQcAAgEHAAIDCwAiIwAjJAAkAAAAAwsAIiMAIyQAJAIDAAMHAAICAwADBwACAwsAKSMAKiQAKwAAAAMLACkjACokACsDAwADBwACCZQBBwMDAAMHAAIJmgEHAwsAMCMAMSQAMgAAAAMLADAjADEkADICAwADBwACAgMAAwcAAgULADcjADokADs1ADg2ADkAAAAAAAULADcjADokADs1ADg2ADkAAAADCwBBIwBCJABDAAAAAwsAQSMAQiQAQwAAAwsASCMASSQASgAAAAMLAEgjAEkkAEoBAwADAQMAAwMLAE8jAFAkAFEAAAADCwBPIwBQJABRAQMAAwEDAAMDCwBWIwBXJABYAAAAAwsAViMAVyQAWAAAAAMLAF4jAF8kAGAAAAADCwBeIwBfJABgEQIBEjEBEzQBFDUBFTYBFzgBGDoOGTsPGj0BGz8OHEAQH0EBIEIBIUMOJUYRJkcVJ0gCKEkCKUoCKksCK0wCLE4CLVAOLlEWL1MCMFUOMVYXMlcCM1gCNFkON1wYOF0eOV4LOl8LO2ALPGELPWILPmQLP2YOQGcfQWkLQmsOQ2wgRG0LRW4LRm8OR3IhSHMlSXQGSnUGS3YGTHcGTXgGTnoGT3wOUH0mUX8GUoEBDlOCASdUgwEGVYQBBlaFAQ5XiAEoWIkBLFmKAQdaiwEHW4wBB1yNAQddjgEHXpABB1-SAQ5gkwEtYZYBB2KYAQ5jmQEuZJsBB2WcAQdmnQEOZ6ABL2ihATNpogEJaqMBCWukAQlspQEJbaYBCW6oAQlvqgEOcKsBNHGtAQlyrwEOc7ABNXSxAQl1sgEJdrMBDne2ATZ4twE8ebkBPXq6AT17vQE9fL4BPX2_AT1-wQE9f8MBDoABxAE-gQHGAT2CAcgBDoMByQE_hAHKAT2FAcsBPYYBzAEOhwHPAUCIAdABRIkB0gEDigHTAQOLAdYBA4wB1wEDjQHYAQOOAdoBA48B3AEOkAHdAUWRAd8BA5IB4QEOkwHiAUaUAeMBA5UB5AEDlgHlAQ6XAegBR5gB6QFLmQHqAQSaAesBBJsB7AEEnAHtAQSdAe4BBJ4B8AEEnwHyAQ6gAfMBTKEB9QEEogH3AQ6jAfgBTaQB-QEEpQH6AQSmAfsBDqcB_gFOqAH_AVKpAYACBaoBgQIFqwGCAgWsAYMCBa0BhAIFrgGGAgWvAYgCDrABiQJTsQGLAgWyAY0CDrMBjgJUtAGPAgW1AZACBbYBkQIOtwGUAlW4AZUCWbkBlwJaugGYAlq7AZsCWrwBnAJavQGdAlq-AZ8CWr8BoQIOwAGiAlvBAaQCWsIBpgIOwwGnAlzEAagCWsUBqQJaxgGqAg7HAa0CXcgBrgJh"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  IdeaCommentScalarFieldEnum: () => IdeaCommentScalarFieldEnum,
  IdeaMediaScalarFieldEnum: () => IdeaMediaScalarFieldEnum,
  IdeaPurchaseScalarFieldEnum: () => IdeaPurchaseScalarFieldEnum,
  IdeaScalarFieldEnum: () => IdeaScalarFieldEnum,
  IdeaVoteScalarFieldEnum: () => IdeaVoteScalarFieldEnum,
  JsonNull: () => JsonNull2,
  ModelName: () => ModelName,
  NewsletterSubscriberScalarFieldEnum: () => NewsletterSubscriberScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullsOrder: () => NullsOrder,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.5.0",
  engine: "280c870be64f457428992c43c1f6d557fab6e29e"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  Category: "Category",
  Idea: "Idea",
  IdeaMedia: "IdeaMedia",
  IdeaVote: "IdeaVote",
  IdeaComment: "IdeaComment",
  IdeaPurchase: "IdeaPurchase",
  NewsletterSubscriber: "NewsletterSubscriber",
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  description: "description",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var IdeaScalarFieldEnum = {
  id: "id",
  title: "title",
  problemStatement: "problemStatement",
  proposedSolution: "proposedSolution",
  description: "description",
  isPaid: "isPaid",
  price: "price",
  status: "status",
  rejectionReason: "rejectionReason",
  isHighlighted: "isHighlighted",
  submittedAt: "submittedAt",
  approvedAt: "approvedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  authorId: "authorId",
  categoryId: "categoryId"
};
var IdeaMediaScalarFieldEnum = {
  id: "id",
  ideaId: "ideaId",
  url: "url",
  altText: "altText",
  createdAt: "createdAt"
};
var IdeaVoteScalarFieldEnum = {
  id: "id",
  type: "type",
  ideaId: "ideaId",
  userId: "userId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var IdeaCommentScalarFieldEnum = {
  id: "id",
  content: "content",
  isDeleted: "isDeleted",
  ideaId: "ideaId",
  userId: "userId",
  parentId: "parentId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var IdeaPurchaseScalarFieldEnum = {
  id: "id",
  ideaId: "ideaId",
  userId: "userId",
  amount: "amount",
  currency: "currency",
  status: "status",
  paymentProvider: "paymentProvider",
  transactionId: "transactionId",
  purchasedAt: "purchasedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var NewsletterSubscriberScalarFieldEnum = {
  id: "id",
  email: "email",
  subscribed: "subscribed",
  subscribedAt: "subscribedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  role: "role",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
globalThis["__dirname"] = path2.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/app/lib/prisma.ts
var prismaGlobal = globalThis;
var adapter = new PrismaPg({
  connectionString: envVariables.DATABASE_URL
});
var prisma = prismaGlobal.prisma ?? new PrismaClient({
  adapter
});
if (envVariables.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma;
}

// src/app/lib/auth.ts
var SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
var toOrigin = (value) => new URL(value).origin;
var AUTH_PUBLIC_URL = envVariables.FRONTEND_URL.replace(/\/$/, "");
var GOOGLE_REDIRECT_URI = `${AUTH_PUBLIC_URL}/api/auth/callback/google`;
var userAdditionalFields = {
  role: {
    type: "string",
    required: true,
    defaultValue: UserRole.MEMBER
  },
  status: {
    type: "string",
    required: true,
    defaultValue: UserStatus.ACTIVE
  }
};
var auth = betterAuth({
  baseURL: AUTH_PUBLIC_URL,
  secret: envVariables.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  account: {
    // Local Google OAuth can lose the temporary state cookie across redirects.
    // Keep the security check enabled in production.
    skipStateCookieCheck: envVariables.NODE_ENV === "development"
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your EcoSpark password",
        templateName: "resetPassword",
        templateData: {
          name: user.name,
          resetUrl: url
        }
      });
    }
  },
  socialProviders: {
    google: {
      clientId: envVariables.GOOGLE_CLIENT_ID,
      clientSecret: envVariables.GOOGLE_CLIENT_SECRET,
      redirectURI: GOOGLE_REDIRECT_URI,
      mapProfileToUser: () => ({
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        emailVerified: true
      })
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your EcoSpark email",
        templateName: "verification",
        templateData: {
          name: user.name,
          verifyUrl: url
        }
      });
    }
  },
  user: {
    additionalFields: userAdditionalFields
  },
  session: {
    expiresIn: SEVEN_DAYS_IN_SECONDS,
    updateAge: 60 * 60 * 12
  },
  trustedOrigins: [
    toOrigin(envVariables.FRONTEND_URL),
    toOrigin(envVariables.BETTER_AUTH_URL)
  ],
  plugins: [
    bearer(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true }
        });
        const subject = type === "forget-password" ? "EcoSpark password reset OTP" : "EcoSpark email verification OTP";
        await sendEmail({
          to: email,
          subject,
          templateName: "otp",
          templateData: {
            title: subject,
            heading: type === "forget-password" ? "Password Reset OTP" : "Email Verification OTP",
            name: user?.name || "EcoSpark User",
            otp,
            expiresInMinutes: 2
          }
        });
      },
      expiresIn: 2 * 60,
      otpLength: 6
    })
  ],
  advanced: {
    useSecureCookies: authCookieSettings.shouldUseSecureCookies,
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: authCookieSettings.sameSite,
          path: "/",
          maxAge: SEVEN_DAYS_IN_SECONDS
        }
      }
    }
  }
});

// src/app/utils/jwt.ts
import jwt from "jsonwebtoken";
var createToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};
var verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token provided";
    return {
      success: false,
      message
    };
  }
};
var decodeToken = (token) => {
  const decoded = jwt.decode(token);
  return decoded && typeof decoded !== "string" ? decoded : null;
};
var jwtUtils = {
  createToken,
  verifyToken,
  decodeToken
};

// src/app/middleware/attachRequestUser.ts
var toWebHeaders = (req) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers.set(key, value);
      return;
    }
    if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  });
  return headers;
};
var attachRequestUser = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: toWebHeaders(req)
    });
    if (session?.user) {
      const role = String(session.user.role);
      if (role === "MEMBER" || role === "ADMIN") {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          role
        };
      }
    }
    if (!req.user) {
      const bearerToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : void 0;
      const accessToken = bearerToken || (typeof req.cookies?.accessToken === "string" ? req.cookies.accessToken : void 0);
      if (accessToken) {
        const verified = jwtUtils.verifyToken(
          accessToken,
          envVariables.ACCESS_TOKEN_SECRET
        );
        if (verified.success) {
          const role = verified.data.role;
          if ((role === "MEMBER" || role === "ADMIN") && typeof verified.data.id === "string" && typeof verified.data.email === "string") {
            req.user = {
              id: verified.data.id,
              email: verified.data.email,
              role
            };
          }
        }
      }
    }
  } catch {
  }
  next();
};

// src/app/middleware/globalErrorHandler.ts
import status4 from "http-status";
import z from "zod";

// src/app/errorHelpers/handlePrismaErrors.ts
import status2 from "http-status";
var getStatusCodeFromPrismaError = (errorCode) => {
  if (errorCode === "P2002") {
    return status2.CONFLICT;
  }
  if (["P2025", "P2001", "P2015", "P2018"].includes(errorCode)) {
    return status2.NOT_FOUND;
  }
  if (["P1000", "P6002"].includes(errorCode)) {
    return status2.UNAUTHORIZED;
  }
  if (["P1010", "P6010"].includes(errorCode)) {
    return status2.FORBIDDEN;
  }
  if (errorCode === "P6003") {
    return status2.PAYMENT_REQUIRED;
  }
  if (["P1008", "P2004", "P6004"].includes(errorCode)) {
    return status2.GATEWAY_TIMEOUT;
  }
  if (errorCode === "P5011") {
    return status2.TOO_MANY_REQUESTS;
  }
  if (errorCode === "P6009") {
    return 413;
  }
  if (errorCode.startsWith("P1") || ["P2024", "P2037", "P6008"].includes(errorCode)) {
    return status2.SERVICE_UNAVAILABLE;
  }
  if (errorCode.startsWith("P2")) {
    return status2.BAD_REQUEST;
  }
  if (errorCode.startsWith("P3") || errorCode.startsWith("P4")) {
    return status2.INTERNAL_SERVER_ERROR;
  }
  return status2.INTERNAL_SERVER_ERROR;
};
var formatErrorMeta = (meta) => {
  if (!meta) return "";
  const parts = [];
  if (meta.target) {
    parts.push(`Field(s): ${String(meta.target)}`);
  }
  if (meta.field_name) {
    parts.push(`Field: ${String(meta.field_name)}`);
  }
  if (meta.column_name) {
    parts.push(`Column: ${String(meta.column_name)}`);
  }
  if (meta.table) {
    parts.push(`Table: ${String(meta.table)}`);
  }
  if (meta.model_name) {
    parts.push(`Model: ${String(meta.model_name)}`);
  }
  if (meta.relation_name) {
    parts.push(`Relation: ${String(meta.relation_name)}`);
  }
  if (meta.constraint) {
    parts.push(`Constraint: ${String(meta.constraint)}`);
  }
  if (meta.database_error) {
    parts.push(`Database Error: ${String(meta.database_error)}`);
  }
  return parts.length > 0 ? parts.join(" |") : "";
};
var handlePrismaClientKnownRequestError = (error) => {
  const statusCode = getStatusCodeFromPrismaError(error.code);
  const metaInfo = formatErrorMeta(error.meta);
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred with the database operation.";
  const errorSources = [
    {
      path: error.code,
      message: metaInfo ? `${mainMessage} | ${metaInfo}` : mainMessage
    }
  ];
  if (error.meta?.cause) {
    errorSources.push({
      path: "cause",
      message: String(error.meta.cause)
    });
  }
  return {
    success: false,
    statusCode,
    message: `Prisma Client Known Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientUnknownError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An unknown error occurred with the database operation.";
  const errorSources = [
    {
      path: "Unknown Prisma Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode: status2.INTERNAL_SERVER_ERROR,
    message: `Prisma Client Unknown Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientValidationError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const errorSources = [];
  const fieldMatch = cleanMessage.match(/Argument `(\w+)`/i);
  const fieldName = fieldMatch ? fieldMatch[1] : "Unknown Field";
  const mainMessage = lines.find(
    (line) => !line.includes("Argument") && !line.includes("\u2192") && line.length > 10
  ) || lines[0] || "Invalid query parameters provided to the database operation.";
  errorSources.push({
    path: fieldName,
    message: mainMessage
  });
  return {
    success: false,
    statusCode: status2.BAD_REQUEST,
    message: `Prisma Client Validation Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientInitializationError = (error) => {
  const statusCode = error.errorCode ? getStatusCodeFromPrismaError(error.errorCode) : status2.SERVICE_UNAVAILABLE;
  const cleanMessage = error.message;
  cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred while initializing the Prisma Client.";
  const errorSources = [
    {
      path: error.errorCode || "Initialization Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode,
    message: `Prisma Client Initialization Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientRustPanicError = () => {
  const errorSources = [
    {
      path: "Rust Engine Crashed",
      message: "The database engine encountered a fatal error and crashed. This is usually due to an internal bug in the Prisma engine or an unexpected edge case in the database operation. Please check the Prisma logs for more details and consider reporting this issue to the Prisma team if it persists."
    }
  ];
  return {
    success: false,
    statusCode: status2.INTERNAL_SERVER_ERROR,
    message: "Prisma Client Rust Panic Error: The database engine crashed due to a fatal error.",
    errorSources
  };
};

// src/app/errorHelpers/handleZodError.ts
import status3 from "http-status";
var handleZodError = (err) => {
  const statusCode = status3.BAD_REQUEST;
  const message = "Zod Validation Error";
  const errorSources = [];
  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => "),
      message: issue.message
    });
  });
  return {
    success: false,
    message,
    errorSources,
    statusCode
  };
};

// src/app/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  if (envVariables.NODE_ENV === "development") {
    console.log("Error from Global Error Handler", err);
  }
  let errorSources = [];
  let statusCode = status4.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack;
  if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    const simplified = handlePrismaClientKnownRequestError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    const simplified = handlePrismaClientUnknownError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    const simplified = handlePrismaClientValidationError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    const simplified = handlerPrismaClientInitializationError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    const simplified = handlerPrismaClientRustPanicError();
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof z.ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof AppError_default) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
    stack = err.stack;
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
    stack = err.stack;
  }
  const errorResponse = {
    success: false,
    message,
    errorSources,
    error: envVariables.NODE_ENV === "development" ? err : void 0,
    stack: envVariables.NODE_ENV === "development" ? stack : void 0
  };
  res.status(statusCode).json(errorResponse);
};

// src/app/middleware/notFound.ts
var notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
};

// src/app/routes/index.ts
import { Router as Router12 } from "express";

// src/app/modules/ai/ai.route.ts
import { Router } from "express";

// src/app/middleware/validateRequest.ts
var validateRequest = (schema) => {
  return async (req, res, next) => {
    await schema.parseAsync({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {}
    });
    next();
  };
};

// src/app/modules/ai/ai.controller.ts
import status5 from "http-status";

// src/app/shared/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// src/app/shared/sendResponse.ts
var sendResponse = (res, payload) => {
  const { statusCode, ...rest } = payload;
  return res.status(statusCode).json(rest);
};

// src/app/modules/ai/ai.service.ts
var DEFAULT_GEMINI_MODEL = envVariables.GEMINI.MODEL || "gemini-2.5-flash-lite";
var MAX_GEMINI_RETRIES = 1;
var getGeminiApiKey = () => {
  if (!envVariables.GEMINI.API_KEY) {
    throw new AppError_default(500, "GEMINI_API_KEY is not configured");
  }
  return envVariables.GEMINI.API_KEY;
};
var formatIdeasForPrompt = (ideas) => ideas.map(
  (idea, index) => `${index + 1}. ${idea.title} | Category: ${idea.category} | Paid: ${idea.isPaid ? "yes" : "no"} | Upvotes: ${idea.upvotes} | Comments: ${idea.commentCount}
Problem: ${idea.problemStatement}
Solution: ${idea.proposedSolution}
Description: ${idea.description}`
).join("\n\n");
var sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
var getRetryDelayMs = (message) => {
  if (!message) return null;
  const match = message.match(/Please retry in\s+([\d.]+)s/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  if (Number.isNaN(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds * 1e3);
};
var mapGeminiErrorToStatusCode = (responseStatus, payload) => {
  const message = payload.error?.message?.toLowerCase() || "";
  const providerCode = payload.error?.code;
  const providerStatus = payload.error?.status?.toLowerCase() || "";
  if (responseStatus === 429 || providerCode === 429 || providerStatus.includes("resource_exhausted") || message.includes("quota exceeded") || message.includes("rate limit") || message.includes("resource exhausted")) {
    return 429;
  }
  if (responseStatus === 401 || responseStatus === 403 || providerCode === 401 || providerCode === 403) {
    return 502;
  }
  if (responseStatus >= 400 && responseStatus < 500) {
    return 400;
  }
  return 502;
};
var createGeminiError = (responseStatus, payload) => {
  const statusCode = mapGeminiErrorToStatusCode(responseStatus, payload);
  const providerMessage = payload.error?.message || "Gemini request failed";
  if (statusCode === 429) {
    const retryDelayMs = getRetryDelayMs(providerMessage);
    const retryText = retryDelayMs ? ` Please try again in ${Math.ceil(retryDelayMs / 1e3)} seconds.` : " Please try again shortly.";
    return new AppError_default(
      429,
      `AI request limit reached for the configured Gemini account.${retryText}`
    );
  }
  return new AppError_default(statusCode, providerMessage);
};
var requestGemini = async (input) => {
  let attempt = 0;
  try {
    while (true) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": getGeminiApiKey()
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: input.systemInstruction }]
            },
            contents: [
              {
                role: "user",
                parts: [{ text: input.prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.5,
              topP: 0.9
            }
          })
        }
      );
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new AppError_default(502, "Gemini returned an unreadable response");
      }
      if (response.ok && !payload.error) {
        return payload;
      }
      const retryDelayMs = getRetryDelayMs(payload.error?.message);
      const shouldRetry = attempt < MAX_GEMINI_RETRIES && mapGeminiErrorToStatusCode(response.status, payload) === 429 && retryDelayMs !== null && retryDelayMs <= 3e4;
      if (!shouldRetry) {
        throw createGeminiError(response.status, payload);
      }
      attempt += 1;
      await sleep(retryDelayMs);
    }
  } catch (error) {
    if (error instanceof AppError_default) {
      throw error;
    }
    throw new AppError_default(502, "Failed to communicate with Gemini");
  }
};
var parseGeminiJson = async (input) => {
  const payload = await requestGemini(input);
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() || "";
  if (!text) {
    throw new AppError_default(502, "Gemini returned an empty response");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError_default(502, "Gemini returned invalid JSON");
  }
};
var askAssistant = async (payload) => {
  return parseGeminiJson({
    systemInstruction: "You are EcoSpark Hub's AI assistant. Answer only from the supplied platform context and return valid JSON.",
    prompt: `Platform: EcoSpark Hub, a sustainability idea-sharing platform. Public ideas can be free or paid. Members draft ideas and admins review them before approval.

Available idea catalog:
${formatIdeasForPrompt(payload.ideas)}

User question:
${payload.question}

Return JSON with:
- answer: concise, grounded answer based on the supplied context
- suggestions: 2 to 3 short follow-up prompts

If the answer is uncertain, say so briefly instead of inventing details.`
  });
};
var generateDraft = async (payload) => {
  return parseGeminiJson({
    systemInstruction: "You are EcoSpark Hub's idea drafting assistant. Strengthen the user's draft and return only valid JSON.",
    prompt: `Platform: EcoSpark Hub. The user is drafting a sustainability idea submission for admin review.

Current draft:
- Title: ${payload.title || "(empty)"}
- Category: ${payload.categoryName || "(not selected)"}
- Problem statement: ${payload.problemStatement || "(empty)"}
- Proposed solution: ${payload.proposedSolution || "(empty)"}
- Description: ${payload.description || "(empty)"}
- Paid idea: ${payload.isPaid ? "yes" : "no"}

Return JSON with:
- title
- categoryHint
- problemStatement
- proposedSolution
- description
- mediaUrls
- price
- readinessScore
- reasons

Rules:
- Improve and complete the draft without changing the core intent.
- Keep the content practical and reviewable, not overly promotional.
- mediaUrls should usually be an empty string unless the user already implies specific media assets.
- Set price only when the idea is paid. Omit price for free ideas.
- readinessScore must be 0-100.
- reasons should explain the improvement choices briefly.`
  });
};
var AiService = {
  askAssistant,
  generateDraft
};

// src/app/modules/ai/ai.controller.ts
var assistant = catchAsync(async (req, res) => {
  const result = await AiService.askAssistant(req.body);
  sendResponse(res, {
    statusCode: status5.OK,
    success: true,
    message: "AI assistant response generated successfully",
    data: result
  });
});
var draft = catchAsync(async (req, res) => {
  const result = await AiService.generateDraft(req.body);
  sendResponse(res, {
    statusCode: status5.OK,
    success: true,
    message: "AI draft generated successfully",
    data: result
  });
});
var AiController = {
  assistant,
  draft
};

// src/app/modules/ai/ai.validation.ts
import z2 from "zod";
var ideaContext = z2.object({
  id: z2.string(),
  title: z2.string().min(1).max(200),
  category: z2.string().min(1).max(120),
  isPaid: z2.boolean(),
  upvotes: z2.number().int(),
  commentCount: z2.number().int(),
  problemStatement: z2.string().min(1).max(4e3),
  proposedSolution: z2.string().min(1).max(4e3),
  description: z2.string().min(1).max(8e3)
});
var assistant2 = z2.object({
  body: z2.object({
    question: z2.string().trim().min(1).max(1e3),
    ideas: z2.array(ideaContext).max(20)
  })
});
var draft2 = z2.object({
  body: z2.object({
    title: z2.string().max(160),
    categoryName: z2.string().max(80).optional(),
    problemStatement: z2.string().max(4e3),
    proposedSolution: z2.string().max(4e3),
    description: z2.string().max(8e3),
    isPaid: z2.boolean()
  })
});
var AiValidation = {
  assistant: assistant2,
  draft: draft2
};

// src/app/modules/ai/ai.route.ts
var router = Router();
router.post("/assistant", validateRequest(AiValidation.assistant), AiController.assistant);
router.post("/draft", validateRequest(AiValidation.draft), AiController.draft);
var AiRoutes = router;

// src/app/modules/admin/admin.route.ts
import { Router as Router2 } from "express";

// src/app/middleware/checkAuth.ts
var checkAuth = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
  };
};

// src/app/modules/admin/admin.controller.ts
import status6 from "http-status";

// src/app/modules/admin/admin.service.ts
var getStats = async () => {
  const [
    totalUsers,
    totalIdeas,
    approvedIdeas,
    rejectedIdeas,
    underReviewIdeas,
    totalComments,
    totalPaidPurchases
  ] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { status: IdeaStatus.APPROVED } }),
    prisma.idea.count({ where: { status: IdeaStatus.REJECTED } }),
    prisma.idea.count({ where: { status: IdeaStatus.UNDER_REVIEW } }),
    prisma.ideaComment.count(),
    prisma.ideaPurchase.count({ where: { status: PurchaseStatus.PAID } })
  ]);
  return {
    totalUsers,
    totalIdeas,
    approvedIdeas,
    rejectedIdeas,
    underReviewIdeas,
    totalComments,
    totalPaidPurchases
  };
};
var updateUserStatus = async (id, status17) => {
  return prisma.user.update({
    where: { id },
    data: {
      status: status17
    }
  });
};
var AdminService = {
  getStats,
  updateUserStatus
};

// src/app/modules/admin/admin.controller.ts
var getStats2 = catchAsync(async (_req, res) => {
  const result = await AdminService.getStats();
  sendResponse(res, {
    statusCode: status6.OK,
    success: true,
    message: "Admin stats fetched successfully",
    data: result
  });
});
var updateUserStatus2 = catchAsync(async (req, res) => {
  const result = await AdminService.updateUserStatus(String(req.params.id), req.body.status);
  sendResponse(res, {
    statusCode: status6.OK,
    success: true,
    message: "User status updated successfully",
    data: result
  });
});
var AdminController = {
  getStats: getStats2,
  updateUserStatus: updateUserStatus2
};

// src/app/modules/admin/admin.validation.ts
import z3 from "zod";
var updateUserStatus3 = z3.object({
  body: z3.object({
    status: z3.enum(["ACTIVE", "DEACTIVATED"])
  })
});
var AdminValidation = {
  updateUserStatus: updateUserStatus3
};

// src/app/modules/admin/admin.route.ts
var router2 = Router2();
router2.get("/stats", checkAuth("ADMIN"), AdminController.getStats);
router2.patch(
  "/users/:id/status",
  checkAuth("ADMIN"),
  validateRequest(AdminValidation.updateUserStatus),
  AdminController.updateUserStatus
);
var AdminRoutes = router2;

// src/app/modules/auth/auth.route.ts
import { Router as Router3 } from "express";

// src/app/modules/auth/auth.controller.ts
import status8 from "http-status";

// src/app/utils/cookie.ts
var setCookie = (res, key, value, options) => {
  res.cookie(key, value, options);
};
var getCookie = (req, key) => {
  const value = req.cookies?.[key];
  return typeof value === "string" ? value : void 0;
};
var getBetterAuthSessionCookie = (req) => {
  return getCookie(req, "__Secure-better-auth.session_token") || getCookie(req, "better-auth.session_token") || getCookie(req, "session_token");
};
var clearCookie = (res, key, options) => {
  res.clearCookie(key, options);
};
var CookieUtils = {
  setCookie,
  getCookie,
  getBetterAuthSessionCookie,
  clearCookie
};

// src/app/utils/token.ts
var SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1e3;
var getCookieCommonOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: authCookieSettings.sameSite,
  path: "/",
  maxAge: SEVEN_DAYS_IN_MS
});
var logCookieOperation = (action, key, options) => {
  if (envVariables.NODE_ENV !== "production") {
    console.log("auth cookie", {
      action,
      key,
      domain: options.domain ?? null,
      path: options.path ?? null,
      sameSite: options.sameSite ?? null,
      secure: options.secure ?? null,
      httpOnly: options.httpOnly ?? null,
      maxAge: options.maxAge ?? null
    });
  }
};
var getAccessToken = (payload) => {
  return jwtUtils.createToken(payload, envVariables.ACCESS_TOKEN_SECRET, {
    expiresIn: envVariables.ACCESS_TOKEN_EXPIRES_IN
  });
};
var getRefreshToken = (payload) => {
  return jwtUtils.createToken(payload, envVariables.REFRESH_TOKEN_SECRET, {
    expiresIn: envVariables.REFRESH_TOKEN_EXPIRES_IN
  });
};
var setAccessTokenCookie = (res, token) => {
  const options = getCookieCommonOptions();
  logCookieOperation("set", "accessToken", options);
  CookieUtils.setCookie(res, "accessToken", token, options);
};
var setRefreshTokenCookie = (res, token) => {
  const options = getCookieCommonOptions();
  logCookieOperation("set", "refreshToken", options);
  CookieUtils.setCookie(res, "refreshToken", token, options);
};
var setBetterAuthSessionCookie = (res, token) => {
  const options = getCookieCommonOptions();
  logCookieOperation("set", "better-auth.session_token", options);
  CookieUtils.setCookie(res, "better-auth.session_token", token, options);
};
var clearCookieWithLogging = (res, key, options) => {
  logCookieOperation("clear", key, options);
  CookieUtils.clearCookie(res, key, options);
};
var clearAuthCookies = (res) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: authCookieSettings.sameSite,
    path: "/"
  };
  clearCookieWithLogging(res, "accessToken", options);
  clearCookieWithLogging(res, "refreshToken", options);
  clearCookieWithLogging(res, "__Secure-better-auth.session_token", options);
  clearCookieWithLogging(res, "better-auth.session_token", options);
  clearCookieWithLogging(res, "session_token", options);
};
var tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
  clearAuthCookies
};

// src/app/modules/auth/auth.service.ts
import status7 from "http-status";
var getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true
    }
  });
};
var getUserBySessionToken = async (sessionToken) => {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: {
      token: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true
        }
      }
    }
  });
  if (!session || session.expiresAt <= /* @__PURE__ */ new Date()) {
    throw new AppError_default(status7.UNAUTHORIZED, "Invalid session token");
  }
  return session.user;
};
var getTrustedCallbackUrl = (callbackUrl) => {
  const defaultCallbackUrl = envVariables.FRONTEND_URL;
  if (!callbackUrl) {
    return defaultCallbackUrl;
  }
  try {
    const requestedUrl = new URL(callbackUrl);
    const allowedOrigin = new URL(defaultCallbackUrl).origin;
    if (requestedUrl.origin !== allowedOrigin) {
      return defaultCallbackUrl;
    }
    return requestedUrl.toString();
  } catch {
    return defaultCallbackUrl;
  }
};
var getGoogleCallbackHandlerUrl = (redirectTo) => {
  const callbackUrl = new URL(
    `${envVariables.FRONTEND_URL.replace(/\/$/, "")}/api/v1/auth/google/callback`
  );
  callbackUrl.searchParams.set(
    "redirectTo",
    getTrustedCallbackUrl(redirectTo)
  );
  return callbackUrl.toString();
};
var toTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status || UserStatus.ACTIVE,
  emailVerified: user.emailVerified ?? false
});
var parseSignInOrSignUpResponse = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const token = "token" in value && typeof value.token === "string" ? value.token : void 0;
  if (!("user" in value) || !value.user || typeof value.user !== "object") {
    return { token };
  }
  const userObject = value.user;
  if (typeof userObject.id !== "string" || typeof userObject.name !== "string" || typeof userObject.email !== "string" || userObject.role !== "MEMBER" && userObject.role !== "ADMIN") {
    return { token };
  }
  const statusValue = userObject.status === UserStatus.ACTIVE || userObject.status === UserStatus.DEACTIVATED ? userObject.status : void 0;
  return {
    token,
    user: {
      id: userObject.id,
      name: userObject.name,
      email: userObject.email,
      role: userObject.role,
      status: statusValue,
      emailVerified: typeof userObject.emailVerified === "boolean" ? userObject.emailVerified : void 0
    }
  };
};
var getCurrentUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true
    }
  });
  if (!user) {
    throw new AppError_default(status7.UNAUTHORIZED, "Unauthorized");
  }
  return user;
};
var register = async (payload) => {
  const result = await auth.api.signUpEmail({
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password
    }
  });
  const parsed = parseSignInOrSignUpResponse(result);
  if (!parsed.user) {
    throw new AppError_default(status7.BAD_REQUEST, "Failed to register user");
  }
  const accessToken = tokenUtils.getAccessToken(toTokenPayload(parsed.user));
  const refreshToken2 = tokenUtils.getRefreshToken(toTokenPayload(parsed.user));
  return {
    accessToken,
    refreshToken: refreshToken2,
    sessionToken: parsed.token,
    user: parsed.user
  };
};
var login = async (payload) => {
  const result = await auth.api.signInEmail({
    body: {
      email: payload.email,
      password: payload.password
    }
  });
  const parsed = parseSignInOrSignUpResponse(result);
  if (!parsed.user) {
    throw new AppError_default(status7.UNAUTHORIZED, "Invalid email or password");
  }
  if (parsed.user.status === UserStatus.DEACTIVATED) {
    throw new AppError_default(status7.FORBIDDEN, "User account is deactivated");
  }
  const accessToken = tokenUtils.getAccessToken(toTokenPayload(parsed.user));
  const refreshToken2 = tokenUtils.getRefreshToken(toTokenPayload(parsed.user));
  return {
    accessToken,
    refreshToken: refreshToken2,
    sessionToken: parsed.token,
    user: parsed.user
  };
};
var getNewToken = async (payload, cookieRefreshToken, headerRefreshToken, sessionToken) => {
  const refreshToken2 = payload?.refreshToken || cookieRefreshToken || headerRefreshToken;
  if (!refreshToken2 && !sessionToken) {
    return null;
  }
  const user = await (async () => {
    if (refreshToken2) {
      const verifiedRefreshToken = jwtUtils.verifyToken(
        refreshToken2,
        envVariables.REFRESH_TOKEN_SECRET
      );
      if (!verifiedRefreshToken.success) {
        return null;
      }
      if (typeof verifiedRefreshToken.data.id !== "string" || typeof verifiedRefreshToken.data.email !== "string" || verifiedRefreshToken.data.role !== "MEMBER" && verifiedRefreshToken.data.role !== "ADMIN") {
        return null;
      }
      return getUserById(verifiedRefreshToken.data.id);
    }
    if (sessionToken) {
      try {
        return await getUserBySessionToken(sessionToken);
      } catch {
        return null;
      }
    }
    return null;
  })();
  if (!user) {
    return null;
  }
  if (user.status === UserStatus.DEACTIVATED) {
    throw new AppError_default(status7.FORBIDDEN, "User account is deactivated");
  }
  if (sessionToken && refreshToken2) {
    let sessionUser = null;
    try {
      sessionUser = await getUserBySessionToken(sessionToken);
    } catch {
      return null;
    }
    if (!sessionUser || sessionUser.id !== user.id) {
      return null;
    }
  }
  const tokenPayload = toTokenPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified
  });
  const newAccessToken = tokenUtils.getAccessToken(tokenPayload);
  const newRefreshToken = tokenUtils.getRefreshToken(tokenPayload);
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken
  };
};
var getGoogleSignInUrl = async (callbackUrl) => {
  const payload = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: getGoogleCallbackHandlerUrl(callbackUrl)
    }
  });
  if (!payload.url) {
    throw new AppError_default(status7.BAD_REQUEST, "Google sign-in URL was not returned");
  }
  return payload.url;
};
var startGoogleSignIn = async (callbackUrl) => {
  return auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: getGoogleCallbackHandlerUrl(callbackUrl)
    },
    asResponse: true
  });
};
var completeSocialLogin = async (requestHeaders, sessionToken) => {
  let user = null;
  try {
    const session = await auth.api.getSession({
      headers: requestHeaders
    });
    if (session?.user) {
      const role = String(session.user.role);
      if ((role === "MEMBER" || role === "ADMIN") && typeof session.user.id === "string" && typeof session.user.email === "string") {
        user = await getUserById(session.user.id);
      }
    }
  } catch {
    user = null;
  }
  if (!user) {
    user = await getUserBySessionToken(sessionToken);
  }
  if (user.status === UserStatus.DEACTIVATED) {
    throw new AppError_default(status7.FORBIDDEN, "User account is deactivated");
  }
  const tokenPayload = toTokenPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified
  });
  return {
    accessToken: tokenUtils.getAccessToken(tokenPayload),
    refreshToken: tokenUtils.getRefreshToken(tokenPayload),
    sessionToken,
    user
  };
};
var changePassword = async (userId, payload, sessionToken) => {
  if (!sessionToken) {
    throw new AppError_default(status7.UNAUTHORIZED, "Session token is required");
  }
  await auth.api.changePassword({
    body: {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      revokeOtherSessions: true
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`
    })
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true
    }
  });
  if (!user) {
    throw new AppError_default(status7.NOT_FOUND, "User not found");
  }
  const tokenPayload = toTokenPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified
  });
  return {
    accessToken: tokenUtils.getAccessToken(tokenPayload),
    refreshToken: tokenUtils.getRefreshToken(tokenPayload),
    sessionToken
  };
};
var logout = async (sessionToken) => {
  if (!sessionToken) {
    return null;
  }
  return auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`
    }),
    asResponse: true
  });
};
var verifyEmail = async (payload) => {
  await auth.api.verifyEmailOTP({
    body: {
      email: payload.email,
      otp: payload.otp
    }
  });
};
var forgotPassword = async (payload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true }
  });
  if (!user) {
    throw new AppError_default(status7.NOT_FOUND, "User not found");
  }
  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email: payload.email
    }
  });
};
var resetPassword = async (payload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true }
  });
  if (!user) {
    throw new AppError_default(status7.NOT_FOUND, "User not found");
  }
  await auth.api.resetPasswordEmailOTP({
    body: {
      email: payload.email,
      otp: payload.otp,
      password: payload.newPassword
    }
  });
  await prisma.session.deleteMany({
    where: {
      userId: user.id
    }
  });
};
var AuthService = {
  register,
  login,
  getNewToken,
  getGoogleSignInUrl,
  startGoogleSignIn,
  completeSocialLogin,
  changePassword,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser
};

// src/app/modules/auth/auth.controller.ts
var getRefreshTokenFromHeader = (req) => {
  const headerValue = req.headers["x-refresh-token"];
  if (typeof headerValue === "string") {
    return headerValue;
  }
  if (Array.isArray(headerValue) && typeof headerValue[0] === "string") {
    return headerValue[0];
  }
  return void 0;
};
var getGoogleCallbackUrlFromRequest = (req) => {
  if (typeof req.query.callbackUrl === "string") {
    return req.query.callbackUrl;
  }
  if (typeof req.body?.callbackUrl === "string") {
    return req.body.callbackUrl;
  }
  return envVariables.FRONTEND_URL;
};
var toWebHeaders2 = (req) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers.set(key, value);
      return;
    }
    if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  });
  return headers;
};
var getSetCookieHeaders = (headers) => {
  const getSetCookie = headers.getSetCookie;
  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }
  const cookieHeader = headers.get("set-cookie");
  if (!cookieHeader) {
    return [];
  }
  const cookies = [];
  let start = 0;
  let inExpiresAttribute = false;
  for (let index = 0; index < cookieHeader.length; index += 1) {
    const current = cookieHeader[index];
    const ahead = cookieHeader.slice(index, index + 8).toLowerCase();
    if (ahead === "expires=") {
      inExpiresAttribute = true;
      continue;
    }
    if (inExpiresAttribute && current === ";") {
      inExpiresAttribute = false;
      continue;
    }
    if (!inExpiresAttribute && current === ",") {
      const next = cookieHeader.slice(index + 1);
      if (/^\s*[^=;, ]+=/.test(next)) {
        cookies.push(cookieHeader.slice(start, index).trim());
        start = index + 1;
      }
    }
  }
  cookies.push(cookieHeader.slice(start).trim());
  return cookies.filter(Boolean);
};
var applyResponseCookies = (res, headers) => {
  const cookies = getSetCookieHeaders(headers);
  if (cookies.length > 0) {
    res.setHeader("set-cookie", cookies);
  }
};
var logGoogleCallbackDiagnostics = (req, redirectTo, sessionToken) => {
  console.log("google callback", {
    url: req.originalUrl,
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    xForwardedHost: req.headers["x-forwarded-host"],
    xForwardedProto: req.headers["x-forwarded-proto"],
    callbackOrigin: `${req.protocol}://${req.get("host")}`,
    resolvedRedirectTo: redirectTo,
    hasSessionTokenCookie: Boolean(sessionToken),
    redirectingToFrontend: redirectTo.startsWith(envVariables.FRONTEND_URL)
  });
  console.log("google callback cookie config", {
    domain: null,
    path: "/",
    sameSite: authCookieSettings.sameSite,
    secure: authCookieSettings.shouldUseSecureCookies,
    httpOnly: true
  });
};
var register2 = catchAsync(async (req, res) => {
  if (req.body?.role === "ADMIN") {
    throw new AppError_default(
      status8.FORBIDDEN,
      "Admin accounts can only be created through seeding"
    );
  }
  const result = await AuthService.register(req.body);
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }
  sendResponse(res, {
    statusCode: status8.CREATED,
    success: true,
    message: "User registered successfully",
    data: result
  });
});
var login2 = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "User logged in successfully",
    data: result
  });
});
var refreshToken = catchAsync(async (req, res) => {
  const result = await AuthService.getNewToken(
    req.body,
    typeof req.cookies.refreshToken === "string" ? req.cookies.refreshToken : void 0,
    getRefreshTokenFromHeader(req),
    CookieUtils.getBetterAuthSessionCookie(req)
  );
  if (!result) {
    tokenUtils.clearAuthCookies(res);
    return sendResponse(res, {
      statusCode: status8.UNAUTHORIZED,
      success: false,
      message: "Refresh token or session token is required"
    });
  }
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Token refreshed successfully",
    data: result
  });
});
var googleSignIn = catchAsync(async (req, res) => {
  const callbackUrl = getGoogleCallbackUrlFromRequest(req);
  const authResponse = await AuthService.startGoogleSignIn(callbackUrl);
  applyResponseCookies(res, authResponse.headers);
  const location = authResponse.headers.get("location");
  if (location) {
    return res.redirect(
      authResponse.status >= 300 && authResponse.status < 400 ? authResponse.status : status8.TEMPORARY_REDIRECT,
      location
    );
  }
  const payload = await authResponse.text();
  return res.status(authResponse.status).type(authResponse.headers.get("content-type") || "application/json").send(payload);
});
var googleSignInUrl = catchAsync(async (req, res) => {
  const callbackUrl = getGoogleCallbackUrlFromRequest(req);
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Google sign-in URL generated successfully",
    data: {
      url: await AuthService.getGoogleSignInUrl(callbackUrl)
    }
  });
});
var googleCallback = catchAsync(async (req, res) => {
  const sessionToken = CookieUtils.getBetterAuthSessionCookie(req);
  if (!sessionToken) {
    throw new AppError_default(status8.UNAUTHORIZED, "Session token is required");
  }
  const result = await AuthService.completeSocialLogin(
    toWebHeaders2(req),
    sessionToken
  );
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  const redirectTo = typeof req.query.redirectTo === "string" ? req.query.redirectTo : envVariables.FRONTEND_URL;
  logGoogleCallbackDiagnostics(req, redirectTo, sessionToken);
  res.redirect(status8.TEMPORARY_REDIRECT, redirectTo);
});
var me = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new AppError_default(status8.UNAUTHORIZED, "Unauthorized");
  }
  const result = await AuthService.getCurrentUser(req.user.id);
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Current user fetched successfully",
    data: result
  });
});
var changePassword2 = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new AppError_default(status8.UNAUTHORIZED, "Unauthorized");
  }
  const result = await AuthService.changePassword(
    req.user.id,
    req.body,
    CookieUtils.getBetterAuthSessionCookie(req)
  );
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Password changed successfully",
    data: result
  });
});
var logout2 = catchAsync(async (req, res) => {
  const authResponse = await AuthService.logout(
    CookieUtils.getBetterAuthSessionCookie(req)
  );
  if (authResponse) {
    applyResponseCookies(res, authResponse.headers);
  }
  tokenUtils.clearAuthCookies(res);
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "User logged out successfully"
  });
});
var verifyEmail2 = catchAsync(async (req, res) => {
  await AuthService.verifyEmail(req.body);
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Email verified successfully"
  });
});
var forgotPassword2 = catchAsync(async (req, res) => {
  await AuthService.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Password reset OTP sent successfully"
  });
});
var resetPassword2 = catchAsync(async (req, res) => {
  await AuthService.resetPassword(req.body);
  sendResponse(res, {
    statusCode: status8.OK,
    success: true,
    message: "Password reset successfully"
  });
});
var AuthController = {
  register: register2,
  login: login2,
  refreshToken,
  googleSignIn,
  googleSignInUrl,
  googleCallback,
  me,
  changePassword: changePassword2,
  logout: logout2,
  verifyEmail: verifyEmail2,
  forgotPassword: forgotPassword2,
  resetPassword: resetPassword2
};

// src/app/modules/auth/auth.validation.ts
import z4 from "zod";
var AuthValidation = {
  register: z4.object({
    body: z4.object({
      name: z4.string().min(2),
      email: z4.email(),
      password: z4.string().min(6)
    }).strict()
  }),
  login: z4.object({
    body: z4.object({
      email: z4.email(),
      password: z4.string().min(6)
    })
  }),
  refreshToken: z4.object({
    body: z4.object({
      refreshToken: z4.string().optional()
    })
  }),
  changePassword: z4.object({
    body: z4.object({
      currentPassword: z4.string().min(6),
      newPassword: z4.string().min(6)
    })
  }),
  verifyEmail: z4.object({
    body: z4.object({
      email: z4.email(),
      otp: z4.string().length(6)
    })
  }),
  forgotPassword: z4.object({
    body: z4.object({
      email: z4.email()
    })
  }),
  resetPassword: z4.object({
    body: z4.object({
      email: z4.email(),
      otp: z4.string().length(6),
      newPassword: z4.string().min(6)
    })
  })
};

// src/app/modules/auth/auth.route.ts
var router3 = Router3();
router3.post(
  "/register",
  validateRequest(AuthValidation.register),
  AuthController.register
);
router3.post("/login", validateRequest(AuthValidation.login), AuthController.login);
router3.post("/google", AuthController.googleSignInUrl);
router3.get("/google", AuthController.googleSignIn);
router3.get("/google/url", AuthController.googleSignInUrl);
router3.get("/google/callback", AuthController.googleCallback);
router3.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshToken),
  AuthController.refreshToken
);
router3.get("/me", checkAuth("MEMBER", "ADMIN"), AuthController.me);
router3.post(
  "/change-password",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(AuthValidation.changePassword),
  AuthController.changePassword
);
router3.post("/logout", checkAuth("MEMBER", "ADMIN"), AuthController.logout);
router3.post(
  "/verify-email",
  validateRequest(AuthValidation.verifyEmail),
  AuthController.verifyEmail
);
router3.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPassword),
  AuthController.forgotPassword
);
router3.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPassword),
  AuthController.resetPassword
);
var AuthRoutes = router3;

// src/app/modules/category/category.route.ts
import { Router as Router4 } from "express";

// src/app/modules/category/category.controller.ts
import status9 from "http-status";

// src/app/utils/QueryBuilder.ts
var QueryBuilder = class {
  constructor(query, initialWhere, initialOrderBy) {
    this.query = query;
    this.where = { ...initialWhere };
    this.orderBy = { ...initialOrderBy };
  }
  where;
  orderBy;
  page = 1;
  limit = 10;
  skip = 0;
  search(fields) {
    const rawSearchTerm = this.query.searchTerm;
    const searchTerm = Array.isArray(rawSearchTerm) ? rawSearchTerm[0] : rawSearchTerm;
    if (!searchTerm) return this;
    this.where = {
      ...this.where,
      OR: fields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" }
      }))
    };
    return this;
  }
  filter(allowedFields) {
    allowedFields.forEach((field) => {
      const value = this.query[field];
      if (value === void 0) return;
      const normalizedValue = Array.isArray(value) ? value[0] : value;
      this.where = {
        ...this.where,
        [field]: normalizedValue
      };
    });
    return this;
  }
  mapFilter(field, mapper) {
    const value = this.query[field];
    if (value === void 0) return this;
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    this.where = {
      ...this.where,
      [field]: mapper(normalizedValue)
    };
    return this;
  }
  sort(defaultField, defaultOrder = "desc") {
    const rawSortBy = this.query.sortBy;
    const rawSortOrder = this.query.sortOrder;
    const sortBy = Array.isArray(rawSortBy) ? rawSortBy[0] : rawSortBy;
    const sortOrder = Array.isArray(rawSortOrder) ? rawSortOrder[0] : rawSortOrder;
    const order = sortOrder === "asc" ? "asc" : defaultOrder;
    const field = sortBy || defaultField;
    this.orderBy = {
      [field]: order
    };
    return this;
  }
  paginate(defaultLimit = 10, maxLimit = 100) {
    const rawPage = this.query.page;
    const rawLimit = this.query.limit;
    const parsedPage = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
    const parsedLimit = Number(
      Array.isArray(rawLimit) ? rawLimit[0] : rawLimit
    );
    this.page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    this.limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, maxLimit) : defaultLimit;
    this.skip = (this.page - 1) * this.limit;
    return this;
  }
  build() {
    return {
      where: this.where,
      orderBy: this.orderBy,
      page: this.page,
      limit: this.limit,
      skip: this.skip
    };
  }
};

// src/app/modules/category/category.service.ts
var create = async (payload) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: "insensitive"
      }
    },
    select: { id: true }
  });
  if (existingCategory) {
    throw new AppError_default(
      409,
      "Category already exists. Try another category name."
    );
  }
  return prisma.category.create({ data: payload });
};
var getAll = async (query) => {
  const queryBuilder = new QueryBuilder(
    query,
    {},
    { createdAt: "desc" }
  ).search(["name", "description"]).sort("createdAt", "desc").paginate(20, 100);
  const { where, orderBy, skip, limit, page } = queryBuilder.build();
  const [total, data] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy,
      skip,
      take: limit
    })
  ]);
  return { meta: { page, limit, total }, data };
};
var update = async (id, payload) => {
  if (payload.name) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: payload.name,
          mode: "insensitive"
        }
      },
      select: { id: true }
    });
    if (existingCategory) {
      throw new AppError_default(
        409,
        "Category already exists. Try another category name."
      );
    }
  }
  return prisma.category.update({
    where: { id },
    data: payload
  });
};
var remove = async (id) => {
  return prisma.category.delete({ where: { id } });
};
var CategoryService = {
  create,
  getAll,
  update,
  remove
};

// src/app/modules/category/category.controller.ts
var create2 = catchAsync(async (req, res) => {
  const result = await CategoryService.create(req.body);
  sendResponse(res, {
    statusCode: status9.CREATED,
    success: true,
    message: "Category created successfully",
    data: result
  });
});
var getAll2 = catchAsync(async (req, res) => {
  const result = await CategoryService.getAll(req.query);
  sendResponse(res, {
    statusCode: status9.OK,
    success: true,
    message: "Categories fetched successfully",
    meta: result.meta,
    data: result.data
  });
});
var update2 = catchAsync(async (req, res) => {
  const result = await CategoryService.update(String(req.params.id), req.body);
  sendResponse(res, {
    statusCode: status9.OK,
    success: true,
    message: "Category updated successfully",
    data: result
  });
});
var remove2 = catchAsync(async (req, res) => {
  const result = await CategoryService.remove(String(req.params.id));
  sendResponse(res, {
    statusCode: status9.OK,
    success: true,
    message: "Category deleted successfully",
    data: result
  });
});
var CategoryController = {
  create: create2,
  getAll: getAll2,
  update: update2,
  remove: remove2
};

// src/app/modules/category/category.validation.ts
import z5 from "zod";
var create3 = z5.object({
  body: z5.object({
    name: z5.string().min(2).max(60),
    description: z5.string().max(500).optional()
  })
});
var update3 = z5.object({
  body: z5.object({
    name: z5.string().min(2).max(60).optional(),
    description: z5.string().max(500).optional()
  })
});
var CategoryValidation = {
  create: create3,
  update: update3
};

// src/app/modules/category/category.route.ts
var router4 = Router4();
router4.get("/", CategoryController.getAll);
router4.post(
  "/",
  checkAuth("ADMIN"),
  validateRequest(CategoryValidation.create),
  CategoryController.create
);
router4.patch(
  "/:id",
  checkAuth("ADMIN"),
  validateRequest(CategoryValidation.update),
  CategoryController.update
);
router4.delete("/:id", checkAuth("ADMIN"), CategoryController.remove);
var CategoryRoutes = router4;

// src/app/modules/comment/comment.route.ts
import { Router as Router5 } from "express";

// src/app/modules/comment/comment.controller.ts
import status10 from "http-status";

// src/app/modules/comment/comment.service.ts
var buildCommentTree = (comments) => {
  const commentMap = /* @__PURE__ */ new Map();
  const rootComments = [];
  for (const comment of comments) {
    commentMap.set(comment.id, {
      ...comment,
      replies: []
    });
  }
  for (const comment of commentMap.values()) {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(comment);
        continue;
      }
    }
    rootComments.push(comment);
  }
  return rootComments;
};
var create4 = async (userId, payload) => {
  if (payload.parentId) {
    const parent = await prisma.ideaComment.findUnique({
      where: { id: payload.parentId },
      select: { id: true, ideaId: true, isDeleted: true }
    });
    if (!parent || parent.ideaId !== payload.ideaId || parent.isDeleted) {
      throw new AppError_default(400, "Invalid parent comment for this idea");
    }
  }
  return prisma.ideaComment.create({
    data: {
      userId,
      ideaId: payload.ideaId,
      content: payload.content,
      parentId: payload.parentId
    }
  });
};
var listByIdea = async (ideaId) => {
  const comments = await prisma.ideaComment.findMany({
    where: {
      ideaId,
      isDeleted: false
    },
    orderBy: {
      createdAt: "asc"
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  return buildCommentTree(comments);
};
var remove3 = async (id, user) => {
  const comment = await prisma.ideaComment.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true
    }
  });
  if (!comment) throw new AppError_default(404, "Comment not found");
  if (user.role !== "ADMIN" && comment.userId !== user.id) {
    throw new AppError_default(403, "Forbidden");
  }
  return prisma.ideaComment.update({
    where: { id },
    data: { isDeleted: true }
  });
};
var CommentService = {
  create: create4,
  listByIdea,
  remove: remove3
};

// src/app/modules/comment/comment.controller.ts
var create5 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status10.UNAUTHORIZED, "Unauthorized");
  const result = await CommentService.create(req.user.id, req.body);
  sendResponse(res, {
    statusCode: status10.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result
  });
});
var listByIdea2 = catchAsync(async (req, res) => {
  const result = await CommentService.listByIdea(String(req.params.ideaId));
  sendResponse(res, {
    statusCode: status10.OK,
    success: true,
    message: "Comments fetched successfully",
    data: result
  });
});
var remove4 = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError_default(status10.UNAUTHORIZED, "Unauthorized");
  const result = await CommentService.remove(String(req.params.id), req.user);
  sendResponse(res, {
    statusCode: status10.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result
  });
});
var CommentController = {
  create: create5,
  listByIdea: listByIdea2,
  remove: remove4
};

// src/app/modules/comment/comment.validation.ts
import z6 from "zod";
var create6 = z6.object({
  body: z6.object({
    ideaId: z6.string().min(1),
    content: z6.string().min(1).max(2e3),
    parentId: z6.string().optional()
  })
});
var CommentValidation = {
  create: create6
};

// src/app/modules/comment/comment.route.ts
var router5 = Router5();
router5.get("/idea/:ideaId", CommentController.listByIdea);
router5.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(CommentValidation.create),
  CommentController.create
);
router5.delete("/:id", checkAuth("MEMBER", "ADMIN"), CommentController.remove);
var CommentRoutes = router5;

// src/app/modules/idea/idea.route.ts
import { Router as Router6 } from "express";

// src/app/modules/idea/idea.controller.ts
import status11 from "http-status";

// src/app/modules/idea/idea.service.ts
var createLockedIdeaResponse = (idea, lockReason, accessState) => ({
  id: idea.id,
  title: idea.title,
  isPaid: idea.isPaid,
  price: idea.price,
  category: idea.category,
  author: idea.author,
  createdAt: idea.createdAt,
  canAccess: false,
  lockReason,
  accessState
});
var shapeIdea = (idea) => {
  const upvotes = idea.votes.filter((v) => v.type === VoteType.UPVOTE).length;
  const downvotes = idea.votes.filter((v) => v.type === VoteType.DOWNVOTE).length;
  return {
    ...idea,
    upvotes,
    downvotes,
    commentCount: idea._count.comments,
    voteCount: idea._count.votes
  };
};
var resolveIsPaidFilter = (value) => {
  const normalizedValue = value.trim().toUpperCase();
  if (["PAID", "TRUE", "1"].includes(normalizedValue)) {
    return true;
  }
  if (["FREE", "FALSE", "0"].includes(normalizedValue)) {
    return false;
  }
  throw new AppError_default(
    400,
    "Invalid payment filter. Use PAID, FREE, true, or false"
  );
};
var create7 = async (authorId, payload) => {
  if (payload.isPaid && (payload.price === void 0 || payload.price <= 0)) {
    throw new AppError_default(400, "Paid idea must include price greater than 0");
  }
  return prisma.idea.create({
    data: {
      title: payload.title,
      problemStatement: payload.problemStatement,
      proposedSolution: payload.proposedSolution,
      description: payload.description,
      categoryId: payload.categoryId,
      authorId,
      isPaid: payload.isPaid ?? false,
      price: payload.isPaid ? payload.price : null,
      media: payload.mediaUrls?.length ? {
        createMany: {
          data: payload.mediaUrls.map((url) => ({ url }))
        }
      } : void 0
    },
    include: {
      media: true
    }
  });
};
var getAll3 = async (query, user) => {
  const normalizedSortBy = String(query.sortBy || "RECENT");
  const prismaSortQuery = { ...query };
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const rawIsPaid = Array.isArray(query.isPaid) ? query.isPaid[0] : query.isPaid;
  const rawPaymentStatus = Array.isArray(query.paymentStatus) ? query.paymentStatus[0] : query.paymentStatus;
  const normalizedStatus = typeof rawStatus === "string" ? rawStatus.toUpperCase() : void 0;
  const isAdmin = user?.role === "ADMIN";
  const baseWhere = isAdmin && normalizedStatus ? {
    status: normalizedStatus
  } : isAdmin ? {} : { status: IdeaStatus.APPROVED };
  if (normalizedSortBy === "RECENT" || normalizedSortBy === "TOP_VOTED" || normalizedSortBy === "MOST_COMMENTED") {
    prismaSortQuery.sortBy = "createdAt";
  }
  if (rawPaymentStatus !== void 0) {
    prismaSortQuery.isPaid = rawPaymentStatus;
  } else if (rawIsPaid !== void 0) {
    prismaSortQuery.isPaid = rawIsPaid;
  }
  const queryBuilder = new QueryBuilder(
    prismaSortQuery,
    baseWhere,
    { createdAt: "desc" }
  ).search(["title", "description", "problemStatement", "proposedSolution"]).filter(["categoryId", "authorId"]).mapFilter("isPaid", resolveIsPaidFilter).sort("createdAt", "desc").paginate(10, 50);
  const { where, orderBy, page, limit, skip } = queryBuilder.build();
  const [total, ideas] = await Promise.all([
    prisma.idea.count({ where }),
    prisma.idea.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true }
        },
        media: true,
        votes: { select: { type: true } },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      }
    })
  ]);
  const minUpvotes = Number(query.minUpvotes || 0);
  const sortBy = normalizedSortBy;
  let shaped = ideas.map(shapeIdea).filter((idea) => idea.upvotes >= minUpvotes);
  if (sortBy === "TOP_VOTED") {
    shaped = shaped.sort((a, b) => b.upvotes - a.upvotes);
  }
  if (sortBy === "MOST_COMMENTED") {
    shaped = shaped.sort((a, b) => b.commentCount - a.commentCount);
  }
  return {
    meta: {
      page,
      limit,
      total
    },
    data: shaped
  };
};
var getById = async (id, user) => {
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { id: true, name: true, email: true } },
      media: true,
      votes: { select: { type: true } },
      _count: { select: { comments: true, votes: true } }
    }
  });
  if (!idea) throw new AppError_default(404, "Idea not found");
  const shaped = shapeIdea(idea);
  const isOwner = user?.id === idea.authorId;
  const isAdmin = user?.role === "ADMIN";
  if (idea.status !== IdeaStatus.APPROVED && !isOwner && !isAdmin) {
    return createLockedIdeaResponse(
      idea,
      "This idea is not publicly available yet",
      "UNAVAILABLE"
    );
  }
  if (!idea.isPaid) {
    return { ...shaped, canAccess: true };
  }
  if (isOwner || isAdmin) {
    return { ...shaped, canAccess: true };
  }
  if (!user?.id) {
    return createLockedIdeaResponse(
      idea,
      "Login and purchase required",
      "LOGIN_REQUIRED"
    );
  }
  const purchase = await prisma.ideaPurchase.findFirst({
    where: {
      ideaId: id,
      userId: user.id,
      status: PurchaseStatus.PAID
    }
  });
  if (!purchase) {
    return createLockedIdeaResponse(idea, "Purchase required", "PURCHASE_REQUIRED");
  }
  return { ...shaped, canAccess: true };
};
var update4 = async (id, userId, payload) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError_default(404, "Idea not found");
  if (idea.authorId !== userId) throw new AppError_default(403, "Forbidden");
  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError_default(400, "Published ideas cannot be edited");
  }
  if (payload.isPaid && (payload.price === void 0 || payload.price <= 0)) {
    throw new AppError_default(400, "Paid idea must include price greater than 0");
  }
  return prisma.idea.update({
    where: { id },
    data: {
      ...payload,
      price: payload.isPaid ? payload.price : payload.isPaid === false ? null : payload.price,
      media: payload.mediaUrls ? {
        deleteMany: {},
        createMany: {
          data: payload.mediaUrls.map((url) => ({ url }))
        }
      } : void 0
    },
    include: {
      media: true
    }
  });
};
var remove5 = async (id, userId) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError_default(404, "Idea not found");
  if (idea.authorId !== userId) throw new AppError_default(403, "Forbidden");
  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError_default(400, "Published ideas cannot be deleted");
  }
  return prisma.idea.delete({ where: { id } });
};
var submitForReview = async (id, userId) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError_default(404, "Idea not found");
  if (idea.authorId !== userId) throw new AppError_default(403, "Forbidden");
  if (idea.status === IdeaStatus.UNDER_REVIEW) {
    throw new AppError_default(400, "Idea is already under review");
  }
  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError_default(400, "Approved ideas do not need to be resubmitted");
  }
  return prisma.idea.update({
    where: { id },
    data: {
      status: IdeaStatus.UNDER_REVIEW,
      submittedAt: /* @__PURE__ */ new Date(),
      approvedAt: null,
      rejectionReason: null
    }
  });
};
var review = async (id, payload) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError_default(404, "Idea not found");
  if (idea.status !== IdeaStatus.UNDER_REVIEW) {
    throw new AppError_default(400, "Only ideas under review can be approved or rejected");
  }
  if (payload.action === "REJECT" && !payload.rejectionReason) {
    throw new AppError_default(400, "Rejection reason is required for rejected ideas");
  }
  return prisma.idea.update({
    where: { id },
    data: payload.action === "APPROVE" ? {
      status: IdeaStatus.APPROVED,
      approvedAt: /* @__PURE__ */ new Date(),
      rejectionReason: null
    } : {
      status: IdeaStatus.REJECTED,
      approvedAt: null,
      rejectionReason: payload.rejectionReason
    }
  });
};
var getMine = async (userId) => {
  return prisma.idea.findMany({
    where: {
      authorId: userId
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      category: true,
      media: true,
      _count: {
        select: {
          comments: true,
          votes: true
        }
      }
    }
  });
};
var IdeaService = {
  create: create7,
  getAll: getAll3,
  getById,
  update: update4,
  remove: remove5,
  submitForReview,
  review,
  getMine
};

// src/app/modules/idea/idea.controller.ts
var create8 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  const result = await IdeaService.create(req.user.id, req.body);
  sendResponse(res, {
    statusCode: status11.CREATED,
    success: true,
    message: "Idea created successfully",
    data: result
  });
});
var getAll4 = catchAsync(async (req, res) => {
  const result = await IdeaService.getAll(req.query, req.user);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "Ideas fetched successfully",
    data: result.data,
    meta: result.meta
  });
});
var getById2 = catchAsync(async (req, res) => {
  const result = await IdeaService.getById(String(req.params.id), req.user);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "Idea fetched successfully",
    data: result
  });
});
var update5 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  const result = await IdeaService.update(String(req.params.id), req.user.id, req.body);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "Idea updated successfully",
    data: result
  });
});
var remove6 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  const result = await IdeaService.remove(String(req.params.id), req.user.id);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "Idea deleted successfully",
    data: result
  });
});
var submitForReview2 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  const result = await IdeaService.submitForReview(String(req.params.id), req.user.id);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "Idea submitted for review successfully",
    data: result
  });
});
var review2 = catchAsync(async (req, res) => {
  const result = await IdeaService.review(String(req.params.id), req.body);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "Idea review action completed",
    data: result
  });
});
var getMine2 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  const result = await IdeaService.getMine(req.user.id);
  sendResponse(res, {
    statusCode: status11.OK,
    success: true,
    message: "My ideas fetched successfully",
    data: result
  });
});
var IdeaController = {
  create: create8,
  getAll: getAll4,
  getById: getById2,
  update: update5,
  remove: remove6,
  submitForReview: submitForReview2,
  review: review2,
  getMine: getMine2
};

// src/app/modules/idea/idea.validation.ts
import z7 from "zod";
var create9 = z7.object({
  body: z7.object({
    title: z7.string().min(3).max(180),
    problemStatement: z7.string().min(10),
    proposedSolution: z7.string().min(10),
    description: z7.string().min(10),
    categoryId: z7.string().min(1),
    isPaid: z7.boolean().optional(),
    price: z7.number().nonnegative().optional(),
    mediaUrls: z7.array(z7.url()).optional()
  })
});
var update6 = z7.object({
  body: z7.object({
    title: z7.string().min(3).max(180).optional(),
    problemStatement: z7.string().min(10).optional(),
    proposedSolution: z7.string().min(10).optional(),
    description: z7.string().min(10).optional(),
    categoryId: z7.string().min(1).optional(),
    isPaid: z7.boolean().optional(),
    price: z7.number().nonnegative().optional(),
    mediaUrls: z7.array(z7.url()).optional()
  })
});
var review3 = z7.object({
  body: z7.object({
    action: z7.enum(["APPROVE", "REJECT"]),
    rejectionReason: z7.string().min(3).max(500).optional()
  })
});
var IdeaValidation = {
  create: create9,
  update: update6,
  review: review3
};

// src/app/modules/idea/idea.route.ts
var router6 = Router6();
router6.get("/", IdeaController.getAll);
router6.get("/mine", checkAuth("MEMBER", "ADMIN"), IdeaController.getMine);
router6.get("/:id", IdeaController.getById);
router6.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(IdeaValidation.create),
  IdeaController.create
);
router6.patch(
  "/:id",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(IdeaValidation.update),
  IdeaController.update
);
router6.delete("/:id", checkAuth("MEMBER", "ADMIN"), IdeaController.remove);
router6.patch(
  "/:id/submit",
  checkAuth("MEMBER", "ADMIN"),
  IdeaController.submitForReview
);
router6.patch(
  "/:id/review",
  checkAuth("ADMIN"),
  validateRequest(IdeaValidation.review),
  IdeaController.review
);
var IdeaRoutes = router6;

// src/app/modules/newsletter/newsletter.route.ts
import { Router as Router7 } from "express";

// src/app/modules/newsletter/newsletter.controller.ts
import status12 from "http-status";

// src/app/modules/newsletter/newsletter.service.ts
var subscribe = async (email) => {
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, subscribed: true },
    update: { subscribed: true, subscribedAt: /* @__PURE__ */ new Date() }
  });
};
var unsubscribe = async (email) => {
  return prisma.newsletterSubscriber.update({
    where: { email },
    data: { subscribed: false }
  });
};
var getAll5 = async () => {
  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" }
  });
};
var NewsletterService = {
  subscribe,
  unsubscribe,
  getAll: getAll5
};

// src/app/modules/newsletter/newsletter.controller.ts
var subscribe2 = catchAsync(async (req, res) => {
  const result = await NewsletterService.subscribe(req.body.email);
  sendResponse(res, {
    statusCode: status12.OK,
    success: true,
    message: "Subscribed successfully",
    data: result
  });
});
var unsubscribe2 = catchAsync(async (req, res) => {
  const result = await NewsletterService.unsubscribe(String(req.params.email));
  sendResponse(res, {
    statusCode: status12.OK,
    success: true,
    message: "Unsubscribed successfully",
    data: result
  });
});
var getAll6 = catchAsync(async (_req, res) => {
  const result = await NewsletterService.getAll();
  sendResponse(res, {
    statusCode: status12.OK,
    success: true,
    message: "Subscribers fetched successfully",
    data: result
  });
});
var NewsletterController = {
  subscribe: subscribe2,
  unsubscribe: unsubscribe2,
  getAll: getAll6
};

// src/app/modules/newsletter/newsletter.validation.ts
import z8 from "zod";
var subscribe3 = z8.object({
  body: z8.object({
    email: z8.string().email()
  })
});
var NewsletterValidation = {
  subscribe: subscribe3
};

// src/app/modules/newsletter/newsletter.route.ts
var router7 = Router7();
router7.post(
  "/subscribe",
  validateRequest(NewsletterValidation.subscribe),
  NewsletterController.subscribe
);
router7.patch("/unsubscribe/:email", NewsletterController.unsubscribe);
router7.get("/", checkAuth("ADMIN"), NewsletterController.getAll);
var NewsletterRoutes = router7;

// src/app/modules/payment/payment.route.ts
import { Router as Router8 } from "express";

// src/app/modules/payment/payment.controller.ts
import status13 from "http-status";

// src/app/modules/payment/payment.service.ts
import Stripe from "stripe";
var toStripeAmount = (amount) => Math.round(amount * 100);
var getStripeClient = () => {
  if (!envVariables.STRIPE.STRIPE_SECRET_KEY) {
    throw new AppError_default(500, "Stripe secret key is not configured");
  }
  return new Stripe(envVariables.STRIPE.STRIPE_SECRET_KEY);
};
var getBackendBaseUrl = () => {
  return envVariables.BETTER_AUTH_URL || `http://localhost:${envVariables.PORT}`;
};
var createStripeCheckoutSession = async (payload) => {
  const stripe = getStripeClient();
  const currency = payload.currency.toLowerCase();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: payload.userEmail,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeAmount(payload.amount),
          product_data: {
            name: `Paid Idea Access: ${payload.ideaTitle}`
          }
        }
      }
    ],
    metadata: {
      purchaseId: payload.purchaseId
    },
    success_url: `${getBackendBaseUrl()}/api/v1/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBackendBaseUrl()}/api/v1/payments/stripe/cancel?purchaseId=${payload.purchaseId}`
  });
  if (!session.url) {
    throw new AppError_default(500, "Failed to generate Stripe checkout URL");
  }
  return {
    sessionId: session.id,
    checkoutUrl: session.url
  };
};
var createCheckoutForPurchase = async (purchaseId, userId) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      idea: {
        select: {
          title: true,
          isPaid: true
        }
      },
      user: {
        select: {
          email: true
        }
      }
    }
  });
  if (!purchase) throw new AppError_default(404, "Purchase not found");
  if (purchase.userId !== userId) throw new AppError_default(403, "Forbidden");
  if (purchase.status === PurchaseStatus.PAID) {
    throw new AppError_default(400, "This purchase is already paid");
  }
  if (!purchase.idea.isPaid) {
    throw new AppError_default(400, "This idea does not require payment");
  }
  const checkout = await createStripeCheckoutSession({
    purchaseId: purchase.id,
    ideaTitle: purchase.idea.title,
    userEmail: purchase.user.email,
    amount: Number(purchase.amount),
    currency: purchase.currency
  });
  const updatedPurchase = await prisma.ideaPurchase.update({
    where: { id: purchase.id },
    data: {
      paymentProvider: "STRIPE",
      transactionId: checkout.sessionId,
      status: PurchaseStatus.PENDING
    }
  });
  return {
    purchase: updatedPurchase,
    payment: {
      provider: "STRIPE",
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId
    }
  };
};
var getPurchaseStatus = async (purchaseId, userId) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          isPaid: true,
          price: true
        }
      }
    }
  });
  if (!purchase) throw new AppError_default(404, "Purchase not found");
  if (purchase.userId !== userId) throw new AppError_default(403, "Forbidden");
  return purchase;
};
var confirmPayment = async (purchaseId, transactionId) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId }
  });
  if (!purchase) throw new AppError_default(404, "Purchase not found");
  if (purchase.status === PurchaseStatus.PAID) {
    return purchase;
  }
  return prisma.ideaPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.PAID,
      transactionId,
      purchasedAt: /* @__PURE__ */ new Date()
    }
  });
};
var markPaymentFailed = async (purchaseId, transactionId) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId }
  });
  if (!purchase) throw new AppError_default(404, "Purchase not found");
  if (purchase.status === PurchaseStatus.PAID) {
    return purchase;
  }
  return prisma.ideaPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.FAILED,
      transactionId: transactionId || purchase.transactionId
    }
  });
};
var confirmStripeSession = async (sessionId) => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) {
    throw new AppError_default(400, "Invalid Stripe session metadata");
  }
  if (session.payment_status === "paid") {
    const transactionId = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
    return confirmPayment(purchaseId, transactionId);
  }
  return markPaymentFailed(purchaseId, session.id);
};
var getPurchaseForTemplate = async (purchaseId) => {
  const purchase = await prisma.ideaPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      idea: {
        select: {
          title: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  if (!purchase) throw new AppError_default(404, "Purchase not found");
  return purchase;
};
var verifyAndHandleWebhook = async (rawBody, signature) => {
  if (!envVariables.STRIPE.STRIPE_WEBHOOK_SECRET) {
    throw new AppError_default(500, "Stripe webhook secret is not configured");
  }
  const stripe = getStripeClient();
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    envVariables.STRIPE.STRIPE_WEBHOOK_SECRET
  );
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const purchaseId = session.metadata?.purchaseId;
    if (purchaseId) {
      const transactionId = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
      await confirmPayment(purchaseId, transactionId);
    }
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const purchaseId = session.metadata?.purchaseId;
    if (purchaseId) {
      await markPaymentFailed(purchaseId, session.id);
    }
  }
  return event;
};
var PaymentService = {
  createStripeCheckoutSession,
  createCheckoutForPurchase,
  getPurchaseStatus,
  confirmPayment,
  markPaymentFailed,
  confirmStripeSession,
  getPurchaseForTemplate,
  verifyAndHandleWebhook
};

// src/app/modules/payment/payment.controller.ts
var confirm = catchAsync(async (req, res) => {
  const result = await PaymentService.confirmPayment(
    req.body.purchaseId,
    req.body.transactionId
  );
  sendResponse(res, {
    statusCode: status13.OK,
    success: true,
    message: "Payment confirmed successfully",
    data: result
  });
});
var statusById = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status13.UNAUTHORIZED, "Unauthorized");
  const result = await PaymentService.getPurchaseStatus(
    String(req.params.purchaseId),
    req.user.id
  );
  sendResponse(res, {
    statusCode: status13.OK,
    success: true,
    message: "Payment status fetched successfully",
    data: result
  });
});
var createCheckout = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status13.UNAUTHORIZED, "Unauthorized");
  const result = await PaymentService.createCheckoutForPurchase(
    String(req.params.purchaseId),
    req.user.id
  );
  sendResponse(res, {
    statusCode: status13.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result
  });
});
var stripeSuccess = catchAsync(async (req, res) => {
  const sessionId = String(req.query.session_id || "");
  if (!sessionId) throw new AppError_default(status13.BAD_REQUEST, "session_id is required");
  const purchase = await PaymentService.confirmStripeSession(sessionId);
  const purchaseForTemplate = await PaymentService.getPurchaseForTemplate(purchase.id);
  return res.status(status13.OK).render("payment", {
    paymentStatus: purchaseForTemplate.status,
    name: purchaseForTemplate.user.name || purchaseForTemplate.user.email,
    ideaTitle: purchaseForTemplate.idea.title,
    amount: purchaseForTemplate.amount.toString(),
    currency: purchaseForTemplate.currency,
    transactionId: purchaseForTemplate.transactionId || "N/A",
    paymentProvider: purchaseForTemplate.paymentProvider,
    paidAt: purchaseForTemplate.purchasedAt ? purchaseForTemplate.purchasedAt.toISOString() : "Pending"
  });
});
var stripeCancel = catchAsync(async (req, res) => {
  const purchaseId = String(req.query.purchaseId || "");
  if (!purchaseId) throw new AppError_default(status13.BAD_REQUEST, "purchaseId is required");
  await PaymentService.markPaymentFailed(purchaseId);
  const purchaseForTemplate = await PaymentService.getPurchaseForTemplate(purchaseId);
  return res.status(status13.OK).render("payment", {
    paymentStatus: purchaseForTemplate.status,
    name: purchaseForTemplate.user.name || purchaseForTemplate.user.email,
    ideaTitle: purchaseForTemplate.idea.title,
    amount: purchaseForTemplate.amount.toString(),
    currency: purchaseForTemplate.currency,
    transactionId: purchaseForTemplate.transactionId || "N/A",
    paymentProvider: purchaseForTemplate.paymentProvider,
    paidAt: purchaseForTemplate.purchasedAt ? purchaseForTemplate.purchasedAt.toISOString() : "Not paid yet"
  });
});
var webhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    throw new AppError_default(status13.BAD_REQUEST, "Missing stripe-signature header");
  }
  if (!req.rawBody) {
    throw new AppError_default(status13.BAD_REQUEST, "Missing raw request body for webhook");
  }
  const event = await PaymentService.verifyAndHandleWebhook(req.rawBody, signature);
  sendResponse(res, {
    statusCode: status13.OK,
    success: true,
    message: "Webhook processed",
    data: { id: event.id, type: event.type }
  });
});
var PaymentController = {
  confirm,
  statusById,
  createCheckout,
  stripeSuccess,
  stripeCancel,
  webhook
};

// src/app/modules/payment/payment.validation.ts
import z9 from "zod";
var confirm2 = z9.object({
  body: z9.object({
    purchaseId: z9.string().min(1),
    transactionId: z9.string().min(3)
  })
});
var PaymentValidation = {
  confirm: confirm2
};

// src/app/modules/payment/payment.route.ts
var router8 = Router8();
router8.post(
  "/confirm",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(PaymentValidation.confirm),
  PaymentController.confirm
);
router8.get("/stripe/success", PaymentController.stripeSuccess);
router8.get("/stripe/cancel", PaymentController.stripeCancel);
router8.post(
  "/:purchaseId/checkout",
  checkAuth("MEMBER", "ADMIN"),
  PaymentController.createCheckout
);
router8.get(
  "/:purchaseId/status",
  checkAuth("MEMBER", "ADMIN"),
  PaymentController.statusById
);
router8.post("/webhook", PaymentController.webhook);
var PaymentRoutes = router8;

// src/app/modules/purchase/purchase.route.ts
import { Router as Router9 } from "express";

// src/app/modules/purchase/purchase.controller.ts
import status14 from "http-status";

// src/app/modules/purchase/purchase.service.ts
var create10 = async (user, payload) => {
  const idea = await prisma.idea.findUnique({ where: { id: payload.ideaId } });
  if (!idea) throw new AppError_default(404, "Idea not found");
  if (!idea.isPaid || !idea.price) {
    throw new AppError_default(400, "This is a free idea. Purchase not required.");
  }
  if (idea.authorId === user.id) {
    throw new AppError_default(400, "Author does not need to purchase own idea");
  }
  const existingPurchase = await prisma.ideaPurchase.findUnique({
    where: {
      ideaId_userId: {
        ideaId: payload.ideaId,
        userId: user.id
      }
    }
  });
  if (existingPurchase?.status === PurchaseStatus.PAID) {
    throw new AppError_default(400, "You already purchased this idea");
  }
  const paymentProvider = payload.paymentProvider || "STRIPE";
  const purchase = existingPurchase ? await prisma.ideaPurchase.update({
    where: { id: existingPurchase.id },
    data: {
      paymentProvider,
      amount: idea.price,
      currency: existingPurchase.currency || "BDT",
      status: PurchaseStatus.PENDING,
      transactionId: null,
      purchasedAt: null
    }
  }) : await prisma.ideaPurchase.create({
    data: {
      ideaId: payload.ideaId,
      userId: user.id,
      amount: idea.price,
      paymentProvider,
      status: PurchaseStatus.PENDING
    }
  });
  const checkout = await PaymentService.createStripeCheckoutSession({
    purchaseId: purchase.id,
    ideaTitle: idea.title,
    userEmail: user.email,
    amount: Number(idea.price),
    currency: purchase.currency
  });
  const purchaseWithSession = await prisma.ideaPurchase.update({
    where: { id: purchase.id },
    data: {
      transactionId: checkout.sessionId,
      status: PurchaseStatus.PENDING
    }
  });
  return {
    purchase: purchaseWithSession,
    payment: {
      provider: "STRIPE",
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId
    }
  };
};
var getMine3 = async (userId) => {
  return prisma.ideaPurchase.findMany({
    where: { userId },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          isPaid: true,
          price: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
var PurchaseService = {
  create: create10,
  getMine: getMine3
};

// src/app/modules/purchase/purchase.controller.ts
var create11 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status14.UNAUTHORIZED, "Unauthorized");
  const result = await PurchaseService.create(
    { id: req.user.id, email: req.user.email },
    req.body
  );
  sendResponse(res, {
    statusCode: status14.CREATED,
    success: true,
    message: "Purchase initialized successfully",
    data: result
  });
});
var getMine4 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status14.UNAUTHORIZED, "Unauthorized");
  const result = await PurchaseService.getMine(req.user.id);
  sendResponse(res, {
    statusCode: status14.OK,
    success: true,
    message: "My purchases fetched successfully",
    data: result
  });
});
var PurchaseController = {
  create: create11,
  getMine: getMine4
};

// src/app/modules/purchase/purchase.validation.ts
import z10 from "zod";
var create12 = z10.object({
  body: z10.object({
    ideaId: z10.string().min(1),
    paymentProvider: z10.enum(["STRIPE"]).optional()
  })
});
var PurchaseValidation = {
  create: create12
};

// src/app/modules/purchase/purchase.route.ts
var router9 = Router9();
router9.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(PurchaseValidation.create),
  PurchaseController.create
);
router9.get("/me", checkAuth("MEMBER", "ADMIN"), PurchaseController.getMine);
var PurchaseRoutes = router9;

// src/app/modules/user/user.route.ts
import { Router as Router10 } from "express";

// src/app/modules/user/user.controller.ts
import status15 from "http-status";

// src/app/modules/user/user.service.ts
var getAll7 = async (query) => {
  const queryBuilder = new QueryBuilder(
    query,
    {},
    { createdAt: "desc" }
  ).search(["name", "email"]).filter(["role", "status"]).sort("createdAt", "desc").paginate(20, 100);
  const { where, orderBy, skip, limit, page } = queryBuilder.build();
  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true
      }
    })
  ]);
  return { meta: { page, limit, total }, data };
};
var getById3 = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      emailVerified: true,
      createdAt: true
    }
  });
  if (!user) throw new AppError_default(404, "User not found");
  return user;
};
var update7 = async (id, payload) => {
  return prisma.user.update({
    where: { id },
    data: payload
  });
};
var UserService = {
  getAll: getAll7,
  getById: getById3,
  update: update7
};

// src/app/modules/user/user.controller.ts
var getAll8 = catchAsync(async (req, res) => {
  const result = await UserService.getAll(req.query);
  sendResponse(res, {
    statusCode: status15.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data
  });
});
var getById4 = catchAsync(async (req, res) => {
  const result = await UserService.getById(String(req.params.id));
  sendResponse(res, {
    statusCode: status15.OK,
    success: true,
    message: "User fetched successfully",
    data: result
  });
});
var update8 = catchAsync(async (req, res) => {
  const result = await UserService.update(String(req.params.id), req.body);
  sendResponse(res, {
    statusCode: status15.OK,
    success: true,
    message: "User updated successfully",
    data: result
  });
});
var UserController = {
  getAll: getAll8,
  getById: getById4,
  update: update8
};

// src/app/modules/user/user.validation.ts
import z11 from "zod";
var update9 = z11.object({
  body: z11.object({
    name: z11.string().min(2).max(100).optional(),
    image: z11.string().url().optional(),
    role: z11.enum(["MEMBER", "ADMIN"]).optional(),
    status: z11.enum(["ACTIVE", "DEACTIVATED"]).optional()
  })
});
var UserValidation = {
  update: update9
};

// src/app/modules/user/user.route.ts
var router10 = Router10();
router10.get("/", checkAuth("ADMIN"), UserController.getAll);
router10.get("/:id", checkAuth("ADMIN"), UserController.getById);
router10.patch(
  "/:id",
  checkAuth("ADMIN"),
  validateRequest(UserValidation.update),
  UserController.update
);
var UserRoutes = router10;

// src/app/modules/vote/vote.route.ts
import { Router as Router11 } from "express";

// src/app/modules/vote/vote.controller.ts
import status16 from "http-status";

// src/app/modules/vote/vote.service.ts
var upsert = async (userId, payload) => {
  return prisma.ideaVote.upsert({
    where: {
      ideaId_userId: {
        ideaId: payload.ideaId,
        userId
      }
    },
    create: {
      ideaId: payload.ideaId,
      userId,
      type: payload.type
    },
    update: {
      type: payload.type
    }
  });
};
var remove7 = async (userId, ideaId) => {
  return prisma.ideaVote.delete({
    where: {
      ideaId_userId: {
        ideaId,
        userId
      }
    }
  });
};
var VoteService = {
  upsert,
  remove: remove7
};

// src/app/modules/vote/vote.controller.ts
var upsert2 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status16.UNAUTHORIZED, "Unauthorized");
  const result = await VoteService.upsert(req.user.id, req.body);
  sendResponse(res, {
    statusCode: status16.OK,
    success: true,
    message: "Vote saved successfully",
    data: result
  });
});
var remove8 = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new AppError_default(status16.UNAUTHORIZED, "Unauthorized");
  const result = await VoteService.remove(req.user.id, req.body.ideaId);
  sendResponse(res, {
    statusCode: status16.OK,
    success: true,
    message: "Vote removed successfully",
    data: result
  });
});
var VoteController = {
  upsert: upsert2,
  remove: remove8
};

// src/app/modules/vote/vote.validation.ts
import z12 from "zod";
var upsert3 = z12.object({
  body: z12.object({
    ideaId: z12.string().min(1),
    type: z12.enum(["UPVOTE", "DOWNVOTE"])
  })
});
var remove9 = z12.object({
  body: z12.object({
    ideaId: z12.string().min(1)
  })
});
var VoteValidation = {
  upsert: upsert3,
  remove: remove9
};

// src/app/modules/vote/vote.route.ts
var router11 = Router11();
router11.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(VoteValidation.upsert),
  VoteController.upsert
);
router11.delete(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(VoteValidation.remove),
  VoteController.remove
);
var VoteRoutes = router11;

// src/app/routes/index.ts
var router12 = Router12();
router12.use("/ai", AiRoutes);
router12.use("/auth", AuthRoutes);
router12.use("/users", UserRoutes);
router12.use("/admins", AdminRoutes);
router12.use("/categories", CategoryRoutes);
router12.use("/ideas", IdeaRoutes);
router12.use("/votes", VoteRoutes);
router12.use("/comments", CommentRoutes);
router12.use("/purchases", PurchaseRoutes);
router12.use("/payments", PaymentRoutes);
router12.use("/newsletters", NewsletterRoutes);
var IndexRoutes = router12;

// src/app.ts
var toOrigin2 = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, "");
  }
};
var allowedCorsOrigins = /* @__PURE__ */ new Set([
  toOrigin2(envVariables.FRONTEND_URL),
  toOrigin2(envVariables.BETTER_AUTH_URL),
  "http://localhost:3000",
  "http://localhost:5000"
]);
var getTrustedFrontendRedirect = (value) => {
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
var getBrokenGoogleRedirectTarget = (req) => {
  const directCandidates = [
    req.query.redirectTo,
    req.query.callbackUrl,
    req.query.callbackURL
  ];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return getTrustedFrontendRedirect(candidate);
    }
  }
  const decodedUrl = decodeURIComponent(req.originalUrl);
  const match = decodedUrl.match(
    /(?:redirectTo|callbackUrl|callbackURL|ctTo)=([^&]+)/i
  );
  return getTrustedFrontendRedirect(match?.[1]);
};
var app = express();
app.set("query parser", (str) => qs.parse(str));
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path3.resolve(process.cwd(), `src/app/templates`));
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
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"]
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(cookieParser());
app.use(attachRequestUser);
app.get("/api/auth/sign-in/social", (req, res, next) => {
  const provider = typeof req.query.provider === "string" ? req.query.provider : "";
  if (!provider.toLowerCase().startsWith("goog")) {
    return next();
  }
  const redirectUrl = new URL(
    `${envVariables.FRONTEND_URL.replace(/\/$/, "")}/api/v1/auth/google`
  );
  redirectUrl.searchParams.set(
    "callbackUrl",
    getBrokenGoogleRedirectTarget(req)
  );
  return res.redirect(307, redirectUrl.toString());
});
app.use("/api/auth/sign-up/email", (req, res, next) => {
  if (req.body?.role && req.body.role !== "MEMBER") {
    return res.status(403).json({
      success: false,
      message: "Admin accounts can only be created via seeding"
    });
  }
  req.body.role = "MEMBER";
  req.body.status = "ACTIVE";
  return next();
});
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/v1", IndexRoutes);
app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "EcoSpark Hub backend is running"
  });
});
app.use(globalErrorHandler);
app.use(notFound);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
