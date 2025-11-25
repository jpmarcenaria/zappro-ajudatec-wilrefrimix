import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    // Allow this only in non-production environments or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_MOCK_WEBHOOK) {
        return new NextResponse('Mock webhook disabled in production', { status: 403 });
    }

    const mockSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_secret';

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    // Default mock event structure if not fully provided
    const mockEvent = {
        id: body.id || `evt_test_${Date.now()}`,
        type: body.type || 'checkout.session.completed',
        data: body.data || {
            object: {
                id: 'cs_test_mock',
                customer_email: 'test@test.com',
                metadata: { userId: 'test-user-123' },
                ...body.data?.object // Allow overriding object properties
            }
        }
    };

    console.log('[MOCK WEBHOOK] Evento recebido:', mockEvent.type);

    // Reusing logic from the main webhook (simplified for mock)
    // In a real scenario, we might want to share the processing function, 
    // but for now we'll duplicate the critical parts to ensure the mock works independently

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        switch (mockEvent.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = mockEvent.data.object;
                // Ensure we have necessary fields for the mock to work with the DB schema
                const subData = {
                    id: subscription.id || `sub_mock_${Date.now()}`,
                    user_id: subscription.metadata?.userId,
                    status: subscription.status || 'active',
                    stripe_customer_id: subscription.customer || `cus_mock_${Date.now()}`,
                    stripe_subscription_id: subscription.id || `sub_mock_${Date.now()}`,
                    price_id: subscription.items?.data?.[0]?.price?.id || 'price_mock_pro',
                    current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
                    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
                    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                };

                if (!subData.user_id) {
                    console.warn('[MOCK WEBHOOK] Missing userId in metadata, skipping DB upsert');
                } else {
                    const { error } = await supabase.from('subscriptions').upsert(subData);
                    if (error) {
                        console.error('[MOCK WEBHOOK] Supabase error:', error);
                        return NextResponse.json({ error: error.message }, { status: 500 });
                    }
                    console.log('[MOCK WEBHOOK] Subscription updated in DB');
                }
                break;

            case 'checkout.session.completed':
                // Handle checkout session completed if needed (often used to provision access before sub update)
                console.log('[MOCK WEBHOOK] Checkout session completed processed');
                break;

            default:
                console.log(`[MOCK WEBHOOK] Unhandled event type: ${mockEvent.type}`);
        }
    } catch (error) {
        console.error('[MOCK WEBHOOK] Processing error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({
        received: true,
        mock: true,
        event: mockEvent.type,
        timestamp: new Date().toISOString()
    });
}
