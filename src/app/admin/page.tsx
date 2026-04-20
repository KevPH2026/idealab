"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Check, AlertCircle, RefreshCw, Server, Key, Cpu } from "lucide-react";

interface ConfigStatus {
  configured: {
    openrouter: boolean;
    minimax: boolean;
  };
  models: {
    visionModel: string;
    copyModel: string;
    imageModel: string;
  };
  updatedAt: string;
}

interface ConfigForm {
  openrouterKey: string;
  minimaxKey: string;
  openrouterEnabled: boolean;
  minimaxEnabled: boolean;
  visionModel: string;
  copyModel: string;
  imageModel: string;
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

export default function AdminPage() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [form, setForm] = useState<ConfigForm>({
    openrouterKey: "",
    minimaxKey: "",
    openrouterEnabled: true,
    minimaxEnabled: true,
    visionModel: "qwen/qwen2.5-vl-72b-instruct",
    copyModel: "openai/gpt-4o",
    imageModel: "image-01",
  });
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [showMiniMax, setShowMiniMax] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setStatus(data);
      if (data.models) {
        setForm((f) => ({
          ...f,
          visionModel: data.models.visionModel || f.visionModel,
          copyModel: data.models.copyModel || f.copyModel,
          imageModel: data.models.imageModel || f.imageModel,
        }));
      }
    } catch (e) {
      setError("获取配置失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("保存失败");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchStatus();
    } catch (e: any) {
      setError(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">服务端模型配置</h1>
              <p className="text-sm text-white/40">管理员面板 · 所有用户将默认使用此配置</p>
            </div>
          </div>
          {status?.updatedAt && (
            <p className="text-sm text-white/30">
              上次更新: {new Date(status.updatedAt).toLocaleString("zh-CN")}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        {/* Status Banner */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${
          status?.configured?.openrouter && status?.configured?.minimax
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-amber-500/10 border border-amber-500/20"
        }`}>
          {status?.configured?.openrouter && status?.configured?.minimax ? (
            <>
              <Check className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-300 font-medium">服务端已完整配置</p>
                <p className="text-green-400/60 text-sm">用户无需配置 API Key，直接可用</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-amber-300 font-medium">配置不完整</p>
                <p className="text-amber-400/60 text-sm">
                  {[
                    !status?.configured?.openrouter && "OpenRouter 未配置",
                    !status?.configured?.minimax && "MiniMax 未配置",
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* API Keys */}
        <Card className="p-8 bg-white/[0.03] border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold">API Keys</h2>
          </div>

          <div className="space-y-6">
            {/* OpenRouter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/70">OpenRouter Key</label>
                <span className="text-xs text-white/30">用于视觉理解 + 文案生成</span>
              </div>
              <div className="relative">
                <Input
                  type={showOpenRouter ? "text" : "password"}
                  value={form.openrouterKey}
                  onChange={(e) => setForm({ ...form, openrouterKey: e.target.value })}
                  placeholder="sk-or-v2-...（留空则不更新）"
                  className="bg-white/5 border-white/10 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouter(!showOpenRouter)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/20 mt-1.5">
                从 <a href="https://openrouter.ai/keys" target="_blank" className="text-violet-400 hover:underline">openrouter.ai/keys</a> 获取
              </p>
            </div>

            {/* MiniMax */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/70">MiniMax Key</label>
                <span className="text-xs text-white/30">用于图片生成</span>
              </div>
              <div className="relative">
                <Input
                  type={showMiniMax ? "text" : "password"}
                  value={form.minimaxKey}
                  onChange={(e) => setForm({ ...form, minimaxKey: e.target.value })}
                  placeholder="sk-cp-...（留空则不更新）"
                  className="bg-white/5 border-white/10 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowMiniMax(!showMiniMax)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showMiniMax ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/20 mt-1.5">
                从 <a href="https://platform.minimax.chat/apikey" target="_blank" className="text-violet-400 hover:underline">platform.minimax.chat</a> 获取
              </p>
            </div>
          </div>
        </Card>

        {/* Model Selection */}
        <Card className="p-8 bg-white/[0.03] border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold">模型选择</h2>
          </div>

          <div className="space-y-6">
            {/* Vision */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">视觉理解模型</p>
              <div className="grid grid-cols-1 gap-2">
                {VISION_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setForm({ ...form, visionModel: m.id })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      form.visionModel === m.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{m.label}</p>
                        <p className="text-xs text-white/40">{m.desc}</p>
                      </div>
                      {form.visionModel === m.id && <Check className="w-4 h-4 text-violet-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Copy */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">文案生成模型</p>
              <div className="grid grid-cols-1 gap-2">
                {COPY_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setForm({ ...form, copyModel: m.id })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      form.copyModel === m.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{m.label}</p>
                        <p className="text-xs text-white/40">{m.desc}</p>
                      </div>
                      {form.copyModel === m.id && <Check className="w-4 h-4 text-violet-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/20">
            配置保存在服务端 config/models.json，不暴露给用户
          </p>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            {saved ? "✓ 已保存" : "保存配置"}
          </Button>
        </div>
      </main>
    </div>
  );
}
