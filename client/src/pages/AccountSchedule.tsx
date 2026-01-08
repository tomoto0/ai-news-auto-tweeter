import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Clock, AlertCircle } from "lucide-react";

export default function AccountSchedule() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [accountId, setAccountId] = useState<number | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [preferredHour, setPreferredHour] = useState(9);
  const [timezone, setTimezone] = useState("Asia/Tokyo");
  const [maxTweetsPerDay, setMaxTweetsPerDay] = useState(5);

  // Get account ID from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("accountId");
    if (id) {
      setAccountId(parseInt(id, 10));
    }
  }, []);

  const { data: account, isLoading: accountLoading } = trpc.accounts.get.useQuery(
    { accountId: accountId! },
    { enabled: !!accountId }
  );

  const { data: schedule, isLoading: scheduleLoading } = trpc.accountSchedules.get.useQuery(
    { accountId: accountId! },
    { enabled: !!accountId }
  );

  const saveMutation = trpc.accountSchedules.save.useMutation({
    onSuccess: () => {
      toast.success("スケジュール設定を保存しました");
    },
    onError: (error) => {
      toast.error(`保存に失敗しました: ${error.message}`);
    },
  });

  // Initialize form with schedule data
  useEffect(() => {
    if (schedule) {
      setIsEnabled(schedule.isEnabled);
      setFrequency(schedule.frequency || "daily");
      setPreferredHour(schedule.preferredHour || 9);
      setTimezone(schedule.timezone || "Asia/Tokyo");
      setMaxTweetsPerDay(schedule.maxTweetsPerDay || 5);
    }
  }, [schedule]);

  const handleSave = () => {
    if (!accountId) {
      toast.error("アカウントIDが見つかりません");
      return;
    }

    saveMutation.mutate({
      accountId,
      isEnabled,
      frequency: frequency as "hourly" | "every_3_hours" | "every_6_hours" | "daily",
      preferredHour,
      timezone,
      maxTweetsPerDay,
    });
  };

  if (accountLoading || scheduleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/accounts")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">アカウントが見つかりません</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/accounts")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              スケジュール設定
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {account.accountName}
              {account.accountHandle && ` (@${account.accountHandle})`}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Schedule Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  自動投稿スケジュール
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                  />
                  <span className="text-sm font-medium">
                    {isEnabled ? "有効" : "無効"}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">投稿頻度</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">毎時間</SelectItem>
                    <SelectItem value="every_3_hours">3時間ごと</SelectItem>
                    <SelectItem value="every_6_hours">6時間ごと</SelectItem>
                    <SelectItem value="daily">毎日</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  自動投稿の実行頻度を選択してください
                </p>
              </div>

              {/* Preferred Hour (only for daily) */}
              {frequency === "daily" && (
                <div className="space-y-2">
                  <Label htmlFor="preferredHour">投稿時刻（時間）</Label>
                  <Input
                    id="preferredHour"
                    type="number"
                    min="0"
                    max="23"
                    value={preferredHour}
                    onChange={(e) =>
                      setPreferredHour(Math.min(23, Math.max(0, parseInt(e.target.value, 10))))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    0～23の範囲で時刻を指定してください
                  </p>
                </div>
              )}

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">タイムゾーン</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo（日本）</SelectItem>
                    <SelectItem value="America/New_York">America/New_York（ニューヨーク）</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles（ロサンゼルス）</SelectItem>
                    <SelectItem value="Europe/London">Europe/London（ロンドン）</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris（パリ）</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Tweets Per Day */}
              <div className="space-y-2">
                <Label htmlFor="maxTweetsPerDay">1日あたりの最大投稿数</Label>
                <Input
                  id="maxTweetsPerDay"
                  type="number"
                  min="1"
                  max="20"
                  value={maxTweetsPerDay}
                  onChange={(e) =>
                    setMaxTweetsPerDay(Math.min(20, Math.max(1, parseInt(e.target.value, 10))))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  1～20の範囲で設定してください
                </p>
              </div>

              {/* Info Box */}
              <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">スケジュール情報</p>
                  <p>
                    スケジュールを有効にすると、設定した時刻に自動でAI関連ニュースを取得し、
                    要約してツイートします。
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  "スケジュール設定を保存"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">アカウント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">アカウント名</p>
                  <p className="font-medium">{account.accountName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ハンドル</p>
                  <p className="font-medium">
                    {account.accountHandle ? `@${account.accountHandle}` : "未設定"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ステータス</p>
                  <p className="font-medium">
                    {account.isActive ? "有効" : "無効"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">認証状態</p>
                  <p className="font-medium">
                    {account.isValid ? "認証済み" : "未認証"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
