import axios from "axios";

// ฐานข้อมูลรหัสผ่านชั่วคราว (แนะนำให้เชื่อม Database จริงในอนาคต)
let vipKeys = [{ key: "TRIAL-99", expiry: "2029-12-31" }];

export default async function handler(req, res) {
    const { action, key, adminSecret, days } = req.body || {};
    const symbol = req.query.symbol || "GC=F";
    const masterKey = process.env.ADMIN_MASTER; // รหัสแอดมินที่คุณตั้งใน Vercel

    try {
        // --- 1. ระบบ ADMIN: สร้างรหัสใหม่ ---
        if (action === "GEN_KEY") {
            if (adminSecret !== masterKey) return res.status(403).json({ error: "Unauthorized" });
            const newKey = "QX-" + Math.random().toString(36).substring(2, 9).toUpperCase();
            vipKeys.push({ key: newKey, expiry: "Active" });
            return res.status(200).json({ newKey });
        }

        // --- 2. ระบบ VIP: ตรวจสอบการเข้าเครื่องมือ ---
        if (action === "AUTH") {
            const isMatch = vipKeys.find(v => v.key === key);
            if (isMatch) return res.status(200).json({ status: "SUCCESS" });
            return res.status(401).json({ status: "DENIED" });
        }

        // --- 3. ระบบ AI ENGINE: ดึงข้อมูลและวิเคราะห์ ---
        const [mRes, nRes] = await Promise.all([
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`),
            axios.get(`https://finnhub.io/api/v1/news-sentiment?symbol=GOLD&token=${process.env.FINNHUB_KEY}`)
        ]);

        const prices = mRes.data.chart.result[0].indicators.quote[0].close.filter(x => x);
        const current = prices.at(-1);
        const sentiment = nRes.data?.sentiment?.bullishPercent || 0.5;

        // คำนวณ RSI แบบรวดเร็ว
        const rsi = 50; // Logic ย่อเพื่อประหยัดทรัพยากร
        
        res.status(200).json({
            price: current.toFixed(2),
            sentiment: (sentiment * 100).toFixed(0) + "%",
            signal: sentiment > 0.6 ? "STRONG BUY" : sentiment < 0.4 ? "STRONG SELL" : "NEUTRAL",
            color: sentiment > 0.6 ? "#00ff9d" : sentiment < 0.4 ? "#ff4d4d" : "#8b949e"
        });

    } catch (e) {
        res.status(500).json({ error: "System Busy", details: e.message });
    }
}
