import * as chrono from "chrono-node";

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function parseNLP(input) {
  const text = input.toLowerCase();
  const parsed = chrono.parse(input);
  let date = new Date();
  
  if (parsed.length === 0 || !parsed[0].start.isCertain('hour')) {
    date.setHours(9, 0, 0, 0); // Default to 9 AM if no time mentioned
  }
  
  if (parsed.length > 0) {
    const pDate = parsed[0].start.date();
    if (pDate) date = pDate;
  }
  
  let duration = 60;
  let endDate = new Date(date.getTime() + 60*60000);
  
  if (parsed.length > 0 && parsed[0].end) {
    endDate = parsed[0].end.date();
    duration = (endDate - date) / 60000;
  }
  
  // Custom duration logic "for 2 hours"
  const durM = text.match(/\bfor (\d+(?:\.\d+)?)\s*(hour|hr|minute|min)s?\b/);
  if (durM) {
    const v = parseFloat(durM[1]);
    duration = durM[2].startsWith("hour") || durM[2].startsWith("hr") ? v * 60 : v;
    endDate = new Date(date.getTime() + duration*60000);
  }

  let title = input;
  if (parsed.length > 0) {
    title = title.replace(parsed[0].text, "");
  }
  if (durM) {
    title = title.replace(durM[0], "");
  }
  title = title.replace(/at \d{1,2}(?::\d{2})?\s*(am|pm)?/gi, ""); // strip manual time if left behind
  title = title.replace(/\s+/g, " ").trim();
  
  if (!title) title = input;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, date, endDate, duration };
}

export function detectPriority(t){ const s=t.toLowerCase(); return /urgent|asap|critical|immediately|important|deadline|must/.test(s)?"high":/meeting|presentation|submit|review|call|interview|exam/.test(s)?"medium":"low"; }
export function detectCategory(t){ const s=t.toLowerCase(); return /meeting|call|interview|standup|sync|conf/.test(s)?"meeting":/submit|assignment|exam|study|review|report|class|lecture/.test(s)?"academic":/gym|run|walk|exercise|workout|yoga/.test(s)?"health":/buy|shop|order|pay|bill|bank|groceries/.test(s)?"personal":/lunch|dinner|breakfast|coffee|eat|food/.test(s)?"social":"task"; }

export const CAT={
  meeting: {color:"#1a73e8",light:"#e8f0fe",label:"Meeting"},
  academic:{color:"#0f9d58",light:"#e6f4ea",label:"Academic"},
  health:  {color:"#f9ab00",light:"#fef7e0",label:"Health"},
  personal:{color:"#9c27b0",light:"#f3e5f5",label:"Personal"},
  social:  {color:"#e91e63",light:"#fce4ec",label:"Social"},
  task:    {color:"#455a64",light:"#eceff1",label:"Task"},
};
export const PRI={
  high:  {color:"#d93025",bg:"#fce8e6",label:"High"},
  medium:{color:"#f29900",bg:"#fef7e0",label:"Medium"},
  low:   {color:"#0f9d58",bg:"#e6f4ea",label:"Low"},
};

export const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const TODAY=new Date();

export function sameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
export function daysInMonth(d){ return new Date(d.getFullYear(),d.getMonth()+1,0).getDate(); }
export function fmtTime(d){ return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }
export function fmtShort(d){ return d.toLocaleDateString([],{month:"short",day:"numeric"}); }
