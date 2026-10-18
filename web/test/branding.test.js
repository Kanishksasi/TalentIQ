import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

test('candidate and interviewer website is employer-neutral',()=>{
  const html=readFileSync(new URL('../client/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../client/app.js',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../src/worker.js',import.meta.url),'utf8');
  for(const source of [html,app,worker])assert.doesNotMatch(source,/j\.?b\.?\s*hunt|jbhunt/i);
  const assets=readdirSync(new URL('../client/assets/',import.meta.url));
  assert(assets.includes('career-fair.png'));
  assert(assets.includes('favicon.svg'));
  assert(!assets.some(name=>/jbhunt|highway|fleet-road|headquarters/i.test(name)));
});
