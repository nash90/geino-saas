import { useState, useEffect } from 'react';
import { organizationsApi } from '@/api/organizations';
import { usersApi, type User } from '@/api/users';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorHandler';
import { OPERATION_ERROR_MESSAGES } from '@/constants/errorMessages';
import { MESSAGES } from '@/constants/messages';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrganizationDialog({ open, onClose, onSuccess }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedManagers, setSelectedManagers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Reset form
      setName('');
      setDescription('');
      setSelectedManagers([]);
      setSearchQuery('');
      setSearchResults([]);
      setError('');
    }
  }, [open]);

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
        // Check if user is already selected
        const isAlreadySelected = selectedManagers.some(manager => manager.id === result.user!.id);
        if (isAlreadySelected) {
          toast.info(MESSAGES.MEMBER.USER_ALREADY_SELECTED);
        } else {
          setSearchResults([result.user]);
        }
      } else {
        toast.info(MESSAGES.MEMBER.USER_NOT_FOUND);
      }
    } catch (err) {
      console.error('Failed to search user:', err);
      toast.error(MESSAGES.MEMBER.USER_SEARCH_FAILED);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedManagers(prev => [...prev, user]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRemoveManager = (userId: string) => {
    setSelectedManagers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('組織名を入力してください');
      return;
    }

    if (selectedManagers.length === 0) {
      setError('少なくとも1人の組織マネージャーを選択してください');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await organizationsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        managerIds: selectedManagers.map(m => m.id),
      });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, OPERATION_ERROR_MESSAGES.ORGANIZATION_CREATE_FAILED));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>組織作成</DialogTitle>
          <DialogDescription>
            新しい組織を作成し、組織マネージャーを割り当てます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                組織名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="組織名を入力"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="組織の説明を入力（任意）"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label>
                組織マネージャー <span className="text-red-500">*</span>
              </Label>

              {/* Selected Managers */}
              {selectedManagers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">選択中: {selectedManagers.length}人</p>
                  <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                    {selectedManagers.map((manager) => (
                      <div key={manager.id} className="flex items-center justify-between p-3 bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">
                            {manager.lastname} {manager.firstname}
                          </p>
                          <p className="text-sm text-gray-600">{manager.email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveManager(manager.id)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Search */}
              <div className="space-y-2">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleUserSearch}
                  placeholder={MESSAGES.MEMBER.SEARCH_PLACEHOLDER_EMAIL_SHORT}
                  disabled={loading}
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
                        type="button"
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
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              作成
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
