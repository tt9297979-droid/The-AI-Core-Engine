import axios from "axios";

// --- แก้ไขรหัส VIP ที่คุณต้องการตรงนี้ได้เลย ---
const PERMANENT_KEYS = ["WIN-99", "QX-2026", "TRIAL-99"]; 

export default async function handler(req, res) {
    const { action, key } = req.body || {};
    const symbol = req.query.symbol || "GC=F"; 

    try {
        // ระบบตรวจสอบรหัส (ไม่ต้องใช้ Database รหัสจะไม่หาย)
        if (action === "AUTH") {
            if (PERMANENT_KEYS.includes(key)) {
                return res.status(200).json({ status: "SUCCESS" });
            }
            return res.status(401).json({ status: "DENIED" });
        }

        // ระบบดึงข้อมูลราคา (XAU/USD)
        const resGold = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
        const prices = resGold.data.chart.result[0].indicators.quote[0].close.filter(x => x);
        const currentPrice = prices.at(-1);

        res.status(200).json({
            price: currentPrice.toFixed(2),
            signal: Math.random() > 0.5 ? "STRONG BUY" : "WAIT", // ระบบจำลองสัญญาณ
            color: "#00ff9d"
        });
    } catch (e) {
        res.status(500).json({ error: "API ERROR" });
    }
}
