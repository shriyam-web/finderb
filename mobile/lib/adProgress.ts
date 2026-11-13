export type AdProgress = {
  percent: number;
  step: string;
  next: string;
  canContinue: boolean;
};

export function adProgress(order: {
  paymentStatus: string;
  campaignStatus: string;
  videoReady: boolean;
  adReviewStatus?: string;
}): AdProgress {
  const closed = ['rejected', 'cancelled', 'refund_pending', 'refunded'].includes(order.campaignStatus);
  const running = ['payment_successful', 'under_review', 'editing', 'video_ready', 'ad_active'].includes(order.campaignStatus);
  if (order.paymentStatus !== 'paid' && !closed && !running && order.campaignStatus !== 'completed') {
    const review = order.adReviewStatus || (order.videoReady ? 'pending' : 'none');
    if (review === 'denied') return { percent: 50, step: 'Change requested', next: 'Send another video', canContinue: true };
    if (review === 'approved') return { percent: 75, step: 'Ad approved', next: 'Pay for this ad', canContinue: true };
    if (review === 'pending') return { percent: 50, step: 'Video sent', next: 'FinderB checks this ad', canContinue: true };
    return { percent: 25, step: 'Ad details saved', next: 'Add the video', canContinue: true };
  }
  if (order.campaignStatus === 'completed') return { percent: 100, step: 'Ad ended', next: '', canContinue: false };
  if (order.campaignStatus === 'ad_active') return { percent: 100, step: 'Ad is live', next: '', canContinue: false };
  if (order.campaignStatus === 'video_ready') return { percent: 100, step: 'Ad is ready', next: '', canContinue: false };
  if (order.campaignStatus === 'editing') return { percent: 100, step: 'Ad in editing', next: '', canContinue: false };
  if (order.campaignStatus === 'under_review' || order.campaignStatus === 'payment_successful') {
    return { percent: 100, step: 'Payment received', next: '', canContinue: false };
  }
  const names: Record<string, string> = {
    rejected: 'Ad rejected',
    cancelled: 'Ad cancelled',
    refund_pending: 'Refund opened',
    refunded: 'Refunded',
  };
  return { percent: 100, step: names[order.campaignStatus] || 'Closed', next: '', canContinue: false };
}
