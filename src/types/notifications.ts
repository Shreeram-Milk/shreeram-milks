/** One message in the customer's bell: an automatic one (out for delivery, refund sent...) or a broadcast from staff. Both languages are kept; the screen shows the one the customer reads. */
export interface AppNotification {
  id: string;
  event: string;
  title: string;
  titleGu: string;
  body: string;
  bodyGu: string;
  /** A screen of the app to open on tap (already checked by the phone before it is opened); null for none. */
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPage {
  notifications: AppNotification[];
  total: number;
  unread: number;
}
