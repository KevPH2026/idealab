"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Check, AlertCircle, RefreshCw, Server, Key, Cpu, Image, MessageSquare, Sliders, Globe, ToggleLeft, ToggleRight, Save, Lock } from "lucide-react";

interface ConfigStatus {
  configured: { openrouter: boolean; minimax: boolean };
  models: {
    visionModel: string; copyModel: string; imageModel: string;
    visionTemp?: number; copyTemp?: number;
    visionMaxTokens?: number; copyMaxTokens?: number;
  };
  updatedAt: string;
}

interface ConfigForm {
  openrouterKey: string; minimaxKey: string;
  openrouterEnabled: boolean; minimaxEnabled: boolean;
  visionModel: string; copyModel: string; imageModel: string;
  visionTemp: number; copyTemp: number;
  visionMaxTokens: number; copyMaxTokens: number;
  imageAspectRatio: string; imageQuality: string; imageStyle: string;
  visionPromptTemplate: string; copyPromptTemplate: string;
  outputLanguage: string; outputVariations: number;
  enableLogoWatermark: boolean; enableAutoRetry: boolean; enableMultiFormat: boolean;
  brandName: string; brandTagline: string;
}

const VISION_MODELS = [
  { id: "qwen/qwen2.5-vl-72b-instruct", label: "Qwen2.5-VL 72B", desc: "视觉理解最强" },
  { id: "anthropic/claude-sonnet-4-7-20251119", label: "Claude Sonnet 4", desc: "速度快" },
  { id: "google/gemini-2.0-flash-exp", label: "Gemini 2.0 Flash", desc: "免费额度多" },
];

const COPY_MODELS = [
  { id: "openai/gpt-4o", label: "GPT-4o", desc: "文案能力最强" },
  { id: "anthropic/claude-sonnet-4-7-20251119", label: "Claude Sonnet 4", desc: "创意文案" },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen2.5 72B", desc: "性价比高" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 正方形", desc: "适合朋友圈/小红书" },
  { id: "16:9", label: "16:9 宽图", desc: "适合公众号/Banner" },
  { id: "9:16", label: "9:16 竖图", desc: "适合抖音/Instagram Stories" },
  { id: "4:3", label: "4:3 经典", desc: "适合知乎/博客" },
];

const IMAGE_QUALITY = [
  { id: "low", label: "省配额（标清）", desc: "消耗更少额度" },
  { id: "medium", label: "均衡（高清）", desc: "质量和配额平衡" },
  { id: "high", label: "最高质量", desc: "最佳效果，消耗更多" },
];

const IMAGE_STYLES = [
  { id: "auto", label: "智能匹配", desc: "根据内容自动选择风格" },
  { id: "photorealistic", label: "写实摄影", desc: "逼真照片风格" },
  { id: "digital_art", label: "数字艺术", desc: "插画/矢量风格" },
  { id: "3d_render", label: "3D渲染", desc: "三维立体效果" },
  { id: "anime", label: "动漫风格", desc: "日漫二次元" },
];

const LANGUAGES = [
  { id: "zh", label: "简体中文" },
  { id: "en", label: "English" },
  { id: "mixed", label: "中英双语" },
];

const DEFAULT_VISION_PROMPT = `你是一位专业的营销视觉分析师。请详细分析这张图片：\n1. 识别主体、场景、风格\n2. 分析构图、色彩、光线\n3. 判断适用行业/场景\n只输出结构化的分析结果。`;

const DEFAULT_COPY_PROMPT = `你是一位顶级营销文案专家。根据以下信息，为图片生成最吸引人的营销文案：\n- 目标受众：[受众描述]\n- 平台：[平台类型]\n- 风格：接地气、有感染力、能引发共鸣\n\n要求：\n- 标题党一点，有反转更好\n- 直接可用，不要废话\n- 输出3个不同角度的版本`;

// --- Auth check ---
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
}
function setToken(t: string) { sessionStorage.setItem("admin_token", t); }
function clearToken() { sessionStorage.removeItem("admin_token"); }

// --- Login Screen ---
function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleLogin() {
    if (!pw.trim()) return;
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setToken(data.token);
        onSuccess();
      } else {
        setErr(data.error || "密码错误");
      }
    } catch {
      setErr("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070711] flex items-center justify-center">
      <div className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">管理员登录</h1>
          <p className="text-white/40 text-sm mt-2">输入密码以访问配置面板</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="输入管理员密码"
              className="bg-white/5 border-white/10 text-white pr-10 text-center text-lg tracking-widest"
              autoFocus
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err && (
            <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
              <AlertCircle className="w-4 h-4" /> {err}
            </div>
          )}
          <Button
            onClick={handleLogin}
            disabled={loading || !pw}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white h-12 text-base"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "登录"}
          </Button>
        </div>
        <p className="text-center text-white/20 text-xs mt-8">
          默认密码请在 Vercel 环境变量设置 ADMIN_PASSWORD
        </p>
      </div>
    </div>
  );
}

// --- Main Admin Panel ---
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [activeTab, setActiveTab] = useState("keys");
  const [form, setForm] = useState<ConfigForm>({
    openrouterKey: "", minimaxKey: "",
    openrouterEnabled: true, minimaxEnabled: true,
    visionModel: "qwen/qwen2.5-vl-72b-instruct",
    copyModel: "openai/gpt-4o",
    imageModel: "image-01",
    visionTemp: 0.7, copyTemp: 0.8,
    visionMaxTokens: 2048, copyMaxTokens: 1024,
    imageAspectRatio: "1:1", imageQuality: "medium", imageStyle: "auto",
    visionPromptTemplate: DEFAULT_VISION_PROMPT,
    copyPromptTemplate: DEFAULT_COPY_PROMPT,
    outputLanguage: "zh", outputVariations: 1,
    enableLogoWatermark: false, enableAutoRetry: true, enableMultiFormat: false,
    brandName: "IdeaLab", brandTagline: "AI灵感创作平台",
  });
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [showMiniMax, setShowMiniMax] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? setAuthed(true) : clearToken())
        .catch(() => clearToken())
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchStatus();
  }, [authed]);

  async function fetchStatus() {
    const token = getToken();
    try {
      const res = await fetch("/api/config", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setStatus(data);
      if (data.models) {
        setForm(f => ({
          ...f,
          visionModel: data.models.visionModel || f.visionModel,
          copyModel: data.models.copyModel || f.copyModel,
          visionTemp: data.models.visionTemp ?? f.visionTemp,
          copyTemp: data.models.copyTemp ?? f.copyTemp,
          visionMaxTokens: data.models.visionMaxTokens ?? f.visionMaxTokens,
          copyMaxTokens: data.models.copyMaxTokens ?? f.copyMaxTokens,
        }));
      }
      if (data.image) {
        setForm(f => ({
          ...f,
          imageAspectRatio: data.image.aspectRatio || f.imageAspectRatio,
          imageQuality: data.image.quality || f.imageQuality,
          imageStyle: data.image.style || f.imageStyle,
        }));
      }
      if (data.output) {
        setForm(f => ({
          ...f,
          outputLanguage: data.output.language || f.outputLanguage,
          outputVariations: data.output.variations ?? f.outputVariations,
        }));
      }
      if (data.features) {
        setForm(f => ({
          ...f,
          enableLogoWatermark: data.features.enableLogoWatermark ?? f.enableLogoWatermark,
          enableAutoRetry: data.features.enableAutoRetry ?? f.enableAutoRetry,
          enableMultiFormat: data.features.enableMultiFormat ?? f.enableMultiFormat,
        }));
      }
      if (data.branding) {
        setForm(f => ({
          ...f,
          brandName: data.branding.brandName || f.brandName,
          brandTagline: data.branding.brandTagline || f.brandTagline,
        }));
      }
      if (data.prompts) {
        setForm(f => ({
          ...f,
          visionPromptTemplate: data.prompts.visionTemplate || f.visionPromptTemplate,
          copyPromptTemplate: data.prompts.copyTemplate || f.copyPromptTemplate,
        }));
      }
    } catch { setError("获取配置失败"); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    const token = getToken();
    if (!token) { setAuthed(false); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.status === 401) { setAuthed(false); return; }
      if (!res.ok) throw new Error("保存失败");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchStatus();
    } catch (e: any) {
      setError(e.message || "保存失败");
    } finally { setSaving(false); }
  }

  function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return enabled
      ? <ToggleRight className="w-8 h-8 text-violet-400 cursor-pointer" onClick={() => onChange(false)} />
      : <ToggleLeft className="w-8 h-8 text-white/30 cursor-pointer" onClick={() => onChange(true)} />;
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => { setAuthed(true); fetchStatus(); }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "keys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
    { id: "models", label: "模型配置", icon: <Cpu className="w-4 h-4" /> },
    { id: "image", label: "图片生成", icon: <Image className="w-4 h-4" /> },
    { id: "prompts", label: "提示词模板", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "output", label: "输出与品牌", icon: <Globe className="w-4 h-4" /> },
    { id: "features", label: "功能开关", icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">管理员配置</h1>
              <p className="text-sm text-white/40">IdeaLab 全局设置 · 服务端生效</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {status?.updatedAt && (
              <p className="text-sm text-white/30">上次更新: {new Date(status.updatedAt).toLocaleString("zh-CN")}</p>
            )}
            <Button onClick={handleLogout} variant="ghost" className="text-white/40 hover:text-white text-sm">
              退出
            </Button>
            <Button
              onClick={handleSave} disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? "✓ 已保存" : "保存全部"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Status Banner */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 mb-8 ${
          status?.configured?.openrouter && status?.configured?.minimax
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-amber-500/10 border border-amber-500/20"
        }`}>
          {status?.configured?.openrouter && status?.configured?.minimax ? (
            <><Check className="w-5 h-5 text-green-400" />
              <div><p className="text-green-300 font-medium">✓ 服务端已完整配置</p><p className="text-green-400/60 text-sm">用户无需配置 API Key，直接可用</p></div>
            </>
          ) : (
            <><AlertCircle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-amber-300 font-medium">⚠ 配置不完整</p>
                <p className="text-amber-400/60 text-sm">
                  {[ !status?.configured?.openrouter && "OpenRouter 未配置", !status?.configured?.minimax && "MiniMax 未配置" ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </>
          )}
        </div>

        {error && <div className="mb-6 rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id ? "bg-violet-600 text-white" : "text-white/50 hover:text-white"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab: API Keys */}
        {activeTab === "keys" && (
          <Card className="p-8 bg-white/[0.03] border-white/10">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Key className="w-5 h-5 text-violet-400" /> API Keys</h2>
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">OpenRouter Key</label>
                  <span className="text-xs text-white/30">用于视觉理解 + 文案生成</span>
                </div>
                <div className="relative">
                  <Input type={showOpenRouter ? "text" : "password"} value={form.openrouterKey}
                    onChange={e => setForm({ ...form, openrouterKey: e.target.value })}
                    placeholder="sk-or-v2-...（留空则不更新）"
                    className="bg-white/5 border-white/10 text-white pr-10" />
                  <button type="button" onClick={() => setShowOpenRouter(!showOpenRouter)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/20 mt-1.5">从 <a href="https://openrouter.ai/keys" target="_blank" className="text-violet-400 hover:underline">openrouter.ai/keys</a> 获取</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">MiniMax Key</label>
                  <span className="text-xs text-white/30">用于图片生成</span>
                </div>
                <div className="relative">
                  <Input type={showMiniMax ? "text" : "password"} value={form.minimaxKey}
                    onChange={e => setForm({ ...form, minimaxKey: e.target.value })}
                    placeholder="sk-cp-...（留空则不更新）"
                    className="bg-white/5 border-white/10 text-white pr-10" />
                  <button type="button" onClick={() => setShowMiniMax(!showMiniMax)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    {showMiniMax ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/20 mt-1.5">从 <a href="https://platform.minimax.chat/apikey" target="_blank" className="text-violet-400 hover:underline">platform.minimax.chat</a> 获取</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab: Models */}
        {activeTab === "models" && (
          <div className="space-y-8">
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Eye className="w-5 h-5 text-violet-400" /> 视觉理解模型</h2>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {VISION_MODELS.map(m => (
                  <button key={m.id} onClick={() => setForm({ ...form, visionModel: m.id })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${form.visionModel === m.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium text-white">{m.label}</p><p className="text-xs text-white/40">{m.desc}</p></div>
                      {form.visionModel === m.id && <Check className="w-4 h-4 text-violet-400" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-3 block">Temperature: {form.visionTemp}</label>
                  <input type="range" min="0" max="1" step="0.05" value={form.visionTemp}
                    onChange={e => setForm({ ...form, visionTemp: parseFloat(e.target.value) })}
                    className="w-full accent-violet-500" />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>精确</span><span>创意</span></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-3 block">Max Tokens: {form.visionMaxTokens}</label>
                  <input type="range" min="512" max="8192" step="256" value={form.visionMaxTokens}
                    onChange={e => setForm({ ...form, visionMaxTokens: parseInt(e.target.value) })}
                    className="w-full accent-violet-500" />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>512</span><span>8192</span></div>
                </div>
              </div>
            </Card>
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><MessageSquare className="w-5 h-5 text-violet-400" /> 文案生成模型</h2>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {COPY_MODELS.map(m => (
                  <button key={m.id} onClick={() => setForm({ ...form, copyModel: m.id })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${form.copyModel === m.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium text-white">{m.label}</p><p className="text-xs text-white/40">{m.desc}</p></div>
                      {form.copyModel === m.id && <Check className="w-4 h-4 text-violet-400" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-3 block">Temperature: {form.copyTemp}</label>
                  <input type="range" min="0" max="1" step="0.05" value={form.copyTemp}
                    onChange={e => setForm({ ...form, copyTemp: parseFloat(e.target.value) })}
                    className="w-full accent-violet-500" />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>稳定</span><span>创意</span></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-3 block">Max Tokens: {form.copyMaxTokens}</label>
                  <input type="range" min="256" max="4096" step="128" value={form.copyMaxTokens}
                    onChange={e => setForm({ ...form, copyMaxTokens: parseInt(e.target.value) })}
                    className="w-full accent-violet-500" />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>256</span><span>4096</span></div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab: Image */}
        {activeTab === "image" && (
          <div className="space-y-8">
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Image className="w-5 h-5 text-violet-400" /> 图片生成参数</h2>
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-3">默认比例</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ASPECT_RATIOS.map(r => (
                      <button key={r.id} onClick={() => setForm({ ...form, imageAspectRatio: r.id })}
                        className={`p-4 rounded-xl border text-left transition-all ${form.imageAspectRatio === r.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <p className="font-medium text-white text-sm">{r.label}</p>
                        <p className="text-xs text-white/40 mt-1">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70 mb-3">生成质量</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {IMAGE_QUALITY.map(q => (
                      <button key={q.id} onClick={() => setForm({ ...form, imageQuality: q.id })}
                        className={`p-4 rounded-xl border text-left transition-all ${form.imageQuality === q.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <p className="font-medium text-white text-sm">{q.label}</p>
                        <p className="text-xs text-white/40 mt-1">{q.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70 mb-3">默认风格</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {IMAGE_STYLES.map(s => (
                      <button key={s.id} onClick={() => setForm({ ...form, imageStyle: s.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${form.imageStyle === s.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <p className="font-medium text-white text-xs">{s.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab: Prompts */}
        {activeTab === "prompts" && (
          <div className="space-y-8">
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-3"><Eye className="w-5 h-5 text-violet-400" /> 视觉理解提示词模板</h2>
              <p className="text-sm text-white/40 mb-4">发送给视觉模型的分析指令</p>
              <textarea value={form.visionPromptTemplate}
                onChange={e => setForm({ ...form, visionPromptTemplate: e.target.value })}
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm resize-y" />
            </Card>
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-3"><MessageSquare className="w-5 h-5 text-violet-400" /> 文案生成提示词模板</h2>
              <p className="text-sm text-white/40 mb-4">发送给文案模型的核心指令</p>
              <textarea value={form.copyPromptTemplate}
                onChange={e => setForm({ ...form, copyPromptTemplate: e.target.value })}
                rows={10}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm resize-y" />
            </Card>
          </div>
        )}

        {/* Tab: Output & Branding */}
        {activeTab === "output" && (
          <div className="space-y-8">
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Globe className="w-5 h-5 text-violet-400" /> 输出语言与变体</h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-3">默认输出语言</p>
                  <div className="space-y-2">
                    {LANGUAGES.map(l => (
                      <button key={l.id} onClick={() => setForm({ ...form, outputLanguage: l.id })}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${form.outputLanguage === l.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <p className="text-sm text-white">{l.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-3 block">文案变体数量: {form.outputVariations}</label>
                  <input type="range" min="1" max="5" step="1" value={form.outputVariations}
                    onChange={e => setForm({ ...form, outputVariations: parseInt(e.target.value) })}
                    className="w-full accent-violet-500 mt-6" />
                  <div className="flex justify-between text-xs text-white/30 mt-1"><span>1个</span><span>5个</span></div>
                </div>
              </div>
            </Card>
            <Card className="p-8 bg-white/[0.03] border-white/10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Server className="w-5 h-5 text-violet-400" /> 品牌信息</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">品牌名称</label>
                  <Input value={form.brandName}
                    onChange={e => setForm({ ...form, brandName: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">品牌标语</label>
                  <Input value={form.brandTagline}
                    onChange={e => setForm({ ...form, brandTagline: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab: Features */}
        {activeTab === "features" && (
          <Card className="p-8 bg-white/[0.03] border-white/10">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3"><Sliders className="w-5 h-5 text-violet-400" /> 功能开关</h2>
            <div className="space-y-1">
              {[
                { key: "enableLogoWatermark", label: "图片水印", desc: "在生成的图片右下角添加 IdeaLab 水印", icon: <Image className="w-4 h-4" /> },
                { key: "enableAutoRetry", label: "自动重试", desc: "API 调用超时时自动重试（最多3次）", icon: <RefreshCw className="w-4 h-4" /> },
                { key: "enableMultiFormat", label: "多格式导出", desc: "支持同时导出 PNG + JPG + WebP", icon: <Sliders className="w-4 h-4" /> },
              ].map(item => (
                <div key={item.key}
                  className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
                    form[item.key as keyof ConfigForm] ? "border-violet-500/30 bg-violet-500/5" : "border-white/10 bg-white/[0.02]"
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      form[item.key as keyof ConfigForm] ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/30"
                    }`}>{item.icon}</div>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-white/40">{item.desc}</p>
                    </div>
                  </div>
                  <Toggle enabled={form[item.key as keyof ConfigForm] as boolean} onChange={v => setForm({ ...form, [item.key]: v })} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bottom save */}
        <div className="mt-8 flex items-center justify-end">
          <p className="text-xs text-white/20 mr-4">配置保存在服务端 config/models.json，不暴露给用户</p>
          <Button onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "✓ 已保存" : "保存全部"}
          </Button>
        </div>
      </main>
    </div>
  );
}
