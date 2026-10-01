export type Reading = { signal_id:string; normalized_value:number; unit:string; source_name:string; source_url:string; source_time:string|null; source_observed_at:string|null; fetched_at:string; record_timezone:string; record_date:string; raw?:unknown; id?:string; cache_expires_at?:string };
export type State = { rows:Reading[]; freshness:string; error_code:string; attempted_at?:string };
export const SOURCE_URL="https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=37.5665&lon=126.9780";
export function kstDate(time:string){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(time));}
export function normalize(payload:any):Reading {
 if(!payload || typeof payload.normalized_value!=="number" || !Number.isFinite(payload.normalized_value) || typeof payload.unit!=="string" || !payload.unit || !payload.signal_id || !payload.source_url || (payload.source_time!==null && !Number.isFinite(Date.parse(payload.source_time))) || !Number.isFinite(Date.parse(payload.fetched_at)) || payload.record_timezone!=="Asia/Seoul") throw new Error("schema_error");
 return {...payload, source_observed_at:payload.source_time,record_date:kstDate(payload.fetched_at),id:payload.signal_id+":"+kstDate(payload.fetched_at)};
}
export function success(state:State,payload:any):State {
 const reading=normalize(payload);const rows=[...state.rows.filter(r=>r.id!==reading.id),reading].sort((a,b)=>a.record_date.localeCompare(b.record_date));
 return {rows,freshness:"fresh",error_code:"none",attempted_at:reading.fetched_at};
}
export function failure(state:State,code:string,at?:string):State {return {...state,freshness:state.rows.length?"stale":"error",error_code:code,attempted_at:at};}
export function delta(rows:Reading[]){if(rows.length<2)return null;const [a,b]=rows.slice(-2);return a.unit===b.unit?Math.round((b.normalized_value-a.normalized_value)*1000)/1000:null;}
export function replay(state:State,f:any):State {
 const t=f.transport;let code="none";
 if(t.mode==="timeout" || t.delay_ms>t.deadline_ms)code="timeout";
 else if(t.mode==="offline")code="offline";
 else if(t.status===401 || t.status===403)code="auth";
 else if(t.status===429)code="rate_limit";
 else if(t.status>=400)code="upstream_error";
 if(code!=="none")return failure(state,code,f.virtual_now);
 try {return success(state,{...f.payload,raw:f.payload});}catch{return failure(state,"schema_error",f.virtual_now);}
}
export const empty:State={rows:[],freshness:"empty",error_code:"none"};
export const messages:Record<string,{title:string;body:string;action:string}>={

 auth:{title:"외부 원천이 요청을 거절했어요 (401/403)",body:"데이터 제공처가 접근을 거절했습니다. 마지막 정상값은 유지됩니다.",action:"출처의 이용 상태를 확인한 뒤 다시 시도하세요."},
 rate_limit:{title:"호출 횟수 제한에 도달했어요 (429)",body:"짧은 시간에 요청이 많았습니다. 마지막 정상값은 유지됩니다.",action:"잠시 기다린 뒤 다시 시도하세요."},
 offline:{title:"네트워크에 연결할 수 없어요",body:"인터넷 연결이나 외부 원천 연결이 끊겼습니다.",action:"네트워크 연결을 확인한 뒤 다시 시도하세요."},
 schema_error:{title:"응답 형식이 달라졌어요",body:"값·단위·시각을 검증하지 못해 새 값을 저장하지 않았습니다.",action:"출처 응답 형식을 확인하고 다시 시도하세요."},
 upstream_error:{title:"외부 원천에서 오류가 발생했어요",body:"마지막 정상값을 보존합니다.",action:"출처의 서비스 상태를 확인하고 다시 시도하세요."},
 storage:{title:"기록을 불러오거나 저장할 수 없어요",body:"현재 표시 중인 값을 유지합니다. 저장 성공으로 처리하지 않습니다.",action:"잠시 뒤 다시 시도하세요."}
};
messages.timeout={title:"외부 응답이 너무 늦어요",body:"제한시간 안에 응답이 오지 않았습니다. 마지막 정상값을 유지합니다.",action:"잠시 뒤 다시 시도하세요."};
