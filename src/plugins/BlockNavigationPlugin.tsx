import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';

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
          // Headings are single-line, always create new paragraph block
          event?.preventDefault();
          onCreateNewBlock();
          return true;
        }

        // Check if we're in a code block
        const isCodeBlock = element && $isCodeNode(element);

        if (isCodeBlock) {
          // For code blocks, check if the current line is empty
          // Get the text content and cursor position
          const textContent = element.getTextContent();
          const offset = anchor.offset;

          // Find the current line by looking at text before and after cursor
          const textBeforeCursor = textContent.substring(0, offset);
          const textAfterCursor = textContent.substring(offset);

          // Get the current line content
          const lastNewlineBeforeCursor = textBeforeCursor.lastIndexOf('\n');
          const firstNewlineAfterCursor = textAfterCursor.indexOf('\n');

          const lineStart = lastNewlineBeforeCursor === -1 ? 0 : lastNewlineBeforeCursor + 1;
          const lineEnd = firstNewlineAfterCursor === -1
            ? textContent.length
            : offset + firstNewlineAfterCursor;

          const currentLineText = textContent.substring(lineStart, lineEnd);
          const isCurrentLineEmpty = currentLineText.trim().length === 0;

          if (isCurrentLineEmpty) {
            // Empty line in code block - exit code block and create paragraph
            event?.preventDefault();

            // Convert current block to paragraph
            $setBlocksType(selection, () => $createParagraphNode());

            // Create new block
            onCreateNewBlock();
            return true;
          }

          // Current line has text, allow default behavior (add line break in code)
          return false;
        }

        // For other multiline components (paragraphs, quotes, lists, etc.)
        // Only create a new block if the entire element is empty
        const currentElementText = element?.getTextContent() || '';
        const isElementEmpty = currentElementText.trim().length === 0;

        if (isElementEmpty) {
          // Element is empty, create new block
          event?.preventDefault();
          if (isLastBlock) {
            onCreateNewBlock();
          } else {
            onMoveToNextBlock();
          }
          return true;
        }

        // Element has text, allow default multiline behavior
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onCreateNewBlock, onMoveToNextBlock, isLastBlock]);

  return null;
}
