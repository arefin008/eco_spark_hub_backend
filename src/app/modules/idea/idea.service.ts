import { IdeaStatus, PurchaseStatus, VoteType } from "../../../generated/prisma/enums";
import type { Prisma } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import {
  TCreateIdeaPayload,
  TReviewIdeaPayload,
  TUpdateIdeaPayload,
} from "./idea.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";

type TIdeaBaseWithRelations = Prisma.IdeaGetPayload<{
  include: {
    category: true;
    author: { select: { id: true; name: true; email: true } };
    media: true;
    votes: { select: { type: true } };
    _count: { select: { comments: true; votes: true } };
  };
}>;

type TIdeaQueryFilter = Prisma.IdeaWhereInput;

interface IShapedIdea extends TIdeaBaseWithRelations {
  upvotes: number;
  downvotes: number;
  commentCount: number;
  voteCount: number;
}

const shapeIdea = (idea: TIdeaBaseWithRelations): IShapedIdea => {
  const upvotes = idea.votes.filter((v) => v.type === VoteType.UPVOTE).length;
  const downvotes = idea.votes.filter((v) => v.type === VoteType.DOWNVOTE).length;

  return {
    ...idea,
    upvotes,
    downvotes,
    commentCount: idea._count.comments,
    voteCount: idea._count.votes,
  };
};

const create = async (authorId: string, payload: TCreateIdeaPayload) => {
  if (payload.isPaid && (payload.price === undefined || payload.price <= 0)) {
    throw new AppError(400, "Paid idea must include price greater than 0");
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
      media: payload.mediaUrls?.length
        ? {
            createMany: {
              data: payload.mediaUrls.map((url) => ({ url })),
            },
          }
        : undefined,
    },
    include: {
      media: true,
    },
  });
};

const getAll = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<TIdeaQueryFilter, Prisma.IdeaOrderByWithRelationInput>(
    query as Record<string, string | string[] | undefined>,
    { status: IdeaStatus.APPROVED },
    { createdAt: "desc" },
  )
    .search(["title", "description", "problemStatement", "proposedSolution"])
    .filter(["categoryId", "authorId"])
    .mapFilter("paymentStatus", (value) => value === "PAID")
    .sort("createdAt", "desc")
    .paginate(10, 50);

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
          select: { id: true, name: true, email: true },
        },
        media: true,
        votes: { select: { type: true } },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    }),
  ]);

  const minUpvotes = Number(query.minUpvotes || 0);
  const sortBy = String(query.sortBy || "RECENT");

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
      total,
    },
    data: shaped,
  };
};

const getById = async (id: string, user?: { id: string; role: "MEMBER" | "ADMIN" }) => {
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { id: true, name: true, email: true } },
      media: true,
      votes: { select: { type: true } },
      _count: { select: { comments: true, votes: true } },
    },
  });

  if (!idea) throw new AppError(404, "Idea not found");

  const shaped = shapeIdea(idea);

  if (!idea.isPaid) {
    return { ...shaped, canAccess: true };
  }

  const isOwner = user?.id === idea.authorId;
  const isAdmin = user?.role === "ADMIN";

  if (isOwner || isAdmin) {
    return { ...shaped, canAccess: true };
  }

  if (!user?.id) {
    return {
      id: idea.id,
      title: idea.title,
      isPaid: true,
      price: idea.price,
      category: idea.category,
      author: idea.author,
      createdAt: idea.createdAt,
      canAccess: false,
      lockReason: "Login and purchase required",
    };
  }

  const purchase = await prisma.ideaPurchase.findFirst({
    where: {
      ideaId: id,
      userId: user.id,
      status: PurchaseStatus.PAID,
    },
  });

  if (!purchase) {
    return {
      id: idea.id,
      title: idea.title,
      isPaid: true,
      price: idea.price,
      category: idea.category,
      author: idea.author,
      createdAt: idea.createdAt,
      canAccess: false,
      lockReason: "Purchase required",
    };
  }

  return { ...shaped, canAccess: true };
};

const update = async (id: string, userId: string, payload: TUpdateIdeaPayload) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError(404, "Idea not found");

  if (idea.authorId !== userId) throw new AppError(403, "Forbidden");
  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError(400, "Published ideas cannot be edited");
  }

  if (payload.isPaid && (payload.price === undefined || payload.price <= 0)) {
    throw new AppError(400, "Paid idea must include price greater than 0");
  }

  return prisma.idea.update({
    where: { id },
    data: {
      ...payload,
      price: payload.isPaid ? payload.price : payload.isPaid === false ? null : payload.price,
      media: payload.mediaUrls
        ? {
            deleteMany: {},
            createMany: {
              data: payload.mediaUrls.map((url) => ({ url })),
            },
          }
        : undefined,
    },
    include: {
      media: true,
    },
  });
};

const remove = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError(404, "Idea not found");
  if (idea.authorId !== userId) throw new AppError(403, "Forbidden");
  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError(400, "Published ideas cannot be deleted");
  }

  return prisma.idea.delete({ where: { id } });
};

const submitForReview = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError(404, "Idea not found");
  if (idea.authorId !== userId) throw new AppError(403, "Forbidden");

  return prisma.idea.update({
    where: { id },
    data: {
      status: IdeaStatus.UNDER_REVIEW,
      submittedAt: new Date(),
      rejectionReason: null,
    },
  });
};

const review = async (id: string, payload: TReviewIdeaPayload) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError(404, "Idea not found");

  if (payload.action === "REJECT" && !payload.rejectionReason) {
    throw new AppError(400, "Rejection reason is required for rejected ideas");
  }

  return prisma.idea.update({
    where: { id },
    data:
      payload.action === "APPROVE"
        ? {
            status: IdeaStatus.APPROVED,
            approvedAt: new Date(),
            rejectionReason: null,
          }
        : {
            status: IdeaStatus.REJECTED,
            rejectionReason: payload.rejectionReason,
          },
  });
};

const getMine = async (userId: string) => {
  return prisma.idea.findMany({
    where: {
      authorId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
      media: true,
      _count: {
        select: {
          comments: true,
          votes: true,
        },
      },
    },
  });
};

export const IdeaService = {
  create,
  getAll,
  getById,
  update,
  remove,
  submitForReview,
  review,
  getMine,
};
