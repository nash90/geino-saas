import { useState, useEffect } from 'react';
import { organizationsApi } from '@/api/organizations';
import { usersApi, type User } from '@/api/users';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getErrorMessage } from '@/lib/errorHandler';
import { OPERATION_ERROR_MESSAGES } from '@/constants/errorMessages';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrganizationDialog({ open, onClose, onSuccess }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadUsers();
      // Reset form
      setName('');
      setDescription('');
      setSelectedManagers([]);
      setError('');
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await usersApi.list({ page: 1, limit: 100 });
      setUsers(data.users);
    } catch (err) {
      setError(getErrorMessage(err, OPERATION_ERROR_MESSAGES.USER_LIST_LOAD_FAILED));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('組織名を入力してください');
      return;
    }

    if (selectedManagers.length === 0) {
      setError('少なくとも1人の組織マネージャーを選択してください');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await organizationsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        managerIds: selectedManagers,
      });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, OPERATION_ERROR_MESSAGES.ORGANIZATION_CREATE_FAILED));
    } finally {
      setLoading(false);
    }
  };

  const toggleManager = (userId: string) => {
    setSelectedManagers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>組織作成</DialogTitle>
          <DialogDescription>
            新しい組織を作成し、組織マネージャーを割り当てます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                組織名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="組織名を入力"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="組織の説明を入力（任意）"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                組織マネージャー <span className="text-red-500">*</span>
              </Label>
              {loadingUsers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`manager-${user.id}`}
                        checked={selectedManagers.includes(user.id)}
                        onCheckedChange={() => toggleManager(user.id)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`manager-${user.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {user.lastname} {user.firstname} ({user.email})
                      </label>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      ユーザーが見つかりません
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500">
                選択中: {selectedManagers.length}人
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              作成
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
