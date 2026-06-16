import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

if (!process.env.JWT_SECRET) {
  console.warn(
    "\n" +
    "╔══════════════════════════════════════════════════════════════╗\n" +
    "║  ⚠️  WARNING: JWT_SECRET not set in environment variables  ║\n" +
    "║  Using default dev secret — tokens are NOT secure!         ║\n" +
    "║  Set JWT_SECRET in your .env file before production use.   ║\n" +
    "╚══════════════════════════════════════════════════════════════╝\n"
  );
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  dbType: process.env.DB_TYPE || "sqlite",
  databaseUrl: process.env.DATABASE_URL || resolve(__dirname, "../data/dbdesign.db"),
};
