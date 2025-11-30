import { useEffect, useState } from 'react';
import { usersApi, type User } from '@/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Shield, ShieldOff, Trash2, User as UserIcon } from 'lucide-react';

export default function SystemAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await usersApi.list({ page: currentPage, limit: pageSize });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.total);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      setError('');
      const roleCode = newRoleCode === 'null' ? null : parseInt(newRoleCode);
      await usersApi.update(selectedUser.id, { systemRoleCode: roleCode });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, systemRoleCode: roleCode }
          : u
      ));
      
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRoleCode('');
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setError(err.message || 'ロールの更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      setError('');
      await usersApi.delete(selectedUser.id);
      
      // Remove from local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.message || 'ユーザーの削除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRoleCode(user.systemRoleCode === null ? 'null' : user.systemRoleCode.toString());
    setIsRoleDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadge = (systemRoleCode: number | null) => {
    if (systemRoleCode === 1) {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <Shield className="w-3 h-3 mr-1" />
          システム管理者
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <UserIcon className="w-3 h-3 mr-1" />
        一般ユーザー
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">システム管理</h1>
        <p className="text-gray-600 mt-1">ユーザーアカウントとシステムロールを管理します</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ユーザー一覧 (全{totalUsers}人)</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">表示件数:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メールアドレス</TableHead>
                <TableHead>名前</TableHead>
                <TableHead>システムロール</TableHead>
                <TableHead>登録日時</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    ユーザーが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.firstname} {user.lastname}</TableCell>
                    <TableCell>{getRoleBadge(user.systemRoleCode)}</TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleDialog(user)}
                        >
                          {user.systemRoleCode === 1 ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-1" />
                              管理者解除
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-1" />
                              管理者付与
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-600">
              {totalUsers > 0 ? (
                <>
                  {(currentPage - 1) * pageSize + 1}〜
                  {Math.min(currentPage * pageSize, totalUsers)}件を表示
                  (全{totalUsers}件中)
                </>
              ) : (
                '0件'
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>システムロールの変更</DialogTitle>
            <DialogDescription>
              ユーザー: {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">システムロール</label>
              <Select value={newRoleCode} onValueChange={setNewRoleCode}>
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
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={actionLoading}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={actionLoading || newRoleCode === (selectedUser?.systemRoleCode === null ? 'null' : selectedUser?.systemRoleCode?.toString())}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              変更する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーの削除</DialogTitle>
            <DialogDescription>
              本当に削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">削除されるユーザー:</p>
                  <p>{selectedUser?.email}</p>
                  <p>{selectedUser?.firstname} {selectedUser?.lastname}</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
