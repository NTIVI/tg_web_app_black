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
            resolve({ id: res.rows?.[0]?.id || null, changes: res.rowCount });
        } catch (err) {
            console.error('DB Run Error:', err.message, '| SQL:', sql, '| Params:', params);
            reject(err);
        }
    }),
    get: (sql, params = []) => new Promise(async (resolve, reject) => {
        try {
            const convertedSql = convertPlaceholders(sql);
            const res = await pool.query(convertedSql, params);
            resolve(res.rows[0]);
        } catch (err) {
            console.error('DB Get Error:', err.message, '| SQL:', sql, '| Params:', params);
            reject(err);
        }
    }),
    all: (sql, params = []) => new Promise(async (resolve, reject) => {
        try {
            const convertedSql = convertPlaceholders(sql);
            const res = await pool.query(convertedSql, params);
            resolve(res.rows);
        } catch (err) {
            console.error('DB All Error:', err.message, '| SQL:', sql, '| Params:', params);
            reject(err);
        }
    }),
    transaction: (callback) => new Promise(async (resolve, reject) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const tx = {
                run: async (sql, params = []) => {
                    const convertedSql = convertPlaceholders(sql);
                    const res = await client.query(convertedSql, params);
                    return { id: res.rows?.[0]?.id || null, changes: res.rowCount };
                },
                get: async (sql, params = []) => {
                    const convertedSql = convertPlaceholders(sql);
                    const res = await client.query(convertedSql, params);
                    return res.rows[0];
                },
                all: async (sql, params = []) => {
                    const convertedSql = convertPlaceholders(sql);
                    const res = await client.query(convertedSql, params);
                    return res.rows;
                }
            };
            const result = await callback(tx);
            await client.query('COMMIT');
            resolve(result);
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Transaction Error:', err.message);
            reject(err);
        } finally {
            client.release();
        }
    })
};
