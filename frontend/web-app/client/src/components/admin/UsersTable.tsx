import { type User } from '@/api/users';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Shield, ShieldOff, Trash2, User as UserIcon } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  pageSize: number;
  activeSearch: string;
  onRoleClick: (user: User) => void;
  onDeleteClick: (user: User) => void;
}

function getRoleBadge(systemRoleCode: number | null) {
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
}

export function UsersTable({
  users,
  loading,
  pageSize,
  activeSearch,
  onRoleClick,
  onDeleteClick,
}: UsersTableProps) {
  return (
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
        {loading ? (
          // Loading skeleton
          Array.from({ length: pageSize }).map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse ml-auto" style={{ width: '200px' }} /></TableCell>
            </TableRow>
          ))
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
              {activeSearch ? (
                <>検索条件 「{activeSearch}」 に一致するユーザーが見つかりません</>
              ) : (
                <>ユーザーが見つかりません</>
              )}
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.lastname} {user.firstname}</TableCell>
              <TableCell>{getRoleBadge(user.systemRoleCode)}</TableCell>
              <TableCell className="text-gray-600">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRoleClick(user)}
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
                    onClick={() => onDeleteClick(user)}
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
  );
}
