import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export type WireMessage = { role:'system'|'user'|'assistant'|'tool'; content:string|null; tool_call_id?:string; tool_calls?:Array<{id:string;type:'function';function:{name:string;arguments:string}}> };
export type WireTool = { type:'function'; function:{name:string;description:string;parameters:Record<string,unknown>} };
export type ProviderResult = { message:WireMessage; provider:string; model:string };
type Endpoint = {name:string; url:string; key:string; model:string};

@Injectable()
export class HostedAiProvider {
  configured():boolean {return this.endpoints().length>0;}
  private endpoints():Endpoint[] {
    const endpoints:Endpoint[]=[];
    if(process.env.GROQ_API_KEY)endpoints.push({name:'groq',url:'https://api.groq.com/openai/v1/chat/completions',key:process.env.GROQ_API_KEY,model:process.env.GROQ_MODEL||'openai/gpt-oss-120b'});
    if(process.env.OPENROUTER_API_KEY)endpoints.push({name:'openrouter',url:'https://openrouter.ai/api/v1/chat/completions',key:process.env.OPENROUTER_API_KEY,model:process.env.OPENROUTER_MODEL||'openrouter/free'});
    return endpoints;
  }
  async next(messages:WireMessage[],tools:WireTool[]):Promise<ProviderResult>{
    const endpoints=this.endpoints();
    if(!endpoints.length)throw new ServiceUnavailableException('No hosted AI provider configured');
    for(const endpoint of endpoints){
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
      try{
        const response=await fetch(endpoint.url,{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+endpoint.key,'Content-Type':'application/json'},body:JSON.stringify({model:endpoint.model,messages,tools,tool_choice:'auto',temperature:0.2,max_tokens:1400})});
        if(!response.ok){if([408,429,500,502,503,504].includes(response.status))continue;throw new Error(endpoint.name+' HTTP '+response.status);}
        const data:any=await response.json();const message=data?.choices?.[0]?.message;
        if(!message||(!Array.isArray(message.tool_calls)&&typeof message.content!=='string'))throw new Error('Invalid completion response');
        return{message:{role:'assistant',content:typeof message.content==='string'?message.content:null,tool_calls:message.tool_calls},provider:endpoint.name,model:data.model||endpoint.model};
      }catch(e){if(endpoint===endpoints[endpoints.length-1])throw new ServiceUnavailableException('Hosted AI unavailable');}finally{clearTimeout(timer);}
    }
    throw new ServiceUnavailableException('Hosted AI rate-limited or unavailable');
  }
}
