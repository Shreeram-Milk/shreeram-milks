/** What the customer types is 10 digits; the server stores the international form. */
export const toInternationalPhone = (tenDigits: string): string => `+91${tenDigits}`;

/** The ten digits to show in a field for a stored number such as +919824612345; anything else is shown as it is. */
export const toTenDigits = (phone: string): string => /^\+91\d{10}$/.test(phone) ? phone.slice(3) : phone;

export const isEmail = (value: string): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

export const isIndianMobile = (digits: string): boolean => /^[6-9]\d{9}$/.test(digits);

/** "+919824612345" -> "+91 98246 12345", for showing to the customer. Anything unexpected is shown as it is. */
export function formatPhone(phone: string): string {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return match ? `+91 ${match[1]} ${match[2]}` : phone;
}
