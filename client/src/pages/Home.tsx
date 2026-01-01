import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, Zap, Clock, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  }, [title, description]);
}

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  useSEO(
    'AI News Auto Tweeter | 最新AIニュース自動要約ツイート投稿',
    'AI関連ニュースを自動取得し、LLMで要約してX（Twitter）に自動投稿するWebアプリ。無料で始められます。'
  );

  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden SEO keywords section */}
      <div className="sr-only">
        <h1>AI News Auto Tweeter - 最新AIニュース自動要約ツイート投稿ツール</h1>
        <p>AI関連ニュースを自動取得し、LLMで要約してX（Twitter）に自動投稿するWebアプリケーション。人工知能、機械学習、ChatGPT、OpenAIなどの最新ニュースを効率的に自動化。</p>
      </div>
      {/* Header */}
      <header className="border-b border-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary" />
            <span className="text-lg font-bold tracking-tight">AI News Tweeter</span>
          </div>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            ログイン
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-foreground">
        <div className="container py-24 md:py-32">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-8">
                AI<span className="text-primary">ニュース</span>を
                <br />
                自動でツイート
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                最新のAI関連ニュースを自動取得し、LLMで要約。
                あなたのXアカウントに自動投稿します。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => window.location.href = getLoginUrl()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg"
                >
                  今すぐ始める
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="md:col-span-5 flex justify-end">
              <div className="w-48 h-48 md:w-64 md:h-64 bg-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-b border-foreground">
        <div className="container py-20">
          <div className="grid md:grid-cols-3 gap-0 border border-foreground">
            {/* Feature 1 */}
            <div className="p-8 border-r border-foreground">
              <div className="w-12 h-12 bg-primary flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-4">自動ニュース取得</h3>
              <p className="text-muted-foreground leading-relaxed">
                AIと機械学習に関する最新ニュースをリアルタイムで自動収集。
                常に最新情報をキャッチアップ。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 border-r border-foreground">
              <div className="w-12 h-12 bg-foreground flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">LLM要約生成</h3>
              <p className="text-muted-foreground leading-relaxed">
                高度な言語モデルがニュースを分析し、
                Twitter向けの簡潔な要約を自動生成。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8">
              <div className="w-12 h-12 bg-primary flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-4">スケジュール投稿</h3>
              <p className="text-muted-foreground leading-relaxed">
                投稿頻度や時間帯を自由に設定。
                完全自動化でSNS運用を効率化。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-b border-foreground">
        <div className="container py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">使い方</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "ログイン", desc: "Manusアカウントでログイン" },
              { step: "02", title: "X API設定", desc: "APIキーを登録" },
              { step: "03", title: "スケジュール設定", desc: "投稿頻度を選択" },
              { step: "04", title: "自動投稿開始", desc: "あとはお任せ" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-muted-foreground/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 w-8 h-px bg-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-foreground text-background">
        <div className="container py-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                今すぐ始めましょう
              </h2>
              <p className="text-background/70 text-lg">
                無料でアカウントを作成し、AI ニュースの自動投稿を開始
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg"
            >
              無料で始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary" />
              <span className="font-bold">AI News Tweeter</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 AI News Auto Tweeter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
