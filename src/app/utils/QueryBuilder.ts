type TQueryValue = string | string[] | undefined;
type TQueryRecord = Record<string, TQueryValue>;

export type TSortOrder = "asc" | "desc";

export type TQueryBuilderResult<
  TWhere extends Record<string, unknown>,
  TOrderBy extends Record<string, unknown>,
> = {
  where: TWhere;
  orderBy: TOrderBy;
  page: number;
  limit: number;
  skip: number;
};

export class QueryBuilder<
  TWhere extends Record<string, unknown>,
  TOrderBy extends Record<string, unknown>,
> {
  private where: TWhere;
  private orderBy: TOrderBy;
  private page = 1;
  private limit = 10;
  private skip = 0;

  constructor(
    private readonly query: TQueryRecord,
    initialWhere: TWhere,
    initialOrderBy: TOrderBy,
  ) {
    this.where = { ...initialWhere };
    this.orderBy = { ...initialOrderBy };
  }

  search(fields: string[]) {
    const rawSearchTerm = this.query.searchTerm;
    const searchTerm = Array.isArray(rawSearchTerm)
      ? rawSearchTerm[0]
      : rawSearchTerm;

    if (!searchTerm) return this;

    this.where = {
      ...this.where,
      OR: fields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    };

    return this;
  }

  filter(allowedFields: string[]) {
    allowedFields.forEach((field) => {
      const value = this.query[field];
      if (value === undefined) return;

      const normalizedValue = Array.isArray(value) ? value[0] : value;
      this.where = {
        ...this.where,
        [field]: normalizedValue,
      };
    });

    return this;
  }

  mapFilter(field: string, mapper: (value: string) => unknown) {
    const value = this.query[field];
    if (value === undefined) return this;

    const normalizedValue = Array.isArray(value) ? value[0] : value;
    this.where = {
      ...this.where,
      [field]: mapper(normalizedValue),
    };

    return this;
  }

  sort(defaultField: string, defaultOrder: TSortOrder = "desc") {
    const rawSortBy = this.query.sortBy;
    const rawSortOrder = this.query.sortOrder;

    const sortBy = Array.isArray(rawSortBy) ? rawSortBy[0] : rawSortBy;
    const sortOrder = Array.isArray(rawSortOrder)
      ? rawSortOrder[0]
      : rawSortOrder;

    const order: TSortOrder = sortOrder === "asc" ? "asc" : defaultOrder;
    const field = sortBy || defaultField;

    this.orderBy = {
      [field]: order,
    } as TOrderBy;

    return this;
  }

  paginate(defaultLimit = 10, maxLimit = 100) {
    const rawPage = this.query.page;
    const rawLimit = this.query.limit;

    const parsedPage = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
    const parsedLimit = Number(
      Array.isArray(rawLimit) ? rawLimit[0] : rawLimit,
    );

    this.page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    this.limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, maxLimit)
        : defaultLimit;
    this.skip = (this.page - 1) * this.limit;

    return this;
  }

  build(): TQueryBuilderResult<TWhere, TOrderBy> {
    return {
      where: this.where,
      orderBy: this.orderBy,
      page: this.page,
      limit: this.limit,
      skip: this.skip,
    };
  }
}

