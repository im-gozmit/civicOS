import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Runs BEFORE any test file or app module is loaded, so the app can never touch the real .data
// folder. (Setting these inside the test file is too late: static imports are evaluated first.)
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "civicos-test-"));
process.env.SESSION_SECRET = "x".repeat(40);
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "correct-horse-battery";
process.env.PHONE_ENCRYPTION_KEY = "0123456789abcdef".repeat(4); // 64 hex chars, test only
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.GEMINI_API_KEY = "";
process.env.OPENAI_API_KEY = "";
