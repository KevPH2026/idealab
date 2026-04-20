"use client";

import { useWizardStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Check } from "lucide-react";

const PROGRESS_LABELS = ["解析素材", "提炼卖点", "生成文案", "绘制设计"];

export function Step5Generating() {
  const { generationProgress, isGenerating, copyOptions, designResults, setStep, reset } = useWizardStore();

  if (!isGenerating && copyOptions.length === 0) {
    // Generation failed or not started - show error state
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20">
        <div className="text-4xl">😕</div>
        <h2 className="text-2xl font-bold">生成遇到问题</h2>
        <p className="text-muted-foreground">请检查网络连接后重试</p>
        <Button onClick={() => { setStep(4); }}>重新尝试</Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-8 py-20">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI 正在生成中...</h2>
          <p className="text-muted-foreground">预计需要 30-60 秒，请稍候</p>
        </div>

        <div className="space-y-4">
          <Progress value={generationProgress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {PROGRESS_LABELS[Math.floor(generationProgress / 25)]}...
          </p>
        </div>

        <div className="flex justify-center gap-8 mt-10">
          {PROGRESS_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                generationProgress > i * 25 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {generationProgress > i * 25 ? "✓" : i + 1}
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Check className="w-4 h-4" /> 生成完成
        </div>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>文案 {copyOptions.length} 条</span>
          <span>设计稿 {designResults.length} 张</span>
        </div>
      </div>

      <Tabs defaultValue="designs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="designs">📐 设计稿</TabsTrigger>
          <TabsTrigger value="copy">✍️ 文案</TabsTrigger>
        </TabsList>

        <TabsContent value="designs" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {designResults.map((d) => (
              <Card key={d.id} className="overflow-hidden">
                <img src={d.imageUrl} alt="设计稿" className="w-full aspect-square object-cover" />
                <div className="p-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => window.open(d.imageUrl)}>
                    <Download className="w-3 h-3 mr-1" /> 下载
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="copy" className="mt-4 space-y-3">
          {copyOptions.map((c, i) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">方案 {i + 1}</span>
                <Button size="sm" variant="outline">
                  <Check className="w-3 h-3 mr-1" /> 使用这条
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">主标题</span>
                  <p className="font-bold">{c.headline}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">副标题</span>
                  <p className="text-sm">{c.subheadline}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">正文</span>
                  <p className="text-sm text-secondary-foreground">{c.body}</p>
                </div>
                {c.cta && (
                  <div>
                    <span className="text-xs text-muted-foreground">行动号召</span>
                    <p className="text-sm font-medium text-primary">{c.cta}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="secondary" onClick={() => setStep(4)}>← 修改</Button>
        <Button variant="outline" onClick={reset}>开始新创作</Button>
      </div>
    </div>
  );
}
