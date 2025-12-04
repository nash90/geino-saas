import { type User } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User as UserIcon, Loader2 } from 'lucide-react';

interface RoleChangeDialogProps {
  open: boolean;
  user: User | null;
  newRoleCode: string;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleCodeChange: (code: string) => void;
  onConfirm: () => void;
}

export function RoleChangeDialog({
  open,
  user,
  newRoleCode,
  loading,
  onOpenChange,
  onRoleCodeChange,
  onConfirm,
}: RoleChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>システムロールの変更</DialogTitle>
          <DialogDescription>
            ユーザー: {user?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">システムロール</label>
            <Select value={newRoleCode} onValueChange={onRoleCodeChange}>
              <SelectTrigger>
                <SelectValue placeholder="ロールを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    一般ユーザー
                  </div>
                </SelectItem>
                <SelectItem value="1">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    システム管理者
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              {newRoleCode === '1' 
                ? 'システム管理者は全ユーザーの管理とシステム設定の変更が可能です。'
                : '一般ユーザーはシステム管理機能にアクセスできません。'}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || newRoleCode === (user?.systemRoleCode === null ? 'null' : user?.systemRoleCode?.toString())}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            変更する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
