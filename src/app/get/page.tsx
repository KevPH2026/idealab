'use client';

import { useState, useRef } from 'react';
import { Sparkles, Zap, Check, Download, AlertCircle, ImagePlus, X, Loader2, Link2, Globe, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) {
    return (
      <a href="/login" className="text-xs text-white/40 hover:text-white/70 transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
        <User className="w-3 h-3" />登录
      </a>
    );
  }

  const initial = (session.user.name || session.user.email || 'U')[0].toUpperCase();
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {initial}
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl py-1 text-sm">
            <div className="px-3 py-2 border-b border-zinc-800">
              <div className="text-white/80 truncate text-xs">{session.user.email}</div>
            </div>
            <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-800 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" />我的素材库
            </a>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:bg-zinc-800 transition-colors">
              <LogOut className="w-3.5 h-3.5" />退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const SCENES = [
  { label: '晨间生活', desc: 'lifestyle morning routine, natural light' },
  { label: '户外黄金时段', desc: 'outdoor golden hour, active lifestyle' },
  { label: '开箱惊喜', desc: 'unboxing moment, excited expression' },
  { label: '使用对比', desc: 'before and after transformation' },
  { label: '产品平铺', desc: 'flat lay product photography' },
  { label: '极简产品', desc: 'minimalist product on marble' },
  { label: '促销氛围', desc: 'festive sale atmosphere' },
  { label: '户外场景', desc: 'scenic outdoor landscape' },
];

const ASPECT_RATIOS = ['1:1', '9:16', '16:9', '1:1', '2:3', '9:16', '16:9', '3:2'];

const PLATFORM_LABELS: Record<string, string> = {
  '1:1': 'IG Feed',
  '16:9': 'FB / Google',
  '9:16': 'Story / TikTok',
  '2:3': 'Pinterest',
  '3:2': 'Landscape',
};

interface ScrapeData {
  title: string;
  description: string;
  images: string[];
  brand: string;
  keywords: string[];
  price?: string;
  sourceUrl: string;
}

async function downloadImageAsBase64(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url;
  return null;
}

export default function GeneratePage() {
  const [step, setStep] = useState<'form' | 'generating' | 'result'>('form');

  // URL 解析
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeData, setScrapeData] = useState<ScrapeData | null>(null);
  const [scrapeError, setScrapeError] = useState('');
  const [selectedRefImageIdx, setSelectedRefImageIdx] = useState<number>(0);

  // 表单字段
  const [brandName, setBrandName] = useState('');
  const [sellingPoint, setSellingPoint] = useState('');
  const [targetCountry, setTargetCountry] = useState('US');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<number[]>([0, 1]);
  const [fastMode] = useState(false);

  // 生成结果
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; platform: string; scene: string; ratio: string }>>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── URL 解析 ─────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!urlInput.trim()) return;
    setIsScraping(true);
    setScrapeError('');
    setScrapeData(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setScrapeError(json.error || '解析失败');
        return;
      }

      const data: ScrapeData = json.data;
      setScrapeData(data);
      setSelectedRefImageIdx(0);

      // 自动填充表单
      if (data.brand && !brandName) setBrandName(data.brand);
      const desc = [data.title, data.description].filter(Boolean).join(' · ');
      if (desc && !sellingPoint) setSellingPoint(desc.slice(0, 200));

      // 自动选第一张图作为参考图
      if (data.images[0]) {
        setReferenceImage(data.images[0]);
      }
    } catch {
      setScrapeError('网络错误，请检查网址后重试');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSelectRefImage = (idx: number, imgUrl: string) => {
    setSelectedRefImageIdx(idx);
    setReferenceImage(imgUrl);
  };

  // ── 文件上传 ─────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('图片大小不能超过5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setScrapeData(null); // 手动上传时清除解析结果选中状态
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const toggleScene = (idx: number) => {
    setSelectedScenes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // ── 生成 ─────────────────────────────────────────────────────────
  const generate = async () => {
    if (!brandName.trim() || !sellingPoint.trim()) {
      setError('品牌名和卖点必填');
      return;
    }
    if (selectedScenes.length === 0) {
      setError('至少选择一个场景');
      return;
    }

    setStep('generating');
    setError('');
    setGeneratedImages([]);
    setProgress(0);

    // 构建 styleContext — 把关键词注入 prompt
    const styleContext = scrapeData
      ? [
          scrapeData.keywords.length ? `Keywords: ${scrapeData.keywords.join(', ')}` : '',
          scrapeData.price ? `Price point: ${scrapeData.price}` : '',
        ].filter(Boolean).join('. ')
      : '';

    const results: Array<{ url: string; platform: string; scene: string; ratio: string }> = [];

    for (let i = 0; i < selectedScenes.length; i++) {
      const sceneIdx = selectedScenes[i];
      setCurrentScene(SCENES[sceneIdx].label);
      setProgress(Math.round((i / selectedScenes.length) * 100));

      try {
        const res = await fetch('/api/adforge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: brandName.trim(),
            sellingPoint: sellingPoint.trim(),
            targetCountry,
            referenceImage,
            styleContext,
            sceneIndex: sceneIdx,
            fastMode,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(`Scene ${sceneIdx} failed:`, res.status, err);
          continue;
        }

        const data = await res.json();
        const imageUrl = data.image?.url;

        if (imageUrl) {
          const base64Url = await downloadImageAsBase64(imageUrl);
          results.push({
            url: base64Url || imageUrl,
            platform: data.image.platform || PLATFORM_LABELS[ASPECT_RATIOS[sceneIdx]] || 'Ad',
            scene: data.image.scene || SCENES[sceneIdx].label,
            ratio: data.image.ratio || ASPECT_RATIOS[sceneIdx],
          });
          setGeneratedImages([...results]);
        }
      } catch (err) {
        console.error(`Scene ${sceneIdx} error:`, err);
      }
    }

    setProgress(100);
    setGeneratedImages(results);
    setStep('result');
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // ── 生成中 ────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">AI正在生成素材...</h2>
          <p className="text-white/40 mb-2">正在生成：{currentScene}</p>
          <p className="text-white/20 text-sm mb-8">每张约30-60秒，请耐心等待</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-white/30">{progress}% · 已生成 {generatedImages.length}/{selectedScenes.length} 张</p>
          {generatedImages.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2">
              {generatedImages.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={img.url} alt={img.scene} className="w-full h-24 object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 结果页 ────────────────────────────────────────────────────────
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

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
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('form')} className="text-xs text-white/30 hover:text-white/60 transition-all">← 重新生成</button>
              <UserMenu />
            </div>
          </div>
        </nav>

        <main className="pt-20 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'rgba(74,222,128,0.9)' }}>
                <Check className="w-3 h-3" />
                生成完成
              </div>
              <h2 className="text-3xl font-black mb-2">{brandName} 的素材矩阵</h2>
              <p className="text-white/30">{generatedImages.length} 张素材 · 品牌调性统一</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {generatedImages.map((img, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="relative aspect-square">
                    <img src={img.url} alt={img.scene} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-[10px] font-medium text-white/70">{img.platform}</span>
                    </div>
                    <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/50"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                      {img.ratio}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[11px] text-white/70">{img.scene}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadImage(img.url, `${brandName}_${img.scene}_${img.ratio}.png`)}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Download className="w-3 h-3" />
                    下载
                  </button>
                </div>
              ))}
            </div>

            {generatedImages.length === 0 && (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">生成失败，请重试</p>
                <button
                  onClick={() => setStep('form')}
                  className="mt-4 px-6 py-2 rounded-xl text-sm text-white/60 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  返回重试
                </button>
              </div>
            )}

            <div className="mt-10 text-center">
              <button
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                <Zap className="w-4 h-4" />
                再生成一套
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── 表单页 ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

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
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-white/30 hover:text-white/60 transition-all">← 返回首页</a>
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
              <Sparkles className="w-3 h-3" />
              AI生成广告素材
            </div>
            <h1 className="text-3xl font-black mb-2">生成你的品牌素材</h1>
            <p className="text-white/30">粘贴产品网址，AI自动解析内容并生成多平台广告素材</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-6">

            {/* ── Step 0: URL 解析区块 ─────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.04)' }}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-white/80">从网址解析产品信息</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(196,181,253,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    推荐
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScrape()}
                      placeholder="粘贴产品页网址，例如 amazon.com/dp/..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <button
                    onClick={handleScrape}
                    disabled={isScraping || !urlInput.trim()}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                  >
                    {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isScraping ? '解析中...' : '解析'}
                  </button>
                </div>

                {scrapeError && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {scrapeError}
                  </p>
                )}
              </div>

              {/* 解析结果预览 */}
              {scrapeData && (
                <div className="px-5 pb-5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3 mt-3">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">解析成功</span>
                    <span className="text-xs text-white/20 truncate">{scrapeData.sourceUrl}</span>
                  </div>

                  {/* 提取到的图片 */}
                  {scrapeData.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] text-white/30 mb-2">选择参考图（AI将参考此图生成素材）</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {scrapeData.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectRefImage(idx, img)}
                            className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all"
                            style={{
                              border: selectedRefImageIdx === idx
                                ? '2px solid rgba(139,92,246,0.8)'
                                : '2px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <img src={img} alt={`参考图${idx + 1}`} className="w-full h-full object-cover" />
                            {selectedRefImageIdx === idx && (
                              <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'rgba(139,92,246,0.3)' }}>
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 提取到的文本信息 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {scrapeData.brand && (
                      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white/30 mb-0.5">品牌</p>
                        <p className="text-white/70 font-medium truncate">{scrapeData.brand}</p>
                      </div>
                    )}
                    {scrapeData.price && (
                      <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white/30 mb-0.5">价格</p>
                        <p className="text-white/70 font-medium truncate">{scrapeData.price}</p>
                      </div>
                    )}
                    {scrapeData.keywords.length > 0 && (
                      <div className="col-span-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white/30 mb-1.5">关键词</p>
                        <div className="flex flex-wrap gap-1">
                          {scrapeData.keywords.slice(0, 6).map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: 'rgba(139,92,246,0.1)', color: 'rgba(196,181,253,0.7)', border: '1px solid rgba(139,92,246,0.15)' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/20">
                    <ChevronDown className="w-3 h-3" />
                    品牌名和卖点已自动填入下方，可直接修改
                  </div>
                </div>
              )}
            </div>

            {/* ── 品牌名 ─────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">品牌名称 *</label>
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="例如：GlowSkin"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* ── 产品卖点 ────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">产品卖点 *</label>
              <textarea
                value={sellingPoint}
                onChange={e => setSellingPoint(e.target.value)}
                placeholder="例如：72小时持妆气垫粉底，轻薄透气不脱妆"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* ── 目标市场 ────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">目标市场</label>
              <select
                value={targetCountry}
                onChange={e => setTargetCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="US">🇺🇸 美国</option>
                <option value="EU">🇪🇺 欧洲</option>
                <option value="JP">🇯🇵 日本</option>
                <option value="CN">🇨🇳 中国</option>
                <option value="UK">🇬🇧 英国</option>
                <option value="CA">🇨🇦 加拿大</option>
                <option value="AU">🇦🇺 澳洲</option>
                <option value="SG">🇸🇬 新加坡</option>
              </select>
            </div>

            {/* ── 参考图（手动上传，当没有从URL解析到图时显示） */}
            {!scrapeData && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">品牌参考图（可选）</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                {referenceImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={referenceImage} alt="参考图" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-xl flex flex-col items-center gap-2 transition-all hover:bg-white/[0.03]"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)' }}
                  >
                    <ImagePlus className="w-8 h-8 text-white/20" />
                    <span className="text-sm text-white/30">点击上传品牌参考图</span>
                    <span className="text-xs text-white/15">支持 JPG/PNG，最大 5MB</span>
                  </button>
                )}
              </div>
            )}

            {/* ── 场景选择 ────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">选择生成场景 *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SCENES.map((scene, i) => (
                  <button
                    key={i}
                    onClick={() => toggleScene(i)}
                    className="relative p-3 rounded-xl text-xs text-center transition-all"
                    style={{
                      background: selectedScenes.includes(i) ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                      border: selectedScenes.includes(i) ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      color: selectedScenes.includes(i) ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {selectedScenes.includes(i) && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                    <div className="font-medium mb-0.5">{scene.label}</div>
                    <div className="text-[10px] opacity-50">{ASPECT_RATIOS[i]}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/20 mt-2">已选 {selectedScenes.length} 个场景 · 每张约30-60秒</p>
            </div>

            {/* ── 生成按钮 ────────────────────────────────────────── */}
            <button
              onClick={generate}
              className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                boxShadow: '0 0 30px rgba(139,92,246,0.3)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                开始生成素材
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
