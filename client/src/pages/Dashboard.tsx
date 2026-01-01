import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Newspaper, Send, Clock, Settings, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: credentials } = trpc.xCredentials.get.useQuery();
  const { data: history } = trpc.tweets.history.useQuery({ limit: 5 });
  const { data: schedule } = trpc.schedule.get.useQuery();

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
      </div>
    </DashboardLayout>
  );
}
