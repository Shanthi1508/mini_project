import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CalculatorEngine, Operation, compute, formatPrecision } from '../src/engine/calculator.js';

describe('formatPrecision', () => {
  it('correctly cleans up floating point inaccuracy', () => {
    assert.strictEqual(formatPrecision(0.1 + 0.2), 0.3);
    assert.strictEqual(formatPrecision(0.3 - 0.2), 0.1);
    assert.strictEqual(formatPrecision(0.7 * 0.1), 0.07);
  });

  it('handles non-finite values gracefully', () => {
    assert.strictEqual(formatPrecision(Infinity), Infinity);
    assert.ok(Number.isNaN(formatPrecision(NaN)));
  });
});

describe('compute', () => {
  it('adds numbers correctly', () => {
    assert.strictEqual(compute(12, 8, Operation.ADD), 20);
    assert.strictEqual(compute(0.1, 0.2, '+'), 0.3);
  });

  it('subtracts numbers correctly', () => {
    assert.strictEqual(compute(25, 10, Operation.SUBTRACT), 15);
    assert.strictEqual(compute(5, 12, '-'), -7);
  });

  it('multiplies numbers correctly', () => {
    assert.strictEqual(compute(6, 7, Operation.MULTIPLY), 42);
    assert.strictEqual(compute(2.5, 4, '*'), 10);
  });

  it('divides numbers correctly', () => {
    assert.strictEqual(compute(100, 4, Operation.DIVIDE), 25);
    assert.strictEqual(compute(1, 3, '/'), 0.333333333333);
  });

  it('throws on division by zero', () => {
    assert.throws(() => compute(5, 0, Operation.DIVIDE), /Cannot divide by zero/);
  });

  it('throws on invalid operator', () => {
    assert.throws(() => compute(5, 5, '^'), /Unknown operator/);
  });
});

describe('CalculatorEngine', () => {
  let calc;

  beforeEach(() => {
    calc = new CalculatorEngine();
  });

  it('initializes with default state', () => {
    const state = calc.getState();
    assert.strictEqual(state.display, '0');
    assert.strictEqual(state.history, '');
    assert.strictEqual(state.operator, null);
    assert.strictEqual(state.isError, false);
  });

  it('inputs digits sequentially', () => {
    calc.inputDigit(1);
    calc.inputDigit(2);
    calc.inputDigit(3);
    assert.strictEqual(calc.getState().display, '123');
  });

  it('does not allow leading zeros', () => {
    calc.inputDigit(0);
    calc.inputDigit(0);
    assert.strictEqual(calc.getState().display, '0');
    calc.inputDigit(5);
    assert.strictEqual(calc.getState().display, '5');
  });

  it('handles decimal input correctly', () => {
    calc.inputDigit(4);
    calc.inputDecimal();
    calc.inputDigit(5);
    calc.inputDecimal(); // repeated decimal point should be ignored
    calc.inputDigit(6);
    assert.strictEqual(calc.getState().display, '4.56');
  });

  it('handles decimal input after operator starts with 0.', () => {
    calc.inputDigit(5);
    calc.setOperator('+');
    calc.inputDecimal();
    calc.inputDigit(2);
    calc.calculate();
    assert.strictEqual(calc.getState().display, '5.2');
  });

  it('performs simple addition and displays history', () => {
    calc.inputDigit(9);
    calc.setOperator('+');
    assert.strictEqual(calc.getState().history, '9 +');
    calc.inputDigit(3);
    calc.calculate();
    assert.strictEqual(calc.getState().display, '12');
    assert.strictEqual(calc.getState().history, '9 + 3 =');
  });

  it('chains multiple operations correctly', () => {
    // 5 + 3 * 2 = (5 + 3 = 8), then 8 * 2 = 16 (standard immediate execution)
    calc.inputDigit(5);
    calc.setOperator('+');
    calc.inputDigit(3);
    calc.setOperator('*');
    assert.strictEqual(calc.getState().display, '8');
    calc.inputDigit(2);
    calc.calculate();
    assert.strictEqual(calc.getState().display, '16');
  });

  it('allows changing operator before second operand', () => {
    calc.inputDigit(7);
    calc.setOperator('+');
    calc.setOperator('-');
    assert.strictEqual(calc.getState().operator, '-');
    calc.inputDigit(2);
    calc.calculate();
    assert.strictEqual(calc.getState().display, '5');
  });

  it('handles toggling positive and negative signs', () => {
    calc.inputDigit(4);
    calc.toggleSign();
    assert.strictEqual(calc.getState().display, '-4');
    calc.toggleSign();
    assert.strictEqual(calc.getState().display, '4');
    // toggling zero does nothing
    calc.reset();
    calc.toggleSign();
    assert.strictEqual(calc.getState().display, '0');
  });

  it('handles percentage calculation standalone and in addition', () => {
    calc.inputDigit(5);
    calc.inputDigit(0);
    calc.inputPercent();
    assert.strictEqual(calc.getState().display, '0.5');

    calc.reset();
    calc.inputDigit(2);
    calc.inputDigit(0);
    calc.inputDigit(0);
    calc.setOperator('+');
    calc.inputDigit(1);
    calc.inputDigit(5);
    calc.inputPercent(); // 15% of 200 = 30
    assert.strictEqual(calc.getState().display, '30');
    calc.calculate();
    assert.strictEqual(calc.getState().display, '230');
  });

  it('handles backspace correctly', () => {
    calc.inputDigit(1);
    calc.inputDigit(2);
    calc.inputDigit(3);
    calc.backspace();
    assert.strictEqual(calc.getState().display, '12');
    calc.backspace();
    assert.strictEqual(calc.getState().display, '1');
    calc.backspace();
    assert.strictEqual(calc.getState().display, '0');
    calc.backspace();
    assert.strictEqual(calc.getState().display, '0');
  });

  it('handles clear entry (CE) vs all clear (AC)', () => {
    calc.inputDigit(1);
    calc.inputDigit(0);
    calc.setOperator('+');
    calc.inputDigit(9);
    calc.clearEntry();
    assert.strictEqual(calc.getState().display, '0');
    calc.inputDigit(5);
    calc.calculate();
    assert.strictEqual(calc.getState().display, '15');

    calc.reset();
    assert.strictEqual(calc.getState().display, '0');
    assert.strictEqual(calc.getState().history, '');
  });

  it('handles division by zero and error recovery', () => {
    calc.inputDigit(8);
    calc.setOperator('/');
    calc.inputDigit(0);
    calc.calculate();
    assert.strictEqual(calc.getState().isError, true);
    assert.strictEqual(calc.getState().display, 'Error');

    // entering digit recovers from error
    calc.inputDigit(5);
    assert.strictEqual(calc.getState().isError, false);
    assert.strictEqual(calc.getState().display, '5');
  });

  it('handles repeated calculations after equals gracefully', () => {
    calc.inputDigit(5);
    calc.calculate();
    assert.strictEqual(calc.getState().display, '5');
    assert.strictEqual(calc.getState().history, '5 =');
  });
});
