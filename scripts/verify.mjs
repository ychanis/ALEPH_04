import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import ts from 'typescript';
const source=fs.readFileSync('lib/reading.ts','utf8');const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {empty,replay,delta,kstDate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const fixture=n=>JSON.parse(fs.readFileSync('public/t04/fixtures/'+n+'.json'));
function check(n,s){const e=fixture(n).expected;assert.equal(s.freshness,e.freshness,n);assert.equal(s.error_code,e.error_code,n);assert.equal(s.rows.length,e.row_count,n);assert.equal(s.rows.at(-1).normalized_value,e.stored_value,n);assert.equal(delta(s.rows),e.delta,n);return s;}
const baseline=()=>replay(replay(empty,fixture('normal-d1-a')),fixture('normal-d1-b'));
let s=check('normal-d1-a',replay(empty,fixture('normal-d1-a')));const id=s.rows[0].id;s=check('normal-d1-b',replay(s,fixture('normal-d1-b')));assert.equal(s.rows[0].id,id);check('normal-d1-b',replay(s,fixture('normal-d1-b')));check('normal-d2',replay(s,fixture('normal-d2')));
for(const name of ['timeout','auth-401','rate-429','offline','schema-break']){const b=baseline();s=check(name,replay(b,fixture(name)));assert.deepEqual(s.rows,b.rows);s=check('recover-d2',replay(s,fixture('recover-d2')));check('recover-d2',replay(s,fixture('recover-d2')));}
assert.equal(kstDate('2026-10-01T14:59:59Z'),'2026-10-01');assert.equal(kstDate('2026-10-01T15:00:00Z'),'2026-10-02');
const manifest=JSON.parse(fs.readFileSync('public/t04/asset-manifest.json'));for(const f of manifest.files){assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/t04/'+f.path)).digest('hex'),f.sha256,f.path);}
console.log('PASS: 17 asset hashes; all 9 fixtures; five failures preserve rows; repeated D1 and D2; KST midnight; delta = 15');

const modelJs=ts.transpileModule(fs.readFileSync('lib/model-source.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {selectModelPoint}=await import('data:text/javascript;base64,'+Buffer.from(modelJs).toString('base64'));
const mk=(time,v)=>({time,data:{instant:{details:{air_temperature:v}}}});
const raw={properties:{meta:{units:{air_temperature:'celsius'}},timeseries:[mk('2026-10-01T00:00:00Z',16.5),mk('2026-10-01T01:00:00Z',18)]}};
assert.equal(selectModelPoint(raw,Date.parse('2026-10-01T00:59:59Z')).data.instant.details.air_temperature,16.5);
assert.equal(selectModelPoint(raw,Date.parse('2026-10-01T01:00:00Z')).data.instant.details.air_temperature,18);
assert.throws(()=>selectModelPoint(raw,Date.parse('2026-10-01T03:00:00Z')));
assert.throws(()=>selectModelPoint({...raw,properties:{...raw.properties,meta:{units:{air_temperature:'kelvin'}}}},Date.parse('2026-10-01T01:00:00Z')));
console.log('PASS: MET time selection, future forecasts excluded, expired model points and wrong units rejected');
