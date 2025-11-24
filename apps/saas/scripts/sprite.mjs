const base=process.env.BASE_URL||'http://localhost:3001'

const sleep=(ms)=>new Promise(res=>setTimeout(res,ms))

const head=async(path)=>{try{const r=await fetch(`${base}${path}`,{method:'HEAD'});return r.status===200}catch{return false}}

const withRetry = async (fn, tries = 3) => { let last = null; for (let i = 0; i < tries; i++) { last = await fn(); if (last && last.status > 0) return last; await sleep(250 * (i + 1)) } return last }

const post=async(path,body)=>{const t0=Date.now();let status=0,len=0;try{const r=await fetch(`${base}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});status=r.status;let txt='';try{txt=await r.text()}catch{}len=txt.length;return{status,len,duration_ms:Date.now()-t0}}catch{return{status,len,duration_ms:Date.now()-t0,error:true}}}
const get=async(path)=>{const t0=Date.now();let status=0,len=0;try{const r=await fetch(`${base}${path}`);status=r.status;let txt='';try{txt=await r.text()}catch{}len=txt.length;return{status,len,duration_ms:Date.now()-t0}}catch{return{status,len,duration_ms:Date.now()-t0,error:true}}}

const rateBurst=async(n=5)=>{const codes=[];for(let i=0;i<n;i++){const res=await withRetry(()=>post('/api/openai/chat',{text:`sprite-${i}`,attachments:[]}));codes.push(res.status)}const summary=codes.reduce((acc,c)=>{acc[c]=(acc[c]||0)+1;return acc},{})
  return{attempts:n,codes,summary,has429:!!summary[429]}
}

const run=async()=>{
  await sleep(200)
  await head('/').catch(()=>{})
  const home=await withRetry(()=>get('/'))
  const chat=await withRetry(()=>get('/chat'))
  const apiChat=await withRetry(()=>post('/api/openai/chat',{text:'sprite',attachments:[]}))
  const apiTts=await withRetry(()=>post('/api/openai/tts',{text:'ola'}))
  const apiTrans=await withRetry(()=>post('/api/openai/transcribe',{base64Audio:'ZGF0YQ==',mimeType:'audio/webm'}))
  const apiProf=await withRetry(()=>get('/api/search/professors'))
  const rate=await rateBurst(5)
  console.log(JSON.stringify({home,chat,apiChat,apiTts,apiTrans,apiProf,rate}))
}
run()
