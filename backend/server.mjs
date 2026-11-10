/** Local-only development backend. NOT a production multi-tenant deployment. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createBrief} from './brief.mjs';
const localDir=path.dirname(fileURLToPath(import.meta.url));
function loadEnv(){const filename=path.join(localDir,'.env');if(!fs.existsSync(filename))return;
  for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(!m)continue;
    let val=m[2].trim();if((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'")))val=val.slice(1,-1);
    if(!process.env[m[1]])process.env[m[1]]=val;
  }
}
loadEnv();
const LIMIT_BYTES=25000;
const limits=new Map();
function allowedOrigin(origin){return !origin||/^chrome-extension:\/\/[a-p]{32}$/.test(origin);}
function authorized(header,expected){if(!expected||!header)return false;
  const a=Buffer.from(String(header)),b=Buffer.from(String(expected));return a.length===b.length && crypto.timingSafeEqual(a,b);
}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function readBody(req){let text='';for await(const buf of req){text+=buf.toString('utf8');if(Buffer.byteLength(text,'utf8')>LIMIT_BYTES)throw Object.assign(new Error('Request is too large.'),{status:413});}
  try{return JSON.parse(text);}catch{throw Object.assign(new Error('Invalid JSON request.'),{status:400});}
}
function rateLimited(ip){const now=Date.now(),entry=limits.get(ip)||{from:now,count:0};
  if(now-entry.from>3600000){entry.from=now;entry.count=0;}entry.count++;limits.set(ip,entry);return entry.count>30;
}
export function createHandler(options={}){
  const briefFn=options.createBrief||createBrief;
  const token=options.token??process.env.CLIENT_ACCESS_TOKEN;
  return async(req,res)=>{
    const origin=req.headers.origin||'';
    if(!allowedOrigin(origin))return json(res,403,{error:'This local API accepts requests only from a Chrome extension.'});
    if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-ProspectIQ-Token');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    if(req.url==='/api/health'&&req.method==='GET')return json(res,200,{status:'ok',version:'0.1.0',configured:Boolean(process.env.OPENAI_API_KEY)});
    if(req.url!=='/api/brief'||req.method!=='POST')return json(res,404,{error:'Not found'});
    if(!authorized(req.headers['x-prospectiq-token'],token))return json(res,401,{error:'Incorrect client access token. Check backend/.env and extension Settings.'});
    if(rateLimited(String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress||'local'))return json(res,429,{error:'Local development rate limit: 30 research requests per hour.'});
    try{const payload=await readBody(req);const data=await briefFn(payload);return json(res,200,data);}
    catch(err){const status=err.status||(/^(Enter|Describe|Company website|Only HTTP|Invalid type)/.test(err.message)?400:503);
      console.error('[ProspectIQ]',new Date().toISOString(),err.message);return json(res,status,{error:String(err.message||'Unexpected server error').slice(0,280)});
    }
  };
}
export function createServer(options={}){return http.createServer(createHandler(options));}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8787);const server=createServer();
  server.listen(port,'127.0.0.1',()=>{
    console.log(`ProspectIQ development backend: http://127.0.0.1:${port}`);
    console.log('OpenAI key configured:',Boolean(process.env.OPENAI_API_KEY));
    console.log('Client token configured:',Boolean(process.env.CLIENT_ACCESS_TOKEN));
    if(!process.env.CLIENT_ACCESS_TOKEN)console.warn('Set CLIENT_ACCESS_TOKEN in backend/.env before using live research.');
  });
}
