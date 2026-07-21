"use client"

import { useState, useRef } from "react"
import { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  FolderOpen,
  Youtube,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Type,
  Undo2,
  Redo2,
  Minus,
} from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { MediaGalleryPicker } from "@/components/dashboard/media-gallery-picker"

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt("Enter URL:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImageFromDevice = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "posts")

      try {
        const res = await fetch("/api/media", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url }).run()
        }
      } catch (err) {
        console.error("Image upload failed:", err)
      }
    }
    input.click()
  }

  const addImageFromGallery = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run()
  }

  const addYoutube = () => {
    const url = window.prompt("Enter YouTube URL:")
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  const setHeading = (level: 1 | 2 | 3 | 4) => {
    editor.chain().focus().toggleHeading({ level }).run()
  }

  const currentHeadingLevel = (): number | null => {
    for (let i = 1; i <= 4; i++) {
      if (editor.isActive("heading", { level: i })) return i
    }
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-2 bg-muted/30">
      {/* Undo/Redo */}
      <ToolbarTooltip tip="Undo">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Redo">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-4" />
        </Toggle>
      </ToolbarTooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Heading dropdown */}
      <DropdownMenu>
        <ToolbarTooltip tip="Headings">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Type className="size-4" />
              <span className="text-xs">
                {currentHeadingLevel() ? `H${currentHeadingLevel()}` : "P"}
              </span>
            </Button>
          </DropdownMenuTrigger>
        </ToolbarTooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHeading(1)}>
            <Heading1 className="size-4 mr-2" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHeading(2)}>
            <Heading2 className="size-4 mr-2" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHeading(3)}>
            <Heading3 className="size-4 mr-2" /> Heading 3
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHeading(4)}>
            <Heading4 className="size-4 mr-2" /> Heading 4
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <ToolbarTooltip tip="Bold (Ctrl+B)">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Italic (Ctrl+I)">
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Underline (Ctrl+U)">
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Strikethrough">
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Inline Code">
        <Toggle
          size="sm"
          pressed={editor.isActive("code")}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Highlight">
        <Toggle
          size="sm"
          pressed={editor.isActive("highlight")}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="size-4" />
        </Toggle>
      </ToolbarTooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarTooltip tip="Bullet List">
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Ordered List">
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Blockquote">
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Code Block">
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Horizontal Rule">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </Toggle>
      </ToolbarTooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <ToolbarTooltip tip="Align Left">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Align Center">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Align Right">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Align Justify">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "justify" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="size-4" />
        </Toggle>
      </ToolbarTooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert */}
      <ToolbarTooltip tip="Add Link">
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={addLink}
        >
          <LinkIcon className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Upload Image">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addImageFromDevice}
        >
          <ImageIcon className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip tip="Image from Gallery">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => setGalleryOpen(true)}
        >
          <FolderOpen className="size-4" />
        </Toggle>
      </ToolbarTooltip>

      {/* Gallery Picker Dialog */}
      <MediaGalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={addImageFromGallery}
        title="Insert Image from Gallery"
      />
      <ToolbarTooltip tip="YouTube Embed">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addYoutube}
        >
          <Youtube className="size-4" />
        </Toggle>
      </ToolbarTooltip>
    </div>
  )
}

function ToolbarTooltip({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}
