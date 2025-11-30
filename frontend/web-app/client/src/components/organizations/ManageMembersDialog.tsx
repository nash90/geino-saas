import { useState, useEffect } from 'react';
import { organizationsApi } from '@/api/organizations';
import { usersApi, type User } from '@/api/users';
import type { Organization, OrganizationMember } from '@/types/entities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManageMembersDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization;
}

export function ManageMembersDialog({ open, onClose, organization }: ManageMembersDialogProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, organization.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load organization with members
      const orgData = await organizationsApi.get(organization.id);
      setMembers(orgData.organization.members);

      // Load all users for selection
      const usersData = await usersApi.list({ page: 1, limit: 100 });
      setUsers(usersData.users);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.error || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setError('ユーザーを選択してください');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await organizationsApi.addMember(organization.id, {
        userId: selectedUserId,
        organizationRoleCode: 1, // organization_manager
      });
      setSelectedUserId('');
      await loadData();
    } catch (err: any) {
      console.error('Failed to add member:', err);
      setError(err.response?.data?.error || 'メンバーの追加に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('このメンバーを削除しますか？')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await organizationsApi.removeMember(organization.id, userId);
      await loadData();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.error || 'メンバーの削除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter out users who are already members
  const availableUsers = users.filter(
    user => !members.some(member => member.userId === user.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>メンバー管理 - {organization.name}</DialogTitle>
          <DialogDescription>
            組織マネージャーの追加・削除を行います。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add Member Section */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">メンバーを追加</h3>
            <div className="flex gap-2">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={actionLoading || availableUsers.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="ユーザーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstname} {user.lastname} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    追加
                  </>
                )}
              </Button>
            </div>
            {availableUsers.length === 0 && (
              <p className="text-sm text-gray-500">
                全てのユーザーが既にメンバーです
              </p>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">現在のメンバー</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-md">
                メンバーがいません
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名前</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>役割</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        {member.user.firstname} {member.user.lastname}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {member.user.email}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium">
                          組織マネージャー
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={actionLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          削除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
