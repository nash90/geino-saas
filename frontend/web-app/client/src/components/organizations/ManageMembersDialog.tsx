import { useState, useEffect } from 'react';
import { organizationsApi } from '@/api/organizations';
import type { Organization, OrganizationMember } from '@/types/entities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddMemberSection } from './members/AddMemberSection';
import { MembersTable } from './members/MembersTable';

interface ManageMembersDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization;
}

export function ManageMembersDialog({ open, onClose, organization }: ManageMembersDialogProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, organization.id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const orgData = await organizationsApi.get(organization.id);
      setMembers(orgData.organization.members);
    } catch (err: any) {
      console.error('Failed to load members:', err);
      setError(err.response?.data?.error || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      setActionLoading(true);
      setError('');
      await organizationsApi.addMember(organization.id, {
        userId,
        organizationRoleCode: 1, // organization_manager
      });
      await loadMembers();
    } catch (err: any) {
      console.error('Failed to add member:', err);
      setError(err.response?.data?.error || 'メンバーの追加に失敗しました');
      throw err;
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
      await loadMembers();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.error || 'メンバーの削除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <div className="overflow-x-auto">
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

            <AddMemberSection
              members={members}
              onAddMember={handleAddMember}
              actionLoading={actionLoading}
            />

            <MembersTable
              members={members}
              loading={loading}
              actionLoading={actionLoading}
              onRemoveMember={handleRemoveMember}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
