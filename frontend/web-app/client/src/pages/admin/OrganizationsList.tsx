import { useEffect, useState } from 'react';
import { organizationsApi } from '@/api/organizations';
import type { Organization } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Loader2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/organizations/CreateOrganizationDialog';
import { UpdateOrganizationDialog } from '@/components/organizations/UpdateOrganizationDialog';
import { ManageMembersDialog } from '@/components/organizations/ManageMembersDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function OrganizationsList() {
  const { user } = useAuth();
  const isSystemAdmin = user?.systemRoleCode === 1;
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrgs, setTotalOrgs] = useState(0);

  useEffect(() => {
    loadOrganizations();
  }, [currentPage, pageSize]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await organizationsApi.list({ page: currentPage, limit: pageSize });
      setOrganizations(data.organizations);
      setTotalPages(data.pagination.totalPages);
      setTotalOrgs(data.pagination.total);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      setError(err.response?.data?.error || '組織一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;

    try {
      setActionLoading(true);
      setError('');
      await organizationsApi.delete(selectedOrg.id);
      
      setIsDeleteDialogOpen(false);
      setSelectedOrg(null);
      await loadOrganizations();
    } catch (err: any) {
      console.error('Failed to delete organization:', err);
      setError(err.response?.data?.error || '組織の削除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const openUpdateDialog = (org: Organization) => {
    setSelectedOrg(org);
    setIsUpdateDialogOpen(true);
  };

  const openMembersDialog = (org: Organization) => {
    setSelectedOrg(org);
    setIsMembersDialogOpen(true);
  };

  const openDeleteDialog = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    loadOrganizations();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedOrg(null);
    loadOrganizations();
  };

  const handleMembersClose = () => {
    setIsMembersDialogOpen(false);
    setSelectedOrg(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">組織管理</h1>
        {isSystemAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            組織作成
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>組織一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              組織が登録されていません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>組織名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-gray-600 max-w-md truncate">
                        {org.description || '-'}
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isSystemAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMembersDialog(org)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              メンバー
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(org)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                          {isSystemAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(org)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              削除
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  全 {totalOrgs} 件中 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalOrgs)} 件を表示
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    前へ
                  </Button>
                  <span className="text-sm">
                    ページ {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    次へ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateOrganizationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedOrg && (
        <>
          <UpdateOrganizationDialog
            open={isUpdateDialogOpen}
            onClose={() => {
              setIsUpdateDialogOpen(false);
              setSelectedOrg(null);
            }}
            organization={selectedOrg}
            onSuccess={handleUpdateSuccess}
          />

          <ManageMembersDialog
            open={isMembersDialogOpen}
            onClose={handleMembersClose}
            organization={selectedOrg}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>組織を削除</DialogTitle>
            <DialogDescription>
              本当に「{selectedOrg?.name}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedOrg(null);
              }}
              disabled={actionLoading}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
