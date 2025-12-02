import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  organizations: any[];
  isOrganizationManagerOrAbove: (orgId: string) => boolean;
  onSubmit: (data: {
    organizationId: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  submitting: boolean;
}

export function CreateProjectDialog({
  open,
  onClose,
  organizations,
  isOrganizationManagerOrAbove,
  onSubmit,
  submitting,
}: CreateProjectDialogProps) {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const resetForm = () => {
    setSelectedOrgId("");
    setProjectName("");
    setProjectDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmit = async () => {
    if (!projectName.trim() || !selectedOrgId) return;

    await onSubmit({
      organizationId: selectedOrgId,
      name: projectName,
      description: projectDescription || undefined,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    });

    resetForm();
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規プロジェクト作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Selection */}
          <div>
            <Label htmlFor="organization">組織</Label>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="組織を選択" />
              </SelectTrigger>
              <SelectContent>
                {organizations
                  .filter(org => isOrganizationManagerOrAbove(org.id))
                  .map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Name */}
          <div>
            <Label htmlFor="projectName">プロジェクト名 *</Label>
            <Input
              id="projectName"
              placeholder="プロジェクト名を入力"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* Project Description */}
          <div>
            <Label htmlFor="projectDescription">プロジェクト概要</Label>
            <Textarea
              id="projectDescription"
              placeholder="プロジェクトの概要を入力してください"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Schedule */}
          <div>
            <Label>スケジュール</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Note about members */}
          <div className="text-sm text-gray-500">
            ※ プロジェクトメンバーは作成後に追加できます
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubmit}
            disabled={submitting || !projectName.trim() || !selectedOrgId}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                作成中...
              </>
            ) : (
              '作成'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
