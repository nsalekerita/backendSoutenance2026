"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listerFilieres = listerFilieres;
exports.getFiliere = getFiliere;
exports.creerFiliere = creerFiliere;
exports.ajouterCritere = ajouterCritere;
const supabase_1 = require("../config/supabase");
async function listerFilieres() {
    const { data, error } = await supabase_1.supabaseAdmin.from('filieres').select('*, filiere_criteres(*)').order('nom');
    if (error)
        throw error;
    return data ?? [];
}
async function getFiliere(id) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('filieres')
        .select('*, filiere_criteres(*)')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function creerFiliere(input) {
    const { data, error } = await supabase_1.supabaseAdmin.from('filieres').insert(input).select().single();
    if (error)
        throw error;
    return data;
}
async function ajouterCritere(filiereId, input) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('filiere_criteres')
        .insert({ filiere_id: filiereId, ...input })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
