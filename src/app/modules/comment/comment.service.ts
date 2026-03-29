import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { TCreateCommentPayload } from "./comment.interface";

type TCommentNode = Awaited<ReturnType<typeof prisma.ideaComment.findMany>>[number] & {
  replies: TCommentNode[];
};

const buildCommentTree = (
  comments: Awaited<ReturnType<typeof prisma.ideaComment.findMany>>,
) => {
  const commentMap = new Map<string, TCommentNode>();
  const rootComments: TCommentNode[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
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

const create = async (userId: string, payload: TCreateCommentPayload) => {
  if (payload.parentId) {
    const parent = await prisma.ideaComment.findUnique({
      where: { id: payload.parentId },
      select: { id: true, ideaId: true, isDeleted: true },
    });

    if (!parent || parent.ideaId !== payload.ideaId || parent.isDeleted) {
      throw new AppError(400, "Invalid parent comment for this idea");
    }
  }

  return prisma.ideaComment.create({
    data: {
      userId,
      ideaId: payload.ideaId,
      content: payload.content,
      parentId: payload.parentId,
    },
  });
};

const listByIdea = async (ideaId: string) => {
  const comments = await prisma.ideaComment.findMany({
    where: {
      ideaId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return buildCommentTree(comments);
};

const remove = async (id: string, user: { id: string; role: "MEMBER" | "ADMIN" }) => {
  const comment = await prisma.ideaComment.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!comment) throw new AppError(404, "Comment not found");

  if (user.role !== "ADMIN" && comment.userId !== user.id) {
    throw new AppError(403, "Forbidden");
  }

  return prisma.ideaComment.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const CommentService = {
  create,
  listByIdea,
  remove,
};
