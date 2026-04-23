'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

type Lang = 'zh' | 'en';

const T = {
  zh: {
    badge: 'DTC广告素材 · 100倍效率',
    heroLine1: '你的广告素材，',
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
  images: DemoImage[];
}

const DEMO_SERIES: DemoSeries[] = [
  {
    name: 'SoundWave',
    category: '降噪耳机',
    emoji: '🎧',
    images: [
      { src: '/demo/tech_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/tech_02.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/tech_03.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/tech_04.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/tech_05.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/tech_06.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/tech_07.webp', label: 'IG Feed 1:1', ratio: 'square' },
    ],
  },
  {
    name: 'AuraGlow',
    category: '美妆护肤',
    emoji: '🧴',
    images: [
      { src: '/demo/beauty_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/beauty_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/beauty_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/beauty_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'BeanCraft',
    category: '精品咖啡',
    emoji: '☕',
    images: [
      { src: '/demo/coffee_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/coffee_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/coffee_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/coffee_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'StridePro',
    category: '运动鞋',
    emoji: '👟',
    images: [
      { src: '/demo/sport_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/sport_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/sport_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/sport_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
];

function SeriesGrid({ series }: { series: DemoSeries }) {
  const hasWide = series.images.some(i => i.ratio === 'wide');
  const hasTall = series.images.some(i => i.ratio === 'tall');

  // For series with 7 images (like tech), use a masonry 4-col layout
  // For series with 4 images, use 3-col layout

  return (
    <div className="rounded-2xl p-[1px] group/series"
      style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.2), rgba(255,255,255,0.03), rgba(6,182,212,0.12))' }}>
      <div className="rounded-2xl p-4 md:p-5"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-violet-500"
            style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
          <span className="text-sm text-white/50 font-medium">{series.emoji}</span>
          <span className="text-xs text-white/30 font-medium">{series.category}</span>
          <span className="text-[10px] text-white/15 font-mono ml-auto">{series.name}</span>
        </div>
        {/* Grid */}
        <div className={series.images.length >= 6 ? 'grid grid-cols-4 gap-1.5 md:gap-2' : 'grid grid-cols-3 gap-1.5 md:gap-2'}>
          {series.images.map((img, i) => {
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-2">
                  <span className="text-[8px] font-bold text-white/80 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    {img.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('zh');
  const t = T[lang];

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
      <div className="fixed bottom-[-200px] left-[30%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />

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

      {/* ─── Demo Gallery ─── */}
      <section id="demo" className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] text-white/12 uppercase tracking-[5px] mb-1">Generated by 100x</p>
          <p className="text-center text-xs text-white/20 mb-8">{t.demoCaption}</p>
          <div className="space-y-5">
            {DEMO_SERIES.map((series, i) => (
              <SeriesGrid key={i} series={series} />
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
