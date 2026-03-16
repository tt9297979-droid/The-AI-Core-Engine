let chart;
let syncTimer;

async function runSystem() {
    const symbol = document.getElementById("symbol").value.trim().toUpperCase();
    const btn = document.getElementById("btn-run");
    
    btn.disabled = true;
    btn.innerHTML = "SYSTEM SYNCING...";

    try {
        // 1. ดึงข้อมูลกราฟ
        const mRes = await fetch(`/api/market?symbol=${symbol}`);
        const mData = await mRes.json();
        renderChart(mData.prices);

        // 2. วิเคราะห์ด้วย AI
        const aRes = await fetch(`/api/analyze?symbol=${symbol}`);
        const aData = await aRes.json();
        updateDisplay(aData);

        // 3. เริ่มระบบ Auto-Update ทุก 15 วินาที
        if (syncTimer) clearInterval(syncTimer);
        syncTimer = setInterval(() => silentSync(symbol), 15000);

    } catch (err) {
        alert("System Error: โปรดตรวจสอบชื่อย่อหุ้น/เหรียญ");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "RUN SYSTEM";
    }
}

function updateDisplay(data) {
    const box = document.getElementById("analysis-box");
    box.className = `card border-${data.color}`;
    box.innerHTML = `
        <div class="live-indicator">LIVE UPDATED: ${data.update}</div>
        <h2 class="price">$${parseFloat(data.price).toLocaleString()}</h2>
        <div class="signal-tag ${data.color}">${data.signal}</div>
        <hr>
        <div class="levels">
            <p>Target (TP): <span class="buy">${data.tp}</span></p>
            <p>Stop Loss (SL): <span class="sell">${data.sl}</span></p>
            <p>RSI: <strong>${data.rsi}</strong></p>
        </div>
    `;
}

async function silentSync(symbol) {
    const res = await fetch(`/api/analyze?symbol=${symbol}`);
    const data = await res.json();
    updateDisplay(data);
}

function renderChart(prices) {
    const ctx = document.getElementById("mainChart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: prices.map((_, i) => i),
            datasets: [{
                data: prices,
                borderColor: "#3b82f6",
                borderWidth: 2,
                fill: true,
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                pointRadius: 0
            }]
        },
        options: { responsive: true, scales: { x: { display: false } } }
    });
}
