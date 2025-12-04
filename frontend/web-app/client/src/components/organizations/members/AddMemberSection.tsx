import { useState } from 'react';
import { usersApi, type User } from '@/api/users';
import type { OrganizationMember } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/SearchInput';
import { Loader2, UserPlus } from 'lucide-react';

interface AddMemberSectionProps {
  members: OrganizationMember[];
  onAddMember: (userId: string) => Promise<void>;
  actionLoading: boolean;
}

export function AddMemberSection({ members, onAddMember, actionLoading }: AddMemberSectionProps) {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const usersData = await usersApi.list({ page: 1, limit: 20, search: query });
      
      // Filter out users who are already members
      const availableUsers = usersData.users.filter(
        user => !members.some(member => member.userId === user.id)
      );
      
      setSearchResults(availableUsers);
    } catch (err: any) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleAdd = async () => {
    if (!selectedUser) return;
    
    try {
      await onAddMember(selectedUser.id);
      setSelectedUser(null);
      setSearchQuery('');
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">メンバーを追加</h3>
      
      {/* Selected User Display */}
      {selectedUser && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div>
            <p className="font-medium text-sm">
              {selectedUser.firstname} {selectedUser.lastname}
            </p>
            <p className="text-sm text-gray-600">{selectedUser.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(null)}
              disabled={actionLoading}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={actionLoading}
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
        </div>
      )}

      {/* User Search */}
      {!selectedUser && (
        <div className="space-y-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleUserSearch}
            placeholder="名前またはメールアドレスで検索..."
          />
          
          {/* Search Results */}
          {searchLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          
          {!searchLoading && searchResults.length > 0 && (
            <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-sm">
                    {user.firstname} {user.lastname}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </button>
              ))}
            </div>
          )}
          
          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              検索結果が見つかりません
            </p>
          )}
        </div>
      )}
    </div>
  );
}
