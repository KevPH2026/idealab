'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Clock, Zap, Check, Lock, Gift, Crown } from 'lucide-react';

const DEMO_STEPS = [
  {
    brand: 'GlowSkin',
    product: '72小时持妆气垫粉底',
    market: '🇺🇸 北美',
    dna: {
      colors: ['#F4A261', '#E76F51', '#2A9D8F'],
      keywords: ['luxury', 'natural glow', 'premium'],
      style: 'warm, elegant, minimal',
    },
    images: [
      { src: '/demo/beauty_01.webp', label: 'IG Feed · 1:1', scene: '晨间生活场景' },
      { src: '/demo/beauty_03.webp', label: 'Story · 9:16', scene: '开箱惊喜时刻' },
      { src: '/demo/beauty_02.webp', label: 'FB Ad · 16:9', scene: '产品平铺展示' },
      { src: '/demo/beauty_04.webp', label: 'TikTok · 9:16', scene: '使用前后对比' },
    ],
  },
  {
    brand: 'SoundWave',
    product: '主动降噪无线耳机',
    market: '🇪🇺 欧洲',
    dna: {
      colors: ['#264653', '#2A9D8F', '#E9C46A'],
      keywords: ['tech', 'minimal', 'premium'],
      style: 'cool, modern, clean',
    },
    images: [
      { src: '/demo/tech_01.webp', label: 'IG Feed · 1:1', scene: '极简产品展示' },
      { src: '/demo/tech_02.webp', label: 'Story · 9:16', scene: '户外使用场景' },
      { src: '/demo/tech_03.webp', label: 'FB Ad · 16:9', scene: '功能特写镜头' },
      { src: '/demo/tech_06.webp', label: 'Google · 16:9', scene: '生活方式融入' },
    ],
  },
  {
    brand: 'BeanCraft',
    product: '单一产地手冲咖啡豆',
    market: '🇯🇵 日本',
    dna: {
      colors: ['#6B4423', '#A0522D', '#D4A574'],
      keywords: ['artisan', 'craft', 'authentic'],
      style: 'warm, rustic, handcrafted',
    },
    images: [
      { src: '/demo/coffee_01.webp', label: 'IG Feed · 1:1', scene: '咖啡冲泡过程' },
      { src: '/demo/coffee_02.webp', label: 'Story · 9:16', scene: '豆袋质感展示' },
      { src: '/demo/coffee_03.webp', label: 'FB Ad · 16:9', scene: '早晨咖啡时光' },
      { src: '/demo/coffee_04.webp', label: 'TikTok · 9:16', scene: '拉花艺术特写' },
    ],
  },
  {
    brand: 'NovaRing',
    product: '智能健康监测戒指',
    market: '🇺🇸 北美',
    dna: {
      colors: ['#1A1A2E', '#4A4E69', '#9A8C98'],
      keywords: ['futuristic', 'health', 'sleek'],
      style: 'dark, premium, tech-forward',
    },
    images: [
      { src: '/demo/ring_01.webp', label: 'IG Feed · 1:1', scene: '产品特写展示' },
      { src: '/demo/ring_02.webp', label: 'Story · 9:16', scene: '佩戴效果展示' },
      { src: '/demo/ring_03.webp', label: 'FB Ad · 16:9', scene: '科技感场景' },
      { src: '/demo/ring_04.webp', label: 'Google · 16:9', scene: '健康数据可视化' },
    ],
  },
  {
    brand: 'FitPulse',
    product: '智能运动追踪手环',
    market: '🇪🇺 欧洲',
    dna: {
      colors: ['#E63946', '#F1FAEE', '#457B9D'],
      keywords: ['energetic', 'sporty', 'dynamic'],
      style: 'bold, active, vibrant',
    },
    images: [
      { src: '/demo/sport_01.webp', label: 'IG Feed · 1:1', scene: '运动场景展示' },
      { src: '/demo/sport_02.webp', label: 'Story · 9:16', scene: '跑步动态捕捉' },
      { src: '/demo/sport_03.webp', label: 'FB Ad · 16:9', scene: '健身房场景' },
      { src: '/demo/sport_04.webp', label: 'TikTok · 9:16', scene: '数据成就分享' },
    ],
  },
  {
    brand: 'MechX',
    product: '桌面协作机器人',
    market: '🇨🇳 中国',
    dna: {
      colors: ['#0D1B2A', '#1B263B', '#415A77'],
      keywords: ['industrial', 'precision', 'innovation'],
      style: 'mechanical, precise, futuristic',
    },
    images: [
      { src: '/demo/robot_01.webp', label: 'IG Feed · 1:1', scene: '产品外观展示' },
      { src: '/demo/robot_02.webp', label: 'Story · 9:16', scene: '工作场景演示' },
      { src: '/demo/robot_03.webp', label: 'FB Ad · 16:9', scene: '细节特写镜头' },
      { src: '/demo/robot_04.webp', label: 'Google · 16:9', scene: '团队协作画面' },
    ],
  },
];

const GALLERY_IMAGES = [
  { src: '/demo/beauty_01.webp', brand: 'GlowSkin', scene: '晨间生活场景', ratio: '1:1' },
  { src: '/demo/tech_01.webp', brand: 'SoundWave', scene: '极简产品展示', ratio: '1:1' },
  { src: '/demo/coffee_01.webp', brand: 'BeanCraft', scene: '咖啡冲泡过程', ratio: '1:1' },
  { src: '/demo/ring_01.webp', brand: 'NovaRing', scene: '产品特写展示', ratio: '1:1' },
  { src: '/demo/sport_01.webp', brand: 'FitPulse', scene: '运动场景展示', ratio: '1:1' },
  { src: '/demo/robot_01.webp', brand: 'MechX', scene: '产品外观展示', ratio: '1:1' },
  { src: '/demo/beauty_02.webp', brand: 'GlowSkin', scene: '产品平铺展示', ratio: '16:9' },
  { src: '/demo/tech_02.webp', brand: 'SoundWave', scene: '户外使用场景', ratio: '9:16' },
  { src: '/demo/coffee_02.webp', brand: 'BeanCraft', scene: '豆袋质感展示', ratio: '9:16' },
  { src: '/demo/ring_02.webp', brand: 'NovaRing', scene: '佩戴效果展示', ratio: '9:16' },
  { src: '/demo/sport_02.webp', brand: 'FitPulse', scene: '跑步动态捕捉', ratio: '9:16' },
  { src: '/demo/robot_02.webp', brand: 'MechX', scene: '工作场景演示', ratio: '9:16' },
  { src: '/demo/beauty_03.webp', brand: 'GlowSkin', scene: '开箱惊喜时刻', ratio: '9:16' },
  { src: '/demo/tech_03.webp', brand: 'SoundWave', scene: '功能特写镜头', ratio: '16:9' },
  { src: '/demo/coffee_03.webp', brand: 'BeanCraft', scene: '早晨咖啡时光', ratio: '16:9' },
  { src: '/demo/ring_03.webp', brand: 'NovaRing', scene: '科技感场景', ratio: '16:9' },
  { src: '/demo/sport_03.webp', brand: 'FitPulse', scene: '健身房场景', ratio: '16:9' },
  { src: '/demo/robot_03.webp', brand: 'MechX', scene: '细节特写镜头', ratio: '16:9' },
  { src: '/demo/beauty_04.webp', brand: 'GlowSkin', scene: '使用前后对比', ratio: '9:16' },
  { src: '/demo/tech_04.webp', brand: 'SoundWave', scene: '产品细节展示', ratio: '1:1' },
  { src: '/demo/coffee_04.webp', brand: 'BeanCraft', scene: '拉花艺术特写', ratio: '9:16' },
  { src: '/demo/ring_04.webp', brand: 'NovaRing', scene: '健康数据可视化', ratio: '16:9' },
  { src: '/demo/sport_04.webp', brand: 'FitPulse', scene: '数据成就分享', ratio: '9:16' },
  { src: '/demo/robot_04.webp', brand: 'MechX', scene: '团队协作画面', ratio: '16:9' },
  { src: '/demo/tech_05.webp', brand: 'SoundWave', scene: '包装盒展示', ratio: '1:1' },
  { src: '/demo/tech_06.webp', brand: 'SoundWave', scene: '生活方式融入', ratio: '16:9' },
  { src: '/demo/tech_07.webp', brand: 'SoundWave', scene: '配件全家福', ratio: '1:1' },
];

const PAIN_POINTS = [
  {
    icon: '⏰',
    title: '一张素材做3天',
    desc: '找参考、写brief、等设计、改稿、再改稿... 上新节奏被素材拖垮',
  },
  {
    icon: '💸',
    title: '外包一张¥300起',
    desc: '按月结算动辄上万，旺季加急还要翻倍。小公司根本烧不起',
  },
  {
    icon: '🎨',
    title: '品味和效率不可兼得',
    desc: '模板工具生成的素材千篇一律，有调性的设计又慢又贵',
  },
  {
    icon: '📱',
    title: '多平台尺寸搞到崩溃',
    desc: 'IG要1:1，Story要9:16，FB要16:9... 一张图改8个版本',
  },
];

const TESTIMONIALS = [
  {
    name: '林薇',
    role: 'DTC品牌创始人',
    brand: 'GlowSkin',
    avatar: '👩‍💼',
    content: '以前上新前一周就开始焦虑素材，现在30分钟搞定一整套。最惊喜的是AI真的懂我们的品牌调性，不是套模板。',
    metric: '素材产出速度提升 20x',
  },
  {
    name: 'Mark Chen',
    role: '跨境电商运营总监',
    brand: 'SoundWave',
    avatar: '👨‍💻',
    content: '我们测试过5个AI生图工具，100x是唯一一个能稳定输出商用级质量的。欧洲市场的素材直接能用，不需要二次修图。',
    metric: '外包成本降低 85%',
  },
  {
    name: 'Sarah Zhang',
    role: '独立站卖家',
    brand: 'BeanCraft',
    avatar: '☕',
    content: '一个人管产品、运营、客服，根本没有时间做素材。100x让我终于可以把精力放回产品和用户上。',
    metric: '每周节省 15+ 小时',
  },
];

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<string | null>(null);

  const demo = DEMO_STEPS[activeDemo];

  // Auto-play demo steps
  useEffect(() => {
    if (demoStep >= 3) return;
    const timer = setTimeout(() => setDemoStep(s => s + 1), 2000);
    return () => clearTimeout(timer);
  }, [demoStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, brand, contact }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '提交失败，请稍后重试');
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const restartDemo = () => {
    setDemoStep(0);
  };

  const filteredGallery = galleryFilter
    ? GALLERY_IMAGES.filter(img => img.brand === galleryFilter)
    : GALLERY_IMAGES;

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 overflow-x-hidden">
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50"
        style={{ background: 'rgba(5,5,7,0.85)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <span className="text-[9px] font-black text-white">100x</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white/90">100x</span>
          </a>
          <a href="/" className="text-xs text-white/30 hover:text-white/60 transition-all">← 返回首页</a>
        </div>
      </nav>

      <main className="pt-14">

        {/* ─── Hero: Hook ─── */}
        <section className="relative pt-20 pb-16 px-6">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
              <Lock className="w-3 h-3" />
              产品内测中 · 预约首批体验资格
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              <span className="text-white">DTC品牌做素材</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                不该这么痛苦
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/30 max-w-xl mx-auto leading-relaxed mb-8">
              你负责打造好产品和品牌调性，
              <span className="text-white/50"> AI负责把卖点变成能卖的素材。</span>
              <br />
              <span className="text-white/15 text-sm">品牌DNA注入 · 多平台一键生成 · 商用级品质</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowWaitlist(true)}
                className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)', padding: '14px 36px', borderRadius: '14px' }}>
                <Gift className="w-4 h-4" />
                预约首批体验 · 每天免费100张
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="text-xs text-white/15">已有 127 位卖家预约</span>
            </div>
          </div>
        </section>

        {/* ─── Pain Points ─── */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">这些场景，你熟悉吗？</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">素材是DTC的瓶颈，不是你的错</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {PAIN_POINTS.map((p, i) => (
                <div key={i} className="group p-5 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                      <p className="text-xs text-white/25 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Interactive Demo ─── */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">看它是怎么工作的</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">3步生成，30秒出图</h2>
              <p className="text-sm text-white/25">点击下方品牌，观看AI实时生成过程</p>
            </div>

            {/* Brand selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {DEMO_STEPS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveDemo(i); setDemoStep(0); }}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeDemo === i ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: activeDemo === i ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    color: activeDemo === i ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                  }}>
                  {d.brand}
                </button>
              ))}
            </div>

            {/* Demo flow */}
            <div className="rounded-2xl p-6 md:p-8"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Step 1: Brand DNA */}
              <div className={`flex items-center gap-4 mb-6 transition-all duration-500 ${demoStep >= 0 ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: demoStep >= 0 ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  {demoStep > 0 ? <Check className="w-4 h-4 text-violet-400" /> : '1'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">品牌DNA解码</p>
                  <p className="text-xs text-white/25">{demo.brand} · {demo.market}</p>
                </div>
                {demoStep >= 0 && (
                  <div className="flex items-center gap-2">
                    {demo.dna.colors.map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-md" style={{ background: c }} />
                    ))}
                    <span className="text-[10px] text-white/20 ml-2">{demo.dna.style}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Product */}
              <div className={`flex items-center gap-4 mb-6 transition-all duration-500 ${demoStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: demoStep >= 1 ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  {demoStep > 1 ? <Check className="w-4 h-4 text-violet-400" /> : '2'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">产品卖点</p>
                  <p className="text-xs text-white/25">{demo.product}</p>
                </div>
                {demoStep >= 1 && (
                  <div className="flex gap-1">
                    {demo.dna.keywords.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] text-violet-300"
                        style={{ background: 'rgba(139,92,246,0.1)' }}>{k}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Generate */}
              <div className={`flex items-center gap-4 mb-6 transition-all duration-500 ${demoStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: demoStep >= 2 ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  {demoStep > 2 ? <Check className="w-4 h-4 text-violet-400" /> : '3'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">生成素材</p>
                  <p className="text-xs text-white/25">{demoStep >= 2 ? '生成中...' : '等待中'}</p>
                </div>
                {demoStep === 2 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                    <span className="text-xs text-violet-400">AI生成中...</span>
                  </div>
                )}
              </div>

              {/* Results */}
              {demoStep >= 3 && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      生成完成 · 4张素材，覆盖全平台
                    </p>
                    <button onClick={restartDemo}
                      className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-all">
                      <Clock className="w-3 h-3" /> 重新播放
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {demo.images.map((img, i) => (
                      <div key={i} className="group relative rounded-xl overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <img src={img.src} alt={img.scene} className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 flex flex-col justify-end p-2"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}>
                          <p className="text-[10px] font-bold text-white/90">{img.label}</p>
                          <p className="text-[9px] text-white/40">{img.scene}</p>
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white/60"
                          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                          AI
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Full Gallery ─── */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">素材展示</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">27张AI生成素材，覆盖6大品类</h2>
              <p className="text-sm text-white/25">全部由100x AI生成，未经人工修图</p>
            </div>

            {/* Gallery Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <button
                onClick={() => setGalleryFilter(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: galleryFilter === null ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                  border: galleryFilter === null ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  color: galleryFilter === null ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                }}>
                全部
              </button>
              {DEMO_STEPS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryFilter(d.brand)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: galleryFilter === d.brand ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: galleryFilter === d.brand ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    color: galleryFilter === d.brand ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                  }}>
                  {d.brand}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredGallery.map((img, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src={img.src} alt={img.scene} className="w-full aspect-square object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}>
                    <p className="text-[10px] font-bold text-white/90">{img.brand}</p>
                    <p className="text-[9px] text-white/40">{img.scene}</p>
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white/60"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    {img.ratio}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">他们已经在用了</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">卖家真实反馈</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="p-6 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: 'rgba(139,92,246,0.1)' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-[11px] text-white/25">{t.role} · {t.brand}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-violet-400" />
                    <span className="text-[11px] font-medium text-violet-300">{t.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Crown className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              成为首批体验用户
            </h2>
            <p className="text-white/25 mb-2">产品正式上线后，每天免费生成100张商用级素材</p>
            <p className="text-xs text-white/15 mb-8">限时福利 · 仅限前500名预约用户</p>

            {!showWaitlist ? (
              <button
                onClick={() => setShowWaitlist(true)}
                className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 40px rgba(139,92,246,0.35)', padding: '16px 44px', borderRadius: '16px' }}>
                <Gift className="w-4 h-4" />
                立即预约 · 每天免费100张
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : !submitted ? (
              <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3 text-left">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="你的名字 *"
                  required
                  className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/15 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="品牌名称"
                  className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/15 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="手机号或邮箱 *"
                  required
                  className="w-full h-11 px-4 rounded-xl text-white placeholder:text-white/15 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>确认预约 <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl p-8 text-center"
                style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Check className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">预约成功！</h3>
                <p className="text-sm text-white/30">上线后第一时间通知你，记得查收邮件/短信</p>
              </div>
            )}
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
            <p className="text-xs text-white/8">© 2026 100x</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
