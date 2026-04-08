import AppError from "../../errorHelpers/AppError";
import { envVariables } from "../../config/env";

type TIdeaContext = {
  id: string;
  title: string;
  category: string;
  isPaid: boolean;
  upvotes: number;
  commentCount: number;
  problemStatement: string;
  proposedSolution: string;
  description: string;
};

type TAssistantPayload = {
  question: string;
  ideas: TIdeaContext[];
};

type TDraftPayload = {
  title: string;
  categoryName?: string;
  problemStatement: string;
  proposedSolution: string;
  description: string;
  isPaid: boolean;
};

type TGeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

const DEFAULT_GEMINI_MODEL = envVariables.GEMINI.MODEL || "gemini-2.5-flash-lite";
const MAX_GEMINI_RETRIES = 1;

const getGeminiApiKey = () => {
  if (!envVariables.GEMINI.API_KEY) {
    throw new AppError(500, "GEMINI_API_KEY is not configured");
  }

  return envVariables.GEMINI.API_KEY;
};

const formatIdeasForPrompt = (ideas: TIdeaContext[]) =>
  ideas
    .map(
      (idea, index) =>
        `${index + 1}. ${idea.title} | Category: ${idea.category} | Paid: ${idea.isPaid ? "yes" : "no"} | Upvotes: ${idea.upvotes} | Comments: ${idea.commentCount}\nProblem: ${idea.problemStatement}\nSolution: ${idea.proposedSolution}\nDescription: ${idea.description}`,
    )
    .join("\n\n");

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getRetryDelayMs = (message?: string) => {
  if (!message) return null;

  const match = message.match(/Please retry in\s+([\d.]+)s/i);

  if (!match) return null;

  const seconds = Number(match[1]);

  if (Number.isNaN(seconds) || seconds <= 0) return null;

  return Math.ceil(seconds * 1000);
};

const mapGeminiErrorToStatusCode = (responseStatus: number, payload: TGeminiResponse) => {
  const message = payload.error?.message?.toLowerCase() || "";
  const providerCode = payload.error?.code;
  const providerStatus = payload.error?.status?.toLowerCase() || "";

  if (
    responseStatus === 429 ||
    providerCode === 429 ||
    providerStatus.includes("resource_exhausted") ||
    message.includes("quota exceeded") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted")
  ) {
    return 429;
  }

  if (responseStatus === 401 || responseStatus === 403 || providerCode === 401 || providerCode === 403) {
    return 502;
  }

  if (responseStatus >= 400 && responseStatus < 500) {
    return 400;
  }

  return 502;
};

const createGeminiError = (responseStatus: number, payload: TGeminiResponse) => {
  const statusCode = mapGeminiErrorToStatusCode(responseStatus, payload);
  const providerMessage = payload.error?.message || "Gemini request failed";

  if (statusCode === 429) {
    const retryDelayMs = getRetryDelayMs(providerMessage);
    const retryText = retryDelayMs
      ? ` Please try again in ${Math.ceil(retryDelayMs / 1000)} seconds.`
      : " Please try again shortly.";

    return new AppError(
      429,
      `AI request limit reached for the configured Gemini account.${retryText}`,
    );
  }

  return new AppError(statusCode, providerMessage);
};

const requestGemini = async (input: {
  systemInstruction: string;
  prompt: string;
}) => {
  let attempt = 0;

  try {
    while (true) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": getGeminiApiKey(),
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: input.systemInstruction }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: input.prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.5,
              topP: 0.9,
            },
          }),
        },
      );

      let payload: TGeminiResponse;

      try {
        payload = (await response.json()) as TGeminiResponse;
      } catch {
        throw new AppError(502, "Gemini returned an unreadable response");
      }

      if (response.ok && !payload.error) {
        return payload;
      }

      const retryDelayMs = getRetryDelayMs(payload.error?.message);
      const shouldRetry =
        attempt < MAX_GEMINI_RETRIES &&
        mapGeminiErrorToStatusCode(response.status, payload) === 429 &&
        retryDelayMs !== null &&
        retryDelayMs <= 30000;

      if (!shouldRetry) {
        throw createGeminiError(response.status, payload);
      }

      attempt += 1;
      await sleep(retryDelayMs);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, "Failed to communicate with Gemini");
  }
};

const parseGeminiJson = async <T>(input: {
  systemInstruction: string;
  prompt: string;
}) => {
  const payload = await requestGemini(input);

  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new AppError(502, "Gemini returned an empty response");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AppError(502, "Gemini returned invalid JSON");
  }
};

const askAssistant = async (payload: TAssistantPayload) => {
  return parseGeminiJson<{
    answer: string;
    suggestions: string[];
  }>({
    systemInstruction:
      "You are EcoSpark Hub's AI assistant. Answer only from the supplied platform context and return valid JSON.",
    prompt: `Platform: EcoSpark Hub, a sustainability idea-sharing platform. Public ideas can be free or paid. Members draft ideas and admins review them before approval.

Available idea catalog:
${formatIdeasForPrompt(payload.ideas)}

User question:
${payload.question}

Return JSON with:
- answer: concise, grounded answer based on the supplied context
- suggestions: 2 to 3 short follow-up prompts

If the answer is uncertain, say so briefly instead of inventing details.`,
  });
};

const generateDraft = async (payload: TDraftPayload) => {
  return parseGeminiJson<{
    title: string;
    categoryHint: string;
    problemStatement: string;
    proposedSolution: string;
    description: string;
    mediaUrls: string;
    price?: number;
    readinessScore: number;
    reasons: string[];
  }>({
    systemInstruction:
      "You are EcoSpark Hub's idea drafting assistant. Strengthen the user's draft and return only valid JSON.",
    prompt: `Platform: EcoSpark Hub. The user is drafting a sustainability idea submission for admin review.

Current draft:
- Title: ${payload.title || "(empty)"}
- Category: ${payload.categoryName || "(not selected)"}
- Problem statement: ${payload.problemStatement || "(empty)"}
- Proposed solution: ${payload.proposedSolution || "(empty)"}
- Description: ${payload.description || "(empty)"}
- Paid idea: ${payload.isPaid ? "yes" : "no"}

Return JSON with:
- title
- categoryHint
- problemStatement
- proposedSolution
- description
- mediaUrls
- price
- readinessScore
- reasons

Rules:
- Improve and complete the draft without changing the core intent.
- Keep the content practical and reviewable, not overly promotional.
- mediaUrls should usually be an empty string unless the user already implies specific media assets.
- Set price only when the idea is paid. Omit price for free ideas.
- readinessScore must be 0-100.
- reasons should explain the improvement choices briefly.`,
  });
};

export const AiService = {
  askAssistant,
  generateDraft,
};
