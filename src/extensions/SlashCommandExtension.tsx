import { Extension, Editor } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import tippy from 'tippy.js';
import type { Instance as TippyInstance } from 'tippy.js';
import { forwardRef, useImperativeHandle, useState } from 'react';

interface SlashCommand {
  title: string;
  description: string;
  keywords: string[];
  onSelect: (editor: Editor) => void;
}

const commands: SlashCommand[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    keywords: ['h1', 'heading1', 'title'],
    onSelect: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    keywords: ['h2', 'heading2'],
    onSelect: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    keywords: ['h3', 'heading3'],
    onSelect: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bulleted List',
    description: 'Create a bulleted list',
    keywords: ['ul', 'bullet', 'list', 'unordered'],
    onSelect: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    keywords: ['ol', 'numbered', 'list', 'ordered'],
    onSelect: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Create a quote block',
    keywords: ['quote', 'blockquote', 'citation'],
    onSelect: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Create a code block',
    keywords: ['code', 'codeblock', 'snippet'],
    onSelect: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: 'Text',
    description: 'Regular paragraph text',
    keywords: ['text', 'paragraph', 'normal', 'p'],
    onSelect: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
];

interface CommandListProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const CommandList = forwardRef<CommandListRef, CommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        if (props.items[selectedIndex]) {
          props.command(props.items[selectedIndex]);
        }
        return true;
      }

      return false;
    },
  }));

  return (
    <div
      style={{
        background: '#252727',
        border: '2px solid #3e4242',
        borderRadius: '16px',
        padding: '8px',
        minWidth: '280px',
        maxHeight: '300px',
        overflowY: 'auto',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      }}
    >
      {props.items.map((item, index) => (
        <div
          key={index}
          onClick={() => props.command(item)}
          style={{
            padding: '10px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            marginBottom: '2px',
            background: index === selectedIndex ? '#3e4242' : 'transparent',
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div
            style={{
              color: '#d0d2d2',
              fontWeight: 600,
              marginBottom: '2px',
              fontSize: '14px',
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              color: '#abb0b0',
              fontSize: '12px',
            }}
          >
            {item.description}
          </div>
        </div>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList';

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        pluginKey: new PluginKey('slashCommand'),
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          return commands.filter((command) => {
            const searchLower = query.toLowerCase();
            return (
              command.title.toLowerCase().includes(searchLower) ||
              command.keywords.some((keyword) => keyword.includes(searchLower))
            );
          });
        },
        render: () => {
          let component: ReactRenderer<CommandListRef>;
          let popup: TippyInstance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandList, {
                props: {
                  ...props,
                  command: (item: SlashCommand) => {
                    item.onSelect(props.editor);
                    props.editor.commands.deleteRange({
                      from: props.range.from,
                      to: props.range.to,
                    });
                  },
                },
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              component.updateProps({
                ...props,
                command: (item: SlashCommand) => {
                  item.onSelect(props.editor);
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                },
              });

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return component.ref?.onKeyDown(props) || false;
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
