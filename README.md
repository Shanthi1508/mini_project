# Simple Calculator

A modern, responsive calculator built with clean separation of concerns, well-defined directory structure, and pure business logic.

## Architecture & Structure

The repository is organized following clean architecture principles:

```text
simple-calculator/
├── index.html            # Main semantic markup and accessible interface
├── package.json          # Node configuration, scripts, and metadata
├── src/
│   ├── engine/           # Pure business logic (framework & DOM agnostic)
│   │   └── calculator.js # CalculatorEngine, arithmetic operations, rounding
│   ├── ui/               # DOM event handling and rendering
│   │   └── app.js        # CalculatorUI class and keyboard/mouse bindings
│   └── styles/           # Modern styling and responsive CSS
│       └── styles.css    # Clean dark UI theme with responsive grid layout
└── tests/
    └── calculator.test.js # Unit test suite using Node.js native test runner
```

### Key Design Principles

1. **Separation of Concerns**: `CalculatorEngine` in `src/engine/calculator.js` contains zero DOM references. It can be executed and tested in any JavaScript runtime (Node.js, browsers, Deno, Bun, React, Vue, etc.).
2. **Numeric Precision**: Uses precision formatting to eliminate typical floating-point anomalies (e.g. `0.1 + 0.2 = 0.3`).
3. **Accessibility (a11y)**: Built with proper ARIA attributes (`aria-label`, `aria-live`, `role="region"`) for screen readers.
4. **Comprehensive Keyboard Support**: Works seamlessly via mouse clicks, touch taps, or keyboard shortcuts (`0-9`, `.`, `+`, `-`, `*`, `/`, `Enter`, `Backspace`, `Escape`, `%`).
5. **No External Runtime Dependencies**: Standard modern ES modules running on native browser APIs and standard Node.js libraries.

## Features

- **Standard Arithmetic**: Addition, Subtraction, Multiplication, Division with operator chaining.
- **Floating-point Handling**: Safe decimal calculations without floating-point representation quirks.
- **Special Operations**:
  - `AC` (All Clear): Resets the entire calculator state and history.
  - `CE` (Clear Entry): Clears the current input while preserving previous operations.
  - `±` (Negate): Toggles between positive and negative numbers.
  - `%` (Percentage): Calculates percentages standalone or relative to the previous operand.
  - Backspace: Deletes entered digits one by one.
- **History Tracking**: Displays calculation history above the current active number.
- **Division by Zero Protection**: Gracefully displays "Error" and allows recovery upon new digit input.

## Running Tests

Unit tests use the native Node.js test runner (`node:test`):

```bash
npm test
```

## Running the Application

You can serve the application with any static web server:

```bash
# Using Python 3
python3 -m http.server 3000

# Or using npx serve
npx serve .
```

Then open `http://localhost:3000` in your web browser.
