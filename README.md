# Polished Basic Calculator

A robust, accessible, and responsive arithmetic calculator built with vanilla HTML, CSS, and JavaScript.

## Features

- **Safe Evaluation**: Uses the Shunting-yard algorithm to safely evaluate expressions without `eval()`.
- **Real-Time Preview**: Shows the result of your calculation as you type.
- **Accessibility**: Fully keyboard accessible with ARIA live regions for screen reader support.
- **Responsiveness**: adapts to mobile and desktop screens using CSS Grid.
- **Precision**: Handles floating-point arithmetic correctly (e.g., `0.1 + 0.2 = 0.3`).

## How to Run

1.  Open `index.html` in any modern web browser.
2.  That's it! No build steps or external dependencies required.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0-9` | Type Numbers |
| `+ - * /` | Operators (`*` acts as `×`, `/` acts as `÷`) |
| `Enter` / `=` | Calculate Result |
| `Backspace` | Delete last character |
| `Escape` | All Clear (AC) - Reset everything |
| `Delete` | Clear (C) - Clear current entry |
| `.` | Decimal Point |

## Design & Accessibility

- **Semantic HTML**: Uses `<main>` and proper button elements.
- **Live Regions**: The display updates are announced to screen readers.
- **Focus States**: Visible focus indicators for keyboard navigation.
- **Touch Targets**: All buttons are at least 44x44px for easy touch on mobile devices.
