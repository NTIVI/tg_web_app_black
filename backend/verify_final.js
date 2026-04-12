import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const DB = {
    all: (q, p) => pool.query(q, p).then(r => r.rows),
    run: (q, p) => pool.query(q, p)
};

const scrapeSocialStats = async () => {
    console.log('Verifying Refined Scrapers...');
    const settings = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'social_%_url'");
    const urls = {};
    settings.forEach(s => {
        const net = s.key.split('_')[1];
        urls[net] = s.value;
    });

    const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    // YouTube
    if (urls.youtube) {
        try {
            console.log('YouTube Handle:', urls.youtube);
            const res = await fetch(urls.youtube, { headers });
            const html = await res.text();
            const match = html.match(/"subscriberCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/i) || 
                          html.match(/"label":\s*"([^"]+)\s+(subscribers|подписчиков)/i) ||
                          html.match(/([\d.]+[KMBТМ]?)\s+(subscribers|подписчиков|отметки)/i);
            if (match) {
                const text = (match[1]).toUpperCase().replace(/,/g, '');
                console.log('YouTube Match Text:', text);
                let countMatch = text.match(/[\d.]+/);
                if (countMatch) {
                    let count = parseFloat(countMatch[0]);
                    if (text.includes('K') || text.includes('ТЫС')) count *= 1000;
                    else if (text.includes('M') || text.includes('МЛН')) count *= 1000000;
                    console.log('YouTube Result:', Math.round(count));
                    await DB.run("UPDATE settings SET value = ? WHERE key = 'social_youtube_current'", [Math.round(count).toString()]);
                }
            } else { console.log('YouTube NO MATCH'); }
        } catch (e) { console.error('YT Error:', e.message); }
    }

    // Instagram
    if (urls.instagram) {
        try {
            console.log('Instagram Handle:', urls.instagram);
            const res = await fetch(urls.instagram, { headers });
            const html = await res.text();
            const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
            if (ogDesc) {
                const content = ogDesc[1].toUpperCase();
                console.log('Instagram OG Content:', content);
                const match = content.match(/([\d.,KMBТМ]+)\s*(FOLLOWERS|ПОДПИСЧИКОВ)/i);
                if (match) {
                    let countText = match[1].replace(/[\s,]/g, '').replace('ТЫС', 'K').replace('МЛН', 'M');
                    let count = parseFloat(countText);
                    if (countText.includes('K')) count *= 1000;
                    else if (countText.includes('M')) count *= 1000000;
                    console.log('Instagram Result:', Math.round(count));
                    await DB.run("UPDATE settings SET value = ? WHERE key = 'social_instagram_current'", [Math.round(count).toString()]);
                } else { console.log('Instagram NO REGEX MATCH in content'); }
            } else { console.log('Instagram NO OG:DESC MATCH'); }
        } catch (e) { console.error('IG Error:', e.message); }
    }
};

scrapeSocialStats();
