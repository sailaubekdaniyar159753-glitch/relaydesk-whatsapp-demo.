const WELCOME='Здравствуйте! 🌷 Агентство «Персонал Элит», Астана.\n\n1 — Нужна няня или домработница\n2 — Ищу работу няней или домработницей\n3 — Другой вопрос\n\nОтветьте цифрой. Для возврата в начало напишите МЕНЮ.';
const CONSENT='Для обработки обращения и обратной связи агентству необходимо ваше согласие на обработку номера WhatsApp и ответов. Напишите СОГЛАСЕН или ОТМЕНА. Не отправляйте ИИН, документы и домашний адрес.';
const QUESTIONS={
client:'Уточните ОДНИМ сообщением: 1) няня или домработница; 2) район Астаны; 3) график; 4) бюджет зарплаты; 5) возраст ребёнка или обязанности.',
candidate:'Напишите ОДНИМ сообщением: 1) имя; 2) няня или домработница; 3) опыт; 4) желаемый график; 5) зарплатные ожидания. Не присылайте документы.',
other:'Опишите, пожалуйста, свой вопрос ОДНИМ сообщением.'
};
const normalized=s=>String(s||'').trim().toLowerCase().replace(/ё/g,'е');
const json=(obj,code=200)=>new Response(JSON.stringify(obj),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
function classify(text){
 const t=normalized(text);
 if(/^(1|1️⃣)$/.test(t)||/нужна няня|нужна домработ|ищу нян|ищу домработ|подбор нян|подбор домработ|нанять/.test(t))return 'client';
 if(/^(2|2️⃣)$/.test(t)||/ищу работу|устроиться|хочу работать|ваканси|ищу ваканси/.test(t))return 'candidate';
 if(/^(3|3️⃣)$/.test(t))return 'other'; return null;
}
function step(state,text){
 const t=normalized(text),s=state||{stage:'choose'};
 if(['меню','старт','начать','отмена','/start'].includes(t))return {state:{stage:'choose'},reply:WELCOME};
 if(s.stage==='choose'){
  const role=classify(text);if(!role)return {state:s,reply:WELCOME};
  return {state:{stage:'consent',role},reply:CONSENT};
 }
 if(s.stage==='consent'){
  if(['согласен','согласна','да','подтверждаю'].includes(t))return {state:{stage:'form',role:s.role},reply:QUESTIONS[s.role]};
  return {state:s,reply:'Для продолжения напишите СОГЛАСЕН или ОТМЕНА.'};
 }
 if(s.stage==='form'){
  if(text.length<12)return {state:s,reply:'Пожалуйста, напишите подробнее одним сообщением.'};
  const role=s.role,service=/нян/.test(t)?'Няня':/домработ/.test(t)?'Домработница':'Уточняется';
  const reply=role==='client'?'✅ Заявка сохранена. Услуга подбора: 70% месячной зарплаты, оплата комиссии после трёх оплачиваемых пробных дней, если кандидат подошёл. Гарантийная замена — по договору. С вами свяжется агентство.':role==='candidate'?'✅ Анкета сохранена. Агентство рассмотрит её и свяжется при наличии подходящей вакансии.':'✅ Ваш вопрос записан. Агентство ознакомится с ним.';
  return {state:{stage:'done',role},reply,lead:{role,service,details:String(text).slice(0,1500)}};
 }
 return {state:s,reply:'Обращение записано. Для нового напишите МЕНЮ.'};
}
async function sigOk(raw,signature,secret){
 if(!secret||!signature?.startsWith('sha256='))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const hash=await crypto.subtle.sign('HMAC',key,raw);
 const actual='sha256='+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 if(signature.length!==actual.length)return false;
 let v=0;for(let i=0;i<actual.length;i++)v|=actual.charCodeAt(i)^signature.charCodeAt(i);return v===0;
}
async function send(env,phone,body){
 const month=new Date().toISOString().slice(0,7),limit=Math.min(900,Math.max(1,Number(env.MONTHLY_REPLY_LIMIT||900)));
 await env.DB.prepare('INSERT OR IGNORE INTO usage(month,used) VALUES (?,0)').bind(month).run();
 const row=await env.DB.prepare('UPDATE usage SET used=used+1 WHERE month=? AND used<?').bind(month,limit).run();
 if(!row.meta.changes){console.error('Bot safety cap reached');return false;}
 const response=await fetch('https://graph.facebook.com/'+(env.META_API_VERSION||'v25.0')+'/'+env.META_PHONE_NUMBER_ID+'/messages',{
 method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.META_ACCESS_TOKEN},
 body:JSON.stringify({messaging_product:'whatsapp',to:phone,type:'text',text:{body,preview_url:false}})});
 if(!response.ok)throw Error('Meta HTTP '+response.status);return true;
}
async function onMessage(env,m){
 const phone=String(m.from||'').replace(/\D/g,''),id=String(m.id||'').slice(0,250);if(!phone||!id)return;
 const old=await env.DB.prepare('SELECT reply,sent FROM events WHERE id=?').bind(id).first();if(old?.sent)return;
 let out;
 if(old){out={reply:old.reply};}
 else{
  const prev=await env.DB.prepare('SELECT state FROM sessions WHERE phone=?').bind(phone).first();
  const text=m.type==='text'?String(m.text?.body||''):'';
  if(/^(удалить|удалить мои данные)$/i.test(text.trim())){
   await env.DB.batch([env.DB.prepare('DELETE FROM leads WHERE phone=?').bind(phone),env.DB.prepare('DELETE FROM sessions WHERE phone=?').bind(phone)]);
   out={reply:'Ваши данные в базе бота удалены. История в WhatsApp не затронута.'};
  }else{
   out=step(prev?.state?JSON.parse(prev.state):{stage:'choose'},text);
   await env.DB.prepare('INSERT INTO sessions(phone,state,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(phone) DO UPDATE SET state=excluded.state,updated_at=CURRENT_TIMESTAMP').bind(phone,JSON.stringify(out.state)).run();
   if(out.lead){await env.DB.prepare('INSERT INTO leads(id,phone,role,service,details) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),phone,out.lead.role,out.lead.service,out.lead.details).run();}
  }
  await env.DB.prepare('INSERT OR IGNORE INTO events(id,phone,reply,sent) VALUES(?,?,?,0)').bind(id,phone,out.reply).run();
 }
 const delivered=await send(env,phone,out.reply);
 if(delivered)await env.DB.prepare('UPDATE events SET sent=1 WHERE id=?').bind(id).run();
}
async function ensureTables(db){
 const tables=[
  'CREATE TABLE IF NOT EXISTS sessions(phone TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, phone TEXT NOT NULL, role TEXT NOT NULL, service TEXT, details TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, phone TEXT NOT NULL, reply TEXT NOT NULL, sent INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS usage(month TEXT PRIMARY KEY, used INTEGER DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at)'
 ];
 for(const sql of tables)await db.prepare(sql).run();
}

export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname==='/health'){
   if(!env.DB)return json({deployed:true,metaConnected:false,storageConnected:false,schemaReady:false});
   try{await ensureTables(env.DB);return json({deployed:true,metaConnected:Boolean(env.META_PHONE_NUMBER_ID&&env.META_ACCESS_TOKEN&&env.META_APP_SECRET),storageConnected:true,schemaReady:true});}
   catch(e){console.error('Database initialization failed',e?.message);return json({deployed:true,storageConnected:true,schemaReady:false},503);}
  }
  if(u.pathname!=='/webhook')return new Response('Not found',{status:404});
  if(request.method==='GET'){
   const ok=u.searchParams.get('hub.mode')==='subscribe'&&env.META_VERIFY_TOKEN&&u.searchParams.get('hub.verify_token')===env.META_VERIFY_TOKEN;
   return ok?new Response(u.searchParams.get('hub.challenge')||''):new Response('Forbidden',{status:403});
  }
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  if(!env.META_APP_SECRET||!env.META_ACCESS_TOKEN||!env.META_PHONE_NUMBER_ID||!env.DB)return new Response('Setup incomplete',{status:503});
  const raw=await request.arrayBuffer();if(raw.byteLength>262144)return new Response('Payload too large',{status:413});
  if(!await sigOk(raw,request.headers.get('x-hub-signature-256'),env.META_APP_SECRET))return new Response('Forbidden',{status:403});
  if(env.PII_STORAGE_ENABLED!=='true')return new Response('Personal data storage is disabled pending Kazakhstan data-residency compliance',{status:503});
  try{
   await ensureTables(env.DB);
   const payload=JSON.parse(new TextDecoder().decode(raw));
   if(payload.object==='whatsapp_business_account')for(const e of payload.entry||[])for(const c of e.changes||[]){
    if(String(c.value?.metadata?.phone_number_id||'')!==String(env.META_PHONE_NUMBER_ID))continue;
    for(const m of c.value?.messages||[])await onMessage(env,m);
   }
   return new Response('ok');
  }catch(e){console.error('Webhook failed',e?.message);return new Response('Processing failed',{status:500});}
 }
};