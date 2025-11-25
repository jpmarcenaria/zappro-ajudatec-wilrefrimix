'use client'
import React, { useState } from 'react'
import { PLAN_PRICE } from '../constants'
import { AuthModal } from './auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'

const WebLanding: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { user } = useAuth()

  const handleLoginClick = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleTrialClick = () => {
    if (user) {
      window.location.href = '/dashboard'
    } else {
      setAuthMode('register')
      setShowAuthModal(true)
    }
  }

  const handleSubscribeClick = () => {
    if (user) {
      window.location.href = '/checkout'
    } else {
      setAuthMode('register')
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
      <div className="min-h-screen bg-[#0f1115] font-sans selection:bg-emerald-500/30 text-white overflow-x-hidden">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] motion-safe:animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>
        <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-xl transition-all" role="navigation" aria-label="Principal">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-sm opacity-50 rounded-lg"></div>
                <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner border border-white/20">Z</div>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">ZapPRO</span>
            </div>
            <div className="flex items-center gap-6">
              <button aria-label="Fazer Login" onClick={handleLoginClick} className="text-gray-300 hover:text-white font-medium text-sm hidden md:block transition-colors">Fazer Login</button>
              <button aria-label="Testar Grátis" onClick={handleTrialClick} className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-700 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]">Testar Grátis</button>
              <button aria-label="Assinar" onClick={handleSubscribeClick} className="text-gray-300 hover:text-white font-medium text-sm">Assinar</button>
            </div>
          </div>
        </nav>
        <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 z-10">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-emerald-400 font-mono text-xs uppercase tracking-widest shadow-lg backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                OpenAI GPT-4o • Atualizado 2025
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                A Inteligência da OpenAI <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 animate-gradient-x">no seu WhatsApp</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">Transformamos o suporte técnico em uma conversa. Diagnósticos, manuais e consultoria especializada sem sair do app que você já usa.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button aria-label="Começar Agora" onClick={handleTrialClick} className="group relative bg-emerald-500 text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer gpu-transform"></div>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                    Começar Agora
                  </span>
                </button>
              </div>
              <div className="pt-8 flex items-center justify-center lg:justify-start gap-4 text-xs font-mono text-gray-400 uppercase tracking-widest"><span>Midea</span> • <span>Samsung</span> • <span>LG</span> • <span>Gree</span> • <span>Daikin</span></div>
            </div>
            <div className="relative mx-auto order-1 lg:order-2 perspective-1000">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] bg-gradient-to-tr from-emerald-500/30 to-blue-500/30 rounded-[60px] blur-[80px] animate-pulse-slow"></div>
              <div className="relative w-[320px] h-[680px] bg-slate-900 rounded-[55px] border-[6px] border-[#3f3f46] shadow-[0_0_0_2px_#52525b,0_20px_50px_-10px_rgba(0,0,0,0.5)] mx-auto overflow-hidden animate-float gpu-transform">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-30"></div>
                <div className="w-full h-full bg-[#E5DDD5] rounded-[48px] overflow-hidden flex flex-col relative">
                  <div className="absolute inset-0 opacity-[0.08] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-fixed pointer-events-none"></div>
                  <div className="h-12 w-full flex justify-between items-center px-6 pt-2 text-black text-[10px] font-bold z-20"><span>10:42</span><div className="flex gap-1"><svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg><svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" /></svg></div></div>
                  <div className="bg-[#f4f4f4]/80 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between z-20 sticky top-0"><div className="flex items-center gap-1 text-[#007AFF]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg><span className="text-base">Voltar</span></div><div className="flex flex-col items-center"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">Z</div><div className="text-center"><h3 className="text-sm font-bold text-black leading-none">ZapPRO</h3><span className="text-[10px] text-slate-500">online</span></div></div></div><div className="flex gap-4 text-[#007AFF]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div></div>
                  <div className="flex-1 p-3 space-y-3 overflow-hidden flex flex-col justify-end pb-4"><div className="flex justify-center mb-2"><span className="bg-[#e2e8f0] text-slate-500 text-[10px] font-bold px-2 py-1 rounded shadow-sm">Hoje</span></div><div className="flex justify-end"><div className="bg-[#DCF8C5] p-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] relative"><p className="text-xs text-black leading-relaxed">Compressor Inverter Samsung não parte. Led pisca 3x.</p><div className="text-[9px] text-slate-500 text-right mt-1 flex justify-end gap-1">10:42 <span className="text-[#34B7F1]">✓✓</span></div></div></div><div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%] relative"><p className="text-[10px] font-bold text-emerald-600 mb-1">ZapPRO IA</p><p className="text-xs text-black leading-relaxed">Fala parceiro! 🛠️ Na Samsung, 3 piscadas é erro de **comunicação** ou **fase do compressor**.</p><div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100"><div className="flex items-center gap-2 mb-1"><span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">▶</span><div className="h-1 bg-slate-200 rounded-full flex-1"></div></div><p className="text-[9px] text-slate-500">Áudio explicativo (0:45)</p></div><div className="flex gap-2 mt-2"><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full text-[9px]">⚡ Teste IPM</span><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full text-[9px]">📘 Manual</span></div><div className="text-[9px] text-slate-500 text-right mt-1">10:42</div></div></div></div>
                  <div className="bg-[#f6f6f6] px-3 py-3 flex items-center gap-3 border-t border-slate-200 z-20"><svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg><div className="flex-1 bg-white border border-slate-200 rounded-full h-8 px-3 flex items-center"><span className="text-xs text-gray-700">Mensagem</span></div><svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-black/80 rounded-full z-30"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 bg-[#0f1115] relative z-10 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Poder de Enterprise. <br /> Simplicidade de Zap.</h2>
              <p className="text-gray-300 text-lg">Substitua 10 grupos e 5 manuais em PDF por uma única conversa.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]">
              <div className="md:col-span-2 md:row-span-2 bg-[#18181b] rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl mb-6 text-emerald-400 border border-emerald-500/20">🧠</div>
                  <h3 className="text-2xl font-bold text-white mb-4">GPT-4o Inside</h3>
                  <p className="text-gray-300 mb-8 leading-relaxed">Não é um bot de respostas prontas. É uma IA que raciocina sobre o problema. Ele entende &quot;barulho estranho&quot;, analisa fotos de placas queimadas e sugere testes elétricos complexos.</p>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5"><div className="text-emerald-400 font-mono text-xs mb-1">LATÊNCIA</div><div className="text-white font-bold text-xl">0.4s</div></div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5"><div className="text-emerald-400 font-mono text-xs mb-1">PRECISÃO</div><div className="text-white font-bold text-xl">99.8%</div></div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-1 md:row-span-1 bg-[#18181b] rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl mb-4 text-blue-400">🎤</div>
                <h3 className="text-lg font-bold text-white mb-2">Áudio Nativo</h3>
                <p className="text-xs text-gray-300">Mande áudio no meio da escada. Receba áudio enquanto dirige.</p>
              </div>
              <div className="md:col-span-1 md:row-span-1 bg-[#18181b] rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-xl mb-4 text-purple-400">📸</div>
                <h3 className="text-lg font-bold text-white mb-2">Visão Computacional</h3>
                <p className="text-xs text-gray-300">Foto da etiqueta? Ele lê o modelo. Foto do erro? Ele diagnostica.</p>
              </div>
              <div className="md:col-span-2 md:row-span-1 bg-gradient-to-r from-emerald-900/40 to-[#18181b] rounded-3xl p-6 border border-white/5 flex items-center justify-between relative overflow-hidden"><div className="relative z-10"><h3 className="text-xl font-bold text-white mb-2">Manuais Ilimitados</h3><p className="text-sm text-gray-300 max-w-xs">Acesse a biblioteca técnica completa de Midea, LG, Samsung e Carrier instantaneamente.</p></div><div className="text-6xl opacity-20 grayscale saturate-0 animate-pulse">📚</div></div>
            </div>
          </div>
        </section>
        <section className="py-24 relative overflow-hidden bg-[#0f1115]">
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="bg-gradient-to-b from-[#1c1c21] to-[#131316] rounded-[40px] p-1 border border-white/10 shadow-2xl">
              <div className="bg-[#18181b] rounded-[36px] p-8 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Plano Único. Tudo Incluso.</h2>
                <p className="text-gray-300 mb-10">Sem pegadinhas. Cancele quando quiser.</p>
                <div className="flex items-center justify-center gap-2 mb-10"><span className="text-6xl font-bold text-white tracking-tighter">{PLAN_PRICE}</span><div className="text-left text-sm text-gray-400 leading-none"><div>/mês</div><div>fatura mensal</div></div></div>
                <div className="grid md:grid-cols-2 gap-4 mb-12 text-left max-w-lg mx-auto">{['Consultas Ilimitadas', 'OpenAI GPT-4o', 'Histórico na Nuvem', 'Suporte Prioritário'].map(f => (<div key={f} className="flex items-center gap-3 text-slate-300"><div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">✓</div>{f}</div>))}</div>
                <button onClick={handleSubscribeClick} className="w-full md:w-auto bg-white text-slate-950 px-12 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20">Assinar Agora</button>
                {process.env.NODE_ENV !== 'production' && (
                  <a
                    href="https://checkout.stripe.com/test_dev_placeholder"
                    className="mt-4 inline-block bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-900 transition-colors"
                    aria-label="Assinar com Stripe (Dev)"
                  >
                    Checkout Stripe (Dev)
                  </a>
                )}
                <p className="mt-4 text-xs text-gray-400">7 dias de garantia incondicional.</p>
              </div>
            </div>
          </div>
        </section>
        <footer className="py-12 border-t border-white/5 bg-[#0a0a0c] text-center text-gray-400 text-sm"><p className="mb-2">Feito para o campo 🇧🇷</p><p>&copy; {new Date().getFullYear()} ZapPRO - Soluções para Ar-condicionado</p></footer>
      </div>
    </>
  )
}

export default WebLanding
