import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct connection for Drizzle Kit (not the pooler)
    url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
