import { Redirect, type Href } from 'expo-router';

/** Older links and login flows land here; the business console is the merchant home now. */
export default function MerchantWelcomeScreen() {
  return <Redirect href={'/business-console' as Href} />;
}
