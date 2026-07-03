import React, { useState, useRef, useEffect } from 'react';
import {
  Brain, X, Send, Minimize2, Maximize2, Loader,
  AlertTriangle, Users, Activity, FileText, Mic, MicOff,
  ShieldAlert, Thermometer, Wind, Zap, CheckCircle2
} from 'lucide-react';
import './AICopilot.css';

interface ActionButton {
  label: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  icon?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  actions?: ActionButton[];
  isAlert?: boolean;
}

// ─── Canned Responses ────────────────────────────────────────────────────────

const RESPONSES = {
  greeting: {
    text: "Hello! I'm your ISIP AI Safety Copilot, actively monitoring all plant systems.\n\nCurrently tracking:\n• **12 sensors** across 9 zones\n• **8 workers** on morning shift\n• **5 active permits**\n• **2 critical alerts** require immediate action\n\nHow can I help you today?",
    actions: [
      { label: 'Show critical alerts', type: 'danger' as const },
      { label: 'Risk summary', type: 'warning' as const },
    ]
  },

  risk: {
    text: "**Current Risk Score: 68/100 — HIGH**\n\nTop compound risk factors:\n\n🔴 **CRITICAL — Zone F (Tank Farm)**\nO₂ at 18.2% + confined space + PPE non-compliance. Escalation probability: 87% within 8 minutes.\n\n🟡 **HIGH — Zone A (Blast Furnace)**\nH₂S at 8.4 ppm (↑38% in 2h) + temperature trending to 1487°C. Estimated 35 min to threshold breach.\n\n🟡 **MEDIUM — Zone B (Converter)**\nCO at 23.1 ppm, approaching 25 ppm threshold. Ventilation at 72% capacity.\n\n**AI Prediction:** Without intervention, risk score reaches 85+ within 20 minutes.",
    actions: [
      { label: '🚨 Evacuate Zone F', type: 'danger' as const },
      { label: 'Boost ventilation Zone A', type: 'warning' as const },
      { label: 'View AI Risk Center', type: 'info' as const },
    ]
  },

  zone_f: {
    text: "⚠️ **Zone F — Tank Farm: CRITICAL STATUS**\n\nActive issues:\n• O₂ level: **18.2%** (threshold: 19.5%) — BELOW SAFE LIMIT\n• Worker W004 (Suresh Kumar) inside Tank T-14 — confined space\n• PPE status: **NON-COMPLIANT** — missing SCBA\n• Permit PTW-2024-0042 compliance: **62%** (required: 80%)\n• Rescue team: **NOT on standby** ← critical gap\n\n**AI Recommendation:** Immediate evacuation required. O₂ is still declining at ~0.2%/min. At current rate, IDLH threshold (16%) reached in ~11 minutes.",
    actions: [
      { label: '🚨 Evacuate Zone F NOW', type: 'danger' as const },
      { label: 'Suspend PTW-2024-0042', type: 'danger' as const },
      { label: 'Alert rescue team', type: 'warning' as const },
    ]
  },

  zone_a: {
    text: "🟡 **Zone A — Blast Furnace: HIGH RISK**\n\nCurrent conditions:\n• H₂S: **8.4 ppm** (threshold: 10 ppm) — trending UP ↑\n• Temperature: **1,487°C** (threshold: 1,500°C) — trending UP ↑\n• Worker W001 (Arjun Sharma) active — tapping operation\n• Permit PTW-2024-0041 compliance: **91%** — satisfactory\n• Cooling flow: 420 L/min — normal\n\n**AI Prediction:** At current trajectory, H₂S will breach threshold in ~35 minutes. Temperature may cross 1,500°C within 45 minutes.",
    actions: [
      { label: 'Alert worker W001', type: 'warning' as const },
      { label: 'Increase ventilation 40%', type: 'warning' as const },
      { label: 'View Sensor S001', type: 'info' as const },
    ]
  },

  sensor: {
    text: "**Sensor Network Status — 11/12 Online**\n\n🔴 **S007** — O₂, Zone F: 18.2% (CRITICAL ↓)\n🟡 **S001** — H₂S, Zone A: 8.4 ppm (WARNING ↑)\n🟡 **S002** — CO, Zone B: 23.1 ppm (WARNING ↑)\n🟡 **S003** — Temp, Zone A: 1,487°C (WARNING ↑)\n🟡 **S006** — Vibration, Zone E: 7.8 mm/s (WARNING ↑)\n🟡 **S012** — H₂, Zone I: 0.4% (WARNING ↑)\n\n✅ **S004** — Pressure, Zone C: 12.8 bar (NORMAL)\n✅ **S005** — SO₂, Zone D: 4.2 mg/m³ (NORMAL)\n✅ **S008** — Flame, Zone G: 342°C (NORMAL)\n✅ **S009** — CH₄, Zone H: 1.8% LEL (NORMAL)\n✅ **S010** — Flow, Zone A: 420 L/min (NORMAL)\n✅ **S011** — Pressure, Zone G: 28.6 bar (NORMAL)",
    actions: [
      { label: 'View Sensor Monitor', type: 'info' as const },
      { label: 'Export sensor report', type: 'success' as const },
    ]
  },

  worker: {
    text: "**Worker Risk Assessment — 8 Active**\n\n🔴 **W004 — Suresh Kumar** (Process Operator)\nZone F | Critical | PPE: Non-compliant | Heart Rate: 105 bpm ⚠️\n\n🟡 **W001 — Arjun Sharma** (Furnace Operator)\nZone A | High | PPE: Compliant | Exposure: 7.2 ppm H₂S\n\n🟡 **W003 — Deepak Verma** (Maintenance Tech)\nZone E | High | PPE: Partial (missing face shield) | Vibration risk\n\n🟡 **W007 — Rajesh Nair** (Crane Operator)\nZone G | Medium | Working at height | Buddy system incomplete\n\n✅ **4 others** — Low to medium risk, within safety parameters",
    actions: [
      { label: 'View Worker Monitor', type: 'info' as const },
      { label: 'Alert all high-risk workers', type: 'warning' as const },
    ]
  },

  permit: {
    text: "**Active Permit-to-Work Status — 5 Active**\n\n🔴 **PTW-2024-0042** — Confined Space (Zone F)\nCompliance: 62% | Worker: W004 | Status: AT RISK\n\n🟡 **PTW-2024-0043** — Electrical (Zone E)\nCompliance: 78% | Worker: W003 | Status: Monitor\n\n✅ **PTW-2024-0041** — Hot Work (Zone A)\nCompliance: 91% | Worker: W001 | Status: Active\n\n✅ **PTW-2024-0044** — Electrical (Zone G)\nCompliance: 96% | Worker: W005 | Status: Active\n\n✅ **PTW-2024-0045** — Working at Height (Zone G)\nCompliance: 88% | Worker: W007 | Status: Active\n\n⏳ **PTW-2024-0046** — Hot Work (Zone C) | Status: Pending approval",
    actions: [
      { label: 'Suspend PTW-2024-0042', type: 'danger' as const },
      { label: 'View all permits', type: 'info' as const },
    ]
  },

  compliance: {
    text: "**Regulatory Compliance Status**\n\n✅ IS 13947 — Electrical Isolation: PASS\n✅ OISD-GDN-206 — Gas Detection: PASS (12/12 sensors)\n✅ IS 15683 — Fire Protection: PASS\n✅ EPA — Stack Emissions: PASS (SO₂ 4.2 mg/m³)\n✅ PESO — Explosive Atmosphere: PASS\n\n❌ Factory Act 1948 — PPE Compliance: **FAIL**\nWorkers W004 (non-compliant) and W003 (partial)\n\n❌ OISD-STD-105 — Permit to Work: **FAIL**\nPTW-0042 at 62%, below 80% required threshold\n\n⚠️ OISD-GDN-169 — Confined Space: **WARNING**\nO₂ monitoring active but rescue team not on standby\n\n**Overall Compliance Score: 73/100**",
    actions: [
      { label: 'View Compliance Center', type: 'info' as const },
      { label: 'Generate compliance report', type: 'success' as const },
    ]
  },

  evacuation: {
    text: "🚨 **EVACUATION PROTOCOL — Zone F Initiated**\n\nActions being triggered:\n1. ✅ Alert sent to Worker W004 (Suresh Kumar) — wearable buzz + visual\n2. ✅ Supervisor Priya Singh notified\n3. ✅ Permit PTW-2024-0042 flagged for suspension\n4. ✅ Rescue team paged to Zone F staging area\n5. ✅ Timeline event logged at " + new Date().toLocaleTimeString() + "\n\n⏱️ Expected evacuation time: ~3 minutes\n\n**Next steps after evacuation:**\n• Investigate O₂ source (likely inert gas purge from Tank T-14)\n• Do NOT re-enter until O₂ stabilizes above 19.5% for 15+ min\n• Complete post-incident review within 24h",
    actions: [
      { label: '✅ Mark Zone F evacuated', type: 'success' as const },
      { label: 'Open incident report', type: 'info' as const },
    ]
  },

  prediction: {
    text: "**AI Predictive Analysis — Next 8 Hours**\n\n📈 Risk trajectory (if no action taken):\n• Now: **68** → 2h: **74** → 4h: **79** → 6h: **83** → 8h: **87**\n\nKey predicted events:\n• H₂S in Zone A likely to breach 10 ppm threshold in **~35 min**\n• Furnace temperature projected to hit 1,500°C in **~45 min**\n• Compressor C3 vibration may trigger auto-shutdown in **~2 hours**\n• Afternoon shift change at 14:00 — expect 20% worker count increase\n\n**AI Confidence: 78%** (based on 24h sensor trend analysis)",
    actions: [
      { label: 'View AI Risk Center', type: 'info' as const },
      { label: 'Schedule preventive action', type: 'warning' as const },
    ]
  },

  emergency: {
    text: "🚨 **EMERGENCY RESPONSE GUIDE**\n\nFor immediate assistance:\n\n**Gas Leak / O₂ Deficiency:**\n→ Evacuate zone immediately\n→ Activate ventilation override\n→ Call Plant Emergency: Ext. 911\n\n**Worker Distress:**\n→ Send rescue team to GPS coordinates\n→ Notify medical station\n→ Document in incident log\n\n**Equipment Failure:**\n→ Activate emergency shutdown (ESD)\n→ Isolate affected equipment\n→ Notify maintenance supervisor\n\n**Current active emergencies: Zone F (O₂ Critical)**",
    actions: [
      { label: '🚨 Trigger emergency alert', type: 'danger' as const },
      { label: 'Call safety supervisor', type: 'warning' as const },
    ]
  },

  default: {
    text: "I'm analyzing current plant data to answer your query.\n\nBased on real-time monitoring across all 9 zones, here's what I can tell you:\n\n• **Highest priority:** Zone F — O₂ deficiency and PPE violation require immediate action\n• **Watch closely:** Zone A — H₂S and temperature both trending upward\n• **Overall risk:** 68/100 and rising\n\nCould you be more specific? Try asking about:\n*sensors, workers, permits, risk, compliance, Zone F, evacuation, or predictions*",
    actions: [
      { label: 'Risk summary', type: 'warning' as const },
      { label: 'Zone F status', type: 'danger' as const },
      { label: 'Worker status', type: 'info' as const },
    ]
  }
};

function getResponse(msg: string): { text: string; actions: { label: string; type: 'info' | 'warning' | 'danger' | 'success' }[] } {
  const l = msg.toLowerCase();

  if (l.match(/\b(hi|hello|hey|greet|start|help|what can)\b/)) return RESPONSES.greeting;
  if (l.match(/\b(evacuate|evacuation|evac)\b/)) return RESPONSES.evacuation;
  if (l.match(/\b(emergency|sos|mayday|urgent)\b/)) return RESPONSES.emergency;
  if (l.match(/\b(predict|forecast|future|next|trend|trajectory)\b/)) return RESPONSES.prediction;
  if (l.match(/\b(zone.?f|tank.?farm|t-?14|o2|oxygen|o₂|confined)\b/)) return RESPONSES.zone_f;
  if (l.match(/\b(zone.?a|blast.?furnace|h2s|h₂s|hydrogen.?sulfide)\b/)) return RESPONSES.zone_a;
  if (l.match(/\b(risk|danger|score|safe|hazard|compound)\b/)) return RESPONSES.risk;
  if (l.match(/\b(sensor|gas|temp|co\b|ch4|so2|vibrat|flow|pressure|ppm|reading)\b/)) return RESPONSES.sensor;
  if (l.match(/\b(worker|person|ppe|staff|employee|suresh|arjun|deepak|w00[0-9]|biometric|heart.?rate)\b/)) return RESPONSES.worker;
  if (l.match(/\b(permit|ptw|work.?order|hot.?work|electrical|height|chemical)\b/)) return RESPONSES.permit;
  if (l.match(/\b(compliance|regulation|iso|oisd|epa|factory.?act|audit|law)\b/)) return RESPONSES.compliance;

  return RESPONSES.default;
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are ISIP AI Safety Copilot, an expert industrial safety AI embedded in a real-time plant monitoring dashboard for a steel manufacturing facility.

Current plant status:
- 12 sensors monitoring across 9 zones
- 8 workers on morning shift
- 5 active permits
- CRITICAL: Zone F has O₂ at 18.2% (below 19.5% threshold), worker W004 in confined space, PPE non-compliant
- HIGH: Zone A has H₂S at 8.4 ppm (threshold 10 ppm), temperature at 1487°C (threshold 1500°C)
- MEDIUM: Zone B has CO at 23.1 ppm (threshold 25 ppm)
- Overall plant risk score: 68/100

Relevant standards: OISD, IS 13947, Factory Act 1948, EPA emissions standards.

Respond concisely (under 150 words), using safety-focused language. Use emojis (🔴🟡✅⚠️) for severity indicators. Format key numbers in **bold**. Always end with a concrete recommendation.`;

async function callGemini(userMessage: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.4 }
        })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const quickPrompts = [
  { label: '🔴 Zone F status', query: 'What is the status of Zone F?' },
  { label: '⚠️ Risk summary', query: 'Give me a full risk summary' },
  { label: '👷 Worker status', query: 'What is the worker risk assessment?' },
  { label: '📋 Permits', query: 'Show me all active permits' },
  { label: '📊 Sensors', query: 'Show sensor network status' },
  { label: '🔮 Predict', query: 'What is the risk prediction for next 8 hours?' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AICopilot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "**ISIP AI Copilot** active and monitoring.\n\n🔴 **2 critical alerts** require immediate attention:\n• Zone F — O₂ deficiency (18.2%) with worker inside confined space\n• Worker W004 — PPE non-compliant in hazardous area\n\nAsk me anything or tap a quick action below.",
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '🚨 Evacuate Zone F', type: 'danger' },
        { label: '⚠️ Risk summary', type: 'warning' },
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [usingGemini, setUsingGemini] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if Gemini API key is available
  useEffect(() => {
    setUsingGemini(!!GEMINI_API_KEY);
  }, []);

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Try Gemini first, fall back to canned
    let responseText: string | null = null;
    let cannedData = getResponse(text);

    if (GEMINI_API_KEY) {
      responseText = await callGemini(text);
    }

    const reply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText ?? cannedData.text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      // Always show action buttons — from canned data even if Gemini responded
      actions: cannedData.actions,
    };

    setMessages(prev => [...prev, reply]);
    setLoading(false);
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const getActionClass = (type: ActionButton['type']) => {
    const map = { danger: 'action-danger', warning: 'action-warning', success: 'action-success', info: 'action-info' };
    return map[type];
  };

  const handleAction = (label: string) => {
    // Map action buttons to queries
    const actionMap: Record<string, string> = {
      '🚨 Evacuate Zone F NOW': 'Initiate evacuation of Zone F',
      '🚨 Evacuate Zone F': 'Initiate evacuation of Zone F',
      '⚠️ Risk summary': 'Give me a full risk summary',
      'Risk summary': 'Give me a full risk summary',
      'Zone F status': 'What is the status of Zone F?',
      'View AI Risk Center': 'What is the AI risk analysis?',
      'View Worker Monitor': 'Show me worker risk assessment',
      'View Sensor Monitor': 'Show me all sensor readings',
      'View all permits': 'Show me all active permits',
      'Suspend PTW-2024-0042': 'What happens if we suspend permit PTW-2024-0042?',
      'Alert rescue team': 'How do I alert the rescue team for Zone F?',
      'Boost ventilation Zone A': 'What ventilation action is needed for Zone A?',
      'Alert worker W001': 'Alert worker Arjun Sharma in Zone A',
      'Show critical alerts': 'Show me all critical alerts',
      'Alert all high-risk workers': 'How do I alert all high-risk workers?',
    };
    const query = actionMap[label] || label;
    sendMessage(query);
  };

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
                  <span className="pulse-dot success" style={{ width: 5, height: 5 }} />
                  <span>
                    {usingGemini ? '✦ Gemini AI · Live' : 'Smart Assist · 12 sensors · 8 workers'}
                  </span>
                </div>
              </div>
            </div>
            <div className="copilot-header-actions">
              <button className="copilot-action-btn" onClick={() => setExpanded(e => !e)} title={expanded ? 'Minimize' : 'Expand'}>
                {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button className="copilot-action-btn" onClick={() => setOpen(false)} title="Close">
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
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="msg-actions">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          className={`msg-action-btn ${getActionClass(action.type)}`}
                          onClick={() => handleAction(action.label)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
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
              <button
                key={p.query}
                className="quick-prompt"
                onClick={() => sendMessage(p.query)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="copilot-input-area">
            <button
              className={`copilot-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <input
              className="copilot-input"
              placeholder={isListening ? '🎤 Listening...' : 'Ask about plant safety...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              id="copilot-input"
            />
            <button
              className={`copilot-send ${input.trim() ? 'active' : ''}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading ? <Loader size={14} className="spin" /> : <Send size={14} />}
            </button>
          </div>

          {/* API mode indicator */}
          <div className="copilot-footer">
            {usingGemini
              ? <span className="footer-gemini">✦ Powered by Gemini AI</span>
              : <span className="footer-smart">💡 Smart Assist mode · Set VITE_GEMINI_API_KEY to enable Gemini</span>
            }
          </div>
        </div>
      )}
    </>
  );
};

export default AICopilot;
