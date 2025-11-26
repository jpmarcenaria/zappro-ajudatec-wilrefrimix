'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 border border-white/10">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-yellow-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Pagamento Cancelado
          </h1>

          <p className="text-lg text-gray-400 mb-6">
            Nenhuma cobrança foi realizada.
          </p>

          <div className="bg-black/20 rounded-xl p-6 mb-6 border border-white/5">
            <p className="text-sm text-gray-400 mb-4">
              💡 Ainda tem dúvidas sobre o ZapPRO?
            </p>
            <ul className="text-left space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span>7 dias de teste grátis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span>Cancele quando quiser, sem burocracia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span>Garantia de satisfação 100%</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              Tentar Novamente
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-white/10 backdrop-blur-md rounded-xl font-semibold hover:bg-white/20 transition-all"
            >
              Voltar para Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

