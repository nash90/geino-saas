import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ProjectMultiSelectProps {
  projects: Array<{ id: string; name: string }>;
  selectedProjectIds: string[];
  onSelectionChange: (projectIds: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
}

export function ProjectMultiSelect({
  projects,
  selectedProjectIds,
  onSelectionChange,
  maxSelections = 5,
  placeholder = "プロジェクトを選択",
}: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelection, setTempSelection] = useState<string[]>(selectedProjectIds);

  // Sync temp selection when selectedProjectIds changes externally
  useEffect(() => {
    setTempSelection(selectedProjectIds);
  }, [selectedProjectIds]);

  const selectedCount = tempSelection.length;
  const isMaxSelected = selectedCount >= maxSelections;

  const handleToggle = (projectId: string) => {
    const isSelected = tempSelection.includes(projectId);

    if (isSelected) {
      setTempSelection(tempSelection.filter((id) => id !== projectId));
    } else {
      if (!isMaxSelected) {
        setTempSelection([...tempSelection, projectId]);
      }
    }
  };

  const handleClearAll = () => {
    setTempSelection([]);
  };

  const handleSelectAll = () => {
    const projectsToSelect = projects.slice(0, maxSelections);
    setTempSelection(projectsToSelect.map((p) => p.id));
  };

  const handleApply = () => {
    onSelectionChange(tempSelection);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSelection(selectedProjectIds);
    setOpen(false);
  };

  const getButtonText = () => {
    if (selectedCount === 0) {
      return placeholder;
    }
    if (selectedCount === 1) {
      const project = projects.find((p) => p.id === selectedProjectIds[0]);
      return project?.name || placeholder;
    }
    return `${selectedCount}個のプロジェクト選択中`;
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset temp selection when closing without applying
      setTempSelection(selectedProjectIds);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-10 w-[280px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{getButtonText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {selectedCount}/{maxSelections} 選択中
            </span>
            <div className="flex gap-1">
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClearAll();
                  }}
                  className="h-6 px-2 text-xs"
                >
                  クリア
                </Button>
              )}
              {projects.length <= maxSelections && selectedCount < projects.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectAll();
                  }}
                  className="h-6 px-2 text-xs"
                >
                  全選択
                </Button>
              )}
            </div>
          </div>

          <div className="border-t mb-2" />

          <input
            type="text"
            placeholder="プロジェクトを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded mb-2"
            onKeyDown={(e) => e.stopPropagation()}
          />

          <div className="max-h-[300px] overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-2">
                プロジェクトが見つかりません
              </div>
            ) : (
              filteredProjects.map((project) => {
                const isSelected = tempSelection.includes(project.id);
                const isDisabled = !isSelected && isMaxSelected;

                return (
                  <div
                    key={project.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isDisabled) {
                        handleToggle(project.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      className="pointer-events-none"
                    />
                    <span className="flex-1 truncate text-sm">{project.name}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {isMaxSelected && (
            <div className="pt-2 mt-2">
              <p className="text-xs text-amber-600 font-medium">
                最大{maxSelections}個まで選択できます
              </p>
            </div>
          )}

          <div className="border-t pt-2 mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={tempSelection.length === 0}
            >
              適用
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
