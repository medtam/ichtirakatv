import { Customer, SubscriptionStatus } from '../types';

/**
 * Calculates the expiry date of a subscription.
 * @param startDate The start date of the subscription (ISO string).
 * @param duration The duration in months.
 * @returns The expiry date as a Date object.
 */
export const getExpiryDate = (startDate: string, duration: number): Date => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + duration);
  return date;
};

/**
 * Determines the status of a customer's subscription.
 * @param customer The customer object.
 * @returns The subscription status: 'active', 'expiringSoon', or 'expired'.
 */
export const getSubscriptionStatus = (customer: Customer): SubscriptionStatus => {
  const expiryDate = getExpiryDate(customer.startDate, customer.duration);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only, ignoring time

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  if (expiryDate < today) {
    return 'expired';
  }
  if (expiryDate >= today && expiryDate <= sevenDaysFromNow) {
    return 'expiringSoon';
  }
  return 'active';
};
