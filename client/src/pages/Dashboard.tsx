import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Newspaper, Send, Clock, Settings, ArrowRight, CheckCircle, XCircle, AlertCircle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [summary, setSummary] = useState("");
  
  const { data: credentials } = trpc.xCredentials.get.useQuery();
  const { data: history } = trpc.tweets.history.useQuery({ limit: 5 });
  const { data: schedule } = trpc.schedule.get.useQuery();
  const { data: news, isLoading: newsLoading, refetch: refetchNews } = trpc.news.fetch.useQuery();
  const refreshNewsMutation = trpc.news.refresh.useMutation({
    onSuccess: (data: any) => {
      try {
        if (Array.isArray(data)) {
          toast.success(`${data.length}件のニュースを取得しました`);
        } else {
          toast.success("ニュースを取得しました");
        }
        const utils = trpc.useUtils();
        utils.news.fetch.invalidate();
        utils.news.fetch.refetch();
      } catch (err) {
        console.error("Error in refreshNewsMutation onSuccess:", err);
      }
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "不明なエラー";
      console.error("Refresh mutation error:", error);
      toast.error(`ニュース更新に失敗しました: ${errorMsg}`);
    },
  });
  
  const summarizeMutation = trpc.news.summarize.useMutation({
    onSuccess: (data) => {
      const summaryText = typeof data.summary === 'string' ? data.summary : '';
      setSummary(summaryText);
      setIsPreviewOpen(true);
    },
    onError: (error) => {
      toast.error(`要約生成に失敗しました: ${error.message}`);
    },
  });
  
  const postMutation = trpc.tweets.post.useMutation({
    onSuccess: () => {
      toast.success("ツイートを投稿しました！");
      setIsPreviewOpen(false);
      setSummary("");
      setSelectedNews(null);
      trpc.useUtils().tweets.history.invalidate();
    },
    onError: (error) => {
      toast.error(`投稿に失敗しました: ${error.message}`);
    },
  });
  
  const handleQuickPost = (newsItem: any) => {
    setSelectedNews(newsItem);
    summarizeMutation.mutate({
      title: newsItem.title,
      description: newsItem.description,
      url: newsItem.url,
    });
  };
  
  const handlePost = () => {
    if (!summary.trim()) {
      toast.error("ツイート内容を入力してください");
      return;
    }
    if (!credentials?.hasCredentials) {
      toast.error("X API認証情報を設定してください");
      return;
    }
    postMutation.mutate({
      content: summary,
      newsTitle: selectedNews?.title,
      newsUrl: selectedNews?.url,
    });
  };

  const stats = {
    totalTweets: history?.length ?? 0,
    successfulTweets: history?.filter(t => t.status === "posted").length ?? 0,
    failedTweets: history?.filter(t => t.status === "failed").length ?? 0,
    pendingTweets: history?.filter(t => t.status === "pending").length ?? 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-foreground pb-6">
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground mt-2">
            ようこそ、{user?.name ?? "ユーザー"}さん
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Send className="h-4 w-4" />
                総ツイート数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTweets}</div>
            </CardContent>
          </Card>

          <Card className="border-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                投稿成功
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.successfulTweets}</div>
            </CardContent>
          </Card>

          <Card className="border-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                投稿失敗
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.failedTweets}</div>
            </CardContent>
          </Card>

          <Card className="border-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                保留中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingTweets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* API Status */}
          <Card className="border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                X API 設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${credentials?.hasCredentials ? "bg-green-500" : "bg-destructive"}`} />
                <span className="text-sm">
                  {credentials?.hasCredentials ? "設定済み" : "未設定"}
                </span>
              </div>
              {credentials?.hasCredentials && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${credentials.isValid ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-sm">
                    {credentials.isValid ? "認証OK" : "要確認"}
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full border-foreground"
                onClick={() => setLocation("/settings")}
              >
                設定を開く
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Status */}
          <Card className="border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                スケジュール
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${schedule?.isEnabled ? "bg-green-500" : "bg-muted-foreground"}`} />
                <span className="text-sm">
                  {schedule?.isEnabled ? "自動投稿ON" : "自動投稿OFF"}
                </span>
              </div>
              {schedule?.isEnabled && (
                <p className="text-sm text-muted-foreground">
                  頻度: {schedule.frequency === "hourly" ? "毎時" : 
                         schedule.frequency === "every_3_hours" ? "3時間ごと" :
                         schedule.frequency === "every_6_hours" ? "6時間ごと" : "毎日"}
                </p>
              )}
              <Button 
                variant="outline" 
                className="w-full border-foreground"
                onClick={() => setLocation("/schedule")}
              >
                設定を開く
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* News Feed */}
          <Card className="border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                ニュースフィード
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                最新のAIニュースを取得し、要約を生成してツイートできます。
              </p>
              <Button 
                className="w-full bg-primary text-primary-foreground"
                onClick={() => setLocation("/news")}
              >
                ニュースを見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Manual Post Section */}
        <Card className="border-foreground">
          <CardHeader className="border-b border-muted pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              手動投稿
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!credentials?.hasCredentials ? (
              <div className="p-4 bg-muted/30 border border-foreground text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  手動投稿を使用するには、X API認証情報を設定してください。
                </p>
                <Button 
                  size="sm"
                  variant="outline"
                  className="border-foreground"
                  onClick={() => setLocation("/settings")}
                >
                  設定を開く
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    最新のニュースから選択して、即座にツイートを投稿できます。
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refreshNewsMutation.mutate()}
                    disabled={newsLoading || refreshNewsMutation.isPending}
                    className="text-muted-foreground"
                  >
                    {newsLoading || refreshNewsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {newsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : news && news.length > 0 ? (
                  <div className="space-y-3">
                    {news.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 border border-muted hover:border-foreground transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {item.source} • {new Date(item.publishedAt).toLocaleString("ja-JP", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleQuickPost(item)}
                            disabled={summarizeMutation.isPending && selectedNews?.id === item.id}
                            className="shrink-0 bg-primary text-primary-foreground"
                          >
                            {summarizeMutation.isPending && selectedNews?.id === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            <span className="ml-2">投稿</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">ニュースが見つかりませんでした</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tweets */}
        {history && history.length > 0 && (
          <Card className="border-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近のツイート</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/history")}
              >
                すべて見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.slice(0, 3).map((tweet) => (
                  <div key={tweet.id} className="border-b border-muted pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm line-clamp-2">{tweet.content}</p>
                      <div className={`shrink-0 w-2 h-2 mt-2 ${
                        tweet.status === "posted" ? "bg-green-500" :
                        tweet.status === "failed" ? "bg-destructive" : "bg-yellow-500"
                      }`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(tweet.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-lg border-foreground">
            <DialogHeader>
              <DialogTitle>ツイートプレビュー</DialogTitle>
              <DialogDescription>
                内容を確認・編集してから投稿できます
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedNews && (
                <div className="p-3 bg-muted/30 border border-muted">
                  <p className="text-xs text-muted-foreground mb-1">元記事</p>
                  <p className="text-sm font-medium">{selectedNews.title}</p>
                </div>
              )}
              <div className="space-y-2">
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                  className="resize-none border-foreground"
                  placeholder="ツイート内容..."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>文字数: {summary.length}</span>
                  <span className={summary.length > 280 ? "text-destructive" : ""}>
                    {summary.length > 280 ? "280文字を超えています" : `残り ${280 - summary.length} 文字`}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="border-foreground"
              >
                キャンセル
              </Button>
              <Button
                onClick={handlePost}
                disabled={postMutation.isPending || summary.length > 280 || !credentials?.hasCredentials}
                className="bg-primary text-primary-foreground"
              >
                {postMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                投稿する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
