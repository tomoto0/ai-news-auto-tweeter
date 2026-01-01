import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Clock, Calendar, Zap } from "lucide-react";

export default function Schedule() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState<"hourly" | "every_3_hours" | "every_6_hours" | "daily">("daily");
  const [preferredHour, setPreferredHour] = useState(9);
  const [timezone, setTimezone] = useState("Asia/Tokyo");
  const [maxTweetsPerDay, setMaxTweetsPerDay] = useState(5);
  const [hasChanges, setHasChanges] = useState(false);

  const utils = trpc.useUtils();
  const { data: schedule, isLoading } = trpc.schedule.get.useQuery();
  const { data: credentials } = trpc.xCredentials.get.useQuery();

  const saveMutation = trpc.schedule.save.useMutation({
    onSuccess: () => {
      utils.schedule.get.invalidate();
      toast.success("スケジュール設定を保存しました");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`保存に失敗しました: ${error.message}`);
    },
  });

  // Load initial values
  useEffect(() => {
    if (schedule) {
      setIsEnabled(schedule.isEnabled);
      setFrequency(schedule.frequency);
      setPreferredHour(schedule.preferredHour ?? 9);
      setTimezone(schedule.timezone ?? "Asia/Tokyo");
      setMaxTweetsPerDay(schedule.maxTweetsPerDay ?? 5);
    }
  }, [schedule]);

  const handleSave = () => {
    if (isEnabled && !credentials?.hasCredentials) {
      toast.error("自動投稿を有効にするには、まずX API認証情報を設定してください");
      return;
    }
    saveMutation.mutate({
      isEnabled,
      frequency,
      preferredHour,
      timezone,
      maxTweetsPerDay,
    });
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  const frequencyOptions = [
    { value: "hourly", label: "毎時", description: "1時間ごとに投稿" },
    { value: "every_3_hours", label: "3時間ごと", description: "3時間ごとに投稿" },
    { value: "every_6_hours", label: "6時間ごと", description: "6時間ごとに投稿" },
    { value: "daily", label: "毎日", description: "1日1回投稿" },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-foreground pb-6">
          <h1 className="text-3xl font-bold tracking-tight">スケジュール設定</h1>
          <p className="text-muted-foreground mt-2">
            自動ツイートの投稿スケジュールを設定します
          </p>
        </div>

        {/* API Warning */}
        {!credentials?.hasCredentials && (
          <div className="p-4 border border-foreground bg-muted/30">
            <p className="text-sm font-medium">X API認証情報が未設定です</p>
            <p className="text-sm text-muted-foreground mt-1">
              自動投稿を有効にするには、設定ページでAPIキーを登録してください。
            </p>
          </div>
        )}

        {/* Enable Toggle */}
        <Card className="border-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              自動投稿
            </CardTitle>
            <CardDescription>
              スケジュールに従ってAIニュースを自動的にツイートします
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-post">自動投稿を有効にする</Label>
                <p className="text-sm text-muted-foreground">
                  {isEnabled ? "自動投稿が有効です" : "自動投稿は無効です"}
                </p>
              </div>
              <Switch
                id="auto-post"
                checked={isEnabled}
                onCheckedChange={(checked) => {
                  setIsEnabled(checked);
                  handleChange();
                }}
                disabled={!credentials?.hasCredentials}
              />
            </div>
          </CardContent>
        </Card>

        {/* Frequency Settings */}
        <Card className="border-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              投稿頻度
            </CardTitle>
            <CardDescription>
              ツイートを投稿する頻度を選択します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>頻度</Label>
              <Select
                value={frequency}
                onValueChange={(value: typeof frequency) => {
                  setFrequency(value);
                  handleChange();
                }}
              >
                <SelectTrigger className="border-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frequency === "daily" && (
              <div className="space-y-2">
                <Label>投稿時刻</Label>
                <Select
                  value={preferredHour.toString()}
                  onValueChange={(value) => {
                    setPreferredHour(parseInt(value));
                    handleChange();
                  }}
                >
                  <SelectTrigger className="border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>1日の最大投稿数</Label>
              <Select
                value={maxTweetsPerDay.toString()}
                onValueChange={(value) => {
                  setMaxTweetsPerDay(parseInt(value));
                  handleChange();
                }}
              >
                <SelectTrigger className="border-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 10, 15, 20].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}件/日
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timezone Settings */}
        <Card className="border-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              タイムゾーン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>タイムゾーン</Label>
              <Select
                value={timezone}
                onValueChange={(value) => {
                  setTimezone(value);
                  handleChange();
                }}
              >
                <SelectTrigger className="border-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tokyo">日本標準時 (JST)</SelectItem>
                  <SelectItem value="America/New_York">東部標準時 (EST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">太平洋標準時 (PST)</SelectItem>
                  <SelectItem value="Europe/London">グリニッジ標準時 (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">中央ヨーロッパ時間 (CET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-foreground">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            className="bg-primary text-primary-foreground"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            設定を保存
          </Button>
        </div>

        {/* Info Box */}
        <Card className="border-foreground bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">注意:</strong> 自動投稿機能は、設定された頻度に従ってバックグラウンドで実行されます。
              投稿されたツイートは履歴ページで確認できます。
              X APIの利用制限に注意してください。
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
