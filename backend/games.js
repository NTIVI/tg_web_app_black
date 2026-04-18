const shouldWin = () => Math.random() < 0.40; // 40% win probability

const SYMBOLS = ['cherry', 'lemon', 'apple', 'bell', 'gem', 'star'];
const SLOTS_PAYTABLE = {
    'star': 50,
    'gem': 25,
    'bell': 15,
    'apple': 10,
    'lemon': 5,
    'cherry': 2
};

const handleSlots = (bet) => {
    const win = shouldWin();
    if (!win) {
        // Force lose: return mismatching symbols (5 reels)
        const outcome = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
        return { outcome, multiplier: 0, winAmount: 0 };
    }
    const s = Math.floor(Math.random() * SYMBOLS.length);
    const multiplier = SLOTS_PAYTABLE[SYMBOLS[s]] || 1.5;
    // 5 reels win: [s, s, s, s, s] or similar. Let's do 5 for jackpot feel.
    return { outcome: [s, s, s, s, s], multiplier, winAmount: Math.floor(bet * multiplier) };
};

const handleRoulette = (bet, betOn) => {
    const win = shouldWin();
    const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const blacks = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
    let winNumber = 0;
    let multiplier = 0;

    if (win) {
        if (betOn === 'red') { winNumber = reds[Math.floor(Math.random() * reds.length)]; multiplier = 2; }
        else if (betOn === 'black') { winNumber = blacks[Math.floor(Math.random() * blacks.length)]; multiplier = 2; }
        else { winNumber = 0; multiplier = 14; }
    } else {
        if (betOn === 'red') { winNumber = blacks[Math.floor(Math.random() * blacks.length)]; }
        else if (betOn === 'black') { winNumber = reds[Math.floor(Math.random() * reds.length)]; }
        else { winNumber = reds[Math.floor(Math.random() * reds.length)]; }
    }
    return { winNumber, multiplier, winAmount: Math.floor(bet * multiplier) };
};

const createDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (let s of suits) {
        for (let v of values) {
            deck.push({ suit: s, value: v });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
};

const calculateHand = (hand) => {
    let sum = 0;
    let aces = 0;
    for (let c of hand) {
        sum += getCardValue(c);
        if (c.value === 'A') aces++;
    }
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    return sum;
};

const handleDice = (bet, target, type) => {
    const win = shouldWin();
    let roll = 0;
    let multiplier = 0;
    if (win) {
        if (type === 'under') { roll = Math.floor(Math.random() * target); multiplier = 98 / target; }
        else { roll = Math.floor(Math.random() * (100 - target)) + target + 1; multiplier = 98 / (100 - target); }
    } else {
        if (type === 'under') { roll = Math.floor(Math.random() * (100 - target + 1)) + target; }
        else { roll = Math.floor(Math.random() * target) + 1; }
    }
    return { roll, win, multiplier, winAmount: Math.floor(bet * multiplier) };
};

const handleCoinFlip = (bet, betOn) => {
    const win = shouldWin();
    const result = win ? betOn : (betOn === 'heads' ? 'tails' : 'heads');
    return { result, win, multiplier: win ? 1.95 : 0, winAmount: win ? Math.floor(bet * 1.95) : 0 };
};

const handlePlinko = (bet, risk = 'medium') => {
    const win = shouldWin();
    const buckets = risk === 'high' ? [50, 10, 2, 0.5, 0.2, 0.2, 0.5, 2, 10, 50] : [5, 2, 1.2, 1, 0.5, 0.5, 1, 1.2, 2, 5];
    let bucketIdx = 0;
    if (win) {
        const winIndices = buckets.map((v, i) => v > 1 ? i : -1).filter(i => i !== -1);
        bucketIdx = winIndices[Math.floor(Math.random() * winIndices.length)] || 0;
    } else {
        const loseIndices = buckets.map((v, i) => v <= 1 ? i : -1).filter(i => i !== -1);
        bucketIdx = loseIndices[Math.floor(Math.random() * loseIndices.length)] || Math.floor(buckets.length / 2);
    }
    const multiplier = buckets[bucketIdx];
    return { bucketIdx, multiplier, winAmount: Math.floor(bet * multiplier) };
};

const handleMinesStart = (bet, mineCount) => {
    const win = shouldWin();
    const grid = Array(25).fill(false);
    let buried = 0;
    while (buried < mineCount) {
        const idx = Math.floor(Math.random() * 25);
        if (!grid[idx]) {
            grid[idx] = true;
            buried++;
        }
    }
    return { mines: grid, revealed: [], status: 'playing', bet, forceWin: win };
};

const getMinesMultiplier = (revealedCount, mineCount) => {
    const n = 25;
    const m = mineCount;
    const k = revealedCount;
    let prob = 1;
    for (let i = 0; i < k; i++) {
        prob *= (n - m - i) / (n - i);
    }
    return (0.98 / prob);
};

const handleCrashStart = (bet) => {
    // Standard Crash Point formula: 1 / (1 - X) with 3% house edge
    // But we still respect shouldWin for user experience if needed, 
    // OR we can make it purely random. User asked for "random".
    const rand = Math.random();
    let crashPoint = 1.0;
    if (rand < 0.03) { // 3% instant crash at 1.00
        crashPoint = 1.00;
    } else {
        crashPoint = Math.floor((100 / (1 - Math.random())) / 1) / 100;
        // Limit max crash to 1000x for safety
        if (crashPoint > 1000) crashPoint = 1000;
    }
    
    return { crashPoint, startTime: Date.now(), status: 'playing', bet };
};

const handleHiLoStart = (bet) => {
    const win = shouldWin();
    const deck = createDeck();
    const currentCard = deck.pop();
    return { currentCard, deck, status: 'playing', bet, multiplier: 1, forceWin: win };
};

const handleWheelSpin = (bet) => {
    const win = shouldWin();
    const segments = [0, 1.2, 0.5, 2, 0, 1.5, 5, 0.2, 1.1, 0, 10, 0.5, 1.2, 0, 20];
    let segmentIdx = 0;
    if (win) {
        const winIndices = segments.map((v, i) => v > 1 ? i : -1).filter(i => i !== -1);
        segmentIdx = winIndices[Math.floor(Math.random() * winIndices.length)] || 1;
    } else {
        const loseIndices = segments.map((v, i) => v <= 1 ? i : -1).filter(i => i !== -1);
        segmentIdx = loseIndices[Math.floor(Math.random() * loseIndices.length)] || 0;
    }
    const multiplier = segments[segmentIdx];
    // "столько + он получал к той сумме" - interpretation: Bet + (Bet * Multiplier)
    const winAmount = multiplier > 0 ? Math.floor(bet + (bet * multiplier)) : 0;
    return { segmentIdx, segments, multiplier, winAmount };
};

const handleTower = (bet, level) => {
    const risk = 0.60; // 60% chance of lose on each step (40% win)
    const win = Math.random() > risk;
    const multiplier = Math.pow(1.5, level);
    return { win, multiplier, currentLevel: level };
};

const handleKeno = (bet, picks) => {
    const draws = [];
    while (draws.length < 10) {
        const n = Math.floor(Math.random() * 40) + 1;
        if (!draws.includes(n)) draws.push(n);
    }
    const matches = picks.filter(p => draws.includes(p)).length;
    let multiplier = 0;
    if (matches === 1) multiplier = 1.5;
    else if (matches === 2) multiplier = 3;
    else if (matches === 3) multiplier = 10;
    else if (matches >= 4) multiplier = 50;
    return { draws, matches, multiplier, winAmount: Math.floor(bet * multiplier) };
};

const handleScratch = (bet) => {
    const win = shouldWin();
    const symbols = ['7', 'X', 'O', 'V', 'A'];
    if (win) {
        const s = symbols[Math.floor(Math.random() * symbols.length)];
        return { symbols: [s, s, s], multiplier: 5, winAmount: bet * 5 };
    }
    return { symbols: ['7', 'X', 'O'].sort(() => Math.random() - 0.5), multiplier: 0, winAmount: 0 };
};

const handleBaccarat = (bet, betOn) => {
    // Simple Baccarat: Player vs Banker
    const pValue = Math.floor(Math.random() * 10);
    const bValue = Math.floor(Math.random() * 10);
    let result = 'tie';
    if (pValue > bValue) result = 'player';
    else if (pValue < bValue) result = 'banker';
    
    let win = result === betOn;
    let multiplier = win ? (betOn === 'tie' ? 8 : 2) : 0;
    return { pValue, bValue, result, win, multiplier, winAmount: Math.floor(bet * multiplier) };
};

export {
    handleSlots,
    handleRoulette,
    createDeck,
    calculateHand,
    handleDice,
    handleCoinFlip,
    handlePlinko,
    handleMinesStart,
    getMinesMultiplier,
    handleCrashStart,
    handleHiLoStart,
    handleWheelSpin,
    handleTower,
    handleKeno,
    handleScratch,
    handleBaccarat,
    getCardValue,
    shouldWin
};
