import { Server } from "http";
import app from "./app";
import { envVariables } from "./app/config/env";
import { connectPrisma, disconnectPrisma } from "./app/lib/prisma";
import { seedAdmin } from "./app/utils/seedAdmin";

let server: Server;
const bootstrap = async () => {
  try {
    await connectPrisma();
    await seedAdmin();
    server = app.listen(envVariables.PORT, () => {
      console.log(`Server is running on http://localhost:${envVariables.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

// SIGTERM signal handler
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down server...");

  if (server) {
    server.close(async () => {
      await disconnectPrisma();
      console.log("Server closed gracefully.");
      process.exit(1);
    });
    return;
  }

  void disconnectPrisma();
  process.exit(1);
});

// SIGINT signal handler

process.on("SIGINT", () => {
  console.log("SIGINT signal received. Shutting down server...");

  if (server) {
    server.close(async () => {
      await disconnectPrisma();
      console.log("Server closed gracefully.");
      process.exit(1);
    });
    return;
  }

  void disconnectPrisma();
  process.exit(1);
});

//uncaught exception handler
process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception Detected... Shutting down server", error);

  if (server) {
    server.close(async () => {
      await disconnectPrisma();
      process.exit(1);
    });
    return;
  }

  void disconnectPrisma();
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection Detected... Shutting down server", error);

  if (server) {
    server.close(async () => {
      await disconnectPrisma();
      process.exit(1);
    });
    return;
  }

  void disconnectPrisma();
  process.exit(1);
});

//unhandled rejection handler

bootstrap();
