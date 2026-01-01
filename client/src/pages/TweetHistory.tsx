import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Trash2, ExternalLink, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TweetHistory() {
  const utils = trpc.useUtils();
  const { data: history, isLoading, refetch, isRefetching } = trpc.tweets.history.useQuery({ limit: 100 });

  const deleteMutation = trpc.tweets.delete.useMutation({
    onSuccess: () => {
      utils.tweets.history.invalidate();
      toast.success("履歴を削除しました");
    },
    onError: (error) => {
      toast.error(`削除に失敗しました: ${error.message}`);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "posted":
        return "投稿済み";
      case "failed":
        return "失敗";
      default:
        return "保留中";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ja-JP", {
      year: "numeric",
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
            <h1 className="text-3xl font-bold tracking-tight">ツイート履歴</h1>
            <p className="text-muted-foreground mt-2">
              過去のツイート投稿履歴を確認できます
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

        {/* Stats Summary */}
        {history && history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 border border-foreground p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{history.length}</div>
              <div className="text-sm text-muted-foreground">総数</div>
            </div>
            <div className="text-center border-x border-foreground">
              <div className="text-2xl font-bold text-green-600">
                {history.filter(t => t.status === "posted").length}
              </div>
              <div className="text-sm text-muted-foreground">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {history.filter(t => t.status === "failed").length}
              </div>
              <div className="text-sm text-muted-foreground">失敗</div>
            </div>
          </div>
        )}

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map((tweet) => (
              <Card key={tweet.id} className="border-foreground">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className="shrink-0 pt-1">
                      <div className={`w-3 h-3 ${
                        tweet.status === "posted" ? "bg-green-500" :
                        tweet.status === "failed" ? "bg-destructive" : "bg-yellow-500"
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm">{tweet.content}</p>
                      
                      {tweet.originalNewsTitle && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>元記事:</span>
                          <span className="truncate">{tweet.originalNewsTitle}</span>
                          {tweet.originalNewsUrl && (
                            <a
                              href={tweet.originalNewsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {tweet.errorMessage && (
                        <div className="p-2 bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                          エラー: {tweet.errorMessage}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-muted">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(tweet.status)}
                          <span>{getStatusText(tweet.status)}</span>
                        </div>
                        <span>{formatDate(tweet.createdAt)}</span>
                        {tweet.tweetId && (
                          <a
                            href={`https://twitter.com/i/web/status/${tweet.tweetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Xで見る
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-foreground">
                          <AlertDialogHeader>
                            <AlertDialogTitle>履歴を削除</AlertDialogTitle>
                            <AlertDialogDescription>
                              この履歴を削除しますか？この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-foreground">
                              キャンセル
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: tweet.id })}
                              className="bg-destructive text-destructive-foreground"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-muted">
            <p className="text-muted-foreground">ツイート履歴がありません</p>
            <p className="text-sm text-muted-foreground mt-2">
              ニュースフィードからツイートを投稿してみましょう
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
