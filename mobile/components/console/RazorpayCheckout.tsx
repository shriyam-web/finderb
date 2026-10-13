import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import type { CheckoutStart } from '../../lib/merchantConsoleApi';
import { createConsoleStyles } from './kit';

export type CheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
};

type Message =
  | ({ type: 'success' } & CheckoutSuccess)
  | { type: 'dismiss' }
  | { type: 'failed'; error?: string }
  | { type: 'error'; error?: string };

/** Razorpay is served from the website's origin so its domain checks pass inside the app. */
const CHECKOUT_ORIGIN = 'https://finderb.com';

const APP_SCHEMES = /^(upi|tez|phonepe|paytmmp|gpay|bhim|credpay|mobikwik|intent):/i;

/** Android intent:// links carry the real scheme inside; the dialer-style scheme opens the UPI app directly. */
function intentToAppUrl(url: string): string | null {
  if (!/^intent:/i.test(url)) return url;
  const scheme = /;scheme=([^;]+);/i.exec(url)?.[1];
  const body = url.replace(/^intent:\/\//i, '').split('#Intent')[0];
  if (scheme) return `${scheme}://${body}`;
  const fallback = /S\.browser_fallback_url=([^;]+);/i.exec(url)?.[1];
  return fallback ? decodeURIComponent(fallback) : null;
}

function checkoutPage(start: CheckoutStart, description: string): string {
  const options: Record<string, unknown> = {
    key: start.keyId,
    name: 'FinderB Business',
    description,
    prefill: {
      name: start.business.fullName || start.business.businessName,
      email: start.business.email || undefined,
      contact: start.business.mobile || undefined,
    },
    notes: { plan: 'pro', source: 'app' },
    theme: { color: '#102C42' },
    webview_intent: true,
    retry: { enabled: true, max_count: 3 },
  };
  if (start.checkoutMode === 'subscription' && start.subscription) {
    options.subscription_id = start.subscription.id;
  } else if (start.order) {
    options.order_id = start.order.id;
    options.amount = start.order.amount;
    options.currency = start.order.currency;
  }
  const payload = JSON.stringify(options).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>html,body{margin:0;height:100%;background:#0B1F30;font:500 14px sans-serif;color:#fff}
.wait{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.7}</style>
</head><body>
<div class="wait">Opening secure payment…</div>
<script>
function send(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
window.onerror=function(msg){send({type:'error',error:String(msg)});};
</script>
<script src="https://checkout.razorpay.com/v1/checkout.js" onerror="send({type:'error',error:'Could not reach Razorpay. Check your internet.'})"></script>
<script>
(function(){
  if(!window.Razorpay){return;}
  var o=${payload};
  o.handler=function(r){send({type:'success',razorpay_payment_id:r.razorpay_payment_id,razorpay_signature:r.razorpay_signature,razorpay_order_id:r.razorpay_order_id,razorpay_subscription_id:r.razorpay_subscription_id});};
  o.modal={ondismiss:function(){send({type:'dismiss'});},confirm_close:true,escape:false};
  var rzp=new Razorpay(o);
  rzp.on('payment.failed',function(e){send({type:'failed',error:(e&&e.error&&e.error.description)||'Payment failed.'});});
  rzp.open();
})();
</script>
</body></html>`;
}

export function RazorpayCheckout({
  start,
  description,
  onSuccess,
  onClose,
  onFailed,
}: {
  start: CheckoutStart | null;
  description: string;
  onSuccess: (result: CheckoutSuccess) => void;
  onClose: () => void;
  onFailed: (message: string) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const [loading, setLoading] = useState(true);
  const html = useMemo(() => (start ? checkoutPage(start, description) : ''), [start, description]);

  const onMessage = (event: WebViewMessageEvent) => {
    let message: Message | null = null;
    try {
      message = JSON.parse(event.nativeEvent.data) as Message;
    } catch {
      return;
    }
    if (message.type === 'success') {
      if (message.razorpay_payment_id && message.razorpay_signature) onSuccess(message);
      else onFailed('Payment response was incomplete. If money was debited, your plan will switch on automatically shortly.');
    } else if (message.type === 'dismiss') {
      onClose();
    } else if (message.type === 'failed') {
      onFailed(message.error || 'Payment failed. No money was taken, or it will be refunded by your bank.');
    } else if (message.type === 'error') {
      onFailed(message.error || 'Could not open the payment window.');
    }
  };

  return (
    <Modal visible={Boolean(start)} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.bar}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel payment">
            <Ionicons name="close" size={24} color={c.ink} />
          </Pressable>
          <Text style={styles.barText}>Secure payment</Text>
          <Ionicons name="lock-closed-outline" size={15} color={c.success} />
          <Text style={styles.barNote}>Razorpay</Text>
        </View>
        {start ? (
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: CHECKOUT_ORIGIN }}
            onMessage={onMessage}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            style={styles.web}
            onShouldStartLoadWithRequest={(request) => {
              if (!APP_SCHEMES.test(request.url)) return true;
              const target = intentToAppUrl(request.url);
              if (target) {
                void Linking.openURL(target).catch(() =>
                  onFailed('That UPI app isn’t installed. Pick another app or pay by card or netbanking.'),
                );
              }
              return false;
            }}
          />
        ) : null}
        {loading ? <ActivityIndicator style={styles.spinner} color={c.primary} /> : null}
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = createConsoleStyles((c) => ({
  root: { flex: 1, backgroundColor: c.card },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: c.line,
  },
  barText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 17, color: c.ink },
  barNote: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  web: { flex: 1, backgroundColor: c.card },
  spinner: { position: 'absolute', top: '50%', alignSelf: 'center' },
}));
