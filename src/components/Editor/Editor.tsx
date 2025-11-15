import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { EnterKeyPlugin } from './plugins/EnterKeyPlugin';
import { editorConfig } from './EditorConfig';
import './Editor.css';

function Placeholder() {
  return (
    <div className="editor-placeholder">
      Start writing... Press Enter to create a new line, Enter twice to create a new block
    </div>
  );
}

export function Editor() {
  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={editorConfig}>
        <div className="editor-inner border border-gray-700 rounded-16 overflow-hidden">
          <ToolbarPlugin />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-input" />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={(props: any) => <div>Error: {props.error?.message}</div>}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <TabIndentationPlugin />
            <EnterKeyPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
