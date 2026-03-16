/**
 * QUANTUM ALPHA X - CORE ENGINE V3.0 (SOVEREIGN EDITION)
 * ระบบวิเคราะห์ระดับสถาบันการเงิน รองรับการประมวลผลข้อมูลความเร็วสูง
 */
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

// ฐานข้อมูลหน่วยความจำชั่วคราว (สำหรับการรันบน Serverless)
// แนะนำ: เชื่อมต่อ Redis หรือ MongoDB สำหรับการใช้งานจริงระดับโลก
let globalRegistry = {
    admin: { masterKey: process.env.ADMIN_MASTER || "QX-ADMIN-2026-SUPREME" },
    vips: [
        { key: "TRIAL-FREE-99", expiry: "2026-12-31T23:59:59Z", type: "PERPETUAL", active: true }
    ],
    logs: []
};

// --- TECHNICAL ANALYSIS UTILITIES ---
const calculateIndicators = (prices) => {
    const period = 14;
    if (prices.length < period) return null;

    // 1. RSI (Relative Strength Index)
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        let diff = prices[i] - prices[i - 1];
        diff >= 0 ? gains += diff : losses -= diff;
    }
    const rsi = 100 - (100 / (1 + (gains / (losses || 1))));

    // 2. EMA (Exponential Moving Average)
    const ema = (data, p) => {
        const k = 2 / (p + 1);
        return data.reduce((a, v, i) => i === 0 ? v : (v * k) + (a * (1 - k)), data[0]);
    };
    const emaFast = ema(prices.slice(-12), 12);
    const emaSlow = ema(prices.slice(-26), 26);

    // 3. Bollinger Bands (20, 2)
    const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const stdDev = Math.sqrt(prices.slice(-20).map(x => Math.pow(x - ma20, 2)).reduce((a, b) => a + b) / 20);

    return { 
        rsi: rsi.toFixed(2), 
        macd: (emaFast - emaSlow).toFixed(4),
        upperBand: (ma20 + (stdDev * 2)).toFixed(2),
        lowerBand: (ma20 - (stdDev * 2)).toFixed(2),
        currentTrend: emaFast > emaSlow ? "BULLISH" : "BEARISH"
    };
};

export default async function handler(req, res) {
    const { action, payload, token } = req.body;
    const symbol = req.query.symbol || "GC=F"; // XAU/USD

    try {
        // --- ROUTING LOGIC ---
        switch (action) {
            case "SYNC_MARKET":
                const [mRes, nRes] = await Promise.all([
                    axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`),
                    axios.get(`https://finnhub.io/api/v1/news-sentiment?symbol=GOLD&token=${process.env.FINNHUB_KEY}`)
                ]);

                const rawPrices = mRes.data.chart.result[0].indicators.quote[0].close.filter(x => x);
                const currentPrice = rawPrices.at(-1);
                const tech = calculateIndicators(rawPrices);
                const sentiment = nRes.data?.sentiment?.bullishPercent || 0.5;

                // AI Scoring Engine (0-10)
                let aiScore = 5;
                if (tech.rsi < 32) aiScore += 3;
                if (tech.rsi > 68) aiScore -= 3;
                if (sentiment > 0.65) aiScore += 2;
                if (currentPrice < tech.lowerBand) aiScore += 2;

                let finalSignal = "HOLD", signalColor = "hold";
                if (aiScore >= 7) { finalSignal = "STRONG BUY"; signalColor = "buy"; }
                if (aiScore <= 3) { finalSignal = "STRONG SELL"; signalColor = "sell"; }

                return res.json({
                    price: currentPrice.toFixed(2),
                    indicators: tech,
                    ai: { score: aiScore, signal: finalSignal, color: signalColor },
                    targets: {
                        tp1: (currentPrice * (signalColor === "buy" ? 1.008 : 0.992)).toFixed(2),
                        sl: (currentPrice * (signalColor === "buy" ? 0.994 : 1.006)).toFixed(2)
                    },
                    sentiment: (sentiment * 100).toFixed(0) + "% Bullish"
                });

            case "ADMIN_GEN_KEY":
                if (token !== globalRegistry.admin.masterKey) return res.status(403).send("Unauthorized");
                const newKey = `QX-${uuidv4().substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 999)}`;
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + payload.days);
                globalRegistry.vips.push({ key: newKey, expiry: expiry.toISOString(), type: `${payload.days}-DAY`, active: true });
                return res.json({ success: true, newKey });

            case "VIP_LOGIN":
                const user = globalRegistry.vips.find(v => v.key === payload.key && v.active);
                if (user && new Date(user.expiry) > new Date()) {
                    return res.json({ status: "AUTHORIZED", expiry: user.expiry });
                }
                return res.status(401).json({ status: "DENIED" });

            default:
                return res.status(400).send("Invalid Action");
        }
    } catch (err) {
        return res.status(500).json({ error: "Quantum Engine Failure", details: err.message });
    }
}
