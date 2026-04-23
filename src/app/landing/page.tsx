'use client';

import { useState } from 'react';
import { ArrowRight, Download, Zap, Globe, Layers, Clock, Sparkles, ChevronRight } from 'lucide-react';

type Lang = 'zh' | 'en';

const T = {
  zh: {
    badge: 'DTC广告素材 · 100倍效率',
    heroLine1: '品牌广告，',
    heroLine2: '100倍加速',
    heroSub: '上传参考图。输入卖点。30秒获得8张多平台广告素材。',
    heroNote: '不是贴logo——是品牌DNA注入。',
    cta: '免费生成',
    ctaSub: '无需注册 · 8张素材直接下载',
    navFeatures: '功能',
    navHow: '使用方法',
    navWhy: '为什么选100x',
    getStarted: '开始使用',
    platforms: '覆盖平台',
    specs: [
      { label: '30秒', desc: '生成速度' },
      { label: '8张', desc: '多场景并行' },
      { label: '7大市场', desc: '自动适配审美' },
      { label: '零门槛', desc: '不需要设计技能' },
    ],
    howTitle: '三步搞定。就这样。',
    howLabel: '使用方法',
    steps: [
      { icon: '🎨', title: '上传参考', desc: '分享你的品牌风格图', detail: 'AI自动解码品牌DNA' },
      { icon: '✍️', title: '描述产品', desc: '一句话核心卖点', detail: '越具体效果越好' },
      { icon: '⚡', title: '生成素材', desc: '8张素材，多平台覆盖', detail: 'IG / Story / FB / TikTok 全覆盖' },
    ],
    whyTitle: '为什么选100x',
    whySubtitle: '普通AI工具 vs 100x',
    genericTitle: '普通AI工具',
    generic: ['每次都要写长提示词', '手动选尺寸、风格、格式', '生成结果跟你的品牌毫无关系', '每次从零开始', '中文素材经常翻车'],
    vsTitle: '100x',
    vs: ['品牌+卖点，10个字搞定', '4种平台尺寸自动适配', '品牌DNA注入，不是贴logo', '8张并行，秒换新版', '目标市场审美自动匹配'],
    finalTitle1: '你的广告素材，',
    finalTitle2: '我们包了',
    finalSub: '8张可直接投放的广告素材。30秒后见。',
    finalCta: '立即生成',
    footer: '© 2026 100x',
    gridLabel: '你的品牌 — 8张素材已生成',
    exportAll: '全部导出',
  },
  en: {
    badge: 'DTC Ad Creatives · 100x Efficiency',
    heroLine1: 'Brand Ads,',
    heroLine2: '100x Faster',
    heroSub: 'Upload a reference. Describe your product. Get 8 platform-ready ad creatives in 30 seconds.',
    heroNote: 'Not a logo stamp — brand DNA infusion.',
    cta: 'Generate Free',
    ctaSub: 'No sign-up · 8 creatives ready to download',
    navFeatures: 'Features',
    navHow: 'How it works',
    navWhy: 'Why 100x',
    getStarted: 'Get Started',
    platforms: 'Platforms',
    specs: [
      { label: '30s', desc: 'Generation speed' },
      { label: '8', desc: 'Multi-scene parallel' },
      { label: '7 Markets', desc: 'Auto aesthetic fit' },
      { label: 'Zero', desc: 'No design skills needed' },
    ],
    howTitle: "Three steps. That's it.",
    howLabel: 'How it works',
    steps: [
      { icon: '🎨', title: 'Upload Reference', desc: 'Share your brand style image', detail: 'AI decodes your brand DNA' },
      { icon: '✍️', title: 'Describe Product', desc: 'One-line core selling point', detail: 'The more specific, the better' },
      { icon: '⚡', title: 'Generate', desc: '8 creatives, multi-platform', detail: 'IG / Story / FB / TikTok covered' },
    ],
    whyTitle: 'Why 100x',
    whySubtitle: 'Generic AI vs 100x',
    genericTitle: 'Generic AI Tools',
    generic: ['Write long prompts every time', 'Pick sizes, styles, formats manually', 'Output has nothing to do with your brand', 'Start from scratch each time', 'Chinese text looks broken'],
    vsTitle: '100x',
    vs: ['Brand + selling point, 10 words done', '4 platform sizes auto-fitted', 'Brand DNA infused, not logo-stamped', '8 images parallel, swap in seconds', 'Target market aesthetic auto-matched'],
    finalTitle1: 'Your brand, ',
    finalTitle2: '100x faster',
    finalSub: '8 production-ready ad creatives. 30 seconds from now.',
    finalCta: 'Generate Now',
    footer: '© 2026 100x',
    gridLabel: 'your_brand — 8 creatives generated',
    exportAll: 'Export All',
  },
};

const DEMO_IMAGES = [
  { src: '/demo/01_IG_Feed_1x1.webp', label: 'IG Feed', size: '1:1' },
  { src: '/demo/02_Story_9x16.webp', label: 'Story', size: '9:16' },
  { src: '/demo/03_FB_16x9.webp', label: 'FB Ad', size: '16:9' },
  { src: '/demo/04_IG_Feed2_1x1.webp', label: 'IG Feed', size: '1:1' },
  { src: '/demo/06_Story2_9x16.webp', label: 'Story', size: '9:16' },
  { src: '/demo/07_FB2_16x9.webp', label: 'FB Ad', size: '16:9' },
];

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('zh');
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 overflow-x-hidden">

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Mesh gradient orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed top-[200px] right-[-300px] w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <div className="fixed bottom-[-200px] left-[30%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50"
        style={{ background: 'rgba(5,5,7,0.8)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <span className="text-[9px] font-black text-white">100x</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white/90">100x</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs text-white/40 font-medium">
            <a href="#features" className="hover:text-white/80 transition-colors">{t.navFeatures}</a>
            <a href="#how" className="hover:text-white/80 transition-colors">{t.navHow}</a>
            <a href="#compare" className="hover:text-white/80 transition-colors">{t.navWhy}</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="text-[11px] text-white/30 hover:text-white/70 px-2.5 py-1 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <a href="/get" className="h-8 px-5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              {t.getStarted}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-12"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            {t.badge}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-4">
            <span className="text-white">{t.heroLine1}</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              {t.heroLine2}
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/30 max-w-lg mx-auto leading-relaxed mb-10">
            {t.heroSub}
            <span className="text-white/15 block mt-1">{t.heroNote}</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/get" className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1)', padding: '14px 36px', borderRadius: '14px' }}>
              {t.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <div className="flex items-center gap-2 text-xs text-white/20">
              <div className="flex -space-x-1.5">
                {['bg-violet-500','bg-cyan-500','bg-fuchsia-500','bg-amber-500'].map((c,i) => (
                  <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-[#050507]`} />
                ))}
              </div>
              {t.ctaSub}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Ad Grid Preview ─── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-[1px]"
            style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.3), rgba(255,255,255,0.05), rgba(6,182,212,0.2))' }}>
            <div className="rounded-2xl p-5 md:p-6"
              style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
                  <span className="text-xs text-white/25 font-medium">{t.gridLabel}</span>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Download className="w-3 h-3" /> {t.exportAll}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {DEMO_IMAGES.map((img, i) => (
                  <div key={i} className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:z-10 ${
                    img.size === '9:16' ? 'row-span-2' : ''
                  }`}
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className={
                      img.size === '9:16' ? 'aspect-[9/16]' :
                      img.size === '16:9' ? 'aspect-video' :
                      'aspect-square'
                    }>
                      <img
                        src={img.src}
                        alt={`${img.label} demo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-2.5 md:p-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-white/90 px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>{img.label}</span>
                        <span className="text-[8px] text-white/50 font-mono">{img.size}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-[9px] text-white/70 font-medium">Download</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Strip ─── */}
      <section className="py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[10px] text-white/15 uppercase tracking-[5px] mb-5">{t.platforms}</p>
          <div className="flex items-center justify-center gap-10 md:gap-16 text-sm font-bold text-white/10">
            <span>Instagram</span><span>TikTok</span><span>Facebook</span><span>Google Ads</span><span>Pinterest</span>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {t.specs.map(s => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-black bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">{s.label}</span>
              </div>
              <p className="text-xs text-white/20">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">{t.howLabel}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">{t.howTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.steps.map((s, i) => (
              <div key={i} className="group relative p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>{s.icon}</div>
                    <span className="text-xs font-mono text-white/10">{String(i+1).padStart(2,'0')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/35 mb-1">{s.desc}</p>
                  <p className="text-xs text-white/15">{s.detail}</p>
                </div>
                {i < 2 && <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10"><ChevronRight className="w-5 h-5 text-white/8" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why 100x ─── */}
      <section id="compare" className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">{t.whyTitle}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {t.whySubtitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-white/20 uppercase tracking-wider mb-5 font-medium">{t.genericTitle}</p>
              <ul className="space-y-3.5">
                {t.generic.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/25"><span className="text-rose-500/50 mt-0.5 text-xs">✕</span>{item}</li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-2xl relative overflow-hidden"
              style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent)' }} />
              <p className="text-xs text-violet-300/70 uppercase tracking-wider mb-5 font-medium">{t.vsTitle}</p>
              <ul className="space-y-3.5 relative">
                {t.vs.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/50"><span className="text-violet-400 mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {t.finalTitle1}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              {t.finalTitle2}
            </span>
          </h2>
          <p className="text-white/25 mb-10">{t.finalSub}</p>
          <a href="/get" className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 40px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.1)', padding: '16px 44px', borderRadius: '16px' }}>
            {t.finalCta}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-[5px] font-black text-white">100x</span>
            </div>
            <span className="text-xs text-white/10">100x.pics</span>
          </div>
          <p className="text-xs text-white/8">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
