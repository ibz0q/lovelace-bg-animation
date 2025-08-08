# Lovelace BG Animation Web Preview

A minimal, full-screen web application for previewing all background animations from the Lovelace BG Animation gallery.

## Features

- **Full-screen preview**: Each background animation is displayed in a full-page iframe
- **Mouse-triggered menu**: A floating menu button appears when you move your mouse
- **Sidebar package selector**: Click the menu to open a sidebar with all available packages
- **Search functionality**: Filter packages by name, description, author, or ID
- **Responsive design**: Works on desktop and mobile devices
- **Keyboard shortcuts**: Press Escape to close the sidebar
- **Loading states**: Visual feedback when switching between packages

## Usage

1. **Move your mouse** anywhere on the page to reveal the menu button
2. **Click the menu button** (hamburger icon) to open the package selector
3. **Search or browse** through the available background animations
4. **Click any package** to load it in the main preview area
5. **Press Escape** or click outside the sidebar to close it

## Package Types

The app categorizes packages into different types:
- **Animation**: Interactive animations and effects
- **Generator**: Procedurally generated backgrounds
- **Application**: Full applications like media backgrounds
- **Other**: Miscellaneous packages

## Technical Details

- Loads package data from the gallery manifest
- Preview URLs follow the pattern: `https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/{packageId}/preview.html`
- Built with vanilla JavaScript, no external dependencies
- Minimal CSS with backdrop blur effects
- Mobile-responsive design

## Deployment

This app is automatically deployed to GitHub Pages as part of the main repository deployment process. It's located at:

`https://ibz0q.github.io/lovelace-bg-animation/docs/web-preview/`

## Files

- `index.html` - Main HTML structure
- `styles.css` - Minimal styling and responsive design
- `script.js` - JavaScript functionality for package loading and UI interactions
- `README.md` - This documentation file
