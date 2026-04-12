import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateSocial() {
    const client = await pool.connect();
    try {
        console.log('Updating social links...');
        await client.query("UPDATE settings SET value = 'https://www.youtube.com/@YourTurn_Arm' WHERE key = 'social_youtube_url'");
        await client.query("UPDATE settings SET value = 'https://www.instagram.com/yourturn_arm/' WHERE key = 'social_instagram_url'");
        await client.query("UPDATE settings SET value = 'https://www.facebook.com/yourturn.arm/' WHERE key = 'social_facebook_url'");
        console.log('Done.');
    } finally {
        client.release();
        await pool.end();
    }
}

updateSocial();
