export type ListingLiveFacts = {
  ownerName: string;
  businessName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  planActive: boolean;
};

export type ListingLiveCopy = {
  title: string;
  subject: string;
  paragraphs: string[];
  inAppBody: string;
  pushBody: string;
  whatsappNext: string;
  needsEmail: boolean;
  needsPhone: boolean;
  needsPlan: boolean;
};

const TITLE = 'Your business is now live on FinderB';

function firstName(owner: string) {
  const token = owner.trim().split(/\s+/)[0] || '';
  if (!token || token.includes('@') || token.length > 40) return 'there';
  return token;
}

function whatsappLine(needs: { needsEmail: boolean; needsPhone: boolean; needsPlan: boolean }) {
  const verify =
    needs.needsEmail && needs.needsPhone
      ? 'A quick confirm of your email and phone in the app is what makes customers trust the page'
      : needs.needsEmail
        ? 'A quick confirm of your email in the app is what makes customers trust the page'
        : needs.needsPhone
          ? 'A quick confirm of your phone in the app is what makes customers trust the page'
          : '';
  const plan = needs.needsPlan
    ? 'you can switch a plan on from the app whenever you want more people to see you'
    : '';
  if (verify && plan) return `${verify}, and ${plan}.`;
  if (verify) return `${verify}.`;
  if (plan) return 'You can switch a plan on from the app whenever you want more people to see you.';
  return 'Your email, phone, and plan are already set. Share the page and say hello to the first customers.';
}

function pushExtra(needs: { needsEmail: boolean; needsPhone: boolean; needsPlan: boolean }) {
  if (needs.needsEmail && needs.needsPhone && needs.needsPlan) {
    return 'Please verify your email and phone, and switch on a plan when you want more visibility.';
  }
  if (needs.needsEmail && needs.needsPhone) return 'Please verify your email and phone in the app.';
  if (needs.needsEmail && needs.needsPlan) {
    return 'Please verify your email, and switch on a plan when you want more visibility.';
  }
  if (needs.needsPhone && needs.needsPlan) {
    return 'Please verify your phone, and switch on a plan when you want more visibility.';
  }
  if (needs.needsEmail) return 'Please verify your email in the app.';
  if (needs.needsPhone) return 'Please verify your phone in the app.';
  if (needs.needsPlan) return 'Switch on a plan when you want more people to see you.';
  return 'Your email, phone, and plan are already set.';
}

/** Conversational “you are live” copy shared by email, WhatsApp, and the in-app alert. */
export function buildListingLiveCopy(facts: ListingLiveFacts): ListingLiveCopy {
  const business = facts.businessName.trim() || 'Your business';
  const first = firstName(facts.ownerName);
  const needsEmail = !facts.emailVerified;
  const needsPhone = !facts.phoneVerified;
  const needsPlan = !facts.planActive;
  const needs = { needsEmail, needsPhone, needsPlan };

  const paragraphs = [
    `Hi ${first}, this is FinderB.`,
    `${business} is now live. We finished the review and switched the listing on, so people nearby can find you, see what you offer, and get in touch.`,
  ];

  if (needsEmail && needsPhone) {
    paragraphs.push(
      'Your email and phone are not verified yet. Open the FinderB app and confirm both. It takes a minute, and a verified listing is the one customers trust.',
    );
  } else if (needsEmail) {
    paragraphs.push(
      'Your email is not verified yet. Open the FinderB app and confirm it. It takes a minute, and a verified listing is the one customers trust.',
    );
  } else if (needsPhone) {
    paragraphs.push(
      'Your phone number is not verified yet. Open the FinderB app and confirm it. It takes a minute, and a verified listing is the one customers trust.',
    );
  }

  if (needsPlan) {
    paragraphs.push(
      `You are still on the free listing, which is a perfectly good start. When you want more people to see ${business}, switch on a plan from the app and we will put you further forward.`,
    );
  }

  if (!needsEmail && !needsPhone && !needsPlan) {
    paragraphs.push(
      'Your email and phone are verified, and your plan is already on. You are in good shape. Share the live page with a few regulars and welcome the first customers.',
    );
  } else if (!needsEmail && !needsPhone) {
    paragraphs.push(
      'Your email and phone are already verified, so the page looks trustworthy. The plan is the only piece still waiting on you.',
    );
  } else {
    paragraphs.push(
      'We are glad you are with FinderB. Open the app when you have a minute, and reply to people quickly. That is what turns a live listing into regular work.',
    );
  }

  const pushBody = `Hi ${first}, ${business} is now live on FinderB. ${pushExtra(needs)}`;

  return {
    title: TITLE,
    subject: TITLE,
    paragraphs,
    inAppBody: paragraphs.join('\n\n'),
    pushBody: pushBody.length > 180 ? `${pushBody.slice(0, 177)}...` : pushBody,
    whatsappNext: whatsappLine(needs),
    needsEmail,
    needsPhone,
    needsPlan,
  };
}
