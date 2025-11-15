import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getRoot,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';

interface BlockNavigationPluginProps {
  onCreateNewBlock: () => void;
  onMoveToNextBlock: () => void;
  isLastBlock: boolean;
}

export function BlockNavigationPlugin({
  onCreateNewBlock,
  onMoveToNextBlock,
  isLastBlock,
}: BlockNavigationPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        const element = anchorNode.getTopLevelElement();

        // Check if we're in a heading (single-line component)
        const isHeading = element && $isHeadingNode(element);

        if (isHeading) {
          // Headings are single-line, always create new block
          event?.preventDefault();
          onCreateNewBlock();
          return true;
        }

        // For multiline components (paragraphs, lists, etc.)
        const root = $getRoot();
        const children = root.getChildren();
        const textContent = root.getTextContent();

        // Check if editor is empty or has only whitespace
        const isEmpty = textContent.trim().length === 0;

        // Check if we're at the end of the content
        const isAtEnd = anchor.offset === anchorNode.getTextContentSize();
        const isLastNode = children.length > 0 &&
                          children[children.length - 1] === element;

        if (isEmpty || (isAtEnd && isLastNode)) {
          // Empty last line or pressing enter on empty editor
          event?.preventDefault();
          if (isLastBlock) {
            onCreateNewBlock();
          } else {
            onMoveToNextBlock();
          }
          return true;
        }

        // Allow default multiline behavior (create new paragraph within block)
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onCreateNewBlock, onMoveToNextBlock, isLastBlock]);

  return null;
}
