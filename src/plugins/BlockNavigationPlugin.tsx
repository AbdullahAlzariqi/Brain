import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
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

        // For multiline components (paragraphs, lists, code, quotes, etc.)
        // Only create a new block if the CURRENT LINE is empty

        // Get the current element's text content
        const currentElementText = element?.getTextContent() || '';
        const isCurrentLineEmpty = currentElementText.trim().length === 0;

        if (isCurrentLineEmpty) {
          // Current line is empty, create new block
          event?.preventDefault();
          if (isLastBlock) {
            onCreateNewBlock();
          } else {
            onMoveToNextBlock();
          }
          return true;
        }

        // Current line has text, allow default multiline behavior
        // This will create a new paragraph/line within the same block
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onCreateNewBlock, onMoveToNextBlock, isLastBlock]);

  return null;
}
