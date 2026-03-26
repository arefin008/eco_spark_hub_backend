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
