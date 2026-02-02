import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/SearchInput";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { useState } from "react";
import { usersApi, type User } from "@/api/users";
import { projectsApi } from "@/api/projects";
import { toast } from "sonner";
import type { ProjectWithMembers } from "@/types/entities";
import { MESSAGES } from "@/constants/messages";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectWithMembers | null;
  onSuccess: () => void;
}

export function AddMemberDialog({ open, onClose, project, onSuccess }: AddMemberDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<string>("2");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !project) return;

    setSearchLoading(true);
    setSearchResults([]);
    setSelectedUser(null);

    try {
      // Use exact email search for security
      const result = await usersApi.findByEmail(searchQuery.trim());

      if (result.user) {
        // Check if user is already a member
        const existingMemberIds = new Set(project.members.map(m => m.userId));
        if (existingMemberIds.has(result.user.id)) {
          // User found but already a member
          toast.info(MESSAGES.MEMBER.USER_ALREADY_PROJECT_MEMBER);
        } else {
          // User found and not a member - show in results
          setSearchResults([result.user]);
        }
      } else {
        // User not found
        toast.info(MESSAGES.MEMBER.USER_NOT_FOUND);
      }
    } catch (error) {
      console.error("Failed to search user:", error);
      toast.error(MESSAGES.MEMBER.USER_SEARCH_FAILED);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !project) return;

    setSubmitting(true);
    try {
      await projectsApi.addMember(project.id, {
        userId: selectedUser.id,
        projectRoleCode: Number(newMemberRole),
      });
      toast.success(MESSAGES.MEMBER.MEMBER_ADDED_SUCCESS);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to add member:", error);
      toast.error(MESSAGES.MEMBER.MEMBER_ADD_FAILED);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setNewMemberRole("2");
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader className="pr-8">
          <DialogTitle>メンバー追加 - {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ロール</label>
            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">プロジェクトマネージャー</SelectItem>
                <SelectItem value="2">芸能ユーザー</SelectItem>
                <SelectItem value="3">現場ユーザー</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">メールアドレスで検索</label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder={MESSAGES.MEMBER.SEARCH_PLACEHOLDER_EMAIL}
              disabled={searchLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {MESSAGES.MEMBER.SEARCH_HELP_TEXT}
            </p>
          </div>

          {searchLoading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-600">{MESSAGES.MEMBER.USER_FOUND}</p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                    {user.lastname.charAt(0)}{user.firstname.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.lastname} {user.firstname}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              キャンセル
            </Button>
            <Button 
              onClick={handleAddMember} 
              disabled={!selectedUser || submitting}
            >
              {submitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  追加中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  追加
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
