/** Codes die je overtypt of voorleest: kort, en zonder tekens die op elkaar lijken. */

export function generateShortCode(): string {
  // Zonder I, O, 0 en 1: die haal je door elkaar wanneer je een code overtypt.
  const tekens = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += tekens.charAt(Math.floor(Math.random() * tekens.length));
  }
  return code;
}

/** Pincode van zes cijfers voor een live-sessie. */
export function nieuwePincode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
