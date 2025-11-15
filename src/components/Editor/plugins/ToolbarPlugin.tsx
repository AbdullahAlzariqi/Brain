import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $isHeadingNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  $setBlocksType,
} from '@lexical/selection';
import { $createParagraphNode } from 'lexical';
import { mergeRegister } from '@lexical/utils';

const LowPriority = 1;

const supportedBlockTypes = new Set([
  'paragraph',
  'quote',
  'code',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
]);

function Divider() {
  return <div className="w-px bg-gray-600 mx-2 h-6" />;
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update block type
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = anchorNode.getParents().find((p: any) => $isListNode(p)) as ListNode;
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (supportedBlockTypes.has(type)) {
            setBlockType(type);
          }
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  return (
    <div
      className="flex items-center gap-1 p-2 bg-gray-800 border-b border-gray-700 sticky top-0 z-10 rounded-t-16"
      ref={toolbarRef}
    >
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
        aria-label="Undo"
      >
        ↶
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
        aria-label="Redo"
      >
        ↷
      </button>
      <Divider />
      <select
        className="p-2 rounded bg-gray-700 text-gray-300 border border-gray-600"
        value={blockType}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') formatParagraph();
          else if (value === 'h1') formatHeading('h1');
          else if (value === 'h2') formatHeading('h2');
          else if (value === 'h3') formatHeading('h3');
          else if (value === 'quote') formatQuote();
          else if (value === 'ul') formatBulletList();
          else if (value === 'ol') formatNumberedList();
        }}
      >
        <option value="paragraph">Text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
        <option value="ul">Bullet List</option>
        <option value="ol">Numbered List</option>
      </select>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={`p-2 px-3 rounded hover:bg-gray-700 ${
          isBold ? 'bg-gray-600 text-white' : 'text-gray-300'
        }`}
        aria-label="Format Bold"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={`p-2 px-3 rounded hover:bg-gray-700 ${
          isItalic ? 'bg-gray-600 text-white' : 'text-gray-300'
        }`}
        aria-label="Format Italics"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={`p-2 px-3 rounded hover:bg-gray-700 ${
          isUnderline ? 'bg-gray-600 text-white' : 'text-gray-300'
        }`}
        aria-label="Format Underline"
      >
        <u>U</u>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={`p-2 px-3 rounded hover:bg-gray-700 ${
          isStrikethrough ? 'bg-gray-600 text-white' : 'text-gray-300'
        }`}
        aria-label="Format Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }}
        className={`p-2 px-3 rounded hover:bg-gray-700 font-mono ${
          isCode ? 'bg-gray-600 text-white' : 'text-gray-300'
        }`}
        aria-label="Format Code"
      >
        {'<>'}
      </button>
    </div>
  );
}
