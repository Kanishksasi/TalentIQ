import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import {localDatabase} from '../server/local-database.js';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
const origin='https://talentiq.test';
const req=(path,method='GET',data,cookie='',extra={})=>new Request(origin+path,{method,headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...extra},body:data===undefined?undefined:JSON.stringify(data)});
const cookie=r=>r.headers.get('set-cookie')?.split(';')[0]||'';
test('account-free check-in, private interviewer records, consent, removal and restoration work in Postgres',async()=>{
 const {pg,DB,UPLOADS}=await localDatabase();
 const env={DB,UPLOADS,VERCEL_RUNTIME:true,RECRUITER_EMAILS:'recruiter@example.test',RECRUITER_SETUP_TOKEN:'test-setup-secret',GROQ_API_KEY:'test-only-provider-key'};
 const originalFetch=globalThis.fetch;
 let calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});if(url.includes('/audio/transcriptions'))return new Response(JSON.stringify({text:'I developed a route planning project using Python.'}),{headers:{'content-type':'application/json'}});const x=JSON.parse(options.body);const extraction=x.messages[0].content.startsWith('Extract');return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(extraction?{resumeText:'Alex Smith\nReact scheduling project',fields:{firstName:'Alex',lastName:'Smith',major:'Computer Science',relevantSkills:['React']},warnings:[]}:{statements:[{text:'Built a scheduling project.',citations:['Candidate profile']}],interviewQuestions:[{text:'How did you validate your scheduling project?',citations:['Candidate profile']}],keySkills:['React'],relevantExperience:['Scheduling project'],missingInformation:[]})}}]}),{headers:{'content-type':'application/json'}});};
 try{
  let r=await worker.fetch(req('/api/health'),env);assert.equal((await r.json()).database.connected,true);
  assert.equal((await worker.fetch(req('/api/event?code=12345'),env)).status,200);
  assert.equal((await worker.fetch(req('/api/event?code=54321'),env)).status,400);
  assert.equal((await worker.fetch(req('/api/resume/parse','POST',{aiConsent:true,text:'Resume'}),env)).status,400);
  for(const [path,method]of [['/api/candidate-auth/session','GET'],['/api/candidate-auth/register','POST'],['/api/candidate-auth/login','POST'],['/api/my-check-in','GET']])assert.equal((await worker.fetch(req(path,method,method==='POST'?{}:undefined),env)).status,410);
  const alex='',other='__Host-talentiq_candidate='+('a'.repeat(64));
  const resume={name:'resume.txt',base64:Buffer.from('Alex Smith\nBuilt a React scheduling project.').toString('base64')};
  const data={firstName:'Alex',lastName:'Smith',email:'alex@example.test',university:'University',degreeProgram:'Bachelor’s',major:'CS',graduationDate:'2027-05',desiredFunction:'Software',eventCode:'12345',resume,relevantSkills:['React'],projectExperience:'Built a scheduling project.',aiConsent:'yes'};
  assert.equal((await worker.fetch(req('/api/candidates','POST',data,alex,{origin:'https://evil.test'}),env)).status,403);
  r=await worker.fetch(req('/api/candidates','POST',data,alex),env);assert.equal(r.status,201);assert.equal(r.headers.get('set-cookie'),null);const {id}=await r.json();
  r=await worker.fetch(req('/api/candidates','POST',data,alex),env);assert.equal(r.status,200);assert.equal((await r.json()).id,id);
  assert.equal((await DB.prepare('SELECT count(*) AS count FROM candidates').first()).count,1);
  assert.equal((await worker.fetch(req('/api/candidates'),env)).status,403);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}`,'GET',undefined,other),env)).status,403);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}/resume`,'GET',undefined,other),env)).status,403);
  assert.equal((await worker.fetch(req('/api/resume/parse','POST',{eventCode:'12345',aiConsent:false,text:'Resume'}),env)).status,403);
  r=await worker.fetch(req('/api/resume/parse','POST',{eventCode:'12345',aiConsent:true,images:['data:image/jpeg;base64,/9j/']}),env);assert.equal(r.status,200);assert.equal((await r.json()).fields.firstName,'Alex');assert.equal(JSON.parse(calls.at(-1).options.body).model,'qwen/qwen3.8-27b');
  const intro={eventCode:'12345',mime:'audio/webm',base64:Buffer.alloc(150).toString('base64'),consent:true};
  r=await worker.fetch(req('/api/transcribe','POST',intro),env);assert.equal(r.status,200);assert.match((await r.json()).text,/Python/);
  assert.equal((await worker.fetch(req('/api/transcribe','POST',{...intro,consent:false}),env)).status,403);
  assert.equal((await worker.fetch(req('/api/transcribe','POST',{...intro,eventCode:'wrong'}),env)).status,400);
  assert.equal((await worker.fetch(req('/api/transcribe','POST',{...intro,candidateId:id}),env)).status,403);
  assert.equal((await worker.fetch(req('/api/auth/setup','POST',{email:'recruiter@example.test',password:'Strong-recruiter-password',setupToken:'wrong'}),env)).status,403);
  assert.equal((await worker.fetch(req('/api/recruiter-session','GET',undefined,'',{'oai-authenticated-user-email':'recruiter@example.test'}),env)).status,200);
  assert.equal((await(await worker.fetch(req('/api/recruiter-session','GET',undefined,'',{'oai-authenticated-user-email':'recruiter@example.test'}),env)).json()).authorized,false);
  r=await worker.fetch(req('/api/auth/setup','POST',{email:'recruiter@example.test',password:'Strong-recruiter-password',setupToken:'test-setup-secret'}),env);assert.equal(r.status,200);const recruiter=cookie(r);
  r=await worker.fetch(req('/api/candidates','GET',undefined,recruiter),env);assert.equal((await r.json()).candidates.length,1);
  r=await worker.fetch(req(`/api/candidates/${id}/resume`,'GET',undefined,recruiter),env);assert.equal(r.status,200);assert.match(await r.text(),/React/);
  r=await worker.fetch(req(`/api/candidates/${id}`,'PATCH',{observations:{conversationNotes:'Discussed route planning.',recruiterName:'Recruiter'},recordStatus:'Follow-Up'},recruiter),env);assert.equal(r.status,200);assert.equal((await r.json()).candidate.observations.conversationNotes,'Discussed route planning.');
  r=await worker.fetch(req(`/api/candidates/${id}/summary`,'POST',{},recruiter),env);assert.equal(r.status,200);assert.equal((await r.json()).summary.interviewQuestions.length,1);
  r=await worker.fetch(req(`/api/candidates/${id}/review`,'POST',{action:'Approved'},recruiter),env);assert.equal((await r.json()).candidate.approvalStatus,'Approved');
  const recording={mime:'audio/webm',base64:Buffer.alloc(150).toString('base64'),consent:true,candidateId:id};
  r=await worker.fetch(req('/api/transcribe','POST',recording,recruiter),env);assert.equal(r.status,200);assert.match((await r.json()).text,/Python/);
  await DB.prepare('UPDATE candidates SET ai_consent=0 WHERE id=?').bind(id).run();const before=calls.length;
  assert.equal((await worker.fetch(req(`/api/candidates/${id}/summary`,'POST',{},recruiter),env)).status,403);
  assert.equal((await worker.fetch(req('/api/transcribe','POST',recording,recruiter),env)).status,403);assert.equal(calls.length,before);
  // Only authenticated interviewers can remove or restore. Writes require the same origin.
  assert.equal((await worker.fetch(req(`/api/candidates/${id}`,'DELETE',{},other),env)).status,403);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}/restore`,'POST',{},other),env)).status,403);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}`,'DELETE',{},recruiter,{origin:'https://evil.test'}),env)).status,403);
  r=await worker.fetch(req(`/api/candidates/${id}`,'DELETE',{},recruiter),env);assert.equal(r.status,200);assert.equal((await r.json()).removed,true);
  r=await worker.fetch(req('/api/candidates','GET',undefined,recruiter),env);assert.equal((await r.json()).candidates.length,0);
  r=await worker.fetch(req('/api/candidates?removed=1','GET',undefined,recruiter),env);const removed=(await r.json()).candidates;assert.equal(removed.length,1);assert.ok(removed[0].removedAt);assert.equal(removed[0].observations.conversationNotes,'Discussed route planning.');
  assert.ok(await UPLOADS.get((await DB.prepare('SELECT resume_key FROM candidates WHERE id=?').bind(id).first()).resume_key));
  assert.equal((await worker.fetch(req(`/api/candidates/${id}`,'PATCH',{recordStatus:'New'},recruiter),env)).status,404);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}/summary`,'POST',{},recruiter),env)).status,404);
  r=await worker.fetch(req('/api/export.csv','GET',undefined,recruiter),env);assert.doesNotMatch(await r.text(),/alex@example.test/);
  const {unzipSync,strFromU8}=await import('fflate');r=await worker.fetch(req('/api/export.xlsx','GET',undefined,recruiter),env);assert.doesNotMatch(strFromU8(unzipSync(new Uint8Array(await r.arrayBuffer()))['xl/worksheets/sheet1.xml']),/alex@example.test/);
  assert.equal((await DB.prepare('SELECT action FROM audit_events WHERE candidate_id=? ORDER BY id DESC LIMIT 1').bind(id).first()).action,'check_in_removed');
  r=await worker.fetch(req(`/api/candidates/${id}/restore`,'POST',{},recruiter),env);assert.equal(r.status,200);assert.equal((await r.json()).candidate.removedAt,null);
  assert.equal((await DB.prepare('SELECT action FROM audit_events WHERE candidate_id=? ORDER BY id DESC LIMIT 1').bind(id).first()).action,'check_in_restored');
  r=await worker.fetch(req('/api/candidates','GET',undefined,recruiter),env);assert.equal((await r.json()).candidates.length,1);
  // Removing an entry allows a fresh check-in; restoring must not create duplicate active entries.
  await worker.fetch(req(`/api/candidates/${id}`,'DELETE',{},recruiter),env);
  r=await worker.fetch(req('/api/candidates','POST',data),env);assert.equal(r.status,201);const newerId=(await r.json()).id;assert.notEqual(newerId,id);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}/restore`,'POST',{},recruiter),env)).status,409);
  await worker.fetch(req(`/api/candidates/${newerId}`,'DELETE',{},recruiter),env);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}/restore`,'POST',{},recruiter),env)).status,200);
  await worker.fetch(req('/api/auth/logout','POST',{},recruiter),env);
  assert.equal((await worker.fetch(req(`/api/candidates/${id}`,'DELETE',{},recruiter),env)).status,403);
 }finally{globalThis.fetch=originalFetch;await pg.close();}
});
test('health reports a missing database honestly and API errors stay structured',async()=>{
 let r=await worker.fetch(req('/api/health'),{GROQ_API_KEY:'configured'});const h=await r.json();assert.equal(h.ok,false);assert.equal(h.database.connected,false);assert.equal(h.aiConfigured,true);
 r=await worker.fetch(req('/api/recruiter-session'),{});assert.equal(r.status,503);assert.match((await r.json()).error,/DATABASE_URL/);
 const DB={prepare(){return{first:async()=>{throw Error('Database disconnected')},all:async()=>{throw Error('Database disconnected')}}}};
 r=await worker.fetch(req('/api/recruiter-session'),{DB});assert.equal(r.status,500);assert.ok((await r.json()).error);
});
test('removal migration preserves existing records and interviewer access when run repeatedly',async()=>{
 const pg=new PGlite(),schema=readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8');
 try{
  await pg.exec(schema.replace(/^ALTER TABLE candidates.*\n/gm,''));
  await pg.query("INSERT INTO candidates(id,first_name,last_name,email,university,degree_program,major,graduation_date,desired_function,event_code,created_at,updated_at) VALUES('existing','Demo','Existing','existing@example.test','School','BS','CS','2027-05','Software','12345','time','time')");
  await pg.query("INSERT INTO recruiter_accounts(email,password_salt,password_hash,iterations,created_at,updated_at) VALUES('interviewer@example.test','salt','existing-hash',210000,'time','time')");
  await pg.exec(schema);await pg.exec(schema);
  const row=(await pg.query("SELECT first_name,removed_at FROM candidates WHERE id='existing'")).rows[0];
  assert.equal(row.first_name,'Demo');assert.equal(row.removed_at,null);
  assert.equal((await pg.query("SELECT password_hash FROM recruiter_accounts WHERE email='interviewer@example.test'")).rows[0].password_hash,'existing-hash');
 }finally{await pg.close();}
});
