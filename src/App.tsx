import { Editor } from './components/Editor/Editor';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
            Brain
          </h1>
          <p className="text-gray-400 text-sm">
            Your intelligent note-taking companion
          </p>
        </header>

        {/* Note Page */}
        <div className="bg-gray-800 rounded-24 shadow-2xl overflow-hidden border border-gray-700">
          {/* Note Title */}
          <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
            <input
              type="text"
              placeholder="Untitled Note"
              className="text-3xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
              defaultValue=""
            />
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>{new Date().toLocaleDateString()}</span>
              <span>•</span>
              <span>Last edited {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Editor */}
          <div className="p-6">
            <Editor />
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-16 border border-gray-700">
          <div className="text-sm text-gray-400 space-y-2">
            <p className="font-semibold text-gray-300">🎯 Block Controls:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <span className="text-blue-400">Enter</span> - Create new line within block
              </li>
              <li>
                <span className="text-purple-400">Enter twice</span> or{' '}
                <span className="text-purple-400">Enter on empty line</span> - Create new block
              </li>
              <li>
                <span className="text-pink-400">Headings</span> - Single line blocks (H1, H2, H3)
              </li>
              <li>
                <span className="text-green-400">Text/Quote/Code</span> - Multi-line escapable blocks
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
