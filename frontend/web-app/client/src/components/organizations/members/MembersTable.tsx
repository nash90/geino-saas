import type { OrganizationMember } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MembersTableProps {
  members: OrganizationMember[];
  loading: boolean;
  actionLoading: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
}

export function MembersTable({ members, loading, actionLoading, onRemoveMember }: MembersTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border rounded-md">
        メンバーがいません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">現在のメンバー</h3>
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
                {member.user.lastname} {member.user.firstname}
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
                  onClick={() => onRemoveMember(member.userId)}
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
    </div>
  );
}
