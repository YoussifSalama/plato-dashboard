"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import type { Editor } from "@tiptap/core";
import { FontFamily } from "reactjs-tiptap-editor/fontfamily";
import { FontSize } from "reactjs-tiptap-editor/fontsize";
import clsx from "clsx";

type RetraceTextEditorProps = {
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    disabled?: boolean;
    isReadOnly?: boolean;
};

const defaultFontFamilies = [
    "Inter",
    "Arial",
    "Georgia",
    "Times New Roman",
    "Courier New",
];

const defaultFontSizes = [
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "24px",
    "28px",
    "32px",
];

const RetraceTextEditor = ({
    value,
    onChange,
    placeholder,
    minHeight = 140,
    disabled = false,
    isReadOnly = false,
}: RetraceTextEditorProps) => {
    const extensions = useMemo(
        () => [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
            }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            FontFamily,
            FontSize,
        ],
        []
    );

    const editor = useEditor({
        extensions,
        content: value || "",
        editable: !disabled && !isReadOnly,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "prose max-w-none focus:outline-none",
                "data-placeholder": placeholder ?? "",
            },
        },
        onUpdate: ({ editor: current }: { editor: Editor }) => {
            if (onChange) {
                onChange(current.getHTML());
            }
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!disabled && !isReadOnly);
    }, [disabled, isReadOnly, editor]);

    useEffect(() => {
        if (!editor) return;
        const nextValue = value || "";
        if (editor.getHTML() === nextValue) return;
        editor.commands.setContent(nextValue, { emitUpdate: false });
    }, [editor, value]);

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href as string | undefined;
        const nextUrl = window.prompt("Enter a link URL", previousUrl ?? "");
        if (nextUrl === null) return;
        if (nextUrl.trim() === "") {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: nextUrl.trim() })
            .run();
    };

    if (!editor) {
        return (
            <div
                className="rounded-md border border-blue-200 bg-white p-3 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300"
                style={{ minHeight }}
            >
                Loading editor...
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {!isReadOnly && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                    <select
                        className="rounded-md border border-blue-200 bg-white px-2 py-1 text-sm text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        defaultValue=""
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            if (!nextValue) return;
                            editor.chain().focus().setFontFamily(nextValue).run();
                        }}
                    >
                        <option value="" disabled>
                            Font
                        </option>
                        {defaultFontFamilies.map((family) => (
                            <option key={family} value={family}>
                                {family}
                            </option>
                        ))}
                    </select>
                    <select
                        className="rounded-md border border-blue-200 bg-white px-2 py-1 text-sm text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        defaultValue=""
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            if (!nextValue) return;
                            editor.chain().focus().setFontSize(nextValue).run();
                        }}
                    >
                        <option value="" disabled>
                            Size
                        </option>
                        {defaultFontSizes.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    <input
                        type="color"
                        aria-label="Text color"
                        className="h-8 w-8 cursor-pointer rounded-md border border-blue-200 bg-white p-1 dark:border-slate-700/60 dark:bg-slate-900"
                        onChange={(event) => {
                            editor.chain().focus().setColor(event.target.value).run();
                        }}
                    />
                    <button
                        type="button"
                        className={clsx(
                            "rounded-md border px-2 py-1 font-semibold",
                            editor.isActive("bold")
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-blue-200 bg-white text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        )}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        B
                    </button>
                    <button
                        type="button"
                        className={clsx(
                            "rounded-md border px-2 py-1 italic",
                            editor.isActive("italic")
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-blue-200 bg-white text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        )}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        I
                    </button>
                    <button
                        type="button"
                        className={clsx(
                            "rounded-md border px-2 py-1 underline",
                            editor.isActive("underline")
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-blue-200 bg-white text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        )}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        U
                    </button>
                    <button
                        type="button"
                        className={clsx(
                            "rounded-md border px-2 py-1",
                            editor.isActive("bulletList")
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-blue-200 bg-white text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        )}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        • List
                    </button>
                    <button
                        type="button"
                        className={clsx(
                            "rounded-md border px-2 py-1",
                            editor.isActive("orderedList")
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-blue-200 bg-white text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        )}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        1. List
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        onClick={setLink}
                    >
                        Link
                    </button>
                    {editor.isActive("link") && (
                        <button
                            type="button"
                            className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                            onClick={() => editor.chain().focus().unsetLink().run()}
                        >
                            Unlink
                        </button>
                    )}
                    <button
                        type="button"
                        className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    >
                        Left
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    >
                        Center
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200"
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    >
                        Right
                    </button>
                </div>
            )}
            <div
                className="rounded-md border border-blue-200 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-900"
                style={{ minHeight }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default RetraceTextEditor;

