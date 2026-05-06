'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Check, Download, AlertCircle, ImagePlus, X } from 'lucide-react';

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

// Demo images for preview mode
const DEMO_IMAGES = [
  { url: '/demo/beauty_01.webp', platform: 'IG Feed', scene: '晨间生活', ratio: '1:1' },
  { url: '/demo/beauty_02.webp', platform: 'FB / Google', scene: '产品平铺', ratio: '16:9' },
  { url: '/demo/beauty_03.webp', platform: 'Story / TikTok', scene: '开箱惊喜', ratio: '9:16' },
  { url: '/demo/beauty_04.webp', platform: 'Story / TikTok', scene: '使用对比', ratio: '9:16' },
  { url: '/demo/tech_01.webp', platform: 'IG Feed', scene: '极简产品', ratio: '1:1' },
  { url: '/demo/tech_02.webp', platform: 'Story / TikTok', scene: '户外场景', ratio: '9:16' },
  { url: '/demo/tech_03.webp', platform: 'FB / Google', scene: '产品平铺', ratio: '16:9' },
  { url: '/demo/tech_06.webp', platform: 'FB / Google', scene: '户外黄金时段', ratio: '16:9' },
];

export default function GeneratePage() {
  const [step, setStep] = useState<'form' | 'generating' | 'result'>('form');
  const [brandName, setBrandName] = useState('');
  const [sellingPoint, setSellingPoint] = useState('');
  const [targetCountry, setTargetCountry] = useState('US');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<number[]>([0, 1, 2, 3]);
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; platform: string; scene: string; ratio: string }>>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const toggleScene = (idx: number) => {
    setSelectedScenes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

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

    // Demo mode: simulate generation with progress
    const results: Array<{ url: string; platform: string; scene: string; ratio: string }> = [];

    for (let i = 0; i < selectedScenes.length; i++) {
      const sceneIdx = selectedScenes[i];
      setProgress(Math.round(((i + 1) / selectedScenes.length) * 100));

      // Use demo image mapped to scene
      const demoImg = DEMO_IMAGES[sceneIdx % DEMO_IMAGES.length];
      results.push({
        url: demoImg.url,
        platform: PLATFORM_LABELS[ASPECT_RATIOS[sceneIdx]] || demoImg.platform,
        scene: SCENES[sceneIdx].label,
        ratio: ASPECT_RATIOS[sceneIdx],
      });

      // Simulate delay for realistic feel
      await new Promise(r => setTimeout(r, 800));
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

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 animate-pulse"
            style={{ boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">AI正在生成素材...</h2>
          <p className="text-white/40 mb-8">预计需要 {selectedScenes.length} 秒，请稍候</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-white/30">{progress}% · 已生成 {Math.round(progress / 100 * selectedScenes.length)}/{selectedScenes.length} 张</p>
        </div>
      </div>
    );
  }

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
            <button onClick={() => setStep('form')} className="text-xs text-white/30 hover:text-white/60 transition-all">
              ← 重新生成
            </button>
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
                    <img src={img.url} alt={img.scene}
                      className="w-full h-full object-cover" />
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
          <a href="/" className="text-xs text-white/30 hover:text-white/60 transition-all">← 返回首页</a>
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
            <p className="text-white/30">填写品牌信息，AI自动生成多平台广告素材</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">品牌参考图（可选）</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              {referenceImage ? (
                <div className="relative rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
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
              <p className="text-xs text-white/20 mt-2">已选 {selectedScenes.length} 个场景 · 预计耗时 {selectedScenes.length} 秒</p>
            </div>

            <button
              onClick={generate}
              disabled={false}
              className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
