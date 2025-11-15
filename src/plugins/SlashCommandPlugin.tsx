import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  TextNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $createParagraphNode } from 'lexical';

interface SlashCommand {
  title: string;
  description: string;
  keywords: string[];
  onSelect: () => void;
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [search, setSearch] = useState('');

  const commands: SlashCommand[] = [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      keywords: ['h1', 'heading1', 'title'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h1'));
          }
        });
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      keywords: ['h2', 'heading2'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h2'));
          }
        });
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      keywords: ['h3', 'heading3'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h3'));
          }
        });
      },
    },
    {
      title: 'Bulleted List',
      description: 'Create a bulleted list',
      keywords: ['ul', 'bullet', 'list', 'unordered'],
      onSelect: () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      keywords: ['ol', 'numbered', 'list', 'ordered'],
      onSelect: () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      title: 'Quote',
      description: 'Create a quote block',
      keywords: ['quote', 'blockquote', 'citation'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        });
      },
    },
    {
      title: 'Code Block',
      description: 'Create a code block',
      keywords: ['code', 'codeblock', 'snippet'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createCodeNode());
          }
        });
      },
    },
    {
      title: 'Text',
      description: 'Regular paragraph text',
      keywords: ['text', 'paragraph', 'normal', 'p'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        });
      },
    },
  ];

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.keywords.some((keyword) => keyword.includes(searchLower))
    );
  });

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setShowMenu(false);
          return;
        }

        const node = selection.anchor.getNode();
        const textContent = node.getTextContent();

        // Check for slash command
        const slashIndex = textContent.lastIndexOf('/');
        if (slashIndex !== -1) {
          const afterSlash = textContent.substring(slashIndex + 1);
          // Only show menu if slash is at start or after space
          const beforeSlash = textContent.substring(0, slashIndex);
          if (beforeSlash.length === 0 || beforeSlash.endsWith(' ')) {
            setSearch(afterSlash);
            setShowMenu(true);
            return;
          }
        }

        setShowMenu(false);
      });
    });
  }, [editor]);

  const handleSelectCommand = (command: SlashCommand) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.anchor.getNode();
      const textContent = node.getTextContent();
      const slashIndex = textContent.lastIndexOf('/');

      if (slashIndex !== -1 && node instanceof TextNode) {
        // Remove the slash command text
        const beforeSlash = textContent.substring(0, slashIndex);
        node.setTextContent(beforeSlash);
      }
    });

    command.onSelect();
    setShowMenu(false);
  };

  if (!showMenu || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        background: '#252727',
        border: '2px solid #3e4242',
        borderRadius: '16px',
        padding: '8px',
        minWidth: '280px',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      }}
    >
      {filteredCommands.map((command, index) => (
        <div
          key={index}
          onClick={() => handleSelectCommand(command)}
          style={{
            padding: '10px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            marginBottom: '2px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3e4242';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            style={{
              color: '#d0d2d2',
              fontWeight: 600,
              marginBottom: '2px',
              fontSize: '14px',
            }}
          >
            {command.title}
          </div>
          <div
            style={{
              color: '#abb0b0',
              fontSize: '12px',
            }}
          >
            {command.description}
          </div>
        </div>
      ))}
    </div>
  );
}
