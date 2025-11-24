import React from 'react';
import { PLAN_PRICE } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isPaid: boolean) => void;
  mode: 'login' | 'payment';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onConfirm, mode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        
        {mode === 'login' ? (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-2xl font-bold">
                    G
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Seguro</h2>
                <p className="text-slate-600 mb-6">Entre com sua conta Google para salvar seu histórico e preferências.</p>
                
                <button 
                    onClick={() => onConfirm(false)}
                    className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-3"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
                    Continuar com Google
                </button>
                <button onClick={onClose} className="mt-4 text-slate-400 hover:text-slate-600 text-sm">
                    Cancelar
                </button>
            </div>
        ) : (
            <div className="p-8">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Upgrade PRO</h2>
                        <p className="text-emerald-600 font-medium">Desbloqueie todo o poder da IA</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-slate-900">{PLAN_PRICE}</span>
                        <span className="text-xs text-slate-500">/mês</span>
                    </div>
                 </div>

                 <div className="space-y-3 mb-6">
                    <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
                        <span className="text-sm text-emerald-900">Análise de Vídeo Ilimitada</span>
                    </div>
                    <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</div>
                        <span className="text-sm text-emerald-900">IA de Raciocínio (Gemini Pro)</span>
                    </div>
                 </div>

                 <p className="text-xs text-slate-500 mb-4 text-center">Simulação de Pagamento (Stripe/Pagar.me)</p>

                 <button 
                    onClick={() => onConfirm(true)}
                    className="w-full bg-emerald-600 text-white py-4 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg mb-3"
                >
                    Confirmar Assinatura
                </button>
                <button onClick={onClose} className="w-full text-slate-500 hover:text-slate-800 py-2 text-sm">
                    Agora não, continuar Grátis
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;