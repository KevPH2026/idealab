'use client';

import { useState, useRef } from 'react';
import {
  Sparkles, ArrowRight, Loader2, Download, RotateCcw,
  Package, Globe, ChevronRight, Upload,
  Eye, X, Link, Check,
} from 'lucide-react';

type Step = 1 | 2 | 3;

interface GeneratedImage { url: string; platform: string; scene: string; }

interface BrandDNA {
  brandName?: string;
  colors: { primary: string; secondary: string; accent: string; palette: string[] };
  style: { mood: string; tone: string; aesthetic: string; photography: string; typography: string };
  keywords: string[];
  description: string;
  targetAudience?: string;
  industry?: string;
}

const TARGET_MARKETS = [
  { code: 'US', label: '北美', flag: '🇺🇸' },
  { code: 'EU', label: '欧洲', flag: '🇪🇺' },
  { code: 'JP', label: '日本', flag: '🇯🇵' },
  { code: 'KR', label: '韩国', flag: '🇰🇷' },
  { code: 'SEA', label: '东南亚', flag: '🌏' },
  { code: 'ME', label: '中东', flag: '🕌' },
  { code: 'LATAM', label: '拉美', flag: '🌎' },
];

export default function AdForgePage() {
  const [step, setStep] = useState<Step>(1);
  const [brandName, setBrandName] = useState('');
  const [targetCountry, setTargetCountry] = useState('US');
  const [sellingPoint, setSellingPoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const [dna, setDna] = useState<BrandDNA | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);
  const [dnaError, setDnaError] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setPreviewSrc(dataUri);
      analyzeImage(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    setDnaLoading(true);
    setDnaError('');
    setDna(null);
    try {
      // 直接传URL给后端分析（后端会下载图片）
      setPreviewSrc(imageUrl.trim());
      const res = await fetch('/api/brand-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '分析失败');
      }
      const data = await res.json();
      setDna(data.dna);
      // 如果后端返回了base64图片，更新预览
      if (data.imageData) {
        setPreviewSrc(data.imageData);
      }
    } catch (e: any) {
      setDnaError(e?.message || '图片分析失败');
    } finally {
      setDnaLoading(false);
    }
  };

  const analyzeImage = async (img: string) => {
    setDnaLoading(true);
    setDnaError('');
    setDna(null);
    try {
      const res = await fetch('/api/brand-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '分析失败');
      }
      const data = await res.json();
      setDna(data.dna);
      if (data.dna.brandName && !brandName) {
        setBrandName(data.dna.brandName);
      }
    } catch (err: any) {
      setDnaError(err?.message || '品牌DNA分析失败');
    } finally {
      setDnaLoading(false);
    }
  };

  const canStep1 = brandName.trim().length >= 1 && (dna !== null || previewSrc);
  const canStep2 = sellingPoint.trim().length >= 2;

  const generate = async () => {
    setLoading(true);
    setError('');
    setImages([]);
    setStep(3);
    try {
      const brandColors = dna?.colors?.palette?.slice(0, 3) || [];
      const styleContext = dna ? [
        `Brand style: ${dna.style.mood}, ${dna.style.tone}, ${dna.style.aesthetic}`,
        `Photography style: ${dna.style.photography}`,
        `Keywords: ${dna.keywords?.join(', ')}`,
        `Brand DNA summary: ${dna.description}`,
      ].join('. ') : '';

      const basePayload = {
        brandName: brandName.trim(),
        brandColors,
        sellingPoint: sellingPoint.trim(),
        targetCountry,
        styleContext,
        referenceImage: previewSrc || undefined,
      };

      // 逐张请求，每张独立，流式追加到images
      const sceneCount = 8;
      let failCount = 0;
      for (let i = 0; i < sceneCount; i++) {
        try {
          const res = await fetch('/api/adforge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...basePayload, sceneIndex: i }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            failCount++;
            continue;
          }
          const data = await res.json();
          if (data.image) {
            setImages(prev => [...prev, data.image]);
          }
        } catch {
          failCount++;
        }
      }

      if (failCount === sceneCount) {
        setError('全部生成失败，请稍后重试');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '出错了');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, i: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName}-${i + 1}.png`;
    a.click();
  };

  const reset = () => { setStep(1); setImages([]); setError(''); };
  const restartFromStep2 = () => { setStep(2); setImages([]); setError(''); };

  const clearImage = () => {
    setPreviewSrc('');
    setDna(null);
    setDnaError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 overflow-x-hidden">

      {/* 点阵网格背景 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* 渐变光晕 */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed top-[200px] right-[-300px] w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      {/* ─── 顶部导航 ─── */}
      <header className="fixed top-0 inset-x-0 z-50"
        style={{ background: 'rgba(5,5,7,0.8)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <span className="text-[9px] font-black text-white">100x</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white/90">100x</span>
          </a>
          <div className="flex items-center gap-1 text-[11px] font-medium">
            {[
              { n: 1, label: '品牌DNA' },
              { n: 2, label: '产品' },
              { n: 3, label: '素材' },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center">
                {i > 0 && <ChevronRight className="w-3 h-3 text-white/15 mx-0.5" />}
                <span className={`px-2 py-0.5 rounded-full transition-all ${
                  step === s.n ? 'bg-violet-500/10 text-violet-300' :
                  step > s.n ? 'text-violet-400/60' : 'text-white/20'
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-14 relative">

        {/* ─── 第一步：品牌DNA ─── */}
        {step === 1 && (
          <div className="min-h-[calc(100vh-56px)] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
              <div className="max-w-lg w-full flex flex-col items-center text-center">

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <Eye className="w-7 h-7 text-violet-400" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">品牌DNA解码</h1>
                <p className="text-white/30 text-sm mb-8 max-w-xs leading-relaxed">
                  上传一张你的品牌风格图，AI自动提取品牌DNA
                </p>

                {/* Slogan */}
                <p className="text-sm font-bold mb-8 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  你的广告素材，我们包了
                </p>

                {/* 模式切换 */}
                <div className="flex rounded-xl p-1 mb-6 w-full max-w-xs"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => setInputMode('upload')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === 'upload' ? 'bg-violet-500/10 text-violet-300' : 'text-white/30'
                    }`}>
                    <Upload className="w-3.5 h-3.5" /> 上传图片
                  </button>
                  <button onClick={() => setInputMode('url')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === 'url' ? 'bg-violet-500/10 text-violet-300' : 'text-white/30'
                    }`}>
                    <Link className="w-3.5 h-3.5" /> 图片链接
                  </button>
                </div>

                {/* 上传区域 */}
                {inputMode === 'upload' && !previewSrc && (
                  <label className="w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group mb-6"
                    style={{ borderColor: 'rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.02)' }}>
                    <Upload className="w-8 h-8 text-white/15 group-hover:text-violet-400/60 transition-all mb-2" />
                    <span className="text-xs text-white/25">点击上传品牌风格参考图</span>
                    <span className="text-[10px] text-white/12 mt-1">支持 JPG / PNG / WebP</span>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}

                {/* 链接输入 */}
                {inputMode === 'url' && !previewSrc && (
                  <div className="w-full flex gap-2 mb-6">
                    <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                      placeholder="粘贴图片链接"
                      className="flex-1 h-11 px-4 rounded-xl text-white placeholder:text-white/15 text-sm focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()} />
                    <button onClick={handleUrlSubmit} disabled={!imageUrl.trim()}
                      className="h-11 px-4 rounded-xl text-white text-sm font-bold disabled:opacity-30 transition-all"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                      分析
                    </button>
                  </div>
                )}

                {/* 预览 + DNA 结果 */}
                {previewSrc && (
                  <div className="w-full mb-6">
                    <div className="flex gap-4">
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ border: '1px solid rgba(139,92,246,0.15)' }}>
                        <img src={previewSrc} alt="品牌参考图" className="w-full h-full object-cover" />
                        <button onClick={clearImage}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-violet-600 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        {dnaLoading && (
                          <div className="flex items-center gap-2 text-white/40">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span className="text-xs">正在解码品牌DNA...</span>
                          </div>
                        )}
                        {dnaError && <div className="text-xs text-rose-400">{dnaError}</div>}
                        {dna && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">提取色板</p>
                              <div className="flex gap-1.5">
                                {dna.colors.palette.map((c, i) => (
                                  <div key={i} className="w-6 h-6 rounded-md" style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">风格关键词</p>
                              <div className="flex flex-wrap gap-1">
                                {dna.keywords.map((k, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium text-violet-300"
                                    style={{ background: 'rgba(139,92,246,0.1)' }}>{k}</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-white/35 leading-relaxed">{dna.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 品牌名称 + 目标市场 */}
                <div className="w-full flex flex-col gap-3 text-left">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">品牌名称</label>
                    <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)}
                      placeholder="如 GlowSkin"
                      className="w-full h-10 px-4 rounded-xl text-white placeholder:text-white/15 text-sm focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-2">目标市场</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TARGET_MARKETS.map(m => (
                        <button key={m.code} onClick={() => setTargetCountry(m.code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            targetCountry === m.code ? 'text-violet-300' : 'text-white/30 hover:text-white/50'
                          }`}
                          style={targetCountry === m.code ? {
                            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                          } : {
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                          }}>
                          {m.flag} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => canStep1 && setStep(2)} disabled={!canStep1 || dnaLoading}
                    className="w-full h-11 mt-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
                    下一步 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 第二步：产品卖点 ─── */}
        {step === 2 && (
          <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <Package className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">产品卖点</h2>
                <p className="text-sm text-white/30">一句话说清楚，AI结合品牌DNA生成广告素材</p>
              </div>

              {dna && (
                <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <div className="flex gap-1">
                    {dna.colors.palette.slice(0, 4).map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded" style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <div className="text-xs text-white/30 flex-1 truncate">{dna.style.mood} · {dna.style.aesthetic}</div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <textarea value={sellingPoint} onChange={e => setSellingPoint(e.target.value)}
                    placeholder="如：72小时持妆不脱粉，一瓶搞定底妆+遮瑕+定妆"
                    rows={3} maxLength={300}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/15 text-sm focus:outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[11px] text-white/15">越具体效果越好</span>
                    <span className="text-[11px] text-white/15">{sellingPoint.length}/300</span>
                  </div>
                </div>

                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Globe className="w-4 h-4 text-white/20 shrink-0" />
                  <div className="text-xs">
                    <span className="text-white/30">目标市场：</span>
                    <span className="text-white/50">
                      {TARGET_MARKETS.find(m => m.code === targetCountry)?.flag}{' '}
                      {TARGET_MARKETS.find(m => m.code === targetCountry)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button onClick={() => setStep(1)}
                    className="h-11 px-5 rounded-xl text-sm text-white/35 hover:text-white/60 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    返回
                  </button>
                  <button onClick={() => canStep2 && generate()} disabled={!canStep2}
                    className="flex-1 h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.25)' }}>
                    <Sparkles className="w-4 h-4" /> 生成素材
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 第三步：结果 ─── */}
        {step === 3 && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            {loading && images.length === 0 && (
              <div className="flex flex-col items-center gap-6 py-24">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <Sparkles className="w-7 h-7 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white mb-1">正在用品牌DNA生成广告素材</p>
                  <p className="text-sm text-white/25">逐张生成中，每张约30-60秒...</p>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[0,1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {(loading || images.length > 0) && images.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {loading ? `生成中... (${images.length}/8)` : '生成完成'}
                    </h2>
                    <p className="text-sm text-white/25 mt-0.5">{images.length} 张品牌广告素材{loading ? '已就绪' : ''}</p>
                  </div>
                  {!loading && (
                    <div className="flex gap-2">
                      <button onClick={restartFromStep2}
                        className="px-3.5 h-9 rounded-lg text-sm text-white/35 hover:text-white/60 flex items-center gap-1.5 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <RotateCcw className="w-3.5 h-3.5" /> 换一版
                      </button>
                      <button onClick={reset}
                        className="px-3.5 h-9 rounded-lg text-sm text-white/35 hover:text-white/60 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        新建
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-md mx-auto rounded-2xl p-8 text-center"
                style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <p className="text-rose-300 font-medium mb-4">{error}</p>
                <div className="flex gap-2.5 justify-center">
                  <button onClick={restartFromStep2}
                    className="px-4 h-9 rounded-lg text-sm text-white/40 hover:text-white/70 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    修改信息
                  </button>
                  <button onClick={generate}
                    className="px-4 h-9 rounded-lg text-white text-sm font-medium transition-all"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    重试
                  </button>
                </div>
              </div>
            )}

            {images.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="group relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`${brandName} 广告素材 ${i+1}`} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3.5">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur text-white/70">{img.platform}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur text-white/70">{img.scene}</span>
                        </div>
                        <button onClick={() => downloadImage(img.url, i)}
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-medium transition-all">
                          <Download className="w-3.5 h-3.5" /> 下载
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
