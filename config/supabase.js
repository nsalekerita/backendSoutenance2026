"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
/**
 * Client Supabase "administrateur" (service role) — utilisé UNIQUEMENT côté backend.
 * Contourne la RLS : chaque service doit donc vérifier lui-même les droits
 * (rôle courant, propriétaire de la ressource, etc.) avant toute opération.
 */
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_1.env.supabaseUrl, env_1.env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
