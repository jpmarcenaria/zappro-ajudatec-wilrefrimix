'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogOut, User, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    type Subscription = { plan: string; status: string; validUntil: string };
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Simular carregamento de subscription
        // Em produção, buscar do Supabase
        const timer = setTimeout(() => {
            setSubscription({
                plan: 'pro',
                status: 'active',
                validUntil: '2026-12-31'
            });
            setLoadingSubscription(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1115]">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#0f1115]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur-sm opacity-50 rounded-lg"></div>
                            <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner border border-white/20">
                                Z
                            </div>
                        </div>
                        <span className="font-bold text-xl text-white">ZapPRO Dashboard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                            <User className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-white">{user.email}</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Sair</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Bem-vindo ao ZapPRO! 👋
                    </h1>
                    <p className="text-gray-400">
                        Gerencie sua assinatura e acesse todas as funcionalidades.
                    </p>
                </div>

                {/* Subscription Card */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl p-6 border border-emerald-500/20">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Status da Assinatura
                                </h3>
                                <p className="text-sm text-gray-400">Plano atual e benefícios</p>
                            </div>
                            {loadingSubscription ? (
                                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                                </div>
                            )}
                        </div>

                        {!loadingSubscription && subscription && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                                    <span className="text-sm text-gray-400">Plano:</span>
                                    <span className="text-sm font-bold text-emerald-400 uppercase">
                                        {subscription.plan}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                                    <span className="text-sm text-gray-400">Status:</span>
                                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                        Ativo
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                                    <span className="text-sm text-gray-400">Válido até:</span>
                                    <span className="text-sm font-semibold text-white">
                                        {new Date(subscription.validUntil).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Info Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Informações da Conta
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                                <span className="text-sm text-gray-400">Email:</span>
                                <span className="text-sm font-semibold text-white">{user.email}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                                <span className="text-sm text-gray-400">Cadastro:</span>
                                <span className="text-sm font-semibold text-white">
                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <button aria-label="Iniciar Chat" onClick={() => router.push('/chat')} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left border border-white/10">
                            <div className="text-2xl mb-2">💬</div>
                            <h4 className="font-semibold text-white mb-1">Iniciar Chat</h4>
                            <p className="text-xs text-gray-400">Converse com a IA especializada</p>
                        </button>

                        <button aria-label="Abrir Manuais" onClick={() => router.push('/manuals')} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left border border-white/10">
                            <div className="text-2xl mb-2">📚</div>
                            <h4 className="font-semibold text-white mb-1">Manuais</h4>
                            <p className="text-xs text-gray-400">Acesse biblioteca técnica</p>
                        </button>

                        <button aria-label="Abrir Configurações" onClick={() => router.push('/dashboard')} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left border border-white/10">
                            <div className="text-2xl mb-2">⚙️</div>
                            <h4 className="font-semibold text-white mb-1">Configurações</h4>
                            <p className="text-xs text-gray-400">Gerencie sua conta</p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
