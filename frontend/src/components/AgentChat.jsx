import { useState, useRef, useEffect } from "react";
import axios from "axios";

const ACCENT = "#1a73e8";
const GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

// Typing indicator with animated dots
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 16px", alignItems: "center" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", flexShrink: 0 }}>✦</div>
      <div style={{ display: "flex", gap: 3, marginLeft: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7, height: 7, borderRadius: "50%", background: "#adb5bd",
              animation: `agentBounce 1.2s infinite ease-in-out`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Single chat message bubble
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start" }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "white", flexShrink: 0, marginTop: 2 }}>✦</div>
      )}
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? ACCENT : "#f1f3f4",
          color: isUser ? "white" : "#202124",
          fontSize: 13,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          boxShadow: isUser ? "0 1px 3px rgba(26,115,232,0.3)" : "none",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// Suggestion chips shown initially
function SuggestionChips({ onSelect }) {
  const suggestions = [
    "📅 What's on my schedule this week?",
    "➕ Schedule a meeting tomorrow at 2pm",
    "⏭️ Postpone all tasks by 1 day",
    "🔄 Clone this month to next month",
    "🗑️ Cancel all meetings today",
    "⭐ Mark all deadlines as high priority",
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0" }}>
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.replace(/^[\p{Emoji}\s]+/u, "").trim())}
          style={{
            padding: "7px 12px",
            borderRadius: 20,
            border: "1px solid #dadce0",
            background: "white",
            fontSize: 12,
            color: "#3c4043",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#e8f0fe";
            e.target.style.borderColor = ACCENT;
            e.target.style.color = ACCENT;
          }}
          onMouseOut={(e) => {
            e.target.style.background = "white";
            e.target.style.borderColor = "#dadce0";
            e.target.style.color = "#3c4043";
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default function AgentChat({ onRefresh }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput("");
    setHasError(false);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("ss_token");
      const { data } = await axios.post(
        "http://localhost:5000/api/agent/chat",
        { message: msg },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // If the agent mutated data, refresh the calendar
      if (data.shouldRefresh && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Agent chat error:", err);
      const errorMsg =
        err.response?.data?.error || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${errorMsg}` }]);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      const token = localStorage.getItem("ss_token");
      await axios.post(
        "http://localhost:5000/api/agent/clear",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) { /* ignore */ }
    setMessages([]);
    setHasError(false);
  };

  return (
    <>
      {/* Inject keyframe animations */}
      <style>{`
        @keyframes agentBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes agentSlideIn {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes agentFabPulse {
          0% { box-shadow: 0 4px 20px rgba(102,126,234,0.4); }
          50% { box-shadow: 0 4px 30px rgba(118,75,162,0.6); }
          100% { box-shadow: 0 4px 20px rgba(102,126,234,0.4); }
        }
      `}</style>

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: GRADIENT,
          border: "none",
          color: "white",
          fontSize: 24,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "agentFabPulse 3s infinite ease-in-out",
          transition: "transform 0.3s ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
        title="TaskFlow AI Agent"
      >
        {open ? "+" : "✦"}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: 400,
            height: 560,
            borderRadius: 16,
            background: "white",
            boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9998,
            animation: "agentSlideIn 0.3s ease-out",
            fontFamily: "'Google Sans', Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: GRADIENT,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "white",
              }}
            >
              ✦
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontSize: 15, fontWeight: 600 }}>
                TaskFlow AI
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                Your intelligent calendar assistant
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear conversation"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "white",
                borderRadius: "50%",
                width: 30,
                height: 30,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🗑
            </button>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px 8px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "16px 0 10px" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✦</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#202124", marginBottom: 4 }}>
                  Hi! I'm your AI assistant
                </div>
                <div style={{ fontSize: 12, color: "#5f6368", marginBottom: 14, lineHeight: 1.5 }}>
                  I can help you manage your schedule. Try one of these:
                </div>
                <SuggestionChips onSelect={sendMessage} />
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
          </div>

          {/* Input area */}
          <div
            style={{
              padding: "10px 14px 14px",
              borderTop: "1px solid #e8eaed",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f3f4",
                borderRadius: 24,
                padding: "4px 6px 4px 16px",
                gap: 6,
                transition: "box-shadow 0.2s",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask me anything about your schedule..."
                disabled={loading}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 13,
                  color: "#202124",
                  fontFamily: "inherit",
                  padding: "8px 0",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: input.trim() ? ACCENT : "#dadce0",
                  color: "white",
                  fontSize: 16,
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                ➤
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#9aa0a6", textAlign: "center", marginTop: 6 }}>
              Powered by GPT-4o · TaskFlow AI Agent
            </div>
          </div>
        </div>
      )}
    </>
  );
}
