/** What the customer types is 10 digits; the server stores the international form. */
export const toInternationalPhone = (tenDigits: string): string => `+91${tenDigits}`;

export const isIndianMobile = (digits: string): boolean => /^[6-9]\d{9}$/.test(digits);

/** "+919824612345" -> "+91 98246 12345", for showing to the customer. Anything unexpected is shown as it is. */
export function formatPhone(phone: string): string {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return match ? `+91 ${match[1]} ${match[2]}` : phone;
}
