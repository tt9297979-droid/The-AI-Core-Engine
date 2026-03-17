function ema(data, period){
let k = 2/(period+1)
let ema = data[0]

for(let i=1;i<data.length;i++){
ema = data[i]*k + ema*(1-k)
}

return ema
}

function rsi(data){
let gains=0,loss=0

for(let i=1;i<data.length;i++){
let d=data[i]-data[i-1]
if(d>0) gains+=d
else loss+=Math.abs(d)
}

let rs=gains/loss
return 100-(100/(1+rs))
}

export default async function handler(req,res){

const prices = req.body.prices

const last = prices.at(-1)

const ema20 = ema(prices.slice(-20),20)
const ema50 = ema(prices.slice(-50),50)
const rsiVal = rsi(prices.slice(-14))

let signal="WAIT"
let sl,tp

// logic เพิ่มความแม่น
if(ema20>ema50 && rsiVal<65){
signal="BUY"
sl = last - 10
tp = last + 25
}

if(ema20<ema50 && rsiVal>35){
signal="SELL"
sl = last + 10
tp = last - 25
}

const rr = Math.abs(tp-last)/Math.abs(last-sl)

res.json({
signal,
entry:last,
sl,
tp,
rr:rr.toFixed(2)
})

}
