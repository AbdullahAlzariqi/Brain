import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { useRef, useEffect } from 'react';
import theme from '../theme/editorTheme';
import { BlockNavigationPlugin } from '../plugins/BlockNavigationPlugin';
import { SlashCommandPlugin } from '../plugins/SlashCommandPlugin';

interface BlockEditorProps {
  id: string;
  onCreateNewBlock: () => void;
  onMoveToNextBlock: () => void;
  onRemoveBlock: () => void;
  isLastBlock: boolean;
  autoFocus?: boolean;
}

export function BlockEditor({
  id,
  onCreateNewBlock,
  onMoveToNextBlock,
  isLastBlock,
  autoFocus = false,
}: BlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const initialConfig = {
    namespace: `Block-${id}`,
    theme,
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
    ],
  };

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      const contentEditable = editorRef.current.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      if (contentEditable) {
        setTimeout(() => {
          contentEditable.focus();
        }, 0);
      }
    }
  }, [autoFocus]);

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
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ position: 'relative' }}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-input" />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <BlockNavigationPlugin
              onCreateNewBlock={onCreateNewBlock}
              onMoveToNextBlock={onMoveToNextBlock}
              isLastBlock={isLastBlock}
            />
            <SlashCommandPlugin />
          </div>
        </LexicalComposer>
      </div>
    </div>
  );
}
