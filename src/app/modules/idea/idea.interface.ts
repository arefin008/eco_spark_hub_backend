import type { Prisma } from "../../../generated/prisma/client";

export type TCreateIdeaPayload = {
  title: string;
  problemStatement: string;
  proposedSolution: string;
  description: string;
  categoryId: string;
  isPaid?: boolean;
  price?: number;
  mediaUrls?: string[];
};

export type TUpdateIdeaPayload = Partial<TCreateIdeaPayload>;

export type TReviewIdeaPayload = {
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
};

export type TIdeaWithRelations = Prisma.IdeaGetPayload<{
  include: {
    category: true;
    author: { select: { id: true; name: true; email: true } };
    media: true;
    votes: { select: { type: true } };
    _count: { select: { comments: true; votes: true } };
  };
}>;

export type TIdeaQueryFilter = Prisma.IdeaWhereInput;
