import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchDeepSeek, parseSearchResult } from '../src/server/search-deepseek.ts';
const response = {content:[{type:'web_search_tool_result',content:[{type:'web_search_result',url:'https://jobs.example.com/1',title:'AI Agent 校招'},{type:'web_search_result',url:'https://jobs.example.com/1',title:'转载'}]}],usage:{input_tokens:100,output_tokens:50,server_tool_use:{web_search_requests:1}}};
test('accepts native result blocks, deduplicates and never invents publication date', () => {
  const parsed = parseSearchResult(response,'dummy-secret');
  assert.equal(parsed.leads.length,1);assert.equal(parsed.leads[0].publishedAt,null);
  assert.deepEqual(parsed.usage,{serverSearches:1,input:100,output:50});
  assert.throws(() => parseSearchResult({content:[{type:'text',text:'我搜索了 https://jobs.example.com'}]},'x'),/搜索结果/);
  assert.throws(() => parseSearchResult({content:[{type:'web_search_tool_result',content:{type:'web_search_tool_result_error'}}]},'x'),/搜索/);
});
test('malicious URLs, secret echoes, huge lists and invalid usage are refused or removed', () => {
  const contents = ['http://a.com','https://127.0.0.1/a','https://a.com/?token=private','https://a.com/dummy-secret','https://user:pass@a.com/'].map(url=>({type:'web_search_result',url,title:'foo'}));
  assert.equal(parseSearchResult({content:[{type:'web_search_tool_result',content:contents}]},'dummy-secret').leads.length,0);
  assert.throws(() => parseSearchResult({...response,usage:{server_tool_use:{web_search_requests:2}}},'x'),/上限/);
  assert.throws(() => parseSearchResult({content:Array(501).fill({type:'text'})},'x'));
});
test('fixed official endpoint, bounded request, cancellation and no retries', async () => {
  const config = {baseUrl:'https://api.deepseek.com',model:'deepseek-flash',timeoutSeconds:10,maxTokens:4096};
  let calls=0;
  const result = await searchDeepSeek(config,'dummy-secret','2027 Agent 校招',new AbortController().signal,async (url,body,headers) => {
    calls++; assert.equal(url,'https://api.deepseek.com/anthropic/v1/messages');
    const v=JSON.parse(body); assert.equal(v.tools[0].max_uses,1);assert.equal(v.max_tokens,4096);assert.equal(headers['x-api-key'],'dummy-secret');
    return {status:200,body:JSON.stringify(response)};
  });
  assert.equal(result.leads.length,1);assert.equal(calls,1);
  await assert.rejects(searchDeepSeek({...config,baseUrl:'https://proxy.example.com'},'dummy-secret','q',new AbortController().signal,async()=>{throw new Error('must not call');}),/官方/);
  await assert.rejects(searchDeepSeek(config,'dummy-secret','q',AbortSignal.abort(),async()=>{throw new Error('must not call');}),/停止/);
  calls=0;
  await assert.rejects(searchDeepSeek(config,'dummy-secret','q',new AbortController().signal,async()=>{calls++;return {status:429,body:'dummy-secret'};}),/限流/);
  assert.equal(calls,1);
});
