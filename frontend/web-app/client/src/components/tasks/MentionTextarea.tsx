import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";

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

// Mention suggestion list component
const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: `${item.lastname} ${item.firstname}` });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="mention-dropdown bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto" style={{ position: "relative", zIndex: 9999, pointerEvents: "auto" }}>
      {props.items.length ? (
        props.items.map((item: MentionUser, index: number) => (
          <button
            key={item.id}
            type="button"
            className={`w-full text-left px-3 py-1.5 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
              index === selectedIndex ? "bg-indigo-100 text-indigo-900 font-medium" : "hover:bg-gray-100"
            }`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => selectItem(index)}
            onMouseDown={(e) => {
              // Prevent blur on textarea when clicking
              e.preventDefault();
              selectItem(index);
            }}
          >
            <div className="font-medium">
              {item.lastname} {item.firstname}
            </div>
            <div className={`text-xs ${index === selectedIndex ? "text-indigo-700" : "text-gray-500"}`}>{item.email}</div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";

export function MentionTextarea({
  value,
  onChange,
  placeholder = "",
  rows = 3,
  projectMembers,
  disabled = false,
}: MentionTextareaProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default paragraph handling to allow plain text
        paragraph: {
          HTMLAttributes: {
            class: "m-0",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: ({ query }) => {
            return projectMembers
              .filter((member) => {
                const searchTerm = query.toLowerCase();
                return (
                  member.firstname.toLowerCase().includes(searchTerm) ||
                  member.lastname.toLowerCase().includes(searchTerm) ||
                  member.email.toLowerCase().includes(searchTerm)
                );
              })
              .slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer;
            let popup: any;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  zIndex: 9999,
                  popperOptions: {
                    modifiers: [
                      {
                        name: "preventOverflow",
                        options: {
                          boundary: "viewport",
                        },
                      },
                    ],
                  },
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as any,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                // @ts-ignore - Tiptap ReactRenderer ref types
                return component.ref?.onKeyDown?.(props) || false;
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
        renderLabel({ node }) {
          return `@${node.attrs.label}`;
        },
      }),
    ],
    content: "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = extractTextWithMentions(json);
      onChange(text);
    },
  });

  // Update editor when value changes externally
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentText = extractTextWithMentions(editor.getJSON());
      if (value !== currentText) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor]);

  return (
    <div className="tiptap-wrapper">
      <style>{`
        .tiptap-wrapper .ProseMirror {
          min-height: ${rows * 1.5}rem;
          max-height: 12rem;
          overflow-y: auto;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgb(209, 213, 219);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          outline: none;
        }

        .tiptap-wrapper .ProseMirror:focus {
          border-color: rgb(99, 102, 241);
          box-shadow: 0 0 0 1px rgb(99, 102, 241);
        }

        .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(156, 163, 175);
          pointer-events: none;
          height: 0;
        }

        .tiptap-wrapper .ProseMirror p {
          margin: 0;
        }

        .tiptap-wrapper .mention {
          background-color: rgb(224, 231, 255);
          color: rgb(67, 56, 202);
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-weight: 500;
          box-decoration-break: clone;
        }

        .tiptap-wrapper .ProseMirror[contenteditable="false"] {
          background-color: rgb(243, 244, 246);
          cursor: not-allowed;
        }

        /* Mention dropdown scrollbar styling */
        .mention-dropdown {
          scrollbar-width: thin;
          scrollbar-color: rgb(203, 213, 225) transparent;
        }

        .mention-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .mention-dropdown::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 0.375rem;
        }

        .mention-dropdown::-webkit-scrollbar-thumb {
          background-color: rgb(203, 213, 225);
          border-radius: 0.375rem;
        }

        .mention-dropdown::-webkit-scrollbar-thumb:hover {
          background-color: rgb(148, 163, 184);
        }

        /* Fade indicator at bottom when scrollable */
        .mention-dropdown::after {
          content: '';
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.9));
          pointer-events: none;
          display: block;
        }

        /* Hide fade when scrolled to bottom */
        .mention-dropdown::-webkit-scrollbar-thumb:active ~ ::after {
          display: none;
        }
      `}</style>

      <EditorContent editor={editor} />
    </div>
  );
}

// Helper to extract text with @[Name](userId) format
function extractTextWithMentions(json: any): string {
  let text = "";

  const processNode = (node: any) => {
    if (node.type === "text") {
      text += node.text;
    } else if (node.type === "mention") {
      text += `@[${node.attrs.label}](${node.attrs.id})`;
    } else if (node.type === "paragraph") {
      if (node.content) {
        node.content.forEach(processNode);
      }
      text += "\n";
    } else if (node.content) {
      node.content.forEach(processNode);
    }
  };

  if (json.content) {
    json.content.forEach(processNode);
  }

  return text.trim();
}
