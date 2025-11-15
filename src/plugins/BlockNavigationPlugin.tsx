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
          // For code blocks, only exit if the ENTIRE block is empty
          const textContent = element.getTextContent();
          const isEntireBlockEmpty = textContent.trim().length === 0;

          if (isEntireBlockEmpty) {
            // Empty code block - convert to paragraph
            event?.preventDefault();
            $setBlocksType(selection, () => $createParagraphNode());
            return true;
          }

          // Code block has content - allow default Lexical behavior (multiline)
          // This will insert a line break within the same code block
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
