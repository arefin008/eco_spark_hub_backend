import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { envVariables } from "../config/env";
import { prisma } from "../lib/prisma";

export const seedAdmin = async () => {
  if (!envVariables.SUPER_ADMIN_EMAIL || !envVariables.SUPER_ADMIN_PASSWORD) {
    return;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: envVariables.SUPER_ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: envVariables.SUPER_ADMIN_EMAIL,
        emailVerified: true,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("Seeded Super Admin user");
    return;
  }

  if (existingAdmin.role !== UserRole.ADMIN || existingAdmin.status !== UserStatus.ACTIVE) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    console.log("Updated existing user to Super Admin");
  }
};
