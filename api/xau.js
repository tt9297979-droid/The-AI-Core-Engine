import axios from "axios"

export default async function handler(req,res){

const symbol="GC=F"

const url=`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`

const r=await axios.get(url)

const prices=r.data.chart.result[0].indicators.quote[0].close

res.json({prices})

}
