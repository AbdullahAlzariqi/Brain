import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';

export function EnterKeyPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getParent();

        // Check if we're in a heading
        if ($isHeadingNode(element)) {
          const textContent = element.getTextContent();

          // If heading is empty or we're at the end of an empty line
          if (!textContent || textContent.trim() === '') {
            event?.preventDefault();

            // Create a new paragraph block
            const paragraph = $createParagraphNode();
            element.insertAfter(paragraph);
            paragraph.select();

            // Remove empty heading
            if (!textContent) {
              element.remove();
            }

            return true;
          }

          // If Enter is pressed at the end of heading, create new paragraph
          if (selection.anchor.offset === textContent.length) {
            event?.preventDefault();

            const paragraph = $createParagraphNode();
            element.insertAfter(paragraph);
            paragraph.select();

            return true;
          }

          // Otherwise, let default behavior handle it (but headings are single-line)
          return false;
        }

        // For paragraphs and other multi-line elements
        const currentText = anchorNode.getTextContent();
        const cursorOffset = selection.anchor.offset;

        // Check if we're on an empty line or at the end of empty content
        const lines = element?.getTextContent().split('\n') || [];
        const currentLineIndex = currentText.substring(0, cursorOffset).split('\n').length - 1;
        const currentLine = lines[currentLineIndex] || '';

        // If the current line is empty and it's the last line, create new block
        if (currentLine.trim() === '' && currentLineIndex === lines.length - 1) {
          // Check if there was a previous line that was also empty (double enter)
          const previousLine = lines[currentLineIndex - 1];

          if (previousLine !== undefined && previousLine.trim() === '') {
            event?.preventDefault();

            // Create new paragraph block
            const paragraph = $createParagraphNode();
            element?.insertAfter(paragraph);
            paragraph.select();

            // Remove the empty lines from current block
            const newText = lines.slice(0, -1).join('\n');
            if (newText.trim() === '') {
              element?.remove();
            } else {
              anchorNode.setTextContent(newText);
            }

            return true;
          }
        }

        // Default behavior for normal enter (new line within block)
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
