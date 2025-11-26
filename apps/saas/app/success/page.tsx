'use client'

/**
 * Página de Sucesso do Pagamento
 * Exibida após conclusão bem-sucedida do checkout Stripe
 */

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')

    return (
        <div className="min-h-screen bg-[#0f1115] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-[#18181b] border border-white/10 rounded-3xl p-8 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    🎉 Assinatura Confirmada!
                </h1>

                <p className="text-gray-300 mb-6">
                    Sua assinatura mensal de <strong className="text-cyan-400">R$ 99,90/mês</strong> foi processada com sucesso.
                </p>

                {sessionId && (
                    <div className="bg-black/40 rounded-xl p-4 mb-6">
                        <p className="text-xs text-gray-400 mb-1">ID da Sessão:</p>
                        <p className="text-xs font-mono text-cyan-400 break-all">{sessionId}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Link
                        href="/dashboard"
                        className="block w-full bg-cyan-500 text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-cyan-400 transition-colors"
                    >
                        Acessar Dashboard
                    </Link>

                    <Link
                        href="/"
                        className="block w-full text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Voltar para Home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
