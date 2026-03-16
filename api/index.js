import axios from "axios";

// ฝังรหัส VIP ไว้ตรงนี้เลยเพื่อไม่ให้รหัสหาย (ใช้ได้ทันที)
const PERMANENT_KEYS = ["WIN-99", "TRIAL-99", "QX-2026"];

export default async function handler(req, res) {
    const { action, key } = req.body || {};
    const symbol = req.query.symbol || "GC=F"; 

    try {
        // ตรวจสอบรหัสผ่านจากรายการที่ฝังไว้
        if (action === "AUTH") {
            if (PERMANENT_KEYS.includes(key)) {
                return res.status(200).json({ status: "SUCCESS" });
            }
            return res.status(401).json({ status: "DENIED" });
        }

        // ดึงข้อมูลราคาทองคำ Real-time
        const resGold = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
        const prices = resGold.data.chart.result[0].indicators.quote[0].close.filter(x => x);
        const currentPrice = prices.at(-1);

        res.status(200).json({
            price: currentPrice.toFixed(2),
            signal: Math.random() > 0.5 ? "STRONG BUY" : "WAIT",
            color: "#00ff9d"
        });
    } catch (e) {
        res.status(500).json({ error: "API ERROR" });
    }
}
