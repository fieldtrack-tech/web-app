import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .min(1, { message: "NEXT_PUBLIC_API_BASE_URL is required." })
    .refine(
      (v) => v.startsWith("/") || z.string().url().safeParse(v).success,
      { message: "NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL or the proxy path /api/proxy." }
    ),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL." }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, { message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required." }),
});

type ParsedEnv = z.infer<typeof EnvSchema>;

export type Env = Readonly<{
  API_BASE_URL: ParsedEnv["NEXT_PUBLIC_API_BASE_URL"];
  SUPABASE_URL: ParsedEnv["NEXT_PUBLIC_SUPABASE_URL"];
  SUPABASE_ANON_KEY: ParsedEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
}>;

function buildErrorMessage(issues: z.ZodIssue[]): string {
  return [
    "[FieldTrack] Invalid environment configuration:",
    ...issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`),
    "Required: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].join("\n");
}

function parseEnv(): ParsedEnv {
  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(buildErrorMessage(parsed.error.issues));
  }

  return parsed.data;
}

const parsed = parseEnv();

export const env: Env = Object.freeze({
  API_BASE_URL: parsed.NEXT_PUBLIC_API_BASE_URL,
  SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function validateEnv(): void {
  parseEnv();
}
