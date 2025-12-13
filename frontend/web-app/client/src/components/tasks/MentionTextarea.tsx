import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface MentionUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  projectMembers: MentionUser[];
  disabled?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  projectMembers,
  disabled = false,
}: MentionTextareaProps) {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter members based on search term
  useEffect(() => {
    if (!mentionSearch) {
      setFilteredMembers(projectMembers.slice(0, 5)); // Show first 5 members
      return;
    }

    const searchLower = mentionSearch.toLowerCase();
    const filtered = projectMembers.filter(
      (member) =>
        member.firstname.toLowerCase().includes(searchLower) ||
        member.lastname.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)
    );
    setFilteredMembers(filtered.slice(0, 5)); // Limit to 5 results
  }, [mentionSearch, projectMembers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);

    // Check if user typed '@'
    const lastChar = newValue[cursorPos - 1];
    if (lastChar === "@") {
      setShowMentionDropdown(true);
      setMentionStartPos(cursorPos - 1);
      setMentionSearch("");
      setSelectedIndex(0);
      return;
    }

    // If mention dropdown is open, update search term
    if (showMentionDropdown && mentionStartPos !== null) {
      const textAfterMention = newValue.substring(mentionStartPos + 1, cursorPos);

      // Close dropdown if space or newline is typed
      if (textAfterMention.includes(" ") || textAfterMention.includes("\n")) {
        setShowMentionDropdown(false);
        setMentionStartPos(null);
        setMentionSearch("");
        return;
      }

      setMentionSearch(textAfterMention);
    }
  };

  const insertMention = (member: MentionUser) => {
    if (mentionStartPos === null) return;

    const beforeMention = value.substring(0, mentionStartPos);
    const afterCursor = value.substring(textareaRef.current?.selectionStart || mentionStartPos);
    const mentionText = `@${member.firstname} ${member.lastname}`;
    const newValue = beforeMention + mentionText + " " + afterCursor;

    onChange(newValue);
    setShowMentionDropdown(false);
    setMentionStartPos(null);
    setMentionSearch("");

    // Set cursor position after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? filteredMembers.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && filteredMembers.length > 0) {
      e.preventDefault();
      insertMention(filteredMembers[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowMentionDropdown(false);
      setMentionStartPos(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowMentionDropdown(false);
        setMentionStartPos(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />

      {showMentionDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-full max-w-md bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {filteredMembers.map((member, index) => (
            <div
              key={member.id}
              className={`px-3 py-2 cursor-pointer ${
                index === selectedIndex
                  ? "bg-indigo-50 text-indigo-900"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => insertMention(member)}
            >
              <div className="font-medium text-sm">
                {member.firstname} {member.lastname}
              </div>
              <div className="text-xs text-gray-500">{member.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
