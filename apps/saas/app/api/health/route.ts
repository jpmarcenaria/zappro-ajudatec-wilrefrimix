import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    services: {
      supabase: await checkSupabase(),
      openai: await checkOpenAI(),
      stripe: await checkStripe(),
    }
  };

  const allHealthy = Object.values(checks.services).every(s => s.status === 'ok');

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503
  });
}

async function checkSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { status: 'error', message: 'Supabase credentials not configured' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('profiles').select('count').limit(1);

    return {
      status: error ? 'error' : 'ok',
      message: error?.message || 'connected'
    };
  } catch (e: any) {
    return { status: 'error', message: e.message };
  }
}

async function checkOpenAI() {
  return {
    status: process.env.OPENAI_API_KEY ? 'ok' : 'error',
    message: process.env.OPENAI_API_KEY ? 'configured' : 'missing API key'
  };
}

async function checkStripe() {
  try {
    const key = process.env.STRIPE_API_KEY;
    if (!key) {
      return { status: 'error', message: 'missing API key' };
    }
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    // conexão simples: listar 1 produto (não expõe dados sensíveis)
    await stripe.products.list({ limit: 1 });
    return { status: 'ok', message: 'connected' };
  } catch (e: any) {
    return { status: 'error', message: e.message };
  }
}
