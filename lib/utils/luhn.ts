// VAL-206
// Luhn algorithm for card validation
export function luhnCheck(card: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = card.length - 1; i >= 0; i--) {
    let digit = parseInt(card[i], 10);
    if (isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

