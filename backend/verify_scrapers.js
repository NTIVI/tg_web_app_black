import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const DB = {
    all: (q, p) => pool.query(q, p).then(r => r.rows),
    get: (q, p) => pool.query(q, p).then(r => r.rows[0]),
    run: (q, p) => pool.query(q, p)
};

const scrapeSocialStats = async () => {
    console.log('Verifying scrapers...');
    const settings = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'social_%_url'");
    const urls = {};
    settings.forEach(s => {
        const net = s.key.split('_')[1];
        urls[net] = s.value;
    });

    const headers = { 
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    // Scrape YouTube
    if (urls.youtube) {
        try {
            console.log('Testing YouTube:', urls.youtube);
            const res = await fetch(urls.youtube, { headers });
            const html = await res.text();
            const match = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/i) || 
                          html.match(/"subscriberCountText":\s*{\s*"accessibility":\s*{\s*"accessibilityData":\s*{\s*"label":\s*"([^"]+)"/i);
            if (match) {
                const text = (match[1] || match[2]).toUpperCase().replace(/,/g, '');
                console.log('YouTube Match:', text);
                let count = parseFloat(text.match(/[\d.]+/)?.[0] || '0');
                if (text.includes('K') || text.includes('ТЫС')) count *= 1000;
                else if (text.includes('M') || text.includes('МЛН')) count *= 1000000;
                console.log('YouTube Count:', Math.round(count));
                await DB.run("UPDATE settings SET value = $1 WHERE key = 'social_youtube_current'", [Math.round(count).toString()]);
            } else {
                console.log('YouTube Match FAILED');
            }
        } catch (e) { console.error('YouTube error:', e.message); }
    }

    // Scrape Instagram
    if (urls.instagram) {
        try {
            console.log('Testing Instagram:', urls.instagram);
            const res = await fetch(urls.instagram, { headers });
            const html = await res.text();
            const match = html.match(/<meta property="og:description" content="([\d.,кКмМbB\s]+) (Followers|Подписчиков)/i);
            if (match) {
                console.log('Instagram Match:', match[1]);
                let countText = match[1].replace(/[\s,]/g, '').replace('к', 'K').replace('м', 'M').toUpperCase();
                let count = parseFloat(countText);
                if (countText.includes('K')) count *= 1000;
                else if (countText.includes('M')) count *= 1000000;
                console.log('Instagram Count:', Math.round(count));
                await DB.run("UPDATE settings SET value = $1 WHERE key = 'social_instagram_current'", [Math.round(count).toString()]);
            } else {
                console.log('Instagram Match FAILED - Page might be blocking or structure changed');
            }
        } catch (e) { console.error('Instagram error:', e.message); }
    }
};

scrapeSocialStats();
