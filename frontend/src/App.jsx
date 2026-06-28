import { useState, useEffect } from "react";
import axios from "axios";
import AuthPage from "./components/AuthPage";
import { 
  MiniCal, MonthView, WeekView, TaskModal, DayPanel, NotifBell 
} from "./components/SchedulerComponents";
import AgentChat from "./components/AgentChat";
import { 
  CAT, PRI, MONTHS, TODAY, 
  urlBase64ToUint8Array, parseNLP, detectPriority, detectCategory, fmtShort, fmtTime 
} from "./utils/helpers";

export default function App(){
  const [user,setUser]=useState(()=>{ try{ const tok=localStorage.getItem("ss_token"); if(!tok)return null; return JSON.parse(localStorage.getItem("ss_user")||"null"); }catch{return null;} });

  const [tasks,setTasks]=useState([]);
  const [view,setView]=useState("month");
  const [cur,setCur]=useState(new Date(TODAY));
  const [selDay,setSelDay]=useState(null);
  const [editTask,setEditTask]=useState(null);
  const [newTask,setNewTask]=useState(false);
  const [miniCur,setMiniCur]=useState(new Date(TODAY));
  const [nlp,setNlp]=useState(""); const [nlpPrev,setNlpPrev]=useState(null);
  const [search,setSearch]=useState(""); const [searchOpen,setSearchOpen]=useState(false);

  const setupPushNotifications = async (token) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    } else if (Notification.permission === 'denied') {
      return;
    }
    try {
      const { data } = await axios.get('http://localhost:5000/api/push/vapid-public-key');
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      
      const cachedKey = localStorage.getItem('vapid_public_key');
      if (subscription && cachedKey !== data.publicKey) {
        await subscription.unsubscribe();
        subscription = null;
      }
      
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(data.publicKey) });
        localStorage.setItem('vapid_public_key', data.publicKey);
      }
      await axios.post('http://localhost:5000/api/push/subscribe', { subscription }, { headers: { Authorization: `Bearer ${token}` } });
    } catch(e) { console.error("Push Error", e); }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('ss_token');
      if (!token) return;
      const { data } = await axios.get('http://localhost:5000/api/tasks', { headers: { Authorization: `Bearer ${token}` }});
      setTasks(data.map(t => ({...t, id: t._id, date: new Date(t.date), endDate: new Date(t.endDate)})));
      setupPushNotifications(token);
    } catch (err) { 
      if(err.response?.status===400||err.response?.status===401){localStorage.removeItem('ss_token');localStorage.removeItem('ss_user');setUser(null);}
      console.error(err); 
    }
  };

  useEffect(() => { if (user) fetchTasks(); }, [user]);
  useEffect(()=>{ if(!nlp.trim()){setNlpPrev(null);return;} const p=parseNLP(nlp); setNlpPrev({...p,priority:detectPriority(nlp),category:detectCategory(nlp)}); },[nlp]);

  const apiCall = async (method, url, data) => {
    try {
      const token = localStorage.getItem('ss_token');
      await axios({ method, url: `http://localhost:5000/api/tasks${url}`, data, headers: { Authorization: `Bearer ${token}` }});
      fetchTasks();
    } catch (err) { 
      if(err.response?.status===400||err.response?.status===401){localStorage.removeItem('ss_token');localStorage.removeItem('ss_user');setUser(null);}
      console.error(err); 
    }
  };

  const addTask = async t => { await apiCall('post', '/', { ...t, done: false }); setEditTask(null); setNewTask(false); };
  const saveTask = async t => { if(t.id && String(t.id).length > 10) { await apiCall('put', `/${t.id}`, t); } else { await addTask(t); } setEditTask(null); setNewTask(false); };
  const delTask = async id => { await apiCall('delete', `/${id}`); setEditTask(null); };
  const togTask = async id => { const t = tasks.find(x=>x.id===id); if(t) await apiCall('put', `/${id}`, { done: !t.done }); };
  const snoozeTask = async (id, mins) => { const t = tasks.find(x=>x.id===id); if(t) { const nd = new Date(Date.now() + mins * 60000); const diff = nd - t.date; const ne = new Date(t.endDate.getTime() + diff); await apiCall('put', `/${id}`, { date: nd, endDate: ne }); } };

  function addTopNLP(){ if(!nlp.trim())return; const p=parseNLP(nlp); addTask({title:p.title,date:p.date,endDate:p.endDate,priority:detectPriority(nlp),category:detectCategory(nlp),notes:""}); setNlp(""); setNlpPrev(null); }

  function nav(dir){ const d=new Date(cur); if(view==="month")d.setMonth(d.getMonth()+dir); else d.setDate(d.getDate()+dir*7); setCur(d); }

  const title=view==="month"?`${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`:
    (()=>{ const s=new Date(cur); s.setDate(s.getDate()-s.getDay()); const e=new Date(s); e.setDate(e.getDate()+6); return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${s.getMonth()!==e.getMonth()?MONTHS[e.getMonth()]+" ":""}${e.getDate()}, ${e.getFullYear()}`; })();

  const ft=search?tasks.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())||t.notes?.toLowerCase().includes(search.toLowerCase())):tasks;

  if(!user)return <AuthPage onLogin={u=>{setUser(u);}}/>;

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Google Sans',Arial,sans-serif",color:"#202124",overflow:"hidden",background:"white"}} onClick={()=>{setSearchOpen(false);}}>

      {/* Sidebar */}
      <div style={{width:210,flexShrink:0,borderRight:"1px solid #e0e0e0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 14px 6px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"#1a73e8",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:13}}>S</div>
          <span style={{fontSize:17,fontWeight:400,color:"#3c4043"}}>Scheduler</span>
        </div>
        <div style={{padding:"6px 10px 10px"}}>
          <button onClick={()=>{setNewTask(true);setEditTask(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:24,border:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",background:"white",cursor:"pointer",fontSize:13,color:"#3c4043",width:"100%"}}>
            <span style={{fontSize:18,color:"#1a73e8"}}>+</span>Create
          </button>
        </div>
        <MiniCal cur={miniCur} sel={selDay} tasks={tasks} onSelect={d=>{setSelDay(d);setCur(d);}} onNav={dir=>{const d=new Date(miniCur);d.setMonth(d.getMonth()+dir);setMiniCur(d);}}/>
        <div style={{padding:"0 10px 8px",borderTop:"1px solid #e0e0e0",marginTop:4}}>
          <div style={{fontSize:10,color:"#70757a",fontWeight:500,padding:"8px 4px 5px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Categories</div>
          {Object.entries(CAT).map(([k,v])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 4px"}}>
              <div style={{width:10,height:10,borderRadius:2,background:v.color}}/>
              <span style={{fontSize:12,color:"#3c4043"}}>{v.label}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:"auto",padding:"10px 14px",borderTop:"1px solid #e0e0e0"}}>
          <div style={{fontSize:12,color:"#5f6368",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name||user.email}</div>
          <button onClick={()=>{localStorage.removeItem("ss_token");localStorage.removeItem("ss_user");setUser(null);}} style={{background:"none",border:"1px solid #dadce0",borderRadius:12,padding:"4px 11px",fontSize:12,color:"#5f6368",cursor:"pointer"}}>Sign out</button>
        </div>
      </div>

      {/* Main area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderBottom:"1px solid #e0e0e0",flexShrink:0}}>
          <button style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:18,padding:6,borderRadius:"50%"}}>☰</button>
          <span style={{fontSize:19,fontWeight:400,color:"#3c4043",minWidth:80}}>Smart Scheduler</span>

          {/* NLP Quick-add */}
          <div style={{flex:1,maxWidth:480,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",background:"#f1f3f4",borderRadius:24,padding:"7px 14px",gap:7}}>
              <span style={{color:"#9aa0a6",fontSize:14}}>✦</span>
              <input value={nlp} onChange={e=>setNlp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTopNLP()}
                placeholder='Quick add: "Submit report tomorrow at 5pm for 1hr"'
                style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:13,color:"#202124",fontFamily:"inherit"}}/>
              {nlp&&<button onClick={addTopNLP} style={{background:"#1a73e8",color:"white",border:"none",borderRadius:12,padding:"3px 10px",fontSize:12,cursor:"pointer"}}>Add</button>}
            </div>
            {nlpPrev&&(
              <div style={{position:"absolute",top:40,left:0,right:0,background:"white",border:"1px solid #dadce0",borderRadius:8,padding:"8px 13px",fontSize:12,zIndex:50,boxShadow:"0 2px 10px rgba(0,0,0,0.1)"}}>
                <span style={{color:CAT[nlpPrev.category].color,fontWeight:500}}>{nlpPrev.title}</span>
                {" · "}{fmtShort(nlpPrev.date)} {fmtTime(nlpPrev.date)}–{fmtTime(nlpPrev.endDate)}
                {" · "}<span style={{color:PRI[nlpPrev.priority].color}}>{PRI[nlpPrev.priority].label}</span>
                {" · "}{CAT[nlpPrev.category].label}
              </div>
            )}
          </div>

          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setSearchOpen(!searchOpen)} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:17,padding:"5px 8px",borderRadius:"50%"}}>🔍</button>
              {searchOpen&&(
                <div style={{position:"absolute",right:0,top:38,background:"white",border:"1px solid #dadce0",borderRadius:8,boxShadow:"0 4px 14px rgba(0,0,0,0.12)",zIndex:200,width:260}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus placeholder="Search events…"
                    style={{width:"100%",padding:"10px 13px",border:"none",borderRadius:8,outline:"none",fontSize:13,boxSizing:"border-box",fontFamily:"inherit"}}/>
                  {search&&<div style={{maxHeight:200,overflowY:"auto"}}>
                    {ft.length===0?<div style={{padding:"12px 13px",fontSize:13,color:"#80868b"}}>No results</div>:ft.map(t=>(
                      <div key={t.id} onClick={()=>{setEditTask(t);setSearchOpen(false);setSearch("");}} style={{padding:"8px 13px",cursor:"pointer",borderTop:"1px solid #f1f3f4",display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{width:8,height:8,borderRadius:2,background:CAT[t.category].color,flexShrink:0}}/>
                        <div><div style={{fontSize:13,color:"#202124"}}>{t.title}</div><div style={{fontSize:11,color:"#80868b"}}>{fmtShort(t.date)}</div></div>
                      </div>
                    ))}
                  </div>}
                </div>
              )}
            </div>
            <NotifBell tasks={tasks} onDismiss={togTask} onSnooze={snoozeTask} />
            <div style={{width:30,height:30,borderRadius:"50%",background:"#1a73e8",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {(user.name||user.email||"U")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Calendar toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderBottom:"1px solid #e0e0e0",flexShrink:0}}>
          <button onClick={()=>{setCur(new Date(TODAY));}} style={{border:"1px solid #dadce0",borderRadius:6,padding:"6px 14px",background:"white",fontSize:13,cursor:"pointer",color:"#3c4043",fontFamily:"inherit"}}>Today</button>
          <button onClick={()=>nav(-1)} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:20,padding:"3px 7px",borderRadius:"50%"}}>‹</button>
          <button onClick={()=>nav(1)} style={{background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:20,padding:"3px 7px",borderRadius:"50%"}}>›</button>
          <span style={{fontSize:18,fontWeight:400,color:"#3c4043",flex:1}}>{title}</span>
          <div style={{display:"flex",border:"1px solid #dadce0",borderRadius:6,overflow:"hidden"}}>
            {["month","week"].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",border:"none",background:view===v?"#e8f0fe":"white",color:view===v?"#1a73e8":"#3c4043",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:view===v?500:400}}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar body */}
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>
          {view==="month"
            ?<MonthView cur={cur} tasks={ft} onDay={d=>setSelDay(d)} onEvent={t=>setEditTask(t)}/>
            :<WeekView cur={cur} tasks={ft} onDay={d=>setSelDay(d)} onEvent={t=>setEditTask(t)}/>}
        </div>
      </div>

      {selDay&&<DayPanel date={selDay} tasks={ft} onClose={()=>setSelDay(null)} onAdd={addTask} onToggle={togTask} onDelete={delTask} onEdit={t=>setEditTask(t)}/>}
      {(editTask||newTask)&&<TaskModal task={editTask||null} onSave={saveTask} onClose={()=>{setEditTask(null);setNewTask(false);}} onDelete={delTask}/>}
      <AgentChat onRefresh={fetchTasks} />
    </div>
  );
}
