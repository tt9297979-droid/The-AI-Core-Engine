import axios from "axios";

// ฐานข้อมูลรหัสผ่าน (ชั่วคราว)
let vipKeys = [{ key: "TRIAL-99", status: "ACTIVE" }];

export default async function handler(req, res) {
    const { action, key, adminSecret } = req.body || {};
    const symbol = req.query.symbol || "GC=F"; 
    const masterKey = process.env.ADMIN_MASTER; // ตั้งค่าใน Vercel Settings

    try {
        // --- 1. ADMIN SYSTEM ---
        if (action === "GEN_KEY") {
            if (adminSecret !== masterKey) return res.status(403).json({ error: "Unauthorized" });
            const newKey = "QX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            vipKeys.push({ key: newKey, status: "ACTIVE" });
            return res.status(200).json({ newKey });
        }

        // --- 2. AUTH SYSTEM ---
        if (action === "AUTH") {
            const found = vipKeys.find(v => v.key === key);
            return found ? res.status(200).json({ status: "OK" }) : res.status(401).json({ status: "FAIL" });
        }

        // --- 3. AI ENGINE (REAL-TIME) ---
        const [mRes, nRes] = await Promise.all([
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`),
            axios.get(`https://finnhub.io/api/v1/news-sentiment?symbol=GOLD&token=${process.env.FINNHUB_KEY}`)
        ]);

        const prices = mRes.data.chart.result[0].indicators.quote[0].close.filter(x => x);
        const current = prices.at(-1);
        const sentiment = nRes.data?.sentiment?.bullishPercent || 0.5;

        res.status(200).json({
            price: current.toFixed(2),
            sentiment: (sentiment * 100).toFixed(0) + "%",
            signal: sentiment > 0.6 ? "STRONG BUY" : sentiment < 0.4 ? "STRONG SELL" : "WAIT",
            color: sentiment > 0.6 ? "#00ff9d" : sentiment < 0.4 ? "#ff4d4d" : "#8b949e",
            tp: (current * (sentiment > 0.5 ? 1.005 : 0.995)).toFixed(2),
            sl: (current * (sentiment > 0.5 ? 0.996 : 1.004)).toFixed(2)
        });
    } catch (e) {
        res.status(500).json({ error: "Sync Error" });
    }
}
