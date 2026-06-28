import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, Minimize2, Maximize2, Loader } from 'lucide-react';
import './AICopilot.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const CANNED_RESPONSES: Record<string, string> = {
  default: "I'm analyzing the current plant state. Based on real-time sensor data, the highest risk area is Zone F - Tank Farm where O₂ levels have dropped to 18.2%. Worker Suresh Kumar is currently non-compliant with PPE requirements in a confined space. I recommend immediate intervention.",
  risk: "Current compound risk score is 68/100. The primary risk drivers are:\n\n1. **O₂ Deficiency (Zone F)** — 18.2%, below 19.5% threshold\n2. **PPE Non-Compliance** — Worker W004 in confined space without proper equipment\n3. **H₂S Rising** — 8.4 ppm, approaching 10 ppm threshold in Zone A\n4. **CO Elevation** — 23.1 ppm in Zone B, nearing 25 ppm limit\n\nPredicted escalation to CRITICAL within 23 minutes if no action taken.",
  permit: "Active permits status:\n\n• **PTW-2024-0042** (Critical) — Confined space permit, 62% compliance. Recommend suspension.\n• **PTW-2024-0043** (High) — Compressor maintenance, worker W003 has partial PPE.\n• **PTW-2024-0041** (High) — Blast furnace tapping, all conditions currently met.\n\nNo expired permits in critical areas. 1 pending permit awaiting supervisor approval.",
  sensor: "Sensor analysis across 12 active monitors:\n\n🔴 **Critical:** S007 (O₂) — 18.2%, below safety threshold\n🟡 **Warning:** S001 (H₂S) — 8.4 ppm, trending up\n🟡 **Warning:** S002 (CO) — 23.1 ppm, trending up\n🟡 **Warning:** S006 (Vibration) — 7.8 mm/s\n\n11/12 sensors online. Compressor C3 vibration has increased 12% in the last 30 minutes.",
  worker: "Worker risk assessment:\n\n🔴 **Suresh Kumar (W004)** — Critical risk. Confined space, O₂ deficient, PPE non-compliant.\n🟡 **Arjun Sharma (W001)** — High risk. H₂S environment, temperature elevated.\n🟡 **Deepak Verma (W003)** — High risk. Partial PPE in maintenance task.\n⚪ **5 others** — Low to medium risk, within safety parameters.",
};

function getResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('risk') || lower.includes('danger') || lower.includes('safe')) return CANNED_RESPONSES.risk;
  if (lower.includes('permit') || lower.includes('ptw') || lower.includes('work')) return CANNED_RESPONSES.permit;
  if (lower.includes('sensor') || lower.includes('gas') || lower.includes('temp') || lower.includes('co') || lower.includes('h2s')) return CANNED_RESPONSES.sensor;
  if (lower.includes('worker') || lower.includes('person') || lower.includes('ppe') || lower.includes('staff')) return CANNED_RESPONSES.worker;
  return CANNED_RESPONSES.default;
}

const AICopilot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "**ISIP AI Copilot** active.\n\nI'm monitoring all plant systems in real-time. Current status: **2 critical alerts** require immediate attention in Zone F. Ask me anything about plant safety, sensor readings, worker status, or permits.",
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getResponse(userMsg.content),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
      setLoading(false);
    }, 1200 + Math.random() * 800);
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const quickPrompts = ['Current risk summary', 'Active permits status', 'Critical workers', 'Sensor alerts'];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button className="copilot-fab" onClick={() => setOpen(true)} id="ai-copilot-btn">
          <Brain size={20} />
          <span className="copilot-fab-badge">2</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className={`copilot-panel ${expanded ? 'expanded' : ''}`}>
          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-header-left">
              <div className="copilot-brain-icon">
                <Brain size={14} />
              </div>
              <div>
                <div className="copilot-title">AI Safety Copilot</div>
                <div className="copilot-subtitle">
                  <span className="pulse-dot success" style={{width: 5, height: 5}} />
                  <span>Monitoring 12 sensors · 8 workers</span>
                </div>
              </div>
            </div>
            <div className="copilot-header-actions">
              <button className="copilot-action-btn" onClick={() => setExpanded(e => !e)}>
                {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button className="copilot-action-btn" onClick={() => setOpen(false)}>
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="copilot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`copilot-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="msg-avatar ai">
                    <Brain size={10} />
                  </div>
                )}
                <div className="msg-bubble">
                  <div
                    className="msg-content"
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  <div className="msg-time">{msg.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="copilot-message assistant">
                <div className="msg-avatar ai">
                  <Brain size={10} />
                </div>
                <div className="msg-bubble">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          <div className="copilot-quick-prompts">
            {quickPrompts.map(p => (
              <button key={p} className="quick-prompt" onClick={() => { setInput(p); }}>
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="copilot-input-area">
            <input
              className="copilot-input"
              placeholder="Ask about plant safety..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              id="copilot-input"
            />
            <button
              className={`copilot-send ${input.trim() ? 'active' : ''}`}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              {loading ? <Loader size={14} className="spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AICopilot;
