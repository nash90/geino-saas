import { useState } from 'react';
import { usersApi, type User } from '@/api/users';
import type { OrganizationMember } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/SearchInput';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';

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
      setSearchResults([]);

      // Use exact email search for security
      const result = await usersApi.findByEmail(query.trim());

      if (result.user) {
        // Check if user is already a member
        const isAlreadyMember = members.some(member => member.userId === result.user!.id);
        if (isAlreadyMember) {
          // User found but already a member
          toast.info(MESSAGES.MEMBER.USER_ALREADY_ORGANIZATION_MEMBER);
        } else {
          // User found and not a member - show in results
          setSearchResults([result.user]);
        }
      } else {
        // User not found
        toast.info(MESSAGES.MEMBER.USER_NOT_FOUND);
      }
    } catch (err: any) {
      console.error('Failed to search user:', err);
      toast.error(MESSAGES.MEMBER.USER_SEARCH_FAILED);
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
              {selectedUser.lastname} {selectedUser.firstname}
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
            placeholder={MESSAGES.MEMBER.SEARCH_PLACEHOLDER_EMAIL_SHORT}
          />
          <p className="text-xs text-gray-500">
            {MESSAGES.MEMBER.SEARCH_HELP_TEXT}
          </p>
          
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
                    {user.lastname} {user.firstname}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
