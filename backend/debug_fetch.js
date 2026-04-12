import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function debugFetch() {
    const urls = [
        'https://www.youtube.com/@YourTurn_Arm',
        'https://www.instagram.com/yourturn_arm/'
    ];
    const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    for (const url of urls) {
        console.log('Fetching:', url);
        try {
            const res = await fetch(url, { headers });
            const html = await res.text();
            console.log('Length:', html.length);
            console.log('First 500 chars:', html.substring(0, 500));
            // Look for "subscriber" anywhere
            const subIndex = html.toLowerCase().indexOf('follower');
            if (subIndex !== -1) {
                console.log('Found "follower" at:', subIndex);
                console.log('Context:', html.substring(subIndex - 50, subIndex + 100));
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
}
debugFetch();
