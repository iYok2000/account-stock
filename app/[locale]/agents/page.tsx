"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, User, Sparkles, MessageSquare, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const AGENT_TYPES = [
  {
    id: "seller_assistant",
    name: "ผู้ช่วยแม่ค้า",
    description: "ถามเรื่องการขาย กลยุทธ์ ราคา กำไร",
    icon: Sparkles,
    iconBg: "bg-secondary/30",
    iconColor: "text-secondary-foreground",
    modelLabel: "Sonnet",
  },
  {
    id: "stock_analyst",
    name: "วิเคราะห์สต็อก",
    description: "ถามเรื่องสินค้าคงคลัง การสั่งซื้อ reorder point",
    icon: MessageSquare,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    modelLabel: "Sonnet",
  },
  {
    id: "mathematician",
    name: "นักคำนวณ",
    description: "วิเคราะห์เชิงลึก ROI ต้นทุน กำไร งบการเงิน",
    icon: Bot,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    modelLabel: "Opus",
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  seller_assistant: [{
    id: "1", role: "assistant",
    content: "สวัสดีค่ะ! ฉันเป็นผู้ช่วยแม่ค้าออนไลน์ค่ะ ช่วยอะไรได้บ้างคะ? สามารถถามเรื่องกลยุทธ์การขาย การตั้งราคา หรือวิเคราะห์ข้อมูลร้านค้าได้เลยค่ะ",
    timestamp: new Date(),
  }],
  stock_analyst: [{
    id: "1", role: "assistant",
    content: "สวัสดีครับ! ผมช่วยวิเคราะห์สินค้าคงคลังได้ครับ ถามเรื่อง reorder point, safety stock, หรือแผนการสั่งซื้อได้เลยครับ",
    timestamp: new Date(),
  }],
  mathematician: [{
    id: "1", role: "assistant",
    content: "สวัสดีครับ! ผมเป็นนักคำนวณเชิงลึกครับ วิเคราะห์ตัวเลขซับซ้อน คำนวณ ROI, ต้นทุน, กำไร หรือวางแผนการเงินแบบละเอียดได้เลยครับ",
    timestamp: new Date(),
  }],
};

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState("seller_assistant");
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => messagesByAgent[selectedAgent] ?? [],
    [messagesByAgent, selectedAgent]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(), role: "user",
      content: inputValue, timestamp: new Date(),
    };
    setMessagesByAgent((prev) => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] ?? []), userMessage],
    }));
    setInputValue("");
    setIsLoading(true);

    // Simulate delay, then return "รอต่อ API" message
    await new Promise((r) => setTimeout(r, 800));
    const botMessage: Message = {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "⏳ รอต่อ API — ระบบ AI ยังไม่ได้เชื่อมต่อ backend กรุณารอการพัฒนาในระยะถัดไป",
      timestamp: new Date(),
    };
    setMessagesByAgent((prev) => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] ?? []), botMessage],
    }));
    setIsLoading(false);
  };

  const currentAgentInfo = AGENT_TYPES.find((a) => a.id === selectedAgent);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI ผู้ช่วย</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          สนทนากับ AI เพื่อวิเคราะห์และวางแผนร้านค้า
        </p>
      </div>

      {/* API banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>รอต่อ API — AI จะตอบได้จริงเมื่อเชื่อมต่อ backend (Anthropic Claude)</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Agent selector */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">เลือก Agent</p>
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0">
            {AGENT_TYPES.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={cn(
                  "min-w-[180px] lg:min-w-0 w-full text-left rounded-lg border p-3 transition-colors shrink-0 lg:shrink",
                  selectedAgent === agent.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", agent.iconBg)}>
                    <agent.icon className={cn("h-5 w-5", agent.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium whitespace-nowrap text-foreground">{agent.name}</p>
                      <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                        {agent.modelLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="hidden lg:block rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              <span className="font-medium">เกี่ยวกับ AI Models</span>
            </div>
            <p>Sonnet — เร็ว เหมาะสำหรับถามทั่วไป</p>
            <p>Opus — วิเคราะห์เชิงลึก ตัวเลขซับซ้อน</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="card lg:col-span-3 p-0 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">{currentAgentInfo?.name}</span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {currentAgentInfo?.modelLabel}
            </span>
          </div>

          {/* Messages */}
          <div className="h-[400px] sm:h-[480px] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">กำลังคิด...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
                placeholder="พิมพ์คำถามที่นี่..."
                disabled={isLoading}
                className="input-base flex-1 h-10"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary h-10 w-10 flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
