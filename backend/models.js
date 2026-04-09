import pool from './database.js';

// Helper to convert '?' placeholders to '$1, $2, ...' for PostgreSQL
const convertPlaceholders = (sql) => {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
};

export const DB = {
    run: (sql, params = []) => new Promise(async (resolve, reject) => {
        try {
            const convertedSql = convertPlaceholders(sql);
            const res = await pool.query(convertedSql, params);
            // PostgreSQL doesn't have insertId. If used with RETURNING id, it's in rows[0].id
            resolve({ id: res.rows?.[0]?.id || null, changes: res.rowCount });
        } catch (err) {
            reject(err);
        }
    }),
    get: (sql, params = []) => new Promise(async (resolve, reject) => {
        try {
            const convertedSql = convertPlaceholders(sql);
            const res = await pool.query(convertedSql, params);
            resolve(res.rows[0]);
        } catch (err) {
            reject(err);
        }
    }),
    all: (sql, params = []) => new Promise(async (resolve, reject) => {
        try {
            const convertedSql = convertPlaceholders(sql);
            const res = await pool.query(convertedSql, params);
            resolve(res.rows);
        } catch (err) {
            reject(err);
        }
    })
};
