/* InviteLens: deterministic local iCalendar invite preflight. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.InviteLens=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_CHARS=2*1024*1024;
  function unfold(text){return text.replace(/\r\n|\r/g,'\n').replace(/\n[ \t]/g,'');}
  function lines(text){return unfold(text).split('\n').filter(Boolean).map(raw=>{const i=raw.indexOf(':');const left=i<0?raw:raw.slice(0,i),value=i<0?'':raw.slice(i+1);const [name,...params]=left.split(';');const map={};params.forEach(p=>{const j=p.indexOf('=');if(j>0)map[p.slice(0,j).toUpperCase()]=p.slice(j+1);});return {name:name.toUpperCase(),value,params:map};});}
  function unescape(value){return value.replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');}
  function parse(text){
    if(typeof text!=='string'||text.length>MAX_CHARS)throw new Error('ICS limit: 2 MiB');
    const out=[],stack=[];
    for(const line of lines(text)){
      if(line.name==='BEGIN'){stack.push({type:line.value.toUpperCase(),fields:[]});continue;}
      if(line.name==='END'){
        const done=stack.pop();
        if(!done||done.type!==line.value.toUpperCase())throw new Error('Mismatched iCalendar component');
        if(done.type==='VEVENT')out.push(done);
        else if(stack.length&&done.type==='VALARM')stack[stack.length-1].fields.push(...done.fields);
        continue;
      }
      if(stack.length)stack[stack.length-1].fields.push(line);
    }
    return out;
  }
  function values(event,name){return event.fields.filter(x=>x.name===name);}
  function first(event,name){return values(event,name)[0]||null;}
  function field(event,name){const item=first(event,name);return item?unescape(item.value):'';}
  function kindDate(item){if(!item)return 'missing';if(item.params.VALUE==='DATE'||/^\d{8}$/.test(item.value))return 'all-day';if(item.params.TZID)return `timezone:${item.params.TZID}`;if(/Z$/i.test(item.value))return 'utc';return 'floating';}
  function inspect(text){
    const events=parse(text),findings=[];
    if(!events.length)findings.push({kind:'no-event',detail:'No VEVENT component found.'});
    if(events.length>1)findings.push({kind:'multiple-events',detail:`This file contains ${events.length} events.`});
    const list=events.map((event,index)=>{
      const start=first(event,'DTSTART'),end=first(event,'DTEND'),urls=[...values(event,'URL'),...values(event,'CONFERENCE'),...values(event,'ATTACH')].map(x=>x.value),alarms=event.fields.filter(x=>x.name==='TRIGGER'),recurrence=field(event,'RRULE'),organizer=field(event,'ORGANIZER'),summary=field(event,'SUMMARY')||'(untitled event)';
      if(kindDate(start)==='floating')findings.push({event:index+1,kind:'floating-time',detail:`${summary} has no timezone or UTC marker.`});
      if(!end)findings.push({event:index+1,kind:'no-end',detail:`${summary} has no DTEND.`});
      if(recurrence)findings.push({event:index+1,kind:'recurring',detail:`${summary}: ${recurrence}`});
      if(alarms.length)findings.push({event:index+1,kind:'alarm',detail:`${summary} includes ${alarms.length} alarm trigger${alarms.length===1?'':'s'}.`});
      urls.forEach(url=>{if(/^webcal:/i.test(url)||/^https?:/i.test(url))findings.push({event:index+1,kind:'external-link',detail:`${summary}: ${url}`});});
      return {summary,start:start?start.value:'',startKind:kindDate(start),end:end?end.value:'',endKind:kindDate(end),organizer,attendees:values(event,'ATTENDEE').map(x=>x.value),recurrence,urls,alarms:alarms.map(x=>x.value)};
    });
    return {version:1,events:list,findings,ready:findings.length===0};
  }
  function report(result){const out=['InviteLens — local iCalendar preflight',`Events: ${result.events.length}`,`Review items: ${result.findings.length}`];for(const event of result.events)out.push('',`- ${event.summary}`,`  Start: ${event.start||'missing'} (${event.startKind})`,`  End: ${event.end||'missing'} (${event.endKind})`,`  Organizer: ${event.organizer||'missing'}`);if(result.findings.length)out.push('','Review items',...result.findings.map(x=>`- ${x.kind}: ${x.detail}`));out.push('','Local structural inspection only. Do not import an invite based on this report alone.');return out.join('\n');}
  return {unfold,lines,parse,inspect,report,MAX_CHARS};
});
