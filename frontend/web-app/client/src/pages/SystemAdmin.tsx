import { useEffect, useState } from 'react';
import { usersApi, type User } from '@/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchInput } from '@/components/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UsersTable } from '@/components/admin/UsersTable';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { getErrorMessage } from '@/lib/errorHandler';
import { OPERATION_ERROR_MESSAGES } from '@/constants/errorMessages';

export default function SystemAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, activeSearch]);

  const loadUsers = async () => {
    try {
      // Show full page loading only on initial load, table loading for search/pagination
      if (users.length === 0 && !activeSearch) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }
      setError('');
      const data = await usersApi.list({ 
        page: currentPage, 
        limit: pageSize,
        search: activeSearch || undefined 
      });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.total);
    } catch (err) {
      const errorMessage = getErrorMessage(err, OPERATION_ERROR_MESSAGES.USER_LIST_LOAD_FAILED);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setActiveSearch(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1);
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
    } catch (err) {
      const errorMessage = getErrorMessage(err, OPERATION_ERROR_MESSAGES.USER_UPDATE_FAILED);
      setError(errorMessage);
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
    } catch (err) {
      const errorMessage = getErrorMessage(err, OPERATION_ERROR_MESSAGES.USER_DELETE_FAILED);
      setError(errorMessage);
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
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>ユーザー一覧 (全{totalUsers}人)</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">表示件数:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
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
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="名前、メールアドレスで検索..."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <UsersTable
            users={users}
            loading={tableLoading}
            pageSize={pageSize}
            activeSearch={activeSearch}
            onRoleClick={openRoleDialog}
            onDeleteClick={openDeleteDialog}
          />
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalUsers}
            loading={tableLoading}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <RoleChangeDialog
        open={isRoleDialogOpen}
        user={selectedUser}
        newRoleCode={newRoleCode}
        loading={actionLoading}
        onOpenChange={setIsRoleDialogOpen}
        onRoleCodeChange={setNewRoleCode}
        onConfirm={handleRoleChange}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        user={selectedUser}
        loading={actionLoading}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
