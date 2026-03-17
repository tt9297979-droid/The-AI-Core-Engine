async function run(){

const xau = await fetch("/api/xau").then(r=>r.json())

const signal = await fetch("/api/signal",{
method:"POST",
body:JSON.stringify({prices:xau.prices})
}).then(r=>r.json())

const ai = await fetch("/api/ai").then(r=>r.json())

document.body.innerHTML = `
Signal: ${signal.signal} <br>
Entry: ${signal.entry} <br>
SL: ${signal.sl} <br>
TP: ${signal.tp} <br>
RR: ${signal.rr} <br><br>

AI Prediction: ${ai.prediction} <br>
Confidence: ${ai.confidence}
`
}

run()
