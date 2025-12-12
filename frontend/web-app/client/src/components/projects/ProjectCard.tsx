import { format } from "date-fns";
import type { ProjectWithMembers } from "@/types/entities";

interface ProjectCardProps {
  project: ProjectWithMembers;
  onClick: (project: ProjectWithMembers) => void;
  calculateProgress: (project: ProjectWithMembers) => number;
}

export function ProjectCard({ project, onClick, calculateProgress }: ProjectCardProps) {
  const progress = calculateProgress(project);

  return (
    <div
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(project)}
    >
      <h3 className="text-lg font-bold mb-2">{project.name}</h3>
      <p className="text-sm text-gray-600 mb-3">
        {project.description ? (
          <>
            {project.description.substring(0, 40)}
            {project.description.length > 40 ? "..." : ""}
          </>
        ) : (
          <span className="text-gray-400">説明なし</span>
        )}
      </p>
      
      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm text-gray-500">進捗</div>
          <div className="text-sm font-semibold">{progress}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500">メンバー:</div>
        <div className="flex -space-x-2">
          {project.members.slice(0, 3).map((member) => (
            <div
              key={member.id}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
              title={`${member.user.lastname} ${member.user.firstname}`}
            >
              {member.user.firstname.charAt(0)}{member.user.lastname.charAt(0)}
            </div>
          ))}
          {project.members.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
              +{project.members.length - 3}
            </div>
          )}
          {project.members.length === 0 && (
            <div className="text-xs text-gray-400">なし</div>
          )}
        </div>
      </div>
    </div>
  );
}
