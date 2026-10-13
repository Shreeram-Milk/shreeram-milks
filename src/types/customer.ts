/** The signed-in customer as the server describes them. No status or internal fields ever reach the phone. */
export interface CustomerProfile {
  id: string;
  /** International form, for example +919824612345. */
  phone: string;
  name: string;
  email: string;
  language: 'en' | 'gu';
  /** True until the customer has told us their name (right after first sign-up). */
  needsProfile: boolean;
}

export interface SignInResult {
  token: string;
  customer: CustomerProfile;
  isNewCustomer: boolean;
}

export interface ProfileInput {
  name: string;
  email: string;
  language: 'en' | 'gu';
}
