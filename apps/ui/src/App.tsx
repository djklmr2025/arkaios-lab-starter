import React, { useState } from "react";
import type { ChatResponse } from "@arkaios/shared/api";
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/,"") || "";
export default function App(){
  const [prompt,setPrompt]=useState(""); const [out,setOut]=useState<string>("");
  async function send(){ const r= await fetch(`${API_BASE}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})}); const data=(await r.json()) as ChatResponse; setOut(data.reply||data.error||JSON.stringify(data,null,2)); }
  return (<div style={{padding:24,fontFamily:'system-ui'}}><h1>ARKAIOS Lab Starter</h1><p><small>API_BASE = {API_BASE || "(same origin via proxy)"} </small></p>
    <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={5} style={{width:"100%"}} placeholder="Escribe tu prompt..."></textarea><br/>
    <button onClick={send}>Enviar</button><pre style={{whiteSpace:"pre-wrap", background:"#111", color:"#0f0", padding:12, marginTop:12}}>{out}</pre></div>);
}
