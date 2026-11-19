import express from "express";
import cors from "cors";
import helmet from "helmet";
import { analyzeEmail } from "./src/analyzer.js";

const app = express();
const PORT = process.env.PORT || 4000;
const origins = new Set(["http://localhost:5173", "http://127.0.0.1:5173",
  ...(process.env.CLIENT_ORIGIN || "").split(",").map(x => x.trim()).filter(Boolean)]);
app.use(helmet());
app.use(cors({ origin(origin, cb) {
  if (!origin || origins.has(origin)) return cb(null, true);
  return cb(new Error("Origin is not allowed by CORS"));
}}));
app.use(express.json({ limit: "1mb" }));

const history = [];
const alerts = [];
let id = 1;

app.get("/", (_req,res) => res.json({name:"Email Security API",status:"ok",health:"/api/health"}));
app.get("/api/health", (_req,res) => res.json({status:"ok",time:new Date().toISOString()}));

app.post("/api/emails/analyze", (req,res) => {
  const {sender="",subject="",message=""} = req.body || {};
  if (![sender,subject,message].every(x => typeof x === "string") ||
      !sender.trim() || !subject.trim() || !message.trim())
    return res.status(400).json({error:"Please provide sender, subject, and message as non-empty text."});
  if (sender.length>254 || subject.length>300 || message.length>10000)
    return res.status(413).json({error:"Input is too long."});
  const result = {id:id++, ...analyzeEmail({sender:sender.trim(),subject:subject.trim(),message:message.trim()}), createdAt:new Date().toISOString()};
  history.unshift(result); history.splice(100);
  if (result.classification !== "SAFE") {
    alerts.unshift({id:result.id,classification:result.classification,sender:result.sender,subject:result.subject,riskScore:result.riskScore,createdAt:result.createdAt});
    alerts.splice(50);
  }
  res.json(result);
});
app.get("/api/emails", (_req,res) => res.json({items:history}));
app.get("/api/dashboard", (_req,res) => res.json({
  totalAnalyzed:history.length,
  safe:history.filter(x=>x.classification==="SAFE").length,
  suspicious:history.filter(x=>x.classification==="SUSPICIOUS").length,
  spam:history.filter(x=>x.classification==="SPAM").length,
  alerts:alerts.length
}));
app.get("/api/alerts", (_req,res) => res.json({items:alerts}));
app.use((err,_req,res,_next) => {
  console.error(err);
  res.status(err.message.includes("CORS")?403:500).json({error:err.message.includes("CORS")?"Frontend origin is not allowed. Check CLIENT_ORIGIN.":"Internal server error."});
});
app.listen(PORT, () => console.log(`Email Security API running on port ${PORT}`));
