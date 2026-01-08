import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Loader2, RefreshCw, Settings } from "lucide-react";

export default function AccountsManager() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    accountName: "",
    accountHandle: "",
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    accessTokenSecret: "",
  });

  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery();

  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: (data) => {
      toast.success("アカウントを追加しました");
      setIsAddDialogOpen(false);
      setFormData({
        accountName: "",
        accountHandle: "",
        apiKey: "",
        apiSecret: "",
        accessToken: "",
        accessTokenSecret: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`アカウント追加に失敗しました: ${error.message}`);
    },
  });

  const deleteMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      toast.success("アカウントを削除しました");
      setIsDeleteDialogOpen(false);
      setSelectedAccountId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`アカウント削除に失敗しました: ${error.message}`);
    },
  });

  const verifyMutation = trpc.accounts.verify.useMutation({
    onSuccess: (data) => {
      if (data.isValid) {
        toast.success("認証情報は有効です");
      } else {
        toast.error("認証情報が無効です");
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`認証検証に失敗しました: ${error.message}`);
    },
  });

  const handleAddAccount = () => {
    if (!formData.accountName.trim()) {
      toast.error("アカウント名を入力してください");
      return;
    }
    if (!formData.apiKey.trim() || !formData.apiSecret.trim() || 
        !formData.accessToken.trim() || !formData.accessTokenSecret.trim()) {
      toast.error("すべてのAPI認証情報を入力してください");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleDeleteAccount = (accountId: number) => {
    setSelectedAccountId(accountId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAccountId) {
      deleteMutation.mutate({ accountId: selectedAccountId });
    }
  };

  const handleVerifyAccount = (accountId: number) => {
    verifyMutation.mutate({ accountId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">複数アカウント管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              複数のX（Twitter）アカウントを登録・管理し、それぞれに異なるスケジュールで自動投稿できます
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            アカウントを追加
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{account.accountName}</CardTitle>
                      {account.accountHandle && (
                        <p className="text-sm text-muted-foreground">@{account.accountHandle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {account.isValid ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">認証済み</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">未認証</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">ステータス</p>
                      <p className="font-medium">
                        {account.isActive ? "有効" : "無効"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">作成日</p>
                      <p className="font-medium">
                        {new Date(account.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  {account.lastVerifiedAt && (
                    <div className="text-xs text-muted-foreground">
                      最終確認: {new Date(account.lastVerifiedAt).toLocaleString("ja-JP")}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/accounts/schedule?accountId=${account.id}`)}
                      className="gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      スケジュール
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyAccount(account.id)}
                      disabled={verifyMutation.isPending}
                      className="gap-1"
                    >
                      {verifyMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      認証確認
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  まだアカウントが登録されていません
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  最初のアカウントを追加
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新しいアカウントを追加</DialogTitle>
            <DialogDescription>
              X（Twitter）のAPI認証情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">アカウント名</Label>
              <Input
                id="accountName"
                placeholder="例：メインアカウント"
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHandle">ハンドル（オプション）</Label>
              <Input
                id="accountHandle"
                placeholder="例：@myaccount"
                value={formData.accountHandle}
                onChange={(e) =>
                  setFormData({ ...formData, accountHandle: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="API Key"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="API Secret"
                value={formData.apiSecret}
                onChange={(e) =>
                  setFormData({ ...formData, apiSecret: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Access Token"
                value={formData.accessToken}
                onChange={(e) =>
                  setFormData({ ...formData, accessToken: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessTokenSecret">Access Token Secret</Label>
              <Input
                id="accessTokenSecret"
                type="password"
                placeholder="Access Token Secret"
                value={formData.accessTokenSecret}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accessTokenSecret: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddAccount}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  追加中...
                </>
              ) : (
                "追加"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アカウントを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このアカウントを削除すると、関連するスケジュール設定も削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
