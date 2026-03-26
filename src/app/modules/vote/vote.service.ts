import { VoteType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { TVotePayload } from "./vote.interface";

const upsert = async (userId: string, payload: TVotePayload) => {
  return prisma.ideaVote.upsert({
    where: {
      ideaId_userId: {
        ideaId: payload.ideaId,
        userId,
      },
    },
    create: {
      ideaId: payload.ideaId,
      userId,
      type: payload.type as VoteType,
    },
    update: {
      type: payload.type as VoteType,
    },
  });
};

const remove = async (userId: string, ideaId: string) => {
  return prisma.ideaVote.delete({
    where: {
      ideaId_userId: {
        ideaId,
        userId,
      },
    },
  });
};

export const VoteService = {
  upsert,
  remove,
};
