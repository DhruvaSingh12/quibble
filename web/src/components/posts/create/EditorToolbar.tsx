import { Editor } from "@tiptap/react";
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
} from "react-icons/fa6";
import { ImageIcon } from "lucide-react";
import { HiMiniGif } from "react-icons/hi2";
import { toast } from "@/components/ui/use-toast";

interface EditorToolbarProps {
  editor: Editor | null;
  selectedGif: string | null;
  showGifPicker: boolean;
  setShowGifPicker: (show: boolean) => void;
  onFileSelect: () => void;
}

export default function EditorToolbar({
  editor,
  selectedGif,
  showGifPicker,
  setShowGifPicker,
  onFileSelect,
}: EditorToolbarProps) {
  const ToolbarButton = ({
    onClick,
    isActive = false,
    icon: Icon,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded-lg p-2 transition-colors hover:bg-muted ${
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
      }`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="flex flex-none items-center gap-1 border-b bg-muted/20 p-3 overflow-x-auto">
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBold().run()}
        isActive={editor?.isActive("bold")}
        icon={FaBold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        isActive={editor?.isActive("italic")}
        icon={FaItalic}
        title="Italic"
      />
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        isActive={editor?.isActive("strike")}
        icon={FaStrikethrough}
        title="Strikethrough"
      />
      <div className="mx-2 h-6 w-px bg-border flex-none" />
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        isActive={editor?.isActive("bulletList")}
        icon={FaListUl}
        title="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        isActive={editor?.isActive("orderedList")}
        icon={FaListOl}
        title="Numbered List"
      />
      <div className="mx-2 h-6 w-px bg-border flex-none" />
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        isActive={editor?.isActive("blockquote")}
        icon={FaQuoteLeft}
        title="Quote"
      />
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleCode().run()}
        isActive={editor?.isActive("code")}
        icon={FaCode}
        title="Inline Code"
      />
      <div className="mx-2 h-6 w-px bg-border flex-none" />
      <ToolbarButton
        onClick={onFileSelect}
        isActive={false}
        icon={ImageIcon}
        title="Add Photo/Video"
      />
      <ToolbarButton
        onClick={() => {
          if (selectedGif) {
            toast({
              title: "One GIF per post",
              description:
                "You can only add one GIF per post. Remove the existing GIF first.",
              variant: "destructive",
            });
            return;
          }
          setShowGifPicker(!showGifPicker);
        }}
        isActive={showGifPicker}
        icon={HiMiniGif}
        title="GIF"
      />
    </div>
  );
}
