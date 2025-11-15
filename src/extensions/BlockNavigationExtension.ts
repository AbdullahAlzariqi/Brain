import { Extension } from '@tiptap/core';

export interface BlockNavigationOptions {
  onCreateNewBlock: () => void;
  onMoveToNextBlock: () => void;
  isLastBlock: boolean;
}

export const BlockNavigationExtension = Extension.create<BlockNavigationOptions>({
  name: 'blockNavigation',

  addOptions() {
    return {
      onCreateNewBlock: () => {},
      onMoveToNextBlock: () => {},
      isLastBlock: false,
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;

        const parentNode = $from.parent;

        // Check if we're in a heading or code block
        const isHeading = parentNode.type.name === 'heading';
        const isCodeBlock = parentNode.type.name === 'codeBlock';

        if (isHeading || isCodeBlock) {
          const textContent = parentNode.textContent;

          // Check if entire block is empty
          const isEntireBlockEmpty = textContent.trim().length === 0;

          if (isEntireBlockEmpty) {
            // Empty block - convert to paragraph
            this.editor.commands.setNode('paragraph');
            return true;
          }

          // Get cursor position
          const cursorPos = selection.from - $from.start();

          // Find the current line boundaries
          const lastNewlineBeforeCursor = textContent.lastIndexOf('\n', cursorPos - 1);
          const lineStart = lastNewlineBeforeCursor === -1 ? 0 : lastNewlineBeforeCursor + 1;

          const nextNewlineAfterCursor = textContent.indexOf('\n', cursorPos);
          const lineEnd = nextNewlineAfterCursor === -1 ? textContent.length : nextNewlineAfterCursor;

          // Get current line text
          const currentLineText = textContent.substring(lineStart, lineEnd);
          const isCurrentLineEmpty = currentLineText.trim().length === 0;

          if (isCurrentLineEmpty) {
            // Empty line - create new block
            if (this.options.isLastBlock) {
              this.options.onCreateNewBlock();
            } else {
              this.options.onMoveToNextBlock();
            }
            return true;
          }

          // Non-empty line - insert line break within block
          return false; // Let TipTap handle default behavior (hard break)
        }

        // For other elements (paragraphs, quotes, lists, etc.)
        const currentElementText = parentNode.textContent || '';
        const isElementEmpty = currentElementText.trim().length === 0;

        if (isElementEmpty) {
          // Element is empty, create new block
          if (this.options.isLastBlock) {
            this.options.onCreateNewBlock();
          } else {
            this.options.onMoveToNextBlock();
          }
          return true;
        }

        // Element has text, allow default multiline behavior
        return false;
      },
    };
  },
});
