import { CalculatorEngine } from '../engine/calculator.js';

export class CalculatorUI {
  constructor(engine, elements) {
    this.engine = engine;
    this.mainDisplay = elements.mainDisplay;
    this.historyDisplay = elements.historyDisplay;
    this.keypad = elements.keypad;

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Keypad button clicks
    this.keypad.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      const action = button.dataset.action;
      const value = button.dataset.value;
      this.handleAction(action, value);
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  handleAction(action, value) {
    switch (action) {
      case 'digit':
        this.engine.inputDigit(value);
        break;
      case 'decimal':
        this.engine.inputDecimal();
        break;
      case 'operator':
        this.engine.setOperator(value);
        break;
      case 'calculate':
        this.engine.calculate();
        break;
      case 'all-clear':
        this.engine.reset();
        break;
      case 'clear-entry':
        this.engine.clearEntry();
        break;
      case 'percent':
        this.engine.inputPercent();
        break;
      case 'toggle-sign':
        this.engine.toggleSign();
        break;
      case 'backspace':
        this.engine.backspace();
        break;
      default:
        break;
    }
    this.render();
  }

  handleKeyboard(e) {
    if (e.key >= '0' && e.key <= '9') {
      this.handleAction('digit', e.key);
    } else if (e.key === '.') {
      this.handleAction('decimal');
    } else if (e.key === '+') {
      this.handleAction('operator', '+');
    } else if (e.key === '-') {
      this.handleAction('operator', '-');
    } else if (e.key === '*' || e.key === 'x') {
      this.handleAction('operator', '×');
    } else if (e.key === '/') {
      e.preventDefault(); // prevent quick-find in browser
      this.handleAction('operator', '÷');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      this.handleAction('calculate');
    } else if (e.key === 'Backspace') {
      this.handleAction('backspace');
    } else if (e.key === 'Escape') {
      this.handleAction('all-clear');
    } else if (e.key === '%') {
      this.handleAction('percent');
    }
  }

  render() {
    const state = this.engine.getState();

    this.mainDisplay.textContent = state.display;
    this.historyDisplay.textContent = state.history;

    if (state.isError) {
      this.mainDisplay.classList.add('error');
    } else {
      this.mainDisplay.classList.remove('error');
    }

    // Update active state on operator buttons
    const operatorButtons = this.keypad.querySelectorAll('[data-action="operator"]');
    operatorButtons.forEach((btn) => {
      if (state.operator && btn.dataset.value === state.operator) {
        btn.classList.add('active-op');
      } else {
        btn.classList.remove('active-op');
      }
    });
  }
}

// Initialize when running in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const mainDisplay = document.getElementById('main-display');
    const historyDisplay = document.getElementById('history-display');
    const keypad = document.querySelector('.calculator-keypad');

    if (mainDisplay && historyDisplay && keypad) {
      const engine = new CalculatorEngine();
      new CalculatorUI(engine, { mainDisplay, historyDisplay, keypad });
    }
  });
}
