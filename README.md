# Notion-like Text Editor

A modern, block-based text editor built with React, TypeScript, and Lexical, featuring a custom dark color scheme inspired by Notion's interface.

## Features

### Block-Based Architecture
- **Multiple Blocks**: Each block is an independent editing unit, similar to Notion
- **Enter Key Behavior**:
  - Single-line components (headings): Press Enter to create a new block
  - Multi-line components (paragraphs, lists): Press Enter for new line, press Enter twice or on empty line to create new block
- **Block Management**: Add, remove, and navigate between blocks seamlessly

### Rich Text Components
Type `/` to access the command menu and choose from:
- **Headings**: H1, H2, H3, H4, H5, H6 (single-line)
- **Paragraph**: Regular text with multi-line support
- **Lists**: Bulleted and numbered lists
- **Quote**: Block quotes with custom styling
- **Code Block**: Syntax-highlighted code blocks
- **Text Formatting**: Bold, italic, underline, strikethrough, inline code

### Custom Color Scheme
The editor uses a carefully crafted dark theme with:

**Primary Colors:**
- Background: Deep purple shades (#090a2a, #121454, #1b1e7e, #2e33d1)
- Text: Light purple/lavender shades (#a7a9f1, #d5d6f6, #f5eef6)

**Neutral Colors:**
- Background: Dark grays (#191A1A, #252727, #3e4242, #575c5c)
- Text: Light grays (#abb0b0, #d0d2d2, #e5e6e6)

**Border Radius:**
- Small: 16px
- Large: 24px

### User Experience
- **Visual Feedback**: Blocks highlight on hover and focus
- **Placeholder Text**: Helpful hints for empty blocks
- **Smooth Transitions**: Polished animations throughout
- **Keyboard Navigation**: Full keyboard support for efficient editing

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── BlockEditor.tsx      # Individual block editor component
│   └── NotionEditor.tsx     # Main editor managing multiple blocks
├── plugins/
│   ├── BlockNavigationPlugin.tsx  # Enter key behavior logic
│   └── SlashCommandPlugin.tsx     # Slash command menu
├── theme/
│   ├── colors.ts            # Color scheme configuration
│   └── editorTheme.ts       # Lexical editor theme
├── styles/
│   └── editor.css           # Editor styling
├── App.tsx                  # Main app component
└── index.css                # Global styles
```

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Lexical**: Meta's extensible text editor framework
- **Vite**: Fast build tool and dev server

## Usage

1. **Start typing**: Click anywhere to begin editing
2. **Add page title**: Use the "Untitled" field at the top
3. **Create blocks**: Press Enter to create new blocks
4. **Slash commands**: Type `/` to open the command menu
5. **Format text**: Use standard keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)
6. **Add more blocks**: Click the "+ Add a block" button at the bottom

## Keyboard Shortcuts

- **Enter**: New line or new block (context-dependent)
- **Cmd/Ctrl + B**: Bold
- **Cmd/Ctrl + I**: Italic
- **Cmd/Ctrl + U**: Underline
- **Cmd/Ctrl + Z**: Undo
- **Cmd/Ctrl + Shift + Z**: Redo

## Future Enhancements

- Multiple notes/pages management
- Block drag-and-drop reordering
- Advanced formatting options
- Tables and embeds
- Collaboration features
- Local storage/persistence
- Export to Markdown/PDF

## License

MIT
