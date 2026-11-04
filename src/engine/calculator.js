/**
 * Pure business logic for the calculator.
 * Independent of any DOM or UI framework.
 */

export const Operation = Object.freeze({
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '×',
  DIVIDE: '÷'
});

/**
 * Accurately performs arithmetic rounding to avoid floating-point artifacts (e.g. 0.1 + 0.2).
 * @param {number} num
 * @param {number} precision
 * @returns {number}
 */
export function formatPrecision(num, precision = 12) {
  if (!Number.isFinite(num)) {
    return num;
  }
  return parseFloat(Number(num).toPrecision(precision));
}

/**
 * Executes a basic binary arithmetic operation.
 * @param {number} a
 * @param {number} b
 * @param {string} op
 * @returns {number}
 */
export function compute(a, b, op) {
  let result;
  switch (op) {
    case Operation.ADD:
    case '+':
      result = a + b;
      break;
    case Operation.SUBTRACT:
    case '-':
      result = a - b;
      break;
    case Operation.MULTIPLY:
    case '*':
    case '×':
      result = a * b;
      break;
    case Operation.DIVIDE:
    case '/':
    case '÷':
      if (b === 0) {
        throw new Error('Cannot divide by zero');
      }
      result = a / b;
      break;
    default:
      throw new Error(`Unknown operator: ${op}`);
  }
  return formatPrecision(result);
}

export class CalculatorEngine {
  constructor() {
    this.reset();
  }

  /**
   * Clears everything (All Clear - AC).
   */
  reset() {
    this.currentValue = '0';
    this.previousValue = null;
    this.operator = null;
    this.waitingForOperand = false;
    this.isErrorState = false;
    this.historyExpression = '';
  }

  /**
   * Clears only current entry (Clear Entry - CE).
   */
  clearEntry() {
    if (this.isErrorState) {
      this.reset();
      return;
    }
    this.currentValue = '0';
  }

  /**
   * Appends a digit (0-9) to the current value.
   * @param {string|number} digit
   */
  inputDigit(digit) {
    if (this.isErrorState) {
      this.reset();
    }

    const strDigit = String(digit);
    if (!/^[0-9]$/.test(strDigit)) {
      return;
    }

    if (this.waitingForOperand) {
      this.currentValue = strDigit;
      this.waitingForOperand = false;
    } else {
      this.currentValue = this.currentValue === '0' ? strDigit : this.currentValue + strDigit;
    }
  }

  /**
   * Inserts a decimal point into the current value.
   */
  inputDecimal() {
    if (this.isErrorState) {
      this.reset();
    }

    if (this.waitingForOperand) {
      this.currentValue = '0.';
      this.waitingForOperand = false;
      return;
    }

    if (!this.currentValue.includes('.')) {
      this.currentValue += '.';
    }
  }

  /**
   * Toggles the sign (+/-) of the current value.
   */
  toggleSign() {
    if (this.isErrorState || this.currentValue === '0') {
      return;
    }

    if (this.currentValue.startsWith('-')) {
      this.currentValue = this.currentValue.slice(1);
    } else {
      this.currentValue = '-' + this.currentValue;
    }
  }

  /**
   * Calculates the percentage of the current value.
   * If there's an active operator and previous value, computes percentage relative to previous value.
   */
  inputPercent() {
    if (this.isErrorState) {
      return;
    }

    const current = parseFloat(this.currentValue);
    if (Number.isNaN(current)) return;

    if (this.operator && this.previousValue !== null) {
      // In operations like "200 + 10%", 10% is 20 of 200
      if (this.operator === Operation.ADD || this.operator === Operation.SUBTRACT) {
        const percentVal = (this.previousValue * current) / 100;
        this.currentValue = String(formatPrecision(percentVal));
        return;
      }
    }

    // Default percentage (e.g. 50% = 0.5)
    this.currentValue = String(formatPrecision(current / 100));
  }

  /**
   * Removes the last entered character (Backspace).
   */
  backspace() {
    if (this.isErrorState || this.waitingForOperand) {
      return;
    }

    if (this.currentValue.length === 1 || (this.currentValue.length === 2 && this.currentValue.startsWith('-'))) {
      this.currentValue = '0';
    } else {
      this.currentValue = this.currentValue.slice(0, -1);
    }
  }

  /**
   * Sets the pending binary operator and calculates intermediate result if chained.
   * @param {string} nextOperator
   */
  setOperator(nextOperator) {
    if (this.isErrorState) {
      return;
    }

    // Standardize symbol
    let opSymbol = nextOperator;
    if (nextOperator === '*') opSymbol = Operation.MULTIPLY;
    if (nextOperator === '/') opSymbol = Operation.DIVIDE;

    const inputValue = parseFloat(this.currentValue);

    if (this.operator && this.waitingForOperand) {
      // Operator changed before second operand entered
      this.operator = opSymbol;
      this.historyExpression = `${this.previousValue} ${this.operator}`;
      return;
    }

    if (this.previousValue === null) {
      this.previousValue = inputValue;
    } else if (this.operator) {
      try {
        const result = compute(this.previousValue, inputValue, this.operator);
        this.currentValue = String(result);
        this.previousValue = result;
      } catch (err) {
        this.isErrorState = true;
        this.currentValue = 'Error';
        this.historyExpression = '';
        return;
      }
    }

    this.waitingForOperand = true;
    this.operator = opSymbol;
    this.historyExpression = `${this.previousValue} ${this.operator}`;
  }

  /**
   * Evaluates the pending operation when '=' is clicked.
   */
  calculate() {
    if (this.isErrorState) {
      return;
    }

    if (this.operator === null || this.previousValue === null) {
      this.historyExpression = `${this.currentValue} =`;
      return;
    }

    const current = parseFloat(this.currentValue);
    try {
      const result = compute(this.previousValue, current, this.operator);
      this.historyExpression = `${this.previousValue} ${this.operator} ${this.currentValue} =`;
      this.currentValue = String(result);
      this.previousValue = null;
      this.operator = null;
      this.waitingForOperand = true;
    } catch (err) {
      this.isErrorState = true;
      this.currentValue = 'Error';
      this.historyExpression = '';
    }
  }

  /**
   * Returns display representation of current calculator state.
   */
  getState() {
    return {
      display: this.currentValue,
      history: this.historyExpression,
      operator: this.operator,
      isError: this.isErrorState
    };
  }
}
