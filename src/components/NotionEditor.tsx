import { useState } from 'react';
import { BlockEditor } from './BlockEditor';
import '../styles/editor.css';

interface Block {
  id: string;
  content: string;
}

export function NotionEditor() {
  const [pageTitle, setPageTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([
    { id: crypto.randomUUID(), content: '' },
  ]);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const handleCreateNewBlock = (afterBlockId: string) => {
    const blockIndex = blocks.findIndex((b) => b.id === afterBlockId);
    const newBlock: Block = {
      id: crypto.randomUUID(),
      content: '',
    };

    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      newBlock,
      ...blocks.slice(blockIndex + 1),
    ];

    setBlocks(newBlocks);
    setFocusedBlockId(newBlock.id);
  };

  const handleMoveToNextBlock = (currentBlockId: string) => {
    const currentIndex = blocks.findIndex((b) => b.id === currentBlockId);
    if (currentIndex < blocks.length - 1) {
      setFocusedBlockId(blocks[currentIndex + 1].id);
    }
  };

  const handleAddBlock = () => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      content: '',
    };
    setBlocks([...blocks, newBlock]);
    setFocusedBlockId(newBlock.id);
  };

  return (
    <div className="editor-container">
      <input
        type="text"
        className="page-title"
        placeholder="Untitled"
        value={pageTitle}
        onChange={(e) => setPageTitle(e.target.value)}
      />

      <div className="blocks-container">
        {blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            onCreateNewBlock={() => handleCreateNewBlock(block.id)}
            onMoveToNextBlock={() => handleMoveToNextBlock(block.id)}
            isLastBlock={index === blocks.length - 1}
            autoFocus={focusedBlockId === block.id}
          />
        ))}
      </div>

      <button className="add-block-button" onClick={handleAddBlock}>
        + Add a block
      </button>
    </div>
  );
}
