import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, X } from "lucide-react";
import { MOCK_PROJECTS } from "@/../../shared/const";
import { format } from "date-fns";

interface Project {
  id: number;
  title: string;
  schedule: string;
  description: string;
  startDate: string;
  endDate: string;
  members: string[];
}

export default function Projects() {
  const [projects] = useState<Project[]>(MOCK_PROJECTS as Project[]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [members, setMembers] = useState<Array<{ role: string; name: string; email: string }>>([
    { role: "", name: "田中 翔太", email: "texample@gmail.com" },
  ]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setDetailDialogOpen(true);
  };

  const addMember = () => {
    setMembers([...members, { role: "", name: "田中 翔太", email: "texample@gmail.com" }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規プロジェクト作成
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleProjectClick(project)}
          >
            <h3 className="text-lg font-bold mb-2">{project.title}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {project.description.substring(0, 40)}
              {project.description.length > 40 ? "..." : ""}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">進捗</div>
              <div className="text-sm font-semibold">{project.schedule}</div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                style={{ width: "66%" }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新規プロジェクト作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <Label htmlFor="projectName">プロジェクト名</Label>
              <Input
                id="projectName"
                placeholder="タイトルテキストが入ります"
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

            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>担当者招待</Label>
                <Trash2 className="w-4 h-4 text-gray-400" />
              </div>

              {members.map((member, index) => (
                <div key={index} className="space-y-3 mb-4 p-4 border rounded-lg">
                  <div>
                    <Label>ロール選択</Label>
                    <Select value={member.role} onValueChange={(value) => {
                      const newMembers = [...members];
                      newMembers[index].role = value;
                      setMembers(newMembers);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="ロール名" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">マネージャー</SelectItem>
                        <SelectItem value="member">メンバー</SelectItem>
                        <SelectItem value="viewer">閲覧者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>名前</Label>
                    <Input
                      value={member.name}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].name = e.target.value;
                        setMembers(newMembers);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label>メールアドレス</Label>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].email = e.target.value;
                          setMembers(newMembers);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">※通知を受け取りたいメールアドレスを追加する</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => removeMember(index)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addMember}>
                担当者をさらに追加する
              </Button>
            </div>

            {/* Submit Button */}
            <Button className="w-full" size="lg">
              作成
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">プロジェクト概要</h4>
                <p className="text-sm text-gray-600">{selectedProject.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">スケジュール</h4>
                <p className="text-sm text-gray-600">
                  {selectedProject.startDate} 〜 {selectedProject.endDate}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">進捗</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                      style={{ width: "66%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{selectedProject.schedule}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">メンバー</h4>
                <div className="space-y-2">
                  {selectedProject.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs">
                        {member.charAt(0)}
                      </div>
                      <span className="text-sm">{member}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

