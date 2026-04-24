'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, Check, Zap, Crown } from 'lucide-react';

type Lang = 'zh' | 'en';

const T = {
  zh: {
    badge: 'DTC广告素材 · 100倍效率',
    heroLine1: '你的广告素材',
    heroLine2: '我们包了',
    heroSub: '上传参考图。输入卖点。30秒获得多平台广告素材。',
    heroNote: '不是贴logo——是品牌DNA注入。',
    cta: '免费生成',
    ctaSub: '无需注册 · 直接下载',
    navHow: '使用方法',
    getStarted: '开始使用',
    howTitle: '三步搞定。就这样。',
    howLabel: '使用方法',
    steps: [
      { icon: '🎨', title: '上传参考', desc: '分享你的品牌风格图', detail: 'AI自动解码品牌DNA' },
      { icon: '✍️', title: '描述产品', desc: '一句话核心卖点', detail: '越具体效果越好' },
      { icon: '⚡', title: '生成素材', desc: '多张素材，多平台覆盖', detail: 'IG / Story / FB / TikTok 全覆盖' },
    ],
    footer: '© 2026 100x',
    demoCaption: '真实AI生成 · 未经修改',
    planLabel: '选择方案',
    planTitle: '按需选择，随时升级',
    plans: [
      {
        name: 'Free',
        badge: '免费体验',
        price: '¥0',
        period: '永久免费',
        desc: '注册即用，体验完整流程',
        features: ['100次AI生成', '8种广告场景', '4种平台尺寸', '品牌DNA解码', '一键下载全部素材'],
        cta: '免费注册',
        highlight: false,
      },
      {
        name: 'Pro',
        badge: '最受欢迎',
        price: '¥199',
        period: '/月',
        desc: '专业卖家首选，无限素材产出',
        features: [
          '无限AI生成', '8种广告场景', '全平台尺寸', '品牌DNA解码',
          '批量导出 & 水印', '多品牌管理', 'A/B测试变体', '优先生成速度', '专属客服支持',
        ],
        cta: '立即升级',
        highlight: true,
      },
    ],
  },
  en: {
    badge: 'DTC Ad Creatives · 100x Efficiency',
    heroLine1: 'Your ad creatives,',
    heroLine2: 'we got this.',
    heroSub: 'Upload a reference. Describe your product. Get platform-ready ad creatives.',
    heroNote: 'Not a logo stamp — brand DNA infusion.',
    cta: 'Generate Free',
    ctaSub: 'No sign-up · Download instantly',
    navHow: 'How it works',
    getStarted: 'Get Started',
    howTitle: "Three steps. That's it.",
    howLabel: 'How it works',
    steps: [
      { icon: '🎨', title: 'Upload Reference', desc: 'Share your brand style image', detail: 'AI decodes your brand DNA' },
      { icon: '✍️', title: 'Describe Product', desc: 'One-line core selling point', detail: 'The more specific, the better' },
      { icon: '⚡', title: 'Generate', desc: 'Multi-platform creatives', detail: 'IG / Story / FB / TikTok covered' },
    ],
    footer: '© 2026 100x',
    demoCaption: 'Real AI output · Unedited',
    planLabel: 'PRICING',
    planTitle: 'Pick your plan, scale anytime',
    plans: [
      {
        name: 'Free',
        badge: 'Free tier',
        price: '$0',
        period: 'Free forever',
        desc: 'Sign up and experience the full workflow',
        features: ['100 AI generations', '8 ad scenes', '4 platform sizes', 'Brand DNA decode', 'One-click download all'],
        cta: 'Sign Up Free',
        highlight: false,
      },
      {
        name: 'Pro',
        badge: 'Most Popular',
        price: '$29',
        period: '/mo',
        desc: 'For serious sellers, unlimited creatives',
        features: [
          'Unlimited AI generations', '8 ad scenes', 'All platform sizes', 'Brand DNA decode',
          'Batch export & watermark', 'Multi-brand management', 'A/B test variants', 'Priority generation speed', 'Dedicated support',
        ],
        cta: 'Upgrade Now',
        highlight: true,
      },
    ],
  },
};

type ImgRatio = 'square' | 'wide' | 'tall';

interface DemoImage {
  src: string;
  label: string;
  ratio: ImgRatio;
}

interface DemoSeries {
  name: string;
  category: string;
  emoji: string;
  tagline: string;
  scenes: string;
  images: DemoImage[];
}

const DEMO_SERIES: DemoSeries[] = [
  {
    name: 'SoundWave',
    category: '降噪耳机',
    emoji: '🎧',
    tagline: '沉浸式降噪 · 随身音乐厅',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/tech_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/tech_02.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/tech_03.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/tech_04.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/tech_05.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/tech_06.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'AuraGlow',
    category: '美妆护肤',
    emoji: '🧴',
    tagline: '天然发光肌 · 一抹即现',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/beauty_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/beauty_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/beauty_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/beauty_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'BeanCraft',
    category: '精品咖啡',
    emoji: '☕',
    tagline: '精品手冲 · 每一杯都是仪式',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/coffee_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/coffee_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/coffee_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/coffee_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'StridePro',
    category: '运动鞋',
    emoji: '👟',
    tagline: '轻量缓震 · 突破每一步',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/sport_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/sport_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/sport_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/sport_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
];

// Ad copy overlay — all English, high-converting marketing copy
const AD_COPY: Record<string, { headline: string; sub: string; cta: string }[]> = {
  SoundWave: [
    { headline: 'Silence The Noise', sub: 'Up to 98% noise cancellation', cta: 'GET YOURS →' },
    { headline: '30 Hours of Bliss', sub: 'All-day battery. Zero downtime.', cta: 'SHOP NOW →' },
    { headline: 'Hear What You\'ve Been Missing', sub: 'Hi-Res Audio · Spatial Sound', cta: 'TRY FREE →' },
    { headline: 'Your Personal Concert Hall', sub: '50mm drivers · Deep bass', cta: 'GET YOURS →' },
    { headline: 'Focus. Create. Repeat.', sub: 'AI-powered Focus Mode', cta: 'SHOP NOW →' },
    { headline: 'Sound That Moves You', sub: '360° Spatial Audio', cta: 'TRY FREE →' },
  ],
  AuraGlow: [
    { headline: 'Glow Different', sub: 'Visible results in 7 days', cta: 'SHOP NOW →' },
    { headline: 'Your Skin But Better', sub: 'Clinical-grade glow serum', cta: 'TRY FREE →' },
    { headline: 'No Filter Needed', sub: '72-hour hydration boost', cta: 'GET YOURS →' },
    { headline: 'Wake Up Glowing', sub: 'Overnight radiance reset', cta: 'SHOP NOW →' },
  ],
  BeanCraft: [
    { headline: 'Every Cup Tells a Story', sub: 'Single-origin specialty roast', cta: 'ORDER NOW →' },
    { headline: 'From Farm to Your Cup', sub: 'Ethically sourced · Freshly roasted', cta: 'TRY TODAY →' },
    { headline: 'Ritual, Not Routine', sub: 'Hand-roasted in small batches', cta: 'SUBSCRIBE →' },
    { headline: 'Mornings Worth Waking Up For', sub: 'Award-winning blend', cta: 'ORDER NOW →' },
  ],
  StridePro: [
    { headline: 'Lighter Than Air', sub: 'Only 180g · Cloud-like cushion', cta: 'SHOP NOW →' },
    { headline: 'Break Your Limits', sub: 'Energy-return sole tech', cta: 'GET YOURS →' },
    { headline: 'From Streets to Tracks', sub: 'StridePro X · Limited Edition', cta: 'PRE-ORDER →' },
    { headline: 'Unleash Your Speed', sub: 'Carbon fiber plate · 3% faster', cta: 'SHOP NOW →' },
  ],
};

function CarouselGrid({ series }: { series: DemoSeries }) {
  const copies = AD_COPY[series.name] || [];

  return (
    <div className="rounded-2xl p-[1px]"
      style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.25), rgba(255,255,255,0.04), rgba(6,182,212,0.15))' }}>
      <div className="rounded-2xl p-4 md:p-5"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-violet-500"
            style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
          <span className="text-sm text-white/50 font-medium">{series.emoji}</span>
          <span className="text-sm text-white/40 font-semibold">{series.category}</span>
          <span className="text-[10px] text-white/15 font-mono ml-auto">{series.name}</span>
        </div>

        {/* Layout: left info panel + right image grid */}
        <div className="flex gap-3 md:gap-4">

          {/* Left — Brand info panel */}
          <div className="hidden md:flex flex-col justify-between w-[200px] shrink-0 rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-3xl mb-3">{series.emoji}</div>
              <h3 className="text-lg font-black text-white/90 mb-1">{series.name}</h3>
              <p className="text-xs text-white/30 mb-4 leading-relaxed">{series.tagline}</p>
              <div className="space-y-2">
                {['IG Feed', 'Story', 'FB Ad', 'TikTok'].map((p, pi) => (
                  <div key={pi} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-500/60" />
                    <span className="text-[10px] text-white/20 font-medium">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] text-white/15 font-mono mb-2">COVERED PLATFORMS</p>
              <div className="flex flex-wrap gap-1">
                {series.scenes.split(' × ').map((s, si) => (
                  <span key={si} className="text-[9px] px-1.5 py-0.5 rounded text-white/25"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Image grid with text overlay */}
          <div className="flex-1 grid grid-cols-3 gap-1.5 md:gap-2">
            {series.images.map((img, i) => {
              const copy = copies[i];
              let cellClass = 'group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:z-10';
              let innerClass = '';

              if (img.ratio === 'tall') {
                cellClass += ' row-span-2';
                innerClass = 'aspect-[9/16] h-full';
              } else if (img.ratio === 'wide') {
                cellClass += ' col-span-2';
                innerClass = 'aspect-video';
              } else {
                innerClass = 'aspect-square';
              }

              return (
                <div key={i} className={cellClass}
                  style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className={innerClass}>
                    <img src={img.src} alt={`${series.name} ${img.label}`}
                      className="w-full h-full object-cover" loading="lazy" />
                  </div>

                  {/* Text overlay — always visible, with stagger animation */}
                  {copy && (
                    <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 60%)',
                      }}>
                      <div className="space-y-1 md:space-y-1.5">
                        <p className="text-white/90 font-black text-sm md:text-base leading-tight animate-fade-in-up"
                          style={{
                            animationDelay: `${i * 200 + 300}ms`,
                            animationFillMode: 'both',
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                          }}>
                          {copy.headline}
                        </p>
                        <p className="text-white/50 text-[9px] md:text-[10px] font-medium animate-fade-in-up"
                          style={{
                            animationDelay: `${i * 200 + 500}ms`,
                            animationFillMode: 'both',
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                          }}>
                          {copy.sub}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-bold text-white/80 animate-fade-in-up"
                          style={{
                            animationDelay: `${i * 200 + 700}ms`,
                            animationFillMode: 'both',
                            background: 'rgba(139,92,246,0.4)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(139,92,246,0.3)',
                          }}>
                          {copy.cta}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Platform label on hover */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[7px] font-bold text-white/70 px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                      {img.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('zh');
  const [activeSeries, setActiveSeries] = useState(0);
  const t = T[lang];

  const total = DEMO_SERIES.length;

  const next = useCallback(() => setActiveSeries(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setActiveSeries(i => (i - 1 + total) % total), [total]);

  // Auto-advance every 5s
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const series = DEMO_SERIES[activeSeries];

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 overflow-x-hidden">

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Mesh orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed top-[200px] right-[-300px] w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50"
        style={{ background: 'rgba(5,5,7,0.85)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <span className="text-[9px] font-black text-white">100x</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white/90">100x</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs text-white/40 font-medium">
            <a href="#demo" className="hover:text-white/80 transition-colors">Demo</a>
            <a href="#how" className="hover:text-white/80 transition-colors">{t.navHow}</a>
            <a href="#pricing" className="hover:text-white/80 transition-colors">Pricing</a>
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
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-10"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            {t.badge}
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6">
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

      {/* ─── Demo Carousel ─── */}
      <section id="demo" className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] text-white/12 uppercase tracking-[5px] mb-1">Generated by 100x</p>
          <p className="text-center text-xs text-white/20 mb-6">{t.demoCaption}</p>

          {/* Carousel */}
          <div className="relative">
            <CarouselGrid series={series} />

            {/* Nav arrows */}
            <button onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(10,10,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <ChevronLeft className="w-4 h-4 text-white/50" />
            </button>
            <button onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(10,10,15,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Dots + series tabs */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {DEMO_SERIES.map((s, i) => (
              <button key={i} onClick={() => setActiveSeries(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: i === activeSeries ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                  border: i === activeSeries ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  color: i === activeSeries ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.2)',
                }}>
                <span className="text-[11px]">{s.emoji}</span>
                <span className="hidden sm:inline text-[11px] font-medium">{s.category}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">{t.planLabel}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">{t.planTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 items-start">
            {t.plans.map((plan, i) => (
              <div key={i} className="relative rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: plan.highlight
                    ? 'rgba(139,92,246,0.06)'
                    : 'rgba(255,255,255,0.015)',
                  border: plan.highlight
                    ? '1px solid rgba(139,92,246,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: plan.highlight
                    ? '0 0 40px rgba(139,92,246,0.08), 0 0 80px rgba(139,92,246,0.03)'
                    : 'none',
                }}>
                {/* Badge */}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', color: 'white', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}>
                      <Crown className="w-3 h-3" /> {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    {plan.highlight
                      ? <Zap className="w-5 h-5 text-violet-400" />
                      : <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    }
                    <span className="text-lg font-bold text-white">{plan.name}</span>
                    {!plan.highlight && (
                      <span className="text-[10px] text-white/20 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl md:text-5xl font-black" style={{ color: plan.highlight ? '#c4b5fd' : 'rgba(255,255,255,0.8)' }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-white/20">{plan.period}</span>
                  </div>
                  <p className="text-sm text-white/25">{plan.desc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm" style={{ color: plan.highlight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)' }}>
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-violet-400' : 'text-white/15'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a href="/get" className="group inline-flex items-center justify-center gap-2 w-full text-sm font-bold transition-all"
                  style={{
                    background: plan.highlight
                      ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                      : 'rgba(255,255,255,0.05)',
                    color: plan.highlight ? 'white' : 'rgba(255,255,255,0.4)',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    boxShadow: plan.highlight ? '0 0 20px rgba(139,92,246,0.25)' : 'none',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            <span className="text-white">{t.heroLine1}</span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              {t.heroLine2}
            </span>
          </h2>
          <p className="text-white/25 mb-10">{t.heroSub}</p>
          <a href="/get" className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 40px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.1)', padding: '16px 44px', borderRadius: '16px' }}>
            {t.cta}
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
