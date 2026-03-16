import axios from "axios";

const EMA = (d, p) => {
    const k = 2 / (p + 1);
    return d.reduce((a, v, i) => i === 0 ? v : (v * k) + (a * (1 - k)), d[0]);
};

export default async function handler(req, res) {
    const symbol = req.query.symbol || "GC=F"; // XAU/USD Proxy
    const key = process.env.FINNHUB_KEY;

    try {
        const [mRes, nRes] = await Promise.all([
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=5d`),
            axios.get(`https://finnhub.io/api/v1/news-sentiment?symbol=${symbol.split('=')[0]}&token=${key}`)
        ]);

        const quotes = mRes.data.chart.result[0].indicators.quote[0];
        const prices = quotes.close.filter(x => x);
        const cur = prices.at(-1);
        
        // --- AI Signal Logic ---
        const rsi = (prices) => {
            let g = 0, l = 0;
            for (let i = prices.length - 14; i < prices.length; i++) {
                let d = prices[i] - prices[i-1];
                d >= 0 ? g += d : l -= d;
            }
            return 100 - (100 / (1 + (g / (l || 1))));
        }(prices);

        const sentiment = nRes.data?.sentiment?.bullishPercent || 0.5;
        const trend = EMA(prices, 50);

        let signal = "NEUTRAL", color = "hold", score = 0;
        if (cur > trend) score += 1;
        if (rsi < 35) score += 2;
        if (sentiment > 0.6) score += 1;
        if (rsi > 65) score -= 2;

        if (score >= 2) { signal = "PRECISION BUY"; color = "buy"; }
        else if (score <= -1) { signal = "PRECISION SELL"; color = "sell"; }

        res.json({
            price: cur.toFixed(2),
            rsi: rsi.toFixed(1),
            sentiment: (sentiment * 100).toFixed(0) + "%",
            signal, color,
            entry: cur.toFixed(2),
            tp: (cur * (color === "buy" ? 1.01 : 0.99)).toFixed(2),
            sl: (cur * (color === "buy" ? 0.995 : 1.005)).toFixed(2),
            time: new Date().toLocaleTimeString()
        });
    } catch (e) {
        res.status(500).json({ error: "Quantum Link Offline" });
    }
}
