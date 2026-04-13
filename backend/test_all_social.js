import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const DB = {
    all: (q, p) => pool.query(q, p).then(r => r.rows),
    run: (q, p) => pool.query(q, p)
};

async function testAll() {
    console.log('--- Comprehensive Scraper Test ---');
    const settings = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'social_%_url'");
    const urls = {};
    settings.forEach(s => urls[s.key.split('_')[1]] = s.value);

    const headers = { 
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    for (const [net, url] of Object.entries(urls)) {
        console.log(`\nTesting ${net.toUpperCase()}: ${url}`);
        try {
            const res = await fetch(url, { headers });
            const html = await res.text();
            let count = null;

            if (net === 'telegram') {
                const match = html.match(/<div class="tgme_page_extra">([\d\s,]+)\s+/);
                if (match) count = parseInt(match[1].replace(/[\s,]/g, ''));
            } else if (net === 'youtube') {
                const match = html.match(/"subscriberCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/i) || 
                              html.match(/"label":\s*"([^"]+)\s+(subscribers|подписчиков)/i) ||
                              html.match(/([\d.]+[KMBТМ]?)\s+(subscribers|подписчиков|отметки)/i);
                if (match) {
                    const text = (match[1]).toUpperCase().replace(/,/g, '');
                    let countMatch = text.match(/[\d.]+/);
                    if (countMatch) {
                        count = parseFloat(countMatch[0]);
                        if (text.includes('K') || text.includes('ТЫС')) count *= 1000;
                        else if (text.includes('M') || text.includes('МЛН')) count *= 1000000;
                    }
                }
            } else if (net === 'instagram' || net === 'facebook') {
                const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
                if (ogDesc) {
                    const content = ogDesc[1].toUpperCase();
                    const match = content.match(/([\d.,KMBТМ]+)\s*(FOLLOWERS|ПОДПИСЧИКОВ|ОТМЕТКИ)/i);
                    if (match) {
                        let countText = match[1].replace(/[\s,]/g, '').replace('ТЫС', 'K').replace('МЛН', 'M');
                        count = parseFloat(countText);
                        if (countText.includes('K')) count *= 1000;
                        else if (countText.includes('M')) count *= 1000000;
                    }
                }
            } else if (net === 'tiktok') {
                const match = html.match(/"followerCount":(\d+)/);
                if (match) count = parseInt(match[1]);
            }

            if (count !== null) {
                console.log(`>> SUCCESS: ${Math.round(count)}`);
            } else {
                console.log(`>> FAILED (No match found)`);
                // console.log('Snippet:', html.slice(0, 500));
            }
        } catch (e) {
            console.log(`>> ERROR: ${e.message}`);
        }
    }
    process.exit(0);
}

testAll();
