import axios from "axios";

// ฟังก์ชันคำนวณทางสถิติเพื่อความแม่นยำระดับมืออาชีพ
const calcRSI = (prices, period = 14) => {
    if (prices.length < period) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff; else losses -= diff;
    }
    const rs = (gains / period) / (losses / period || 1);
    return 100 - (100 / (1 + rs));
};

export default async function handler(req, res) {
    const symbol = req.query.symbol || "BTC-USD";
    try {
        // ดึงข้อมูลย้อนหลัง 6 เดือนเพื่อให้ Indicator เสถียรที่สุด
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;
        const r = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const result = r.data.chart.result[0];
        const close = result.indicators.quote[0].close.filter(p => p !== null);
        const high = result.indicators.quote[0].high.filter(p => p !== null);
        const low = result.indicators.quote[0].low.filter(p => p !== null);

        const lastPrice = close.at(-1);
        const rsi = calcRSI(close, 14);
        
        // คำนวณ Pivot Points สำหรับจุด Buy/Sell จริง
        const pHigh = high.at(-2), pLow = low.at(-2), pClose = close.at(-2);
        const pivot = (pHigh + pLow + pClose) / 3;
        const r1 = (2 * pivot) - pLow; // แนวต้าน (จุดขาย)
        const s1 = (2 * pivot) - pHigh; // แนวรับ (จุดซื้อ)

        let signal = "NEUTRAL", color = "hold";
        if (rsi < 30 || lastPrice <= s1) { signal = "STRONG BUY"; color = "buy"; }
        else if (rsi > 70 || lastPrice >= r1) { signal = "STRONG SELL"; color = "sell"; }
        else if (lastPrice > pivot) { signal = "BUY / TREND UP"; color = "buy"; }
        else { signal = "SELL / TREND DOWN"; color = "sell"; }

        res.status(200).json({
            price: lastPrice.toFixed(2),
            rsi: rsi.toFixed(2),
            signal,
            color,
            tp: r1.toFixed(2),
            sl: s1.toFixed(2),
            update: new Date().toLocaleTimeString()
        });
    } catch (e) {
        res.status(500).json({ error: "Market API Error" });
    }
}
