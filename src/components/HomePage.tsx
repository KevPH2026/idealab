"use client";

import { useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { Step1Materials } from "@/components/Step1_Materials";
import { Step2Scene } from "@/components/Step2_Scene";
import { Step3Style } from "@/components/Step3_Style";
import { Step4Audience } from "@/components/Step4_Audience";
import { Step5Generating } from "@/components/Step5_Generating";
import { SettingsModal } from "@/components/SettingsModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Download,
  Layers,
  Star,
  Rocket,
  Shield,
  Clock,
  Settings,
  Brain,
  Wand2,
  Image,
  PenLine,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";

import { IdeaLabLogo } from "@/components/Logo";

const WORKFLOW = [
  { step: "01", label: "上传素材" },
  { step: "02", label: "选场景" },
  { step: "03", label: "配风格" },
  { step: "04", label: "AI 生成" },
];

const PAIN_POINTS = [
  { emoji: "😫", title: "有素材，不会用", desc: "截图、文档、产品图堆满文件夹，不知道怎么变成能发的内容" },
  { emoji: "🌀", title: "设计师排期要3天", desc: "等设计图比等客户回复还久，节奏全被打乱" },
  { emoji: "📝", title: "文案改8遍还是不对", desc: "自己写没感觉，找人写又说不清需求，来回拉扯" },
];

const DEMO_RESULT = {
  input: {
    type: "product photo",
    desc: "一款极简无线耳机，白色，金属质感",
  },
  analysis: {
    style: "极简主义 / 苹果风 / 高端感",
    scene: "小红书、Instagram、电商详情页",
    audience: "25-35岁都市白领、数码爱好者",
    colors: ["#F5F5F7", "#1D1D1F", "#0071E3"],
  },
  copies: [
    {
      platform: "小红书",
      text: "听过很多降噪耳机，直到戴上它——安静到能听见自己的呼吸。极简设计，续航32小时，通勤党和出差人闭眼入。",
      tags: "#无线耳机 #降噪耳机 #数码好物 #通勤必备",
    },
    {
      platform: "朋友圈",
      text: "终于找到一副能让我'与世隔绝'的耳机。\n极简颜值 + 32小时续航 + 深度降噪，\n上班路上终于有了自己的安静角落。",
      tags: "",
    },
    {
      platform: "电商详情",
      text: "【重新定义安静】采用行业领先主动降噪技术，隔绝高达40dB环境噪音。极简金属设计，32小时超长续航，充电10分钟续航5小时，为都市精英而生。",
      tags: "",
    },
  ],
};

const DEMO_STEPS = [
  { label: "上传素材", detail: "产品图 / 链接 / 文字" },
  { label: "AI 分析", detail: "识别风格、场景、受众" },
  { label: "生成文案", detail: "3条不同角度营销文案" },
  { label: "一键配图", detail: "AI 生成配套设计稿" },
];

const FEATURES = [
  { icon: <Layers className="w-5 h-5" />, title: "素材即输入", desc: "文件、链接、文字、截图，随便什么格式，丢进去就行" },
  { icon: <Brain className="w-5 h-5" />, title: "AI 全自动", desc: "自动提炼卖点，生成3条不同角度的营销文案" },
  { icon: <Image className="w-5 h-5" />, title: "一键出图", desc: "根据文案和风格，AI生成可下载的设计稿" },
  { icon: <Download className="w-5 h-5" />, title: "直接可用", desc: "PNG 高清输出，可直接用于朋友圈、社媒、电商" },
];

const USE_CASES = [
  { title: "朋友圈素材", desc: "打造高转化朋友圈图文", icon: "🖼" },
  { title: "社媒内容", desc: "小红书/抖音/微博多平台适配", icon: "📱" },
  { title: "电商主图", desc: "淘宝/京东/亚马逊主图文案", icon: "🛒" },
  { title: "品牌故事", desc: "从产品到叙事的完整内容", icon: "📖" },
  { title: "独立站文案", desc: "产品页、落地页、About Us", icon: "🌐" },
  { title: "广告素材", desc: "Google/Meta/TikTok 广告文案", icon: "🎯" },
];

const CHANGELOG = [
  { version: "v0.2.0", date: "2026-04-20", tags: ["新功能", "重大更新"], changes: [
    "全新深色炫酷首页上线",
    "增加灯泡 Logo SVG",
    "5步向导流程完整跑通",
    "支持素材上传/链接/文本三种方式",
    "支持朋友圈、小红书、电商等6大场景",
    "支持受众+目标精准生成",
    "后端3模型Pipeline上线（qwen-vl + GPT-4o + MiniMax）",
  ]},
  { version: "v0.1.0", date: "2026-04-19", tags: ["初始版本"], changes: [
    "项目初始化，基础框架搭建",
    "shadcn/ui + Tailwind + Zustand 集成",
    "API Route 生成接口搭建",
  ]},
];

function ChangelogTag({ tags }: { tags: string[] }) {
  return (
    <div className="flex gap-1.5">
      {tags.map(t => (
        <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          t === "新功能" ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" :
          t === "重大更新" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
          "bg-white/10 text-white/50 border border-white/10"
        }`}>{t}</span>
      ))}
    </div>
  );
}

// ─── HomeContent (Dark Landing Page) ─────────────────────────────────────────
function HomeContent({ onStart, onSettings }: { onStart: () => void; onSettings: () => void }) {
  return (
    <div className="min-h-screen bg-[#070711] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#070711]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdeaLabLogo size={36} />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              IdeaLab
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSettings} className="text-white/50 hover:text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("pain")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              痛点
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              功能
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("cases")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              场景
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("changelog")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              更新
            </Button>
            <a
              href="/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 transition-all"
            >
              EN
            </a>
            <Button
              size="sm"
              onClick={onStart}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/50 ml-2"
            >
              免费试用
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-700/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-700/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-violet-300 mb-8 backdrop-blur-sm">
            <Wand2 className="w-4 h-4 text-violet-400" />
            <span>AI 驱动的新一代内容创作平台</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            丢素材，<span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">5分钟</span>
            <br />
            出营销内容和设计稿
          </h1>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            截图、文档、产品图、竞品链接 — 随便什么素材，丢进去，AI 自动分析、生成可发布的文案和设计稿。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-900/60 text-white text-lg font-semibold rounded-2xl border border-violet-500/30"
              onClick={onStart}
            >
              立即开始 <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-lg font-semibold rounded-2xl backdrop-blur-sm"
              onClick={() => document.getElementById("pain")?.scrollIntoView({ behavior: "smooth" })}
            >
              了解更多
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-white/30">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-white/60">4.9</span>
              <span>用户评分</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Rocket className="w-4 h-4 text-violet-400" />
              <span className="font-medium text-white/60">5分钟</span>
              <span>平均出稿</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white/60">100%</span>
              <span>内容原创</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 用户共鸣 ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#070711] to-[#0d0d1a]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">你一定听过这些话</p>
          <h2 className="text-3xl font-bold text-white mb-12">做内容这件事，是不是总卡在这？</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { quote: "我要五彩斑斓的黑", sub: "—— 甲方爸爸的经典名言" },
              { quote: "总之，你懂我意思吧？", sub: "—— 说完自己也忘了什么意思" },
              { quote: "不对，再改改", sub: "—— 第三版往往不如第一版" },
            ].map((q, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
                <div className="text-2xl font-bold text-white mb-3 italic">"{q.quote}"</div>
                <div className="text-sm text-white/30">{q.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-lg">IdeaLab 让 AI 替你理解、替你创作、替你执行</p>
        </div>
      </section>

      {/* ── Pain Points ─────────────────────────────────────────────────── */}
      <section id="pain" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">你的痛点</p>
            <h2 className="text-4xl font-bold text-white mb-4">做内容这件事，累在哪？</h2>
            <p className="text-lg text-white/40">IdeaLab 解决这些问题</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p) => (
              <Card
                key={p.title}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="text-4xl mb-5">{p.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-white/40 leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">
            工作流
          </p>
          <h2 className="text-center text-3xl font-bold text-white mb-14">简单4步，告别内容焦虑</h2>

          <div className="flex items-start justify-between gap-4 relative">
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-600/50 via-indigo-500/50 to-violet-600/50" />
            {WORKFLOW.map((w) => (
              <div key={w.step} className="flex-1 flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40 text-white font-bold text-sm border border-violet-500/30">
                  {w.step}
                </div>
                <span className="text-sm font-medium text-white/60">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">实际效果</p>
            <h2 className="text-4xl font-bold text-white mb-4">一个素材 → 多个平台的可用内容</h2>
            <p className="text-lg text-white/40">点击任意平台标签查看对应文案，或继续调整</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {DEMO_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-300">
                    {i + 1}
                  </div>
                  <div className="text-xs text-white/40 mt-1.5">{s.label}</div>
                </div>
                {i < DEMO_STEPS.length - 1 && (
                  <div className="w-12 h-px bg-violet-500/20 mx-1 mb-5" />
                )}
              </div>
            ))}
          </div>

          {/* Demo card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl shadow-violet-950/20">
            <div className="bg-white/[0.03] border-b border-white/5 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="text-xs text-white/30 font-mono">idealab.now — 实时生成演示</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Left: inputs */}
              <div className="lg:col-span-2 border-r border-white/5 p-6 space-y-5">
                {/* Material input */}
                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">📦 素材输入</p>
                  <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-2xl shadow-lg">
                        🎧
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">无线降噪耳机</p>
                        <p className="text-xs text-white/40">产品图 · 白色极简款</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 italic">"极简设计，32小时续航，深度降噪"</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">🧠 AI 分析结果</p>
                  <div className="space-y-2">
                    {[
                      { label: "风格", value: DEMO_RESULT.analysis.style },
                      { label: "场景", value: DEMO_RESULT.analysis.scene },
                      { label: "受众", value: DEMO_RESULT.analysis.audience },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-2">
                        <span className="text-xs text-violet-400 font-medium min-w-8 pt-0.5">{item.label}</span>
                        <span className="text-xs text-white/60">{item.value}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-violet-400 font-medium min-w-8 pt-0.5">色彩</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {DEMO_RESULT.analysis.colors.map((c) => (
                          <div key={c} className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2">
                  <button
                    onClick={onStart}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2"
                  >
                    去试一下 →
                  </button>
                </div>
              </div>

              {/* Right: outputs */}
              <div className="lg:col-span-3 p-6">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">✍️ 生成的营销文案</p>
                <div className="space-y-3">
                  {DEMO_RESULT.copies.map((copy, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-4 border transition-all cursor-pointer hover:border-violet-500/30 ${
                        i === 0
                          ? "bg-violet-600/10 border-violet-500/30"
                          : "bg-white/[0.03] border-white/8 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          i === 0 ? "bg-violet-500/30 text-violet-300" : "bg-white/10 text-white/50"
                        }`}>
                          {copy.platform}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${i === 0 ? "text-white" : "text-white/70"}`}>
                        {copy.text}
                      </p>
                      {copy.tags && (
                        <p className="text-xs text-violet-400/70 mt-2">{copy.tags}</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/20 mt-4 text-center">AI 生成 · 继续说"换一版"可重新生成</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">核心能力</p>
            <h2 className="text-4xl font-bold text-white mb-4">省去 90% 的沟通成本</h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">不需要设计师，不需要文案，你只需要告诉 AI 你要什么</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 flex items-center justify-center mb-5 border border-violet-500/20">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/40 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ───────────────────────────────────────────────────── */}
      <section id="cases" className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">适用场景</p>
            <h2 className="text-4xl font-bold text-white mb-4">覆盖所有营销内容需求</h2>
            <p className="text-lg text-white/40">一个平台，解决所有内容创作场景</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {USE_CASES.map((c) => (
              <div
                key={c.title}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-violet-500/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-[32px] bg-gradient-to-br from-violet-900/60 via-indigo-900/60 to-purple-900/60 border border-violet-500/20 p-16 relative overflow-hidden shadow-2xl shadow-violet-950/50">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
                <Clock className="w-4 h-4" />
                <span>免费使用，无需信用卡</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5 text-white">还在为内容创作烦恼？</h2>
              <p className="text-xl text-white/50 mb-10">现在开始，5分钟出成品</p>
              <Button
                size="lg"
                className="h-14 px-12 bg-white text-violet-700 hover:bg-violet-50 shadow-2xl text-lg font-bold rounded-2xl"
                onClick={onStart}
              >
                免费开始创作 <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Changelog ───────────────────────────────────────────────────── */}
      <section id="changelog" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">版本记录</p>
            <h2 className="text-4xl font-bold text-white mb-4">更新的每一步</h2>
            <p className="text-lg text-white/40">持续迭代，只为更好的创作体验</p>
          </div>

          <div className="space-y-6">
            {CHANGELOG.map((release, i) => (
              <Card
                key={release.version}
                className={`bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden ${
                  i === 0 ? "border-violet-500/30 shadow-lg shadow-violet-900/10" : ""
                }`}
              >
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-white">{release.version}</span>
                    <span className="text-sm text-white/30">{release.date}</span>
                    <ChangelogTag tags={release.tags} />
                  </div>
                </div>
                <ul className="px-8 py-6 space-y-3">
                  {release.changes.map((c, j) => (
                    <li key={j} className="flex items-start gap-3 text-white/60">
                      <span className="text-violet-400 mt-0.5">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdeaLabLogo size={28} />
            <span className="font-bold text-white/70">IdeaLab</span>
          </div>
          <p className="text-sm text-white/20">© 2026 IdeaLab · AI Content Creation Platform</p>
        </div>
      </footer>
    </div>
  );
}

// ─── WizardContent ───────────────────────────────────────────────────────────
function WizardContent({ onBack, onSettings }: { onBack: () => void; onSettings: () => void }) {
  const { step } = useWizardStore();

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      <header className="border-b border-white/5 bg-[#070711]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdeaLabLogo size={34} />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              IdeaLab
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSettings} className="text-white/40 hover:text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-white/20 text-white/60 hover:text-white hover:bg-white/10"
            >
              ← 返回首页
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <StepIndicator />
        {step === 1 && <Step1Materials />}
        {step === 2 && <Step2Scene />}
        {step === 3 && <Step3Style />}
        {step === 4 && <Step4Audience />}
        {step === 5 && <Step5Generating />}
      </main>
    </div>
  );
}

// ─── AppShell ────────────────────────────────────────────────────────────────
export function AppShell() {
  const [showWizard, setShowWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showWizard ? (
        <WizardContent onBack={() => setShowWizard(false)} onSettings={() => setShowSettings(true)} />
      ) : (
        <HomeContent onStart={() => setShowWizard(true)} onSettings={() => setShowSettings(true)} />
      )}
    </>
  );
}
