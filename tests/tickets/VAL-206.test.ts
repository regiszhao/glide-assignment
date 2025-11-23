import { describe, it, expect } from 'vitest';
import { luhnCheck } from '../../lib/utils/luhn';

describe('VAL-206: Card Number Validation (Luhn)', () => {
  it('luhnCheck accepts known-good numbers and rejects bad ones', () => {
    // Visa test number
    expect(luhnCheck('4111111111111111')).toBeTruthy();
    // Amex test number
    expect(luhnCheck('378282246310005')).toBeTruthy();
    // Known bad
    expect(luhnCheck('4111111111111112')).toBeFalsy();
    expect(luhnCheck('abcd1234')).toBeFalsy();
  });
});
