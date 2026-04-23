import React, { useState, useEffect, useRef } from 'react';
import { 
  CAT, PRI, MONTHS, DAYS, TODAY, 
  sameDay, daysInMonth, fmtTime, fmtShort, parseNLP, detectPriority, detectCategory 
} from '../utils/helpers';

export function MiniCal({cur,sel,tasks,onSelect,onNav}){
  const first=new Date(cur.getFullYear(),cur.getMonth(),1);
  const days=daysInMonth(cur); const dow=first.getDay();
  const cells=Array.from({length:dow+days},(_,i)=>i<dow?null:new Date(cur.getFullYear(),cur.getMonth(),i-dow+1));
  const hasTask=d=>d&&tasks.some(t=>sameDay(t.date,d)&&!t.done);
  return(
    <div style={{padding:"0 8px 12px"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
        <button onClick={()=>onNav(-1)} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:18,padding:2,borderRadius:"50%"}}>‹</button>
        <span style={{flex:1,textAlign:"center",fontSize:12,fontWeight:500,color:"#202124"}}>{MONTHS[cur.getMonth()].substring(0,3)} {cur.getFullYear()}</span>
        <button onClick={()=>onNav(1)} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:18,padding:2,borderRadius:"50%"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"#70757a",padding:"2px 0",fontWeight:500}}>{d[0]}</div>)}
        {cells.map((d,i)=>(
          <div key={i} onClick={()=>d&&onSelect(d)} style={{textAlign:"center",padding:"2px 0",cursor:d?"pointer":"default"}}>
            {d&&<div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",fontSize:11,position:"relative",
              background:sel&&sameDay(d,sel)?"#1a73e8":sameDay(d,TODAY)?"#e8f0fe":"transparent",
              color:sel&&sameDay(d,sel)?"white":sameDay(d,TODAY)?"#1a73e8":"#202124",
              fontWeight:sameDay(d,TODAY)?600:400}}>
              {d.getDate()}
              {hasTask(d)&&!(sel&&sameDay(d,sel))&&<div style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",width:3,height:3,borderRadius:"50%",background:"#1a73e8"}}/>}
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pill({task,onClick}){
  const m=CAT[task.category];
  return(
    <div onClick={e=>{e.stopPropagation();onClick(task);}} style={{background:task.done?"#f1f3f4":m.light,borderLeft:`3px solid ${task.done?"#bdc1c6":m.color}`,borderRadius:"0 3px 3px 0",padding:"1px 5px",marginBottom:2,cursor:"pointer",opacity:task.done?0.6:1,overflow:"hidden",userSelect:"none"}}>
      <div style={{fontSize:11,fontWeight:500,color:task.done?"#80868b":m.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.title}</div>
    </div>
  );
}

export function DayPanel({date,tasks,onClose,onAdd,onToggle,onDelete,onEdit}){
  const [inp,setInp]=useState(""); const [prev,setPrev]=useState(null);
  const isToday2=sameDay(date,TODAY);
  const hours=Array.from({length:24},(_,i)=>i);
  const dayTasks=tasks.filter(t=>sameDay(t.date,date)).sort((a,b)=>a.date-b.date);
  const curMin=new Date().getHours()*60+new Date().getMinutes();

  useEffect(()=>{
    if(!inp.trim()){setPrev(null);return;}
    const p=parseNLP(inp); const nd=new Date(date); nd.setHours(p.date.getHours(),p.date.getMinutes(),0,0);
    const ne=new Date(nd.getTime()+p.duration*60000);
    setPrev({...p,date:nd,endDate:ne,priority:detectPriority(inp),category:detectCategory(inp)});
  },[inp,date]);

  function addIt(){ if(!inp.trim())return; const p=parseNLP(inp); const nd=new Date(date); nd.setHours(p.date.getHours(),p.date.getMinutes(),0,0); const ne=new Date(nd.getTime()+p.duration*60000); onAdd({title:p.title,date:nd,endDate:ne,priority:detectPriority(inp),category:detectCategory(inp),notes:""}); setInp(""); setPrev(null); }

  function getTop(t){ return(t.date.getHours()+t.date.getMinutes()/60)*60; }
  function getH(t){ return Math.max(22,(t.endDate-t.date)/60000/60*60); }

  return(
    <div style={{position:"fixed",top:0,right:0,width:380,height:"100vh",background:"white",boxShadow:"-2px 0 16px rgba(0,0,0,0.13)",zIndex:200,display:"flex",flexDirection:"column",fontFamily:"'Google Sans',Arial,sans-serif"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #e0e0e0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:20,padding:2,borderRadius:"50%"}}>✕</button>
        <div style={{flex:1}}>
          <div style={{fontSize:12,color:"#5f6368"}}>{date.toLocaleDateString([],{weekday:"long"})}</div>
          <div style={{fontSize:20,fontWeight:400,color:isToday2?"#1a73e8":"#202124",lineHeight:1.2}}>{date.toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        {isToday2&&<span style={{background:"#e8f0fe",color:"#1a73e8",padding:"3px 10px",borderRadius:12,fontSize:12,fontWeight:500}}>Today</span>}
      </div>

      <div style={{padding:"10px 14px",borderBottom:"1px solid #e0e0e0",flexShrink:0}}>
        <div style={{display:"flex",gap:8}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIt()}
            placeholder={`Add for ${fmtShort(date)}… "Meeting at 3pm"`}
            style={{flex:1,padding:"8px 12px",borderRadius:20,border:"1px solid #dadce0",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={addIt} style={{background:"#1a73e8",color:"white",border:"none",borderRadius:20,padding:"8px 14px",fontSize:13,cursor:"pointer",fontWeight:500}}>Add</button>
        </div>
        {prev&&<div style={{marginTop:7,padding:"5px 10px",background:"#e8f0fe",borderRadius:6,fontSize:12,color:"#1a73e8"}}>
          <b>{prev.title}</b> · {fmtTime(prev.date)}–{fmtTime(prev.endDate)} · <span style={{color:PRI[prev.priority].color}}>{PRI[prev.priority].label}</span> · {CAT[prev.category].label}
        </div>}
      </div>

      <div style={{flex:1,overflowY:"auto",position:"relative"}}>
        <div style={{position:"relative",minHeight:24*60+20}}>
          {hours.map(h=>(
            <div key={h} style={{position:"absolute",top:h*60,left:0,right:0,height:60,borderTop:"1px solid #f1f3f4",display:"flex",alignItems:"flex-start",pointerEvents:"none"}}>
              <span style={{fontSize:10,color:"#80868b",width:38,textAlign:"right",paddingRight:6,paddingTop:2,flexShrink:0}}>
                {h===0?"":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}
              </span>
            </div>
          ))}
          {isToday2&&<div style={{position:"absolute",top:curMin,left:38,right:0,height:2,background:"#d93025",zIndex:10,pointerEvents:"none"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#d93025",position:"absolute",left:-4,top:-3}}/>
          </div>}
          {dayTasks.map(task=>{
            const m=CAT[task.category]; const top=getTop(task); const ht=getH(task);
            return(
              <div key={task.id} onClick={()=>onEdit(task)}
                style={{position:"absolute",top,left:44,right:6,height:ht,background:task.done?"#f1f3f4":m.light,borderLeft:`3px solid ${task.done?"#bdc1c6":m.color}`,borderRadius:"0 6px 6px 0",padding:"3px 7px",cursor:"pointer",overflow:"hidden",opacity:task.done?0.6:1,zIndex:5}}>
                <div style={{fontSize:12,fontWeight:600,color:task.done?"#80868b":m.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.title}</div>
                {ht>28&&<div style={{fontSize:11,color:"#5f6368"}}>{fmtTime(task.date)}–{fmtTime(task.endDate)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {dayTasks.length>0&&(
        <div style={{borderTop:"1px solid #e0e0e0",maxHeight:190,overflowY:"auto",flexShrink:0}}>
          {dayTasks.map(task=>{
            const m=CAT[task.category];
            return(
              <div key={task.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:"1px solid #f1f3f4"}}>
                <div onClick={()=>onToggle(task.id)} style={{width:16,height:16,borderRadius:4,border:`2px solid ${m.color}`,background:task.done?m.color:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white"}}>{task.done&&"✓"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:task.done?"#80868b":"#202124",textDecoration:task.done?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.title}</div>
                  <div style={{fontSize:11,color:"#80868b"}}>{fmtTime(task.date)} · {m.label}</div>
                </div>
                <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#bdc1c6",fontSize:13,padding:3}}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TaskModal({task,onSave,onClose,onDelete}){
  const [t,setT]=useState(task||{title:"",date:new Date(),endDate:new Date(Date.now()+3600000),priority:"medium",category:"task",notes:"",done:false});
  const fmt=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  const parseD=s=>new Date(s);
  const m=CAT[t.category];

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Google Sans',Arial,sans-serif"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"white",borderRadius:12,width:460,maxHeight:"90vh",overflowY:"auto",padding:28,boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:12,height:12,borderRadius:3,background:m.color,flexShrink:0}}/>
          <h3 style={{margin:0,fontWeight:400,fontSize:18,color:"#202124",flex:1}}>{task?"Edit event":"New event"}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:18,padding:4}}>✕</button>
        </div>
        <input value={t.title} onChange={e=>setT({...t,title:e.target.value})} placeholder="Add title"
          style={{width:"100%",fontSize:22,fontWeight:400,border:"none",borderBottom:"2px solid #1a73e8",outline:"none",marginBottom:20,padding:"4px 0",fontFamily:"inherit",color:"#202124",boxSizing:"border-box"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          {[["Start",t.date,"date"],["End",t.endDate,"endDate"]].map(([lbl,val,key])=>(
            <div key={key}>
              <label style={{fontSize:11,color:"#5f6368",display:"block",marginBottom:4}}>{lbl}</label>
              <input type="datetime-local" value={fmt(val)} onChange={e=>setT({...t,[key]:parseD(e.target.value)})}
                style={{width:"100%",padding:"8px 10px",border:"1px solid #dadce0",borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          {[["Category","category",Object.entries(CAT)],["Priority","priority",Object.entries(PRI)]].map(([lbl,key,opts])=>(
            <div key={key}>
              <label style={{fontSize:11,color:"#5f6368",display:"block",marginBottom:4}}>{lbl}</label>
              <select value={t[key]} onChange={e=>setT({...t,[key]:e.target.value})}
                style={{width:"100%",padding:"8px 10px",border:"1px solid #dadce0",borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>
                {opts.map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:"#5f6368",display:"block",marginBottom:4}}>Notes</label>
          <textarea value={t.notes} onChange={e=>setT({...t,notes:e.target.value})} placeholder="Add notes…" rows={3}
            style={{width:"100%",padding:"8px 10px",border:"1px solid #dadce0",borderRadius:6,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",alignItems:"center"}}>
          {task&&<button onClick={()=>onDelete(task.id)} style={{background:"none",border:"1px solid #dadce0",borderRadius:20,padding:"8px 16px",fontSize:13,color:"#d93025",cursor:"pointer",marginRight:"auto",fontFamily:"inherit"}}>Delete</button>}
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5f6368",cursor:"pointer"}}>
            <input type="checkbox" checked={t.done} onChange={e=>setT({...t,done:e.target.checked})}/>Mark done
          </label>
          <button onClick={onClose} style={{background:"none",border:"1px solid #dadce0",borderRadius:20,padding:"8px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={()=>{if(t.title.trim())onSave(t);}} style={{background:"#1a73e8",color:"white",border:"none",borderRadius:20,padding:"8px 20px",fontSize:13,cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function MonthView({cur,tasks,onDay,onEvent}){
  const first=new Date(cur.getFullYear(),cur.getMonth(),1);
  const days=daysInMonth(cur); const dow=first.getDay();
  const total=Math.ceil((dow+days)/7)*7;
  const cells=Array.from({length:total},(_,i)=>{ const d=i-dow+1; return(d<1||d>days)?null:new Date(cur.getFullYear(),cur.getMonth(),d); });
  const weeks=[]; for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
  return(
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #e0e0e0",flexShrink:0}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:11,fontWeight:500,color:"#70757a"}}>{d}</div>)}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {weeks.map((wk,wi)=>(
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",flex:1,minHeight:0,borderBottom:"1px solid #e0e0e0"}}>
            {wk.map((d,di)=>{
              const dt=d?tasks.filter(t=>sameDay(t.date,d)).sort((a,b)=>a.date-b.date):[];
              const isT=d&&sameDay(d,TODAY); const isCur=d&&d.getMonth()===cur.getMonth();
              return(
                <div key={di} onClick={()=>d&&onDay(d)} style={{borderRight:di<6?"1px solid #e0e0e0":"none",padding:"3px",overflow:"hidden",cursor:d?"pointer":"default",background:d?"white":"#fafafa",minHeight:80}}>
                  {d&&<>
                    <div style={{textAlign:"right",marginBottom:2}}>
                      <span style={{display:"inline-flex",width:22,height:22,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:isT?"#1a73e8":"transparent",color:isT?"white":isCur?"#202124":"#bdc1c6",fontSize:12,fontWeight:isT?600:400}}>{d.getDate()}</span>
                    </div>
                    {dt.slice(0,3).map(t=><Pill key={t.id} task={t} onClick={onEvent}/>)}
                    {dt.length>3&&<div style={{fontSize:10,color:"#70757a",paddingLeft:3}}>+{dt.length-3} more</div>}
                  </>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeekView({cur,tasks,onDay,onEvent}){
  const s=new Date(cur); s.setDate(s.getDate()-s.getDay());
  const wk=Array.from({length:7},(_,i)=>{ const d=new Date(s); d.setDate(d.getDate()+i); return d; });
  const hours=Array.from({length:24},(_,i)=>i);
  const ref=useRef(); useEffect(()=>{ if(ref.current)ref.current.scrollTop=480; },[]);
  const curMin=new Date().getHours()*60+new Date().getMinutes();
  const todayIdx=wk.findIndex(d=>sameDay(d,TODAY));
  return(
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"44px repeat(7,1fr)",borderBottom:"1px solid #e0e0e0",flexShrink:0}}>
        <div/>{wk.map((d,i)=>{
          const isT=sameDay(d,TODAY); const dt=tasks.filter(t=>sameDay(t.date,d));
          return(
            <div key={i} onClick={()=>onDay(d)} style={{textAlign:"center",padding:"6px 2px",cursor:"pointer",borderRight:i<6?"1px solid #e0e0e0":"none"}}>
              <div style={{fontSize:10,color:"#70757a",fontWeight:500}}>{DAYS[d.getDay()]}</div>
              <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"3px auto 2px",background:isT?"#1a73e8":"transparent",color:isT?"white":"#202124",fontSize:16,fontWeight:isT?600:400}}>{d.getDate()}</div>
              {dt.length>0&&<div style={{fontSize:10,color:isT?"#1a73e8":"#70757a"}}>{dt.length}e</div>}
            </div>
          );
        })}</div>
      <div ref={ref} style={{flex:1,overflowY:"auto",position:"relative"}}>
        <div style={{display:"grid",gridTemplateColumns:"44px repeat(7,1fr)",minHeight:24*60}}>
          {hours.map(h=>(
            <div key={h} style={{gridColumn:"1/-1",position:"absolute",top:h*60,left:0,right:0,borderTop:"1px solid #f1f3f4",display:"flex",pointerEvents:"none"}}>
              <span style={{fontSize:10,color:"#80868b",width:36,textAlign:"right",paddingRight:6,transform:"translateY(-50%)",flexShrink:0}}>
                {h===0?"":h<12?`${h}`:h===12?"12":h-12}{h===0?"":h<12?" AM":" PM"}
              </span>
            </div>
          ))}
          {todayIdx>=0&&<div style={{position:"absolute",top:curMin,left:44,right:0,height:2,background:"#d93025",zIndex:10,pointerEvents:"none"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#d93025",position:"absolute",left:-4,top:-3}}/>
          </div>}
          {wk.map((d,di)=>{
            const colLeft=`calc(44px + ${di}/7*(100% - 44px))`;
            const colW=`calc((100% - 44px)/7)`;
            return tasks.filter(t=>sameDay(t.date,d)).map(task=>{
              const top=(task.date.getHours()+task.date.getMinutes()/60)*60;
              const ht=Math.max(20,(task.endDate-task.date)/60000/60*60);
              const m=CAT[task.category];
              return(
                <div key={task.id} onClick={()=>onEvent(task)}
                  style={{position:"absolute",top,left:`calc(${colLeft} + 2px)`,width:`calc(${colW} - 4px)`,height:ht,background:task.done?"#f1f3f4":m.light,borderLeft:`3px solid ${task.done?"#bdc1c6":m.color}`,borderRadius:"0 4px 4px 0",padding:"2px 5px",cursor:"pointer",overflow:"hidden",opacity:task.done?0.6:1,zIndex:5}}>
                  <div style={{fontSize:11,fontWeight:600,color:task.done?"#80868b":m.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.title}</div>
                  {ht>26&&<div style={{fontSize:10,color:"#5f6368"}}>{fmtTime(task.date)}</div>}
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

export function NotifBell({tasks, onDismiss, onSnooze}){
  const [open,setOpen]=useState(false);
  const [snoozeMins, setSnoozeMins] = useState({});
  const now=new Date();
  const overdue=tasks.filter(t=>!t.done&&t.date<now);
  const soon=tasks.filter(t=>!t.done&&t.date>now&&t.date-now<3600000).sort((a,b)=>a.date-b.date);
  const count=overdue.length+soon.length;

  const getSnooze = id => snoozeMins[id] || 15;
  const incSnooze = (id, d) => setSnoozeMins(prev => ({...prev, [id]: Math.max(5, getSnooze(id) + d)}));

  const renderTask = (t, type) => {
    const mins = getSnooze(t.id);
    return (
      <div key={t.id} style={{padding:"9px 14px",borderBottom:"1px solid #f1f3f4",background:type==="OVERDUE"?"#fce8e6":"white"}}>
        <div style={{fontSize:11,fontWeight:600,color:type==="OVERDUE"?"#d93025":"#f29900"}}>{type==="OVERDUE"?"OVERDUE":`IN ${Math.round((t.date-now)/60000)} MIN`}</div>
        <div style={{fontSize:13,color:"#202124",marginBottom:2}}>{t.title}</div>
        <div style={{fontSize:11,color:"#80868b",marginBottom:8}}>{type==="OVERDUE"?fmtShort(t.date):fmtTime(t.date)}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={() => onDismiss(t.id)} style={{background:"none",border:"1px solid #dadce0",borderRadius:12,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#5f6368"}}>Dismiss</button>
          <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
            <button onClick={() => incSnooze(t.id, -5)} style={{background:"#f1f3f4",border:"none",borderRadius:4,width:20,height:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#5f6368"}}>-</button>
            <span style={{fontSize:11,minWidth:32,textAlign:"center",color:"#5f6368"}}>{mins}m</span>
            <button onClick={() => incSnooze(t.id, 5)} style={{background:"#f1f3f4",border:"none",borderRadius:4,width:20,height:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#5f6368"}}>+</button>
          </div>
          <button onClick={() => { onSnooze(t.id, mins); if(count===1) setOpen(false); }} style={{background:"#1a73e8",color:"white",border:"none",borderRadius:12,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Snooze</button>
        </div>
      </div>
    );
  };

  return(
    <div style={{position:"relative"}}>
      <button onClick={e=>{e.stopPropagation();setOpen(!open);}} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:18,padding:"5px 8px",borderRadius:"50%",position:"relative"}}>
        🔔{count>0&&<span style={{position:"absolute",top:3,right:3,width:15,height:15,borderRadius:"50%",background:"#d93025",color:"white",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{count}</span>}
      </button>
      {open&&(
        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:0,top:40,width:310,background:"white",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",zIndex:400,overflow:"hidden",border:"1px solid #e0e0e0"}}>
          <div style={{padding:"11px 14px",borderBottom:"1px solid #e0e0e0",fontSize:13,fontWeight:500,color:"#202124"}}>Reminders</div>
          {count===0&&<div style={{padding:16,fontSize:13,color:"#5f6368",textAlign:"center"}}>All caught up ✓</div>}
          {overdue.map(t=>renderTask(t, "OVERDUE"))}
          {soon.map(t=>renderTask(t, "SOON"))}
        </div>
      )}
    </div>
  );
}
