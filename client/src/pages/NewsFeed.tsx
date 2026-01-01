import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2, Sparkles, Send, ExternalLink, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

export default function NewsFeed() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [summary, setSummary] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: news, isLoading, refetch, isRefetching } = trpc.news.fetch.useQuery();
  const { data: credentials } = trpc.xCredentials.get.useQuery();

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
      utils.tweets.history.invalidate();
    },
    onError: (error) => {
      toast.error(`投稿に失敗しました: ${error.message}`);
    },
  });

  const handleSummarize = (item: NewsItem) => {
    setSelectedNews(item);
    summarizeMutation.mutate({
      title: item.title,
      description: item.description,
      url: item.url,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-foreground pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ニュースフィード</h1>
            <p className="text-muted-foreground mt-2">
              最新のAI関連ニュースを取得し、要約を生成します
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-foreground"
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            更新
          </Button>
        </div>

        {/* API Warning */}
        {!credentials?.hasCredentials && (
          <div className="p-4 border border-foreground bg-muted/30">
            <p className="text-sm font-medium">X API認証情報が未設定です</p>
            <p className="text-sm text-muted-foreground mt-1">
              ツイートを投稿するには、設定ページでAPIキーを登録してください。
            </p>
          </div>
        )}

        {/* News List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : news && news.length > 0 ? (
          <div className="grid gap-4">
            {news.map((item) => (
              <Card key={item.id} className="border-foreground">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-tight">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{item.source}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 bg-primary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-muted">
                    <Button
                      size="sm"
                      onClick={() => handleSummarize(item)}
                      disabled={summarizeMutation.isPending && selectedNews?.id === item.id}
                      className="bg-primary text-primary-foreground"
                    >
                      {summarizeMutation.isPending && selectedNews?.id === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      要約を生成
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.url, "_blank")}
                      className="border-foreground"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      記事を読む
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">ニュースが見つかりませんでした</p>
          </div>
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
