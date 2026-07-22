import { NextResponse } from 'next/server';

import Stripe from 'stripe';

const PACKAGES = {
  hosting: {
    title: 'Keep DuaPrayer online',
    description:
      'Help cover servers, databases, and security so prayer requests stay available.',
  },
  development: {
    title: "Build what's next",
    description:
      'Support new features, accessibility, and a smoother community experience.',
  },
  operations: {
    title: 'Run the mission',
    description:
      'Help with operations and the work behind keeping this space free.',
  },
} as const;

type PackageId = keyof typeof PACKAGES;

function isPackageId(value: unknown): value is PackageId {
  return typeof value === 'string' && value in PACKAGES;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secret) {
    return NextResponse.json(
      { error: 'Donations are temporarily unavailable.' },
      { status: 503 },
    );
  }

  let amount = 0;
  let packageId: PackageId | null = null;
  let donationType: 'monthly' | 'once' = 'monthly';

  try {
    const body = (await request.json()) as {
      amount?: unknown;
      packageId?: unknown;
      donationType?: unknown;
    };

    amount = Number(body.amount);

    if (!isPackageId(body.packageId)) {
      return NextResponse.json(
        { error: 'Choose an impact area for your gift.' },
        { status: 400 },
      );
    }

    packageId = body.packageId;

    if (body.donationType === 'once' || body.donationType === 'monthly') {
      donationType = body.donationType;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000) {
    return NextResponse.json(
      { error: 'Enter a whole-dollar amount between $1 and $10,000.' },
      { status: 400 },
    );
  }

  const donationPackage = PACKAGES[packageId];
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin
  ).replace(/\/$/, '');

  const stripe = new Stripe(secret, {
    apiVersion: '2026-06-24.dahlia',
  });

  const isMonthly = donationType === 'monthly';
  const metadata = {
    donation_amount_usd: String(amount),
    donation_package_id: packageId,
    donation_package_title: donationPackage.title,
    donation_type: donationType,
    source: 'duaprayer_donate_page',
  };

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount * 100,
            product_data: {
              name: `DuaPrayer — ${donationPackage.title}`,
              description: donationPackage.description,
            },
            ...(isMonthly ? { recurring: { interval: 'month' as const } } : {}),
          },
        },
      ],
      mode: isMonthly ? 'subscription' : 'payment',
      success_url: `${baseUrl}/donate?success=1`,
      cancel_url: `${baseUrl}/donate?canceled=1`,
      ...(isMonthly
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
      metadata,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);

    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 },
    );
  }
}
