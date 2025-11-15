# Brain - Lexical Notes

A modern, block-based note-taking application built with Lexical editor, inspired by Notion.

## Features

- **Block-Based Editing**: Similar to Notion, with intelligent block behavior
- **Rich Text Support**: Bold, italic, underline, strikethrough, and inline code
- **Multiple Block Types**:
  - Headings (H1, H2, H3) - Single line blocks with color-coded borders
  - Text/Paragraphs - Multi-line escapable blocks
  - Quotes - Styled quote blocks
  - Lists - Bullet and numbered lists
  - Code blocks - Syntax-highlighted code

## Block Behavior

- **Enter**: Creates a new line within the current block
- **Enter twice** or **Enter on empty last line**: Creates a new block
- **Headings**: Single-line only (pressing Enter creates a new paragraph block)
- **Text/Quote/Code**: Multi-line escapable blocks

## Styling

- Border radius variations: 16px and 24px
- Color-coded borders for different block types:
  - Blue: Heading 1
  - Purple: Heading 2
  - Pink: Heading 3
  - Green: Quotes
  - Orange: Code blocks

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- React 18
- TypeScript
- Lexical Editor
- Tailwind CSS
- Vite
