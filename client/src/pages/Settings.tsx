import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Trash2, RefreshCw } from "lucide-react";

export default function Settings() {
  const [showSecrets, setShowSecrets] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accessTokenSecret, setAccessTokenSecret] = useState("");

  const utils = trpc.useUtils();
  const { data: credentials, isLoading } = trpc.xCredentials.get.useQuery();
  
  const saveMutation = trpc.xCredentials.save.useMutation({
    onSuccess: (data) => {
      utils.xCredentials.get.invalidate();
      if (data.isValid) {
        toast.success("X API認証情報を保存しました");
      } else {
        toast.warning("認証情報を保存しましたが、認証に失敗しました。キーを確認してください。");
      }
      // Clear form
      setApiKey("");
      setApiSecret("");
      setAccessToken("");
      setAccessTokenSecret("");
    },
    onError: (error) => {
      toast.error(`保存に失敗しました: ${error.message}`);
    },
  });

  const verifyMutation = trpc.xCredentials.verify.useMutation({
    onSuccess: (data) => {
      utils.xCredentials.get.invalidate();
      if (data.isValid) {
        toast.success("認証に成功しました");
      } else {
        toast.error("認証に失敗しました。キーを確認してください。");
      }
    },
    onError: (error) => {
      toast.error(`認証確認に失敗しました: ${error.message}`);
    },
  });

  const deleteMutation = trpc.xCredentials.delete.useMutation({
    onSuccess: () => {
      utils.xCredentials.get.invalidate();
      toast.success("認証情報を削除しました");
    },
    onError: (error) => {
      toast.error(`削除に失敗しました: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      toast.error("すべての項目を入力してください");
      return;
    }
    saveMutation.mutate({ apiKey, apiSecret, accessToken, accessTokenSecret });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-foreground pb-6">
          <h1 className="text-3xl font-bold tracking-tight">X API 設定</h1>
          <p className="text-muted-foreground mt-2">
            X（Twitter）APIの認証情報を設定します
          </p>
        </div>

        {/* Current Status */}
        {credentials?.hasCredentials && (
          <Card className="border-foreground">
            <CardHeader>
              <CardTitle className="text-lg">現在の設定状態</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {credentials.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">
                      {credentials.isValid ? "認証済み" : "認証エラー"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      API Key: {credentials.apiKeyPreview}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending}
                    className="border-foreground"
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">再確認</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="ml-2">削除</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Key Form */}
        <Card className="border-foreground">
          <CardHeader>
            <CardTitle className="text-lg">
              {credentials?.hasCredentials ? "認証情報を更新" : "新規設定"}
            </CardTitle>
            <CardDescription>
              X Developer Portalから取得したAPIキーを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key (Consumer Key)</Label>
                <Input
                  id="apiKey"
                  type={showSecrets ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono border-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret (Consumer Secret)</Label>
                <Input
                  id="apiSecret"
                  type={showSecrets ? "text" : "password"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono border-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type={showSecrets ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono border-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessTokenSecret">Access Token Secret</Label>
                <Input
                  id="accessTokenSecret"
                  type={showSecrets ? "text" : "password"}
                  value={accessTokenSecret}
                  onChange={(e) => setAccessTokenSecret(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono border-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-muted">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-muted-foreground"
              >
                {showSecrets ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    非表示
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    表示
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-primary text-primary-foreground"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                保存して認証
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-foreground bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">APIキーの取得方法</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="https://developer.twitter.com/en/portal/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  X Developer Portal
                </a>
                にアクセス
              </li>
              <li>プロジェクトを作成し、アプリを追加</li>
              <li>「Keys and tokens」タブからAPIキーを取得</li>
              <li>Access TokenとAccess Token Secretを生成</li>
              <li>アプリの権限を「Read and Write」に設定</li>
            </ol>
            <div className="p-4 bg-background border border-foreground mt-4">
              <p className="text-sm font-medium">注意</p>
              <p className="text-sm text-muted-foreground mt-1">
                APIキーは安全に暗号化して保存されます。
                ツイートの投稿には「Read and Write」権限が必要です。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
