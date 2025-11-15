export type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'code'
  | 'quote'
  | 'list'
  | 'numbered-list'
  | 'todo'
  | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, any>;
}

export interface Note {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}
