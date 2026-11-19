import {useEffect,useState} from "react";
const API = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
function App(){
 const [form,setForm]=useState({sender:"",subject:"",message:""}),[result,setResult]=useState(null);
 const [stats,setStats]=useState({totalAnalyzed:0,safe:0,suspicious:0,spam:0}),[history,setHistory]=useState([]),[alerts,setAlerts]=useState([]);
 const [status,setStatus]=useState("Checking"),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const refresh=async()=>{try{const rs=await Promise.all(["/api/health","/api/dashboard","/api/emails","/api/alerts"].map(p=>fetch(API+p)));
 if(rs.some(r=>!r.ok))throw Error("API unavailable");const [h,s,e,a]=await Promise.all(rs.map(r=>r.json()));
 setStatus(h.status==="ok"?"Connected":"Unavailable");setStats(s);setHistory(e.items||[]);setAlerts(a.items||[]);}catch{setStatus("Offline");}};
 useEffect(()=>{refresh()},[]);
 const change=(k,v)=>setForm(old=>({...old,[k]:v}));
 const sample=()=>setForm({sender:"winner123@example.com",subject:"URGENT! Claim your FREE prize today",message:"Congratulations! You are a winner. Click https://example.com to claim your free cash now. Limited time offer!!!"});
 async function submit(e){e.preventDefault();setBusy(true);setError("");setResult(null);try{const r=await fetch(API+"/api/emails/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.error||"Analysis failed");setResult(d);await refresh()}catch(x){setError(x.message+". Check that the backend is running and VITE_API_URL is correct.")}finally{setBusy(false)}}
 return <main className="wrap">
 <header><a className="logo" href="#"><span>✉</span><b>Email<span>Guard</span><small>EMAIL SECURITY & SPAM DETECTION</small></b></a><div className="status"><i className={status==="Connected"?"on":"off"}/> API {status}</div></header>
 <section className="hero"><label>COMPUTER NETWORKS • SECURITY PROJECT</label><h1>Intelligent Email<br/><em>Threat Analyzer</em></h1><p>Analyze email content, identify suspicious patterns, and understand how finite-state machines classify potential spam.</p></section>
 <section className="stats">{[["TOTAL ANALYZED",stats.totalAnalyzed,""],["SAFE EMAILS",stats.safe,"green"],["SUSPICIOUS",stats.suspicious,"yellow"],["SPAM DETECTED",stats.spam,"red"]].map(x=><article key={x[0]}><small>{x[0]}</small><strong className={x[2]}>{x[1]}</strong></article>)}</section>
 <div className="columns">
 <section className="panel"><div className="heading"><div><label>EMAIL INSPECTION</label><h2>Analyze an email</h2></div><button className="ghost" onClick={sample} type="button">Load sample</button></div>
 <form onSubmit={submit}><label>Sender email address<input required value={form.sender} onChange={e=>change("sender",e.target.value)} placeholder="sender@example.com"/></label>
 <label>Subject line<input required maxLength="300" value={form.subject} onChange={e=>change("subject",e.target.value)} placeholder="Enter email subject"/></label>
 <label>Message content<textarea required rows="7" maxLength="10000" value={form.message} onChange={e=>change("message",e.target.value)} placeholder="Paste the email message here..."/></label>
 {error&&<div className="error">{error}</div>}<button className="primary" disabled={busy}>{busy?"Analyzing...":"⌕  Analyze email"}</button></form><p className="note">Academic demonstration only. Use sample emails, not private messages.</p></section>
 <section className="panel"><div className="heading"><div><label>ANALYSIS OUTPUT</label><h2>Detection report</h2></div></div>
 {!result?<div className="empty"><div>⌁</div><b>Waiting for an email</b><p>Submit an email to view classification, risk score, detected patterns, and FSM transitions.</p></div>:
 <div><div className={"classification "+result.classification.toLowerCase()}><small>CLASSIFICATION</small><strong>{result.classification}</strong><span>Risk score: {result.riskScore}</span></div><p className="note">{result.explanation}</p>
 <div className="meta"><span>Sender format</span><b className={result.senderValid?"green":"red"}>{result.senderValid?"Valid":"Invalid"}</b></div>
 <h3>Detected patterns ({result.findings.length})</h3>{result.findings.length===0?<p className="note">No suspicious patterns found.</p>:result.findings.map((f,i)=><div className="finding" key={i}><div><b>{f.type}</b><small>{f.detail}</small></div><strong>+{f.points}</strong></div>)}
 <h3>Finite-state machine transitions</h3>{result.fsm.transitions.map((t,i)=><div className="transition" key={i}><b>{t.from}</b><small>{t.input}</small><strong>{t.to}</strong></div>)}<div className="final">Final state <b>{result.fsm.finalState}</b></div></div>}
 </section></div>
 <section className="panel lower"><div className="heading"><div><label>MONITORING</label><h2>Recent analysis history</h2></div><small>{history.length} records</small></div>
 {history.length===0?<p className="note">No email analyses yet.</p>:<div className="tablebox"><table><thead><tr><th>Sender</th><th>Subject</th><th>Classification</th><th>Risk</th><th>Time</th></tr></thead><tbody>{history.slice(0,8).map(x=><tr key={x.id}><td>{x.sender}</td><td>{x.subject}</td><td><span className={"tag "+x.classification.toLowerCase()}>{x.classification}</span></td><td>{x.riskScore}</td><td>{new Date(x.createdAt).toLocaleTimeString()}</td></tr>)}</tbody></table></div>}</section>
 <section className="panel lower"><div className="heading"><div><label>THREAT MONITOR</label><h2>Security alerts</h2></div><small>{alerts.length} alerts</small></div>
 {alerts.length===0?<p className="note">No security alerts generated.</p>:alerts.slice(0,5).map(a=><div className="alert" key={a.id}><b>! {a.classification} email from {a.sender}</b><small>{a.subject} · Risk {a.riskScore}</small></div>)}</section>
 <footer>EMAILGUARD · EMAIL SECURITY & SPAM PATTERN DETECTION SYSTEM</footer></main>
}
export default App;
