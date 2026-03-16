import axios from "axios";

// --- Mathematical Core Functions ---
const calcSMA = (prices, period) => prices.slice(-period).reduce((a, b) => a + b, 0) / period;

const calcEMA = (prices, period) => {
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * k) + (ema * (1 - k));
    }
    return ema;
};

const calcRSI = (prices, period = 14) => {
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
};

const calcStdDev = (prices, period, sma) => {
    const subset = prices.slice(-period);
    const variance = subset.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    return Math.sqrt(variance);
};

export default async function handler(req, res) {
    const symbol = req.query.symbol || "BTC-USD";
    
    try {
        // ดึงข้อมูล 6 เดือนเพื่อความแม่นยำของ MACD และ EMA
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;
        const r = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        const result = r.data.chart.result[0];
        const quote = result.indicators.quote[0];
        
        // กรองข้อมูล null
        const validIndices = quote.close.map((c, i) => c !== null ? i : -1).filter(i => i !== -1);
        const closePrices = validIndices.map(i => quote.close[i]);
        const highPrices = validIndices.map(i => quote.high[i]);
        const lowPrices = validIndices.map(i => quote.low[i]);
        
        const lastPrice = closePrices.at(-1);
        
        // --- 1. Momentum & Trend (RSI & MACD) ---
        const rsi = calcRSI(closePrices, 14);
        const macdLine = calcEMA(closePrices, 12) - calcEMA(closePrices, 26);
        const signalLine = macdLine * 0.9; // Simplified MACD Signal
        const macdHist = macdLine - signalLine;

        // --- 2. Volatility (Bollinger Bands) ---
        const sma20 = calcSMA(closePrices, 20);
        const stdDev = calcStdDev(closePrices, 20, sma20);
        const upperBB = sma20 + (stdDev * 2);
        const lowerBB = sma20 - (stdDev * 2);

        // --- 3. Support & Resistance (Pivot Points) ---
        // ใช้ข้อมูลวันก่อนหน้าเพื่อคำนวณจุดหมุนของวันนี้
        const prevHigh = highPrices.at(-2);
        const prevLow = lowPrices.at(-2);
        const prevClose = closePrices.at(-2);
        const pivot = (prevHigh + prevLow + prevClose) / 3;
        const r1 = (2 * pivot) - prevLow; // Resistance 1 (Take Profit)
        const s1 = (2 * pivot) - prevHigh; // Support 1 (Stop Loss)

        // --- 4. AI Consensus Scoring ---
        let score = 0;
        if (rsi < 40) score += 2; else if (rsi > 60) score -= 2;
        if (macdHist > 0) score += 2; else score -= 2;
        if (lastPrice > sma20) score += 1; else score -= 1;
        if (lastPrice <= lowerBB * 1.02) score += 2; // ใกล้ขอบล่าง = น่าซื้อ
        if (lastPrice >= upperBB * 0.98) score -= 2; // ใกล้ขอบบน = น่าขาย

        let signal = "HOLD";
        let actionColor = "hold";
        if (score >= 4) { signal = "STRONG BUY"; actionColor = "buy"; }
        else if (score >= 1) { signal = "BUY"; actionColor = "buy"; }
        else if (score <= -4) { signal = "STRONG SELL"; actionColor = "sell"; }
        else if (score <= -1) { signal = "SELL"; actionColor = "sell"; }

        res.json({
            currentPrice: lastPrice.toFixed(2),
            indicators: {
                rsi: rsi.toFixed(2),
                macd: macdHist > 0 ? "BULLISH" : "BEARISH",
                trend: lastPrice > sma20 ? "UPTREND" : "DOWNTREND"
            },
            bands: { upper: upperBB.toFixed(2), mid: sma20.toFixed(2), lower: lowerBB.toFixed(2) },
            levels: {
                pivot: pivot.toFixed(2),
                resistance: r1.toFixed(2),
                support: s1.toFixed(2)
            },
            consensus: { signal, color: actionColor, score }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Data processing failed. Symbol might be invalid." });
    }
}
