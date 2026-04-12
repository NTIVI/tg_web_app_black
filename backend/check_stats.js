import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function checkStats() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM settings WHERE key LIKE 'social_%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        client.release();
        await pool.end();
    }
}
checkStats();
