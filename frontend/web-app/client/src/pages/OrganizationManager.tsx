import { useEffect, useState } from 'react';
import { organizationsApi } from '@/api/organizations';
import type { Organization } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Pencil, ShieldAlert } from 'lucide-react';
import { UpdateOrganizationDialog } from '@/components/organizations/UpdateOrganizationDialog';
import { getErrorMessage } from '@/lib/errorHandler';
import { OPERATION_ERROR_MESSAGES } from '@/constants/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

export default function OrganizationManager() {
  const { user, organizations: userOrganizations, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const isSystemAdmin = user?.systemRoleCode === 1;
  const isOrganizationManager = userOrganizations.length > 0;
  // Only Organization Managers can access this page (System Admins use /system-admin)
  const hasAccess = isOrganizationManager && !isSystemAdmin;

  // Redirect users without access to home page
  useEffect(() => {
    if (!authLoading && !hasAccess) {
      setLocation('/');
    }
  }, [authLoading, hasAccess, setLocation]);

  useEffect(() => {
    if (hasAccess) {
      loadOrganizations();
    }
  }, [hasAccess]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      // Backend will automatically filter to show only organizations where user is a manager
      const data = await organizationsApi.list({ page: 1, limit: 100 });
      setOrganizations(data.organizations);
    } catch (err) {
      setError(getErrorMessage(err, OPERATION_ERROR_MESSAGES.ORGANIZATION_LIST_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (org: Organization) => {
    setSelectedOrg(org);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedOrg(null);
    loadOrganizations();
  };

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show access denied if not authorized (brief flash before redirect)
  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            この操作には組織マネージャー権限が必要です。ホームページにリダイレクトしています...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">組織管理</h1>
        <p className="text-gray-600 mt-1">
          あなたが管理者として所属している組織の情報を表示・編集できます
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>組織一覧 (全{organizations.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              管理者として所属している組織がありません
            </div>
          ) : (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(org)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog */}
      {selectedOrg && (
        <UpdateOrganizationDialog
          open={isUpdateDialogOpen}
          onClose={() => {
            setIsUpdateDialogOpen(false);
            setSelectedOrg(null);
          }}
          organization={selectedOrg}
          onSuccess={handleUpdateSuccess}
          isSystemAdmin={false}
        />
      )}
    </div>
  );
}
