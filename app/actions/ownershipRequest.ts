'use server';

import { submitOwnershipRequest } from '@/lib/ownershipRequest.server';
import { getSession } from '@/app/actions/user';

export async function requestBusinessOwnership(input: {
  businessId: string;
  name: string;
  email: string;
  phone: string;
}) {
  return submitOwnershipRequest(input);
}

export async function ownershipRequestDefaults() {
  const session = await getSession();
  const user = session?.success ? session.user : null;
  return {
    name: String(user?.fullName || ''),
    email: String(user?.email || ''),
    phone: String(user?.phone || ''),
  };
}
