# PTCGP Tracker Tools

A Chrome extension providing enhanced trading tools for PTCGP Tracker.

## Features

- **Card Matching**: Automatically highlights cards that match between your collection and other players' collections
- **Trade Statistics**: Shows a summary of potential trades grouped by card rarity
- **Rarity Filters**: Filter cards by rarity (♢, ♢♢, ♢♢♢, ♢♢♢♢, ☆)
- **Visual Indicators**: Golden borders and overlays for matched cards
- **Settings Management**: Toggle features and customize your experience

## Development

This extension is built using:
- TypeScript
- React
- Vite
- Tailwind CSS

### Getting Started

1. Clone the repository
2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Build the extension:
```
npm run build
```

### Loading the Extension in Chrome

1. Build the extension using `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the `dist` directory from this project
5. The extension should now be loaded and ready to use

### Build Process

The build process includes:
1. TypeScript compilation
2. Vite bundling with specific output configuration:
   - `content.js` - Content script (without hash in filename)
   - `src/content/style.css` - CSS for content script (placed to match manifest paths)
   - Main popup script and other assets (with hashes for cache busting)

This build process ensures:
- File names and paths match exactly what Chrome expects based on the manifest.json
- The dist directory is completely self-contained and ready for Chrome extension loading

### Project Structure

- `src/` - Source files
  - `content/` - Content scripts that run on the PTCGP Tracker website
    - `content.ts` - Main content script
    - `style.css` - Styles for the content script
  - `types/` - TypeScript type definitions
- `manifest.json` - Extension manifest file

## Notes for Developers

- The extension uses the CRXJS Vite plugin to handle the Chrome extension manifest and build process
- CSS files are copied directly to maintain the path structure expected by Chrome
- When making changes to the build process, ensure the dist directory structure matches the paths in the manifest

## Usage

1. Click the extension icon in Chrome
2. Enter your PTCGP Tracker profile URL
3. Visit other players' profiles to see potential trades
4. Use the settings panel to customize the experience:
   - Toggle match indicators
   - Toggle trade statistics
   - Filter by card rarity

## Tech Stack

- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Vite + CRXJS

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request




# TODO

- https://developer.chrome.com/docs/webstore/publish