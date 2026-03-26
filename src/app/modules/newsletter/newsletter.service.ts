import { prisma } from "../../lib/prisma";

const subscribe = async (email: string) => {
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, subscribed: true },
    update: { subscribed: true, subscribedAt: new Date() },
  });
};

const unsubscribe = async (email: string) => {
  return prisma.newsletterSubscriber.update({
    where: { email },
    data: { subscribed: false },
  });
};

const getAll = async () => {
  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const NewsletterService = {
  subscribe,
  unsubscribe,
  getAll,
};
