/** The signed-in customer as the server describes them. No status or internal fields ever reach the phone. */
export interface CustomerProfile {
  id: string;
  /** The email the customer signs in with. */
  email: string;
  /** Optional contact number, international form such as +919824612345; empty when not given. */
  phone: string;
  name: string;
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
  /** Ten digits as typed, or empty. */
  phone: string;
  language: 'en' | 'gu';
}
