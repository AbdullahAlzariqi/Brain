import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import CodeBlock from '@tiptap/extension-code-block';
import Link from '@tiptap/extension-link';
import History from '@tiptap/extension-history';
import { useRef, useEffect } from 'react';
import { BlockNavigationExtension } from '../extensions/BlockNavigationExtension';
import { SlashCommandExtension } from '../extensions/SlashCommandExtension';

interface BlockEditorProps {
  onCreateNewBlock: () => void;
  onMoveToNextBlock: () => void;
  isLastBlock: boolean;
  autoFocus?: boolean;
}

export function BlockEditor({
  onCreateNewBlock,
  onMoveToNextBlock,
  isLastBlock,
  autoFocus = false,
}: BlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'editor-code',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      History,
      BlockNavigationExtension.configure({
        onCreateNewBlock,
        onMoveToNextBlock,
        isLastBlock,
      }),
      SlashCommandExtension,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'editor-input',
      },
    },
  });

  useEffect(() => {
    if (autoFocus && editor) {
      setTimeout(() => {
        editor.commands.focus();
      }, 0);
    }
  }, [autoFocus, editor]);

  return (
    <div className="block-container">
      <div className="block-actions">
        <button
          className="block-action-button"
          title="Drag to reorder"
          onMouseDown={(e) => {
            // Prevent focus loss
            e.preventDefault();
          }}
        >
          ⋮⋮
        </button>
      </div>
      <div className="editor-block" ref={editorRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
