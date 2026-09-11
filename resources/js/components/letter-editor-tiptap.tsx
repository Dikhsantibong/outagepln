import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Indent, Outdent,
    Undo2, Redo2, Table as TableIcon, Minus,
    Quote, Type, Palette, Highlighter,
    Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
    Plus, Trash2, ChevronDown,
} from 'lucide-react';

// ──────────────────────────────────────────
// FontSize extension (custom, lightweight)
// ──────────────────────────────────────────
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return { types: ['textStyle'] };
    },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: (el: HTMLElement) => el.style.fontSize?.replace(/['"]+/g, '') || null,
                    renderHTML: (attrs: Record<string, any>) => {
                        if (!attrs.fontSize) return {};
                        return { style: `font-size: ${attrs.fontSize}` };
                    },
                },
            },
        }];
    },
    addCommands() {
        return {
            setFontSize: (size: string) => ({ chain }: any) =>
                chain().setMark('textStyle', { fontSize: size }).run(),
            unsetFontSize: () => ({ chain }: any) =>
                chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
        } as any;
    },
});

// ──────────────────────────────────────────
// Toolbar button component
// ──────────────────────────────────────────
function ToolbarBtn({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors
                ${active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {children}
        </button>
    );
}

function ToolbarSep() {
    return <div className="mx-0.5 h-6 w-px bg-border" />;
}

// ──────────────────────────────────────────
// Dropdown wrapper
// ──────────────────────────────────────────
function ToolbarDropdown({
    label,
    children,
    width = 'w-40',
}: {
    label: React.ReactNode;
    children: React.ReactNode;
    width?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
                {label}
                <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
                <div className={`absolute top-full left-0 z-50 mt-1 ${width} max-h-56 overflow-y-auto rounded-md border bg-popover p-1 shadow-md`}>
                    {children}
                </div>
            )}
        </div>
    );
}

function DropdownItem({
    onClick,
    active = false,
    children,
    style,
}: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={style}
            className={`
                w-full text-left rounded px-2 py-1.5 text-sm transition-colors
                ${active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}
            `}
        >
            {children}
        </button>
    );
}

// ──────────────────────────────────────────
// Color picker
// ──────────────────────────────────────────
function ColorPicker({
    icon,
    title,
    currentColor,
    onSelect,
    onClear,
}: {
    icon: React.ReactNode;
    title: string;
    currentColor?: string;
    onSelect: (color: string) => void;
    onClear: () => void;
}) {
    const colors = [
        '#000000', '#434343', '#666666', '#999999', '#cccccc',
        '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
        '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#e11d48',
        '#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9',
        '#93c5fd', '#c4b5fd', '#f0abfc', '#fda4af', '#ffffff',
    ];

    return (
        <ToolbarDropdown label={<span className="flex items-center gap-1">{icon}</span>} width="w-48">
            <div className="p-1">
                <p className="text-xs text-muted-foreground mb-1.5 px-1">{title}</p>
                <div className="grid grid-cols-5 gap-1">
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onSelect(color)}
                            className={`h-6 w-6 rounded border transition-transform hover:scale-110 ${
                                currentColor === color ? 'ring-2 ring-primary ring-offset-1' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-1.5 w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                    Hapus warna
                </button>
            </div>
        </ToolbarDropdown>
    );
}

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────
const FONT_FAMILIES = [
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
];

const FONT_SIZES = [
    '8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '36pt',
];

const HEADING_LEVELS = [
    { label: 'Normal', level: 0 },
    { label: 'Heading 1', level: 1 },
    { label: 'Heading 2', level: 2 },
    { label: 'Heading 3', level: 3 },
    { label: 'Heading 4', level: 4 },
];

// ──────────────────────────────────────────
// Main Editor Component
// ──────────────────────────────────────────
export default function LetterEditorTiptap({
    value,
    onChange,
    className,
    placeholder = 'Mulai ketik di sini...',
}: {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4] },
            }),
            Underline,
            Subscript,
            Superscript,
            TextStyle,
            Color,
            FontFamily,
            FontSize,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content',
            },
        },
    });

    // Sync external value changes
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value]);

    if (!editor) return null;

    const currentFontFamily = editor.getAttributes('textStyle').fontFamily || '';
    const currentFontSize = editor.getAttributes('textStyle').fontSize || '';
    const currentColor = editor.getAttributes('textStyle').color || '';

    const currentHeading = (() => {
        for (let i = 1; i <= 4; i++) {
            if (editor.isActive('heading', { level: i })) return i;
        }
        return 0;
    })();

    return (
        <div className={`tiptap-wrapper border rounded-md overflow-hidden bg-background ${className || ''}`}>
            {/* Toolbar Row 1: Font, Size, Heading */}
            <div className="tiptap-toolbar flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1">
                {/* Heading */}
                <ToolbarDropdown
                    label={<span className="min-w-[70px] text-left">{HEADING_LEVELS.find(h => h.level === currentHeading)?.label || 'Normal'}</span>}
                    width="w-36"
                >
                    {HEADING_LEVELS.map((h) => (
                        <DropdownItem
                            key={h.level}
                            active={currentHeading === h.level}
                            onClick={() => {
                                if (h.level === 0) {
                                    editor.chain().focus().setParagraph().run();
                                } else {
                                    editor.chain().focus().toggleHeading({ level: h.level as 1|2|3|4 }).run();
                                }
                            }}
                        >
                            {h.level === 0 ? h.label : <span style={{ fontSize: `${18 - h.level * 2}px`, fontWeight: 'bold' }}>{h.label}</span>}
                        </DropdownItem>
                    ))}
                </ToolbarDropdown>

                <ToolbarSep />

                {/* Font Family */}
                <ToolbarDropdown
                    label={
                        <span className="min-w-[100px] text-left truncate">
                            {FONT_FAMILIES.find(f => currentFontFamily.includes(f.value.split(',')[0]))?.label || 'Font'}
                        </span>
                    }
                    width="w-52"
                >
                    {FONT_FAMILIES.map((f) => (
                        <DropdownItem
                            key={f.value}
                            active={currentFontFamily.includes(f.value.split(',')[0])}
                            onClick={() => editor.chain().focus().setFontFamily(f.value).run()}
                            style={{ fontFamily: f.value }}
                        >
                            {f.label}
                        </DropdownItem>
                    ))}
                </ToolbarDropdown>

                <ToolbarSep />

                {/* Font Size */}
                <ToolbarDropdown
                    label={<span className="min-w-[32px] text-left">{currentFontSize || '12pt'}</span>}
                    width="w-24"
                >
                    {FONT_SIZES.map((size) => (
                        <DropdownItem
                            key={size}
                            active={currentFontSize === size}
                            onClick={() => (editor.chain().focus() as any).setFontSize(size).run()}
                        >
                            {size}
                        </DropdownItem>
                    ))}
                </ToolbarDropdown>

                <ToolbarSep />

                {/* Bold, Italic, Underline, Strikethrough */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
                    <Bold className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
                    <Italic className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
                    <SubscriptIcon className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
                    <SuperscriptIcon className="h-4 w-4" />
                </ToolbarBtn>

                <ToolbarSep />

                {/* Text Color */}
                <ColorPicker
                    icon={<Palette className="h-4 w-4" style={currentColor ? { color: currentColor } : undefined} />}
                    title="Warna Teks"
                    currentColor={currentColor}
                    onSelect={(color) => editor.chain().focus().setColor(color).run()}
                    onClear={() => editor.chain().focus().unsetColor().run()}
                />

                {/* Highlight */}
                <ColorPicker
                    icon={<Highlighter className="h-4 w-4" />}
                    title="Warna Highlight"
                    currentColor={editor.getAttributes('highlight').color}
                    onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                    onClear={() => editor.chain().focus().unsetHighlight().run()}
                />

                <ToolbarSep />

                {/* Alignment */}
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Rata Kiri">
                    <AlignLeft className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Rata Tengah">
                    <AlignCenter className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rata Kanan">
                    <AlignRight className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Rata Kiri-Kanan">
                    <AlignJustify className="h-4 w-4" />
                </ToolbarBtn>

                <ToolbarSep />

                {/* Lists */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                    <List className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')} title="Indent">
                    <Indent className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')} title="Outdent">
                    <Outdent className="h-4 w-4" />
                </ToolbarBtn>

                <ToolbarSep />

                {/* Table */}
                <ToolbarDropdown label={<TableIcon className="h-4 w-4" />} width="w-48">
                    <DropdownItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                        <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Sisipkan Tabel 3×3</span>
                    </DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}>
                        <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Sisipkan Tabel 4×4</span>
                    </DropdownItem>
                    {editor.isActive('table') && (
                        <>
                            <div className="my-1 h-px bg-border" />
                            <DropdownItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                                Tambah Kolom →
                            </DropdownItem>
                            <DropdownItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                                Tambah Baris ↓
                            </DropdownItem>
                            <DropdownItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                                Hapus Kolom
                            </DropdownItem>
                            <DropdownItem onClick={() => editor.chain().focus().deleteRow().run()}>
                                Hapus Baris
                            </DropdownItem>
                            <DropdownItem onClick={() => editor.chain().focus().mergeCells().run()}>
                                Gabung Sel
                            </DropdownItem>
                            <DropdownItem onClick={() => editor.chain().focus().splitCell().run()}>
                                Pisah Sel
                            </DropdownItem>
                            <div className="my-1 h-px bg-border" />
                            <DropdownItem onClick={() => editor.chain().focus().deleteTable().run()}>
                                <span className="flex items-center gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Hapus Tabel</span>
                            </DropdownItem>
                        </>
                    )}
                </ToolbarDropdown>

                <ToolbarSep />

                {/* Blockquote & HR */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                    <Quote className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis Horizontal">
                    <Minus className="h-4 w-4" />
                </ToolbarBtn>

                <ToolbarSep />

                {/* Undo/Redo */}
                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
                    <Undo2 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
                    <Redo2 className="h-4 w-4" />
                </ToolbarBtn>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
