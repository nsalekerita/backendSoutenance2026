"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function optional(name, fallback = '') {
    const value = process.env[name] ?? fallback;
    if (!value)
        console.warn(`[env] Variable manquante: ${name}`);
    return value;
}
exports.env = {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    supabaseUrl: optional('SUPABASE_URL'),
    supabaseServiceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY'),
    supabaseAnonKey: optional('SUPABASE_ANON_KEY'),
    jwtSecret: optional('JWT_SECRET', 'dev-secret-change-me'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    geminiApiKey: optional('GEMINI_API_KEY'),
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
};