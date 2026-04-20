"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RefreshCw, Zap, MessageSquare, Image, Play, User, Key, LogOut, ChevronRight, Loader2, Check, Eye } from "lucide-react";

interface Skill {
  id: string; name: string; description: string; models: string[];
  enabled: boolean; freeQuotaUser: number;
}
interface Pricing { perTurnPrice: number; freeUserTurns: number; }

interface Session {
  id: string; skillId: string; skillName: string;
  status: string; totalTurns: number; totalCharge: number;
  startedAt: string;
}

interface QuotaInfo {
  freeUsed: number; freeTotal: number;
}

interface Turn {
  turnNumber: number; userMessage: string | null;
  aiResponse: string; cost: number; createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [userKeys, setUserKeys] = useState({ openrouter: "", minimax: "" });
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [currentResult, setCurrentResult] = useState<{vision:string; copy:string; images:string[]} | null>(null);
  const [pendingCharge, setPendingCharge] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAll();
    }
  }, [status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function fetchAll() {
    setQuotaLoading(true);
    const [skRes, quotaRes, sessRes] = await Promise.all([
      fetch("/api/execute").then(r => r.json()),
      fetch("/api/quota").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/sessions").then(r => r.ok ? r.json() : { sessions: [] }).catch(() => { sessions: [] }),
    ]);
    setSkills(skRes.skills || []);
    setPricing(skRes.pricing || null);
    setQuota(quotaRes);
    setSessions(sessRes.sessions || []);
    setQuotaLoading(false);
  }

  async function startSession() {
    if (!selectedSkill) return;
    setLoading(true);
    setMessage("");
    setImageUrl("");
    setTurns([]);
    setCurrentResult(null);
    setPendingCharge(0);
    setConfirming(false);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: selectedSkill.id, sessionId: null, message: "", imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "启动失败"); return; }
      setActiveSessionId(data.sessionId);
      setPendingCharge(data.cost || 0);
      if (data.result) {
        const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
        setCurrentResult(parsed);
      }
      setTurns([{ turnNumber: 1, userMessage: null, aiResponse: JSON.stringify(data.result), cost: data.cost || 0, createdAt: new Date().toISOString() }]);
      await fetchAll();
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!activeSessionId || (!message.trim() && !imageUrl)) return;
    setRegenerating(true);
    const msg = message;
    setMessage("");
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: selectedSkill!.id, sessionId: activeSessionId, message: msg, imageUrl, regenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "执行失败"); return; }
      setPendingCharge(prev => prev + (data.cost || 0));
      if (data.result) {
        const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
        setCurrentResult(parsed);
      }
      setTurns(prev => [...prev, {
        turnNumber: turns.length + 1,
        userMessage: msg,
        aiResponse: JSON.stringify(data.result),
        cost: data.cost || 0,
        createdAt: new Date().toISOString(),
      }]);
      await fetchAll();
    } finally {
      setRegenerating(false);
    }
  }

  async function confirmDone() {
    if (!activeSessionId) return;
    setConfirming(true);
    await fetch("/api/sessions/done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSessionId }),
    });
    await fetchAll();
    setActiveSessionId(null);
    setSelectedSkill(null);
    setTurns([]);
    setCurrentResult(null);
    setPendingCharge(0);
    setConfirming(false);
  }

  async function saveKeys() {
    setSavingKeys(true);
    try {
      await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userKeys),
      });
      setKeysSaved(true);
      setTimeout(() => setKeysSaved(false), 2000);
    } finally {
      setSavingKeys(false);
    }
  }

  const skillIcons: Record<string, React.ReactNode> = {
    visual_analysis: <Eye className="w-5 h-5" />,
    copy_generation: <MessageSquare className="w-5 h-5" />,
    image_generation: <Image className="w-5 h-5" />,
    full_pipeline: <Zap className="w-5 h-5" />,
  };

  if (status === "loading" || quotaLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C14 3 10 7 10 12C10 14.5 11.5 16.5 14 17.5C16.5 18.5 18 20.5 18 23" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="14" cy="11" r="4" fill="white"/>
              <path d="M14 21V25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 25H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">IdeaLab</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Quota badge */}
          <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
            {quota ? (
              <span>{Math.max(0, quota.freeTotal - quota.freeUsed)} 次免费</span>
            ) : <span>{pricing?.freeUserTurns || 5} 次免费</span>}
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="w-4 h-4 text-violet-600" />
            </div>
            <span className="hidden sm:inline">{session?.user?.email}</span>
          </div>
          <button onClick={() => setShowKeys(!showKeys)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Key className="w-4 h-4" />
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* API Keys Panel */}
      {showKeys && (
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="max-w-3xl mx-auto">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" /> 我的 API Keys（优先级最高）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">OpenRouter Key（视觉 + 文案）</label>
                <Input type="password" value={userKeys.openrouter}
                  onChange={e => setUserKeys(k => ({ ...k, openrouter: e.target.value }))}
                  placeholder="sk-or-v2-..." className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">MiniMax Key（图片生成）</label>
                <Input type="password" value={userKeys.minimax}
                  onChange={e => setUserKeys(k => ({ ...k, minimax: e.target.value }))}
                  placeholder="sk-cp-..." className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveKeys} disabled={savingKeys} size="sm" className="bg-violet-600 hover:bg-violet-500">
                {savingKeys ? <Loader2 className="w-3 h-3 animate-spin" /> : keysSaved ? <Check className="w-3 h-3" /> : null}
                {keysSaved ? "已保存" : "保存我的 Keys"}
              </Button>
              <span className="text-xs text-gray-400">不填则使用系统默认 Key</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Skill Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide text-gray-500">选择技能</h2>
          <div className="space-y-2">
            {skills.filter(s => s.enabled).map(skill => (
              <button
                key={skill.id}
                onClick={() => { setSelectedSkill(skill); setActiveSessionId(null); setTurns([]); setCurrentResult(null); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedSkill?.id === skill.id
                    ? "border-violet-500 bg-violet-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedSkill?.id === skill.id ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {skillIcons[skill.id] || <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{skill.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{skill.description}</p>
                    <p className="text-xs text-violet-500 mt-1">免费 {skill.freeQuotaUser} 次</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedSkill && !activeSessionId && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <label className="text-xs text-gray-500 mb-2 block">图片 URL（选填）</label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://... 或粘贴图片地址" className="h-9 text-sm mb-3" />
              <Button onClick={startSession} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                启动 {selectedSkill.name}
              </Button>
            </div>
          )}

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide text-gray-500 mb-3">最近会话</h2>
              <div className="space-y-2">
                {sessions.slice(0, 5).map(sess => (
                  <div key={sess.id} className="bg-white border border-gray-200 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{sess.skillName || sess.skillId}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sess.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>{sess.status === "active" ? "进行中" : "已结束"}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{sess.totalTurns} 轮 · ¥{sess.totalCharge.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat / Result Area */}
        <div className="lg:col-span-2">
          {!activeSessionId ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-96">
              <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedSkill ? `准备使用 ${selectedSkill.name}` : "选择一个技能开始"}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm">
                {selectedSkill ? selectedSkill.description : "从左侧选择一个技能，然后上传图片开始创作"}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{selectedSkill?.name}</span>
                  <span className="text-xs text-gray-400">#{activeSessionId.slice(-6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {pendingCharge > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      本次预计 ¥{pendingCharge.toFixed(2)}
                    </span>
                  )}
                  {quota && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                      剩余 {Math.max(0, quota.freeTotal - quota.freeUsed)} 次免费
                    </span>
                  )}
                </div>
              </div>

              {/* Turn history */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {turns.map((turn, i) => {
                  const parsed = (() => {
                    try { return JSON.parse(turn.aiResponse); } catch { return { vision: turn.aiResponse, copy: "", images: [] }; }
                  })();
                  return (
                    <div key={i}>
                      {/* AI first turn response */}
                      {i === 0 && (parsed.vision || parsed.copy || parsed.images?.length > 0) && (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                          {parsed.vision && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">🎯 视觉分析</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsed.vision}</p>
                            </div>
                          )}
                          {parsed.copy && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">✍️ 文案</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsed.copy}</p>
                            </div>
                          )}
                          {parsed.images?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">🖼️ 图片</p>
                              <div className="grid grid-cols-2 gap-2">
                                {parsed.images.map((url: string, idx: number) => (
                                  <img key={idx} src={url} alt="" className="rounded-xl w-full" />
                                ))}
                              </div>
                            </div>
                          )}
                          {turn.cost > 0 && (
                            <p className="text-xs text-amber-600 mt-2">本轮计费 ¥{turn.cost.toFixed(2)}</p>
                          )}
                        </div>
                      )}
                      {/* User message */}
                      {turn.userMessage && (
                        <div className="bg-violet-50 rounded-2xl rounded-tr-sm p-3 ml-8">
                          <p className="text-sm text-gray-800">{turn.userMessage}</p>
                        </div>
                      )}
                      {/* AI follow-up */}
                      {turn.userMessage && (parsed.copy || parsed.images?.length > 0) && (
                        <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                          {parsed.copy && <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{parsed.copy}</p>}
                          {parsed.images?.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {parsed.images.map((url: string, idx: number) => (
                                <img key={idx} src={url} alt="" className="rounded-xl w-full" />
                              ))}
                            </div>
                          )}
                          {turn.cost > 0 && (
                            <p className="text-xs text-amber-600 mt-2">本轮计费 ¥{turn.cost.toFixed(2)} · 累计 ¥{(turns.slice(0, i+1).reduce((s,t) => s + t.cost, 0)).toFixed(2)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {regenerating && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" /> 生成中...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-gray-100 p-4">
                {currentResult && !confirming && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => { setConfirming(true); confirmDone(); }}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
                    >
                      ✓ 满意，结束会话
                    </button>
                    <span className="text-xs text-gray-400">或继续调整</span>
                  </div>
                )}
                {confirming && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-sm text-green-700">
                    ✓ 会话已结束！免费次数已消耗，后续使用将按 ¥{pricing?.perTurnPrice || 0.5}/次 计费
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder='说点什么，比如"颜色换一下"或"再活泼一点"，回车发送'
                    className="flex-1"
                    disabled={regenerating}
                  />
                  <Button onClick={sendMessage} disabled={regenerating || !message.trim()} className="bg-violet-600 hover:bg-violet-500 gap-2 px-4">
                    {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    重新生成
                  </Button>
                </div>
                {pendingCharge > 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    预计结算 ¥{pendingCharge.toFixed(2)} · {pricing?.perTurnPrice ? `¥${pricing.perTurnPrice}/次` : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
