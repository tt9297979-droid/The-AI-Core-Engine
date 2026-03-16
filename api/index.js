import axios from "axios";

export default async function handler(req, res) {
    const symbol = "GC=F"; // Gold Spot
    const apiKey = process.env.FINNHUB_KEY;

    try {
        // ใช้ Promise.all เพื่อดึงข้อมูลพร้อมกันแบบขนาน (Parallel) ลดเวลาดีเลย์ลง 50%
        const [m, n] = await Promise.all([
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`),
            axios.get(`https://finnhub.io/api/v1/news-sentiment?symbol=GOLD&token=${apiKey}`)
        ]);

        const p = m.data.chart.result[0].indicators.quote[0].close.filter(x => x);
        const cur = p[p.length - 1];
        const sent = n.data?.sentiment?.bullishPercent || 0.5;

        // คำนวณสัญญาณทันทีโดยไม่ผ่าน Loop ซับซ้อน
        const sig = (cur < (p.reduce((a, b) => a + b, 0) / p.length) && sent > 0.5) ? "STRONG BUY" : 
                    (cur > (p.reduce((a, b) => a + b, 0) / p.length) && sent < 0.5) ? "STRONG SELL" : "WAIT";

        res.setHeader('Cache-Control', 'no-store, max-age=0'); // ห้ามเก็บ Cache เพื่อให้ข้อมูลสดใหม่ตลอดเวลา
        res.status(200).json({
            p: cur.toFixed(2),
            s: sig,
            c: sig.includes("BUY") ? "#00ff9d" : sig.includes("SELL") ? "#ff4d4d" : "#8b949e",
            t: (cur + (sig.includes("BUY") ? 2 : -2)).toFixed(2),
            l: (cur + (sig.includes("BUY") ? -1.5 : 1.5)).toFixed(2)
        });
    } catch (e) {
        res.status(500).send("FAST_SYNC_ERROR");
    }
}
