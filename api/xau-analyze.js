import axios from "axios"

function ema(data, period){
let k = 2/(period+1)
let ema = data[0]

for(let i=1;i<data.length;i++){
ema = data[i]*k + ema*(1-k)
}

return ema
}

function rsi(data, period=14){
let gains=0,loss=0

for(let i=1;i<period;i++){
let diff=data[i]-data[i-1]
if(diff>0) gains+=diff
else loss+=Math.abs(diff)
}

let rs=gains/loss
return 100-(100/(1+rs))
}

export default async function handler(req,res){

// ใช้ symbol ทอง
const symbol="GC=F" // Gold Futures

const url=`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`

const r=await axios.get(url)

const prices=r.data.chart.result[0].indicators.quote[0].close

const last=prices.at(-1)

// indicators
const ema20=ema(prices.slice(-20),20)
const ema50=ema(prices.slice(-50),50)
const rsiVal=rsi(prices.slice(-15))

// logic AI
let signal="WAIT"
let entry=last
let sl,tp

if(ema20>ema50 && rsiVal<70){
signal="BUY"
sl=last-15
tp=last+30
}

if(ema20<ema50 && rsiVal>30){
signal="SELL"
sl=last+15
tp=last-30
}

// risk reward
const rr = Math.abs(tp-entry)/Math.abs(entry-sl)

res.json({
price:last,
signal,
entry,
sl,
tp,
rr:rr.toFixed(2),
ema20,
ema50,
rsi:rsiVal.toFixed(2)
})

}
