export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayBaseCheckoutOptions = {
  key: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
  };
};

export type RazorpayOrderCheckoutOptions = RazorpayBaseCheckoutOptions & {
  amount: number;
  currency: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
};

export type RazorpaySubscriptionCheckoutOptions = RazorpayBaseCheckoutOptions & {
  subscription_id: string;
  handler: (response: RazorpaySubscriptionSuccessResponse) => void;
};

export type RazorpaySubscriptionSuccessResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = RazorpayOrderCheckoutOptions | RazorpaySubscriptionCheckoutOptions;

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
        existing.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(Boolean(window.Razorpay));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
}

export async function openRazorpayCheckout(
  options: RazorpayOrderCheckoutOptions,
  onFailure?: (message: string) => void
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load the payment window. Check your connection and try again.');
  }

  const checkout = new window.Razorpay(options);
  checkout.on('payment.failed', (response) => {
    onFailure?.(response.error.description || 'Payment failed. Please try again.');
  });
  checkout.open();
}

export async function openRazorpaySubscriptionCheckout(
  options: RazorpaySubscriptionCheckoutOptions,
  onFailure?: (message: string) => void
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load the payment window. Check your connection and try again.');
  }

  const checkout = new window.Razorpay(options);
  checkout.on('payment.failed', (response) => {
    onFailure?.(response.error.description || 'Mandate setup failed. Please try again.');
  });
  checkout.open();
}
