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

        // Check if we're in a heading or code block
        const isHeading = element && $isHeadingNode(element);
        const isCodeBlock = element && $isCodeNode(element);

        if (isHeading || isCodeBlock) {
          const textContent = element.getTextContent();
          const offset = anchor.offset;

          // Check if entire block is empty
          const isEntireBlockEmpty = textContent.trim().length === 0;

          if (isEntireBlockEmpty) {
            // Empty block - convert to paragraph
            event?.preventDefault();
            $setBlocksType(selection, () => $createParagraphNode());
            return true;
          }

          // Find the current line boundaries
          // Find start of current line (last newline before cursor, or 0)
          const lastNewlineBeforeCursor = textContent.lastIndexOf('\n', offset - 1);
          const lineStart = lastNewlineBeforeCursor === -1 ? 0 : lastNewlineBeforeCursor + 1;

          // Find end of current line (next newline after cursor, or end of text)
          const nextNewlineAfterCursor = textContent.indexOf('\n', offset);
          const lineEnd = nextNewlineAfterCursor === -1 ? textContent.length : nextNewlineAfterCursor;

          // Get current line text
          const currentLineText = textContent.substring(lineStart, lineEnd);
          const isCurrentLineEmpty = currentLineText.trim().length === 0;

          if (isCurrentLineEmpty) {
            // Empty line - create new block
            event?.preventDefault();
            if (isLastBlock) {
              onCreateNewBlock();
            } else {
              onMoveToNextBlock();
            }
            return true;
          }

          // Non-empty line - insert line break within block
          // We need to explicitly handle this to prevent creating new blocks
          event?.preventDefault();
          selection.insertText('\n');
          return true;
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
