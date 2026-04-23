const CAT = {
    meeting: { color: "#1a73e8", light: "#e8f0fe", label: "Meeting" },
    academic: { color: "#0f9d58", light: "#e6f4ea", label: "Academic" },
    health: { color: "#f9ab00", light: "#fef7e0", label: "Health" },
    personal: { color: "#9c27b0", light: "#f3e5f5", label: "Personal" },
    social: { color: "#e91e63", light: "#fce4ec", label: "Social" },
    task: { color: "#455a64", light: "#eceff1", label: "Task" },
};

const PRI = {
    high: { color: "#d93025", bg: "#fce8e6", label: "High" },
    medium: { color: "#f29900", bg: "#fef7e0", label: "Medium" },
    low: { color: "#0f9d58", bg: "#e6f4ea", label: "Low" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = new Date();

function sameDay(a, b) {
    if (!a || !b) return false;
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
}

function daysInMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function fmtTime(d) {
    return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtShort(d) {
    return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
}

function parseNLP(input) {
    const text = input.toLowerCase();
    // Chrono assumes it's loaded globally via CDN
    const parsed = typeof chrono !== 'undefined' ? chrono.parse(input) : [];
    let date = new Date();

    if (parsed.length === 0 || !parsed[0].start.isCertain('hour')) {
        date.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    if (parsed.length > 0) {
        const pDate = parsed[0].start.date();
        if (pDate) date = pDate;
    }

    let duration = 60;
    let endDate = new Date(date.getTime() + 60 * 60000);

    if (parsed.length > 0 && parsed[0].end) {
        endDate = parsed[0].end.date();
        duration = (endDate - date) / 60000;
    }

    const durM = text.match(/\bfor (\d+(?:\.\d+)?)\s*(hour|hr|minute|min)s?\b/);
    if (durM) {
        const v = parseFloat(durM[1]);
        duration = durM[2].startsWith("hour") || durM[2].startsWith("hr") ? v * 60 : v;
        endDate = new Date(date.getTime() + duration * 60000);
    }

    let title = input;
    if (parsed.length > 0) {
        title = title.replace(parsed[0].text, "");
    }
    if (durM) {
        title = title.replace(durM[0], "");
    }
    title = title.replace(/at \d{1,2}(?::\d{2})?\s*(am|pm)?/gi, "");
    title = title.replace(/\s+/g, " ").trim();

    if (!title) title = input;
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return { title, date, endDate, duration };
}

function detectPriority(t) {
    const s = t.toLowerCase();
    return /urgent|asap|critical|immediately|important|deadline|must/.test(s) ? "high" : /meeting|presentation|submit|review|call|interview|exam/.test(s) ? "medium" : "low";
}

function detectCategory(t) {
    const s = t.toLowerCase();
    return /meeting|call|interview|standup|sync|conf/.test(s) ? "meeting" : /submit|assignment|exam|study|review|report|class|lecture/.test(s) ? "academic" : /gym|run|walk|exercise|workout|yoga/.test(s) ? "health" : /buy|shop|order|pay|bill|bank|groceries/.test(s) ? "personal" : /lunch|dinner|breakfast|coffee|eat|food/.test(s) ? "social" : "task";
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
