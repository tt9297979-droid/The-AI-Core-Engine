let mainChart;
let refreshTimer;

async function executeAnalysis() {
    const symbol = document.getElementById("symbol").value.toUpperCase();
    const btn = document.getElementById("btn-analyze");
    const loader = document.getElementById("loading");

    btn.innerText = "COMPUTING...";
    loader.style.display = "block";

    try {
        // Fetch AI Data
        const aiRes = await fetch(`/api/analyze?symbol=${symbol}`);
        if (!aiRes.ok) throw new Error("Invalid Symbol");
        const data = await aiRes.json();
        
        // Fetch Market Data for Chart (last 60 days)
        const marketRes = await fetch(`/api/market?symbol=${symbol}`);
        const marketData = await marketRes.json();
        const chartPrices = marketData.prices.slice(-60); // แสดงแค่ 60 วันล่าสุดบนกราฟ

        updateUI(data);
        renderChart(chartPrices, data.bands);
        
        // Auto refresh every 60 seconds
        clearInterval(refreshTimer);
        refreshTimer = setInterval(executeAnalysis, 60000);

    } catch (error) {
        alert("System Error: Could not analyze data for " + symbol);
    } finally {
        btn.innerText = "RUN ALGORITHM";
        loader.style.display = "none";
    }
}

function updateUI(data) {
    // Core Data
    document.getElementById("val-price").innerText = parseFloat(data.currentPrice).toLocaleString();
    
    const sigEl = document.getElementById("val-signal");
    sigEl.innerText = data.consensus.signal;
    sigEl.className = ""; // Reset class
    sigEl.classList.add(`color-${data.consensus.color}`);

    // Indicators
    document.getElementById("val-rsi").innerText = data.indicators.rsi;
    document.getElementById("val-macd").innerText = data.indicators.macd;
    document.getElementById("val-sma").innerText = parseFloat(data.bands.mid).toLocaleString();
    document.getElementById("val-trend").innerText = data.indicators.trend;

    // Action Levels (Pivot, Limit, Stop)
    document.getElementById("val-r1").innerText = parseFloat(data.levels.resistance).toLocaleString();
    document.getElementById("val-pivot").innerText = parseFloat(data.levels.pivot).toLocaleString();
    document.getElementById("val-s1").innerText = parseFloat(data.levels.support).toLocaleString();
    
    // ตั้งค่าสีให้ Limit (เขียว) / Stop (แดง) ตาม Signal
    const r1 = document.getElementById("val-r1");
    const s1 = document.getElementById("val-s1");
    if(data.consensus.color === "buy") {
        r1.classList.add("color-buy"); s1.classList.add("color-sell");
    } else if (data.consensus.color === "sell") {
        s1.classList.add("color-buy"); // ถ้าเปิด Short แนวรับกลายเป็นจุดทำกำไร
        r1.classList.add("color-sell");
    }
}

function renderChart(prices, bands) {
    const ctx = document.getElementById("mainChart").getContext("2d");
    const labels = prices.map((_, i) => `T-${prices.length - i}`);

    if (mainChart) mainChart.destroy();

    // สร้างข้อมูลขอบบน-ขอบล่างจำลองบนกราฟ เพื่อให้เห็น Volatility
    const upperData = prices.map(p => parseFloat(bands.upper));
    const lowerData = prices.map(p => parseFloat(bands.lower));

    mainChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Price",
                    data: prices,
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    zIndex: 2
                },
                {
                    label: "Upper Volatility (BB)",
                    data: upperData,
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0
                },
                {
                    label: "Lower Volatility (BB)",
                    data: lowerData,
                    borderColor: "rgba(34, 197, 94, 0.3)",
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { grid: { color: "#27272a" }, position: 'right' }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// โหลดตอนเปิดเว็บ
window.onload = executeAnalysis;
