let chart;

async function runQuantumEngine() {
    const sym = document.getElementById("symbol").value;
    try {
        const [aRes, mRes, nRes] = await Promise.all([
            fetch(`/api/analyze?symbol=${sym}`),
            fetch(`/api/market?symbol=${sym}`),
            fetch(`/api/news?symbol=${sym}`)
        ]);

        const data = await aRes.json();
        const market = await mRes.json();
        const news = await nRes.json();

        // Update Signals
        const container = document.getElementById("signal-container");
        container.className = `card signal-box ${data.color}`;
        document.getElementById("price").innerText = data.price;
        document.getElementById("signal").innerText = data.signal;
        document.getElementById("signal").style.color = `var(--${data.color})`;
        
        document.getElementById("stats").innerHTML = `
            <div>ENTRY: <strong>${data.entry}</strong></div>
            <div>SENTIMENT: <strong>${data.sentiment}</strong></div>
            <div style="color:var(--buy)">TARGET: ${data.tp}</div>
            <div style="color:var(--sell)">STOP: ${data.sl}</div>
        `;

        // Update Chart
        renderChart(market.prices);

        // Update News
        document.getElementById("news").innerHTML = news.map(n => 
            `<div class="news-item">${n.headline || n.title}</div>`
        ).join('');

    } catch (e) { console.error("Data Stream Interrupted"); }
}

function renderChart(prices) {
    const ctx = document.getElementById("mainChart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: prices.map((_, i) => i),
            datasets: [{
                data: prices,
                borderColor: '#00ff88',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                backgroundColor: 'rgba(0, 255, 136, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { grid: { color: '#1e293b' } } },
            plugins: { legend: { display: false } }
        }
    });
}

// ระบบ High-Frequency Update ทุก 5 วินาที
setInterval(runQuantumEngine, 5000);
window.onload = runQuantumEngine;
