export function selectModelPoint(raw:any,now:number){
 if(raw?.properties?.meta?.units?.air_temperature!=="celsius" || !Array.isArray(raw?.properties?.timeseries))throw Error("schema_error");
 const points=raw.properties.timeseries.filter((p:any)=>Number.isFinite(Date.parse(p.time))&&Date.parse(p.time)<=now).sort((a:any,b:any)=>Date.parse(b.time)-Date.parse(a.time));
 const point=points[0];
 if(!point || now-Date.parse(point.time)>3600000 || typeof point.data?.instant?.details?.air_temperature!=="number" || !Number.isFinite(point.data.instant.details.air_temperature))throw Error("schema_error");
 return point;
}
