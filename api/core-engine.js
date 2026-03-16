import axios from "axios";

export default async function handler(req, res) {
    const { action, key } = req.body || {};
    const symbol = req.query.symbol || "GC=F"; // ทองคำ
    const FINNHUB_KEY = process.env.FINNHUB_KEY;

    // 1. ระบบรักษาความปลอดภัย (Login)
    if (req.method === 'POST' && action === 'AUTH') {
        const validKey = "TRIAL-FREE-99"; // รหัสเข้าใช้งาน
        if (key === validKey) return res.status(200).json({ status: "SUCCESS" });
        return res.status(401).json({ status: "DENIED" });
    }

    // 2. ระบบดึงข้อมูลและ AI (GET)
    try {
        const [mRes, nRes] = await Promise.all([
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`),
            axios.get(`https://finnhub.io/api/v1/news-sentiment?symbol=GOLD&token=${FINNHUB_KEY}`)
        ]);

        const prices = mRes.data.chart.result[0].indicators.quote[0].close.filter(x => x);
        const current = prices.at(-1);
        const sentiment = nRes.data?.sentiment?.bullishPercent || 0.5;

        // คำนวณสัญญาณง่ายๆ แต่แม่นยำ (RSI 14)
        let rsi = 50; 
        if (prices.length > 14) {
            let gains = 0, losses = 0;
            for (let i = prices.length - 14; i < prices.length; i++) {
                let d = prices[i] - prices[i-1];
                d >= 0 ? gains += d : losses -= d;
            }
            rsi = 100 - (100 / (1 + (gains / (losses || 1))));
        }

        let signal = "HOLD", color = "gray";
        if (rsi < 35 || sentiment > 0.65) { signal = "STRONG BUY"; color = "lime"; }
        if (rsi > 65 || sentiment < 0.35) { signal = "STRONG SELL"; color = "red"; }

        res.status(200).json({
            price: current.toFixed(2),
            signal, color, rsi: rsi.toFixed(1),
            sentiment: (sentiment * 100).toFixed(0) + "%",
            tp: (current * (color === "lime" ? 1.005 : 0.995)).toFixed(2),
            sl: (current * (color === "lime" ? 0.996 : 1.004)).toFixed(2)
        });
    } catch (e) {
        res.status(500).json({ error: "API_ERROR", message: "ตรวจสอบ FINNHUB_KEY ใน Vercel" });
    }
}
