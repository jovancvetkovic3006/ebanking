/**
 * Generates a Serbian bank account number in format: 265-XXXXXXXXXXXXX-XX
 * - 265: bank code (fixed, represents our eBanking)
 * - 13 digits: account number (random)
 * - 2 digits: control number (mod 97)
 */

function mod97(numStr: string): number {
  let remainder = 0;
  for (const ch of numStr) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder;
}

export function generateAccountNumber(): string {
  const bankCode = "265";
  const accountDigits = Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join("");

  // Control digits: 98 - (bankCode + accountDigits + "00") mod 97
  const control = 98 - mod97(bankCode + accountDigits + "00");
  const controlStr = (control < 0 ? control + 97 : control).toString().padStart(2, "0");

  return `${bankCode}-${accountDigits}-${controlStr}`;
}
