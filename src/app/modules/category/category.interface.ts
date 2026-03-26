export type TCreateCategoryPayload = {
  name: string;
  description?: string;
};

export type TUpdateCategoryPayload = Partial<TCreateCategoryPayload>;
