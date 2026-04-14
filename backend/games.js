const shouldWin = () => Math.random() < 0.35; // 35% win probability

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
        // Force lose: return mismatching symbols
        const outcome = [0, 1, 2].sort(() => Math.random() - 0.5);
        return { outcome, multiplier: 0, winAmount: 0 };
    }
    const s = Math.floor(Math.random() * SYMBOLS.length);
    const multiplier = SLOTS_PAYTABLE[SYMBOLS[s]] || 1.5;
    return { outcome: [s, s, s], multiplier, winAmount: Math.floor(bet * multiplier) };
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
    const win = shouldWin();
    let crashPoint = 1.0;
    if (win) {
        crashPoint = 1.5 + Math.random() * 3.5;
    } else {
        crashPoint = 1.00 + Math.random() * 0.15;
    }
    return { crashPoint, startTime: Date.now(), status: 'playing', bet, forceWin: win };
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
    return { segmentIdx, segments, multiplier, winAmount: Math.floor(bet * multiplier) };
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
    getCardValue,
    shouldWin
};
