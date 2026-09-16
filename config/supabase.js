"use strict";
// Compatibilité avec l'ancienne interface de requête. Les données sont
// désormais stockées dans PostgreSQL/RDS et les fichiers dans S3.
const { query } = require('./database');
const { storage } = require('./storage');
const identifier = (value) => {
    if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
    return `"${value}"`;
};
class Builder {
    constructor(table) { this.table = table; this.op = 'select'; this.filters = []; this.params = []; this.columns = '*'; }
    select(columns = '*', options = {}) { this.columns = columns; this.options = options; return this; }
    insert(payload) { this.op = 'insert'; this.payload = payload; return this; }
    upsert(payload, options = {}) { this.op = 'upsert'; this.payload = payload; this.conflict = options.onConflict; return this; }
    update(payload) { this.op = 'update'; this.payload = payload; return this; }
    delete() { this.op = 'delete'; return this; }
    eq(column, value) { this.params.push(value); this.filters.push(`${identifier(column)} = $${this.params.length}`); return this; }
    in(column, values) { this.params.push(values); const cast = column === 'filiere_actuelle_id' || column === 'id' ? '::uuid[]' : ''; this.filters.push(`${identifier(column)} = ANY($${this.params.length}${cast})`); return this; }
    contains(column, values) { this.params.push(values); const cast = column === 'filieres_ciblees' ? '::uuid[]' : ''; this.filters.push(`${identifier(column)} @> $${this.params.length}${cast}`); return this; }
    textSearch(column, value) { this.params.push(`%${String(value).replace(/\s*\|\s*/g, '%')}%`); this.filters.push(`${identifier(column)} ILIKE $${this.params.length}`); return this; }
    order(column, { ascending = true } = {}) { this.orderBy = `${identifier(column)} ${ascending ? 'ASC' : 'DESC'}`; return this; }
    limit(value) { this.limitValue = Number(value); return this; }
    async single() { const result = await this.execute(); if (result.error) return result; if (result.data.length !== 1) return { data: null, error: new Error('Résultat unique attendu') }; return { data: result.data[0], error: null }; }
    async maybeSingle() { const result = await this.execute(); if (result.error) return result; return { data: result.data[0] ?? null, error: null }; }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
    whereSql() { return this.filters.length ? ` WHERE ${this.filters.join(' AND ')}` : ''; }
    projectionSql() {
        if (!this.columns || this.columns === '*' || this.columns.includes('(')) return '*';
        return this.columns.split(',').map((column) => identifier(column.trim())).join(',');
    }
    async execute() {
        try {
            let sql;
            const params = [...this.params];
            if (this.op === 'select') {
                if (this.options?.count === 'exact' && this.options?.head) {
                    const result = await query(`SELECT count(*)::int AS count FROM ${identifier(this.table)}${this.whereSql()}`, params);
                    return { data: null, count: result.rows[0].count, error: null };
                }
                sql = `SELECT ${this.projectionSql()} FROM ${identifier(this.table)}${this.whereSql()}`;
                if (this.orderBy) sql += ` ORDER BY ${this.orderBy}`;
                if (this.limitValue) sql += ` LIMIT ${this.limitValue}`;
            } else if (this.op === 'insert' || this.op === 'upsert') {
                const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
                if (!rows.length) return { data: [], error: null };
                const columns = [...new Set(rows.flatMap(Object.keys))];
                const valuesSql = rows.map((row) => `(${columns.map((column) => { params.push(dbValue(column, row[column])); return `$${params.length}`; }).join(',')})`).join(',');
                sql = `INSERT INTO ${identifier(this.table)} (${columns.map(identifier).join(',')}) VALUES ${valuesSql}`;
                if (this.op === 'upsert') {
                    const rawConflicts = this.conflict.split(',').map((v) => v.trim());
                    const updates = columns.filter((column) => !rawConflicts.includes(column));
                    sql += ` ON CONFLICT (${rawConflicts.map(identifier).join(',')}) DO UPDATE SET ${updates.map((column) => `${identifier(column)}=EXCLUDED.${identifier(column)}`).join(',')}`;
                }
                sql += ' RETURNING *';
            } else if (this.op === 'update') {
                const columns = Object.keys(this.payload);
                const setSql = columns.map((column) => { params.push(dbValue(column, this.payload[column])); return `${identifier(column)}=$${params.length}`; });
                sql = `UPDATE ${identifier(this.table)} SET ${setSql.join(',')}${this.whereSql()} RETURNING *`;
            } else {
                sql = `DELETE FROM ${identifier(this.table)}${this.whereSql()} RETURNING *`;
            }
            const result = await query(sql, params);
            return { data: await enrich(this.table, this.columns, result.rows), error: null };
        } catch (error) { return { data: null, error }; }
    }
}
function dbValue(column, value) {
    if (value === undefined) return null;
    if (['competences_requises', 'reponse', 'data', 'embedding'].includes(column) && value !== null) return JSON.stringify(value);
    return value;
}
async function enrich(table, columns, rows) {
    if (!rows.length || !columns.includes('(')) return rows;
    if (table === 'filieres') for (const row of rows) row.filiere_criteres = (await query('SELECT * FROM filiere_criteres WHERE filiere_id=$1', [row.id])).rows;
    if (table === 'etudiants' && columns.includes('etudiant_competences')) for (const row of rows) row.etudiant_competences = (await query('SELECT competence_nom FROM etudiant_competences WHERE etudiant_id=$1', [row.id])).rows;
    if (table === 'offres' && columns.includes('entreprises')) for (const row of rows) row.entreprises = (await query('SELECT id, nom, secteur FROM entreprises WHERE id=$1', [row.entreprise_id])).rows[0] ?? null;
    if (table === 'candidatures') for (const row of rows) {
        if (columns.includes('offres')) row.offres = (await query('SELECT id, titre, type, localisation, entreprise_id FROM offres WHERE id=$1', [row.offre_id])).rows[0] ?? null;
        if (columns.includes('etudiants')) row.etudiants = (await query('SELECT id, user_id, nom, prenom, filiere, specialite, photo_url FROM etudiants WHERE id=$1', [row.etudiant_id])).rows[0] ?? null;
    }
    if (table === 'recommandations' && columns.includes('scores_filieres')) for (const row of rows) row.scores_filieres = (await query("SELECT s.filiere_id, s.score, json_build_object('nom', f.nom) AS filieres FROM scores_filieres s JOIN filieres f ON f.id=s.filiere_id WHERE s.recommandation_id=$1", [row.id])).rows;
    return rows;
}
exports.supabaseAdmin = { from: (table) => new Builder(table), storage };
