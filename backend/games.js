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
    const outcome = [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
    ];
    let multiplier = 0;
    const s1 = SYMBOLS[outcome[0]];
    const s2 = SYMBOLS[outcome[1]];
    const s3 = SYMBOLS[outcome[2]];

    if (s1 === s2 && s2 === s3) {
        multiplier = SLOTS_PAYTABLE[s1] || 0;
    } else if (s1 === s2) {
        multiplier = 1.5;
    }
    const winAmount = Math.floor(bet * multiplier);
    return { outcome, multiplier, winAmount };
};

const handleRoulette = (bet, betOn) => {
    const winNumber = Math.floor(Math.random() * 37);
    let multiplier = 0;
    const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = reds.includes(winNumber);
    const isBlack = winNumber !== 0 && !isRed;
    const isGreen = winNumber === 0;

    if (betOn === 'red' && isRed) multiplier = 2;
    else if (betOn === 'black' && isBlack) multiplier = 2;
    else if (betOn === 'green' && isGreen) multiplier = 14;

    const winAmount = Math.floor(bet * multiplier);
    return { winNumber, multiplier, winAmount };
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
    const roll = Math.floor(Math.random() * 100) + 1;
    let win = false;
    let multiplier = 0;
    if (type === 'under') {
        win = roll < target;
        multiplier = 98 / target;
    } else {
        win = roll > target;
        multiplier = 98 / (100 - target);
    }
    const winAmount = win ? Math.floor(bet * multiplier) : 0;
    return { roll, win, multiplier: win ? multiplier : 0, winAmount };
};

const handleCoinFlip = (bet, betOn) => {
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = result === betOn;
    return { result, win, multiplier: win ? 1.95 : 0, winAmount: win ? Math.floor(bet * 1.95) : 0 };
};

const handlePlinko = (bet, risk = 'medium') => {
    const buckets = risk === 'high' ? [50, 10, 2, 0.5, 0.2, 0.2, 0.5, 2, 10, 50] : [5, 2, 1.2, 1, 0.5, 0.5, 1, 1.2, 2, 5];
    const bucketIdx = Math.floor(Math.random() * buckets.length);
    const multiplier = buckets[bucketIdx];
    return { bucketIdx, multiplier, winAmount: Math.floor(bet * multiplier) };
};

const handleMinesStart = (bet, mineCount) => {
    const grid = Array(25).fill(false);
    let buried = 0;
    while (buried < mineCount) {
        const idx = Math.floor(Math.random() * 25);
        if (!grid[idx]) {
            grid[idx] = true;
            buried++;
        }
    }
    return { mines: grid, revealed: [], status: 'playing', bet };
};

const getMinesMultiplier = (revealedCount, mineCount) => {
    // Basic combination formula for odds
    const n = 25;
    const m = mineCount;
    const k = revealedCount;
    
    // Multiplier = (n! / (n-k)!) / ((n-m)! / (n-m-k)!) * 0.98 (house edge)
    const factorial = (num) => (num <= 1 ? 1 : num * factorial(num - 1));
    const combinations = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
    
    // Simplification for small grids:
    let prob = 1;
    for (let i = 0; i < k; i++) {
        prob *= (n - m - i) / (n - i);
    }
    return (0.98 / prob);
};

const handleCrashStart = (bet) => {
    // Multiplier curve: 1 / (1 - random())
    // 0.98 house edge: multiply result by 0.98
    // Min 1.0, Max 1000.0
    const r = Math.random();
    let crashPoint = 0.98 / (1 - r);
    if (crashPoint < 1) crashPoint = 1;
    if (crashPoint > 1000) crashPoint = 1000;
    return { crashPoint, startTime: Date.now(), status: 'playing', bet };
};

const handleHiLoStart = (bet) => {
    const deck = createDeck();
    const currentCard = deck.pop();
    return { currentCard, deck, status: 'playing', bet, multiplier: 1 };
};

const handleWheelSpin = (bet) => {
    const segments = [0, 1.2, 0.5, 2, 0, 1.5, 5, 0.2, 1.1, 0, 10, 0.5, 1.2, 0, 20];
    const segmentIdx = Math.floor(Math.random() * segments.length);
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
    getCardValue
};
