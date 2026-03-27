import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { envVariables } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedAdmin = async () => {
  if (!envVariables.SUPER_ADMIN_EMAIL || !envVariables.SUPER_ADMIN_PASSWORD) {
    return;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: envVariables.SUPER_ADMIN_EMAIL },
    include: {
      accounts: {
        select: {
          providerId: true,
        },
      },
    },
  });

  if (!existingAdmin) {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: "Super Admin",
        email: envVariables.SUPER_ADMIN_EMAIL,
        password: envVariables.SUPER_ADMIN_PASSWORD,
      },
    });

    if (!signUpResult?.user?.id) {
      throw new Error("Failed to seed super admin with credential account");
    }

    await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: {
        emailVerified: true,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("Seeded Super Admin user");
    return;
  }

  const hasCredentialAccount = existingAdmin.accounts.some(
    (account) => account.providerId === "credential",
  );

  if (!hasCredentialAccount) {
    await prisma.user.delete({
      where: { id: existingAdmin.id },
    });

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: "Super Admin",
        email: envVariables.SUPER_ADMIN_EMAIL,
        password: envVariables.SUPER_ADMIN_PASSWORD,
      },
    });

    if (!signUpResult?.user?.id) {
      throw new Error(
        "Failed to recreate super admin with credential account",
      );
    }

    await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: {
        emailVerified: true,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("Recreated Super Admin with credential account");
    return;
  }

  if (
    existingAdmin.role !== UserRole.ADMIN ||
    existingAdmin.status !== UserStatus.ACTIVE
  ) {
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
