import { env } from "cloudflare:workers";
import { SOURCE_URL,normalize,failure,empty,type State } from "../../../lib/reading";
import { selectModelPoint } from "../../../lib/model-source";
function db(){if(!env.DB)throw new Error("storage");return env.DB;}
async function load():Promise<State>{
 const result=await db().prepare("SELECT reading,raw FROM daily WHERE signal_id=? ORDER BY record_date").bind("seoul-temperature").all();
 const rows=result.results.map((r:any)=>({...JSON.parse(r.reading),raw:JSON.parse(r.raw)}));
 const status:any=await db().prepare("SELECT error_code,attempted_at FROM board_status WHERE id=?").bind("seoul-temperature").first();
 const error=status?.error_code||"none";
 const old=rows.length && Date.now()-Date.parse(rows[rows.length-1].fetched_at)>3600000;
 return {rows,error_code:error,freshness:error!=="none"?(rows.length?"stale":"error"):old?"stale":rows.length?"fresh":"empty",attempted_at:status?.attempted_at};
}
export async function GET(){try{return Response.json(await load(),{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"storage"},{status:503});}}
export async function POST(){
 const at=new Date().toISOString();let prior:State=empty;
 try {prior=await load();}catch{return Response.json({error:"storage"},{status:503});}
 const last=prior.rows.at(-1);
 // Reuse the already stored response until the provider's expiry; never invent a new fetch time.
 if(last?.source_url===SOURCE_URL && prior.error_code==="none" && Date.parse(last.cache_expires_at||"")>Date.now())return Response.json({...prior,notice:"제공처의 캐시 유효시간 안이라 기존 정상값을 표시합니다. 조회 시각은 바꾸지 않았어요."});
 if(last?.source_url===SOURCE_URL && prior.error_code==="rate_limit" && Date.now()-Date.parse(prior.attempted_at||"")<600000)return Response.json({...prior,notice:"호출 제한 후 10분 동안 추가 외부 요청을 쉬고 있습니다."});
 let raw:any;let reading:any;let code="none";let cacheExpires="";
 try {
  const response=await fetch(SOURCE_URL,{signal:AbortSignal.timeout(8000),headers:{Accept:"application/json","User-Agent":"ALEPH-Seoul-Information-Board/1.0 https://seoul-daily-signal.ksyji123.chatgpt.site"},cache:"no-store"});
  cacheExpires=response.headers.get("Expires")||new Date(Date.now()+600000).toISOString();
  if(!response.ok){code=response.status===401||response.status===403?"auth":response.status===429?"rate_limit":"upstream_error";}
  else {try{raw=await response.json();}catch{code="schema_error";}}
  if(code==="none"){
   try {
    const point=selectModelPoint(raw,Date.now());
    reading=normalize({signal_id:"seoul-temperature",normalized_value:point.data.instant.details.air_temperature,unit:"°C",source_name:"MET Norway · 서울 기온 예측 모델",source_url:SOURCE_URL,source_time:point.time,fetched_at:new Date().toISOString(),record_timezone:"Asia/Seoul",cache_expires_at:new Date(cacheExpires).toISOString()});
   }catch{code="schema_error";}
  }
 }catch(e:any){code=e.name==="TimeoutError"||e.name==="AbortError"?"timeout":"offline";}
 try {
  const statements=[db().prepare("INSERT INTO board_status (id,error_code,attempted_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET error_code=excluded.error_code,attempted_at=excluded.attempted_at").bind("seoul-temperature",code,at)];
  if(code==="none")statements.unshift(db().prepare("INSERT INTO daily (id,signal_id,record_date,reading,raw) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET reading=excluded.reading,raw=excluded.raw").bind(reading.id,reading.signal_id,reading.record_date,JSON.stringify(reading),JSON.stringify(raw)));
  await db().batch(statements);
  return Response.json(await load(),{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({...failure(prior,"storage",at),error:"storage"},{status:503});}
}
