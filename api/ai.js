import axios from "axios"

export default async function handler(req,res){

const r = await axios.get("https://YOUR-AI/predict")

res.json(r.data)

}
