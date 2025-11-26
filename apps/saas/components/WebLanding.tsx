'use client'
import React, { useState } from 'react'
import { PLAN_PRICE } from '../constants'
import { AuthModal } from './auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { Wrench, MessageCircle, Target, BookOpen, Zap, Binary, Users, BarChart3, CheckCircle2, ShieldCheck, ArrowRight, Play, Star } from 'lucide-react'

const WebLanding: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { user } = useAuth()
  const [isSubscribing, setIsSubscribing] = useState(false)

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

  const handleSubscribeClick = async () => {
    try {
      if (isSubscribing) return
      setIsSubscribing(true)
      const useElement = (process.env.NEXT_PUBLIC_USE_PAYMENT_ELEMENT || '').toLowerCase() === 'true'
      if (process.env.NODE_ENV !== 'production') {
        console.log('subscribe_click', { useElement, paymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_URL || '' })
      }
      if (useElement) {
        window.location.href = '/payment'
        return
      }
      const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_URL || ''
      if (paymentLink) {
        window.location.href = paymentLink
        return
      }
      const fetchWithRetry = async (url: string, init: RequestInit, attempts = 2, timeoutMs = 10000): Promise<Response> => {
        for (let i = 0; i <= attempts; i++) {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), timeoutMs)
          try {
            const res = await fetch(url, { ...init, signal: controller.signal })
            clearTimeout(timer)
            if (res.ok) return res
            if (res.status >= 500 || res.status === 429) {
              if (i < attempts) await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
              else return res
            } else {
              return res
            }
          } catch (err) {
            clearTimeout(timer)
            if (i < attempts) await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
            else throw err
          }
        }
        throw new Error('network error')
      }
      const response = await fetchWithRetry('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        if ((process.env.NEXT_PUBLIC_USE_PAYMENT_ELEMENT || '').toLowerCase() === 'true') {
          window.location.href = '/payment'
          return
        }
        throw new Error('Erro ao criar sessão de checkout')
      }

      const data = await response.json()

      // Redirecionar para Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de checkout não retornada')
      }
    } catch (error) {
      console.error('Erro ao processar checkout:', error)
      if ((process.env.NEXT_PUBLIC_USE_PAYMENT_ELEMENT || '').toLowerCase() === 'true') {
        window.location.href = '/payment'
        return
      }
      alert('Erro ao processar pagamento. Por favor, tente novamente.')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
      <div className="min-h-screen bg-[#0f1115] font-sans selection:bg-cyan-500/30 text-white overflow-x-hidden">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] motion-safe:animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>
        <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-xl transition-all" role="navigation" aria-label="Principal">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-50 rounded-lg"></div>
                <div className="relative bg-gradient-to-br from-cyan-400 to-cyan-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner border border-white/20">Z</div>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">ZapPRO</span>
            </div>
            <div className="flex items-center gap-6">
              <button aria-label="Fazer Login" onClick={handleLoginClick} className="text-gray-300 hover:text-white font-medium text-sm hidden md:block transition-colors">Fazer Login</button>
              <button aria-label="Testar Grátis" onClick={handleTrialClick} className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-cyan-400 hover:text-slate-950 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]">Testar Grátis</button>
              <button aria-label="Assinar" onClick={handleSubscribeClick} disabled={isSubscribing} className={`text-gray-300 font-medium text-sm ${isSubscribing ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}>{isSubscribing ? 'Processando...' : 'Assinar'}</button>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 z-10">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-cyan-400 font-mono text-xs uppercase tracking-widest shadow-lg backdrop-blur-md animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                OPENAI GPT-4O - ATUALIZADO 2025
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                ZapPRO: Chega de gastar 2 horas no manual. <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient-x">Resolva em 2 minutos no Zap.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Criado por refrigerista, para refrigerista brasileiro. Diagnóstico direto, passo-a-passo mastigado, solução prática. Sem enrolação. Sem teoria. Sem guru vendendo curso.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button aria-label="Começar Agora" onClick={handleTrialClick} className="group relative bg-cyan-500 text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-cyan-400 transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:scale-105">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer gpu-transform"></div>
                  <span className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    🔧 Testar Grátis Agora
                  </span>
                </button>
              </div>
              <div className="pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-gray-400 uppercase tracking-widest">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">✅ Criado por @willrefrimix</span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">🛠️ +500 atendimentos reais</span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">⚡ Latência 0.4s - Precisão 99.8%</span>
              </div>
            </div>
            <div className="relative mx-auto order-1 lg:order-2 perspective-1000">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] bg-gradient-to-tr from-cyan-500/30 to-blue-500/30 rounded-[60px] blur-[80px] animate-pulse-slow"></div>
              <div className="relative w-[320px] h-[680px] bg-slate-900 rounded-[55px] border-[6px] border-[#3f3f46] shadow-[0_0_0_2px_#52525b,0_20px_50px_-10px_rgba(0,0,0,0.5)] mx-auto overflow-hidden animate-float gpu-transform">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-30"></div>
                <div className="w-full h-full bg-[#E5DDD5] rounded-[48px] overflow-hidden flex flex-col relative">
                  <div className="absolute inset-0 opacity-[0.08] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-fixed pointer-events-none"></div>
                  <div className="h-12 w-full flex justify-between items-center px-6 pt-2 text-black text-[10px] font-bold z-20"><span>10:42</span><div className="flex gap-1"><svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg><svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" /></svg></div></div>
                  <div className="bg-[#f4f4f4]/80 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between z-20 sticky top-0"><div className="flex items-center gap-1 text-[#007AFF]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg><span className="text-base">Voltar</span></div><div className="flex flex-col items-center"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">Z</div><div className="text-center"><h3 className="text-sm font-bold text-black leading-none">ZapPRO</h3><span className="text-[10px] text-slate-500">online</span></div></div></div><div className="flex gap-4 text-[#007AFF]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div></div>
                  <div className="flex-1 p-3 space-y-3 overflow-hidden flex flex-col justify-end pb-4"><div className="flex justify-center mb-2"><span className="bg-[#e2e8f0] text-slate-500 text-[10px] font-bold px-2 py-1 rounded shadow-sm">Hoje</span></div><div className="flex justify-end"><div className="bg-[#DCF8C5] p-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] relative"><p className="text-xs text-black leading-relaxed">Ar não liga, display piscando LED vermelho 3x</p><div className="text-[9px] text-slate-500 text-right mt-1 flex justify-end gap-1">10:42 <span className="text-[#34B7F1]">✓✓</span></div></div></div><div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%] relative"><p className="text-[10px] font-bold text-cyan-600 mb-1">ZapPRO IA</p><p className="text-xs text-black leading-relaxed whitespace-pre-line">🔧 DIAGNÓSTICO - 3 PISCADAS LED

                    1. Desliga da tomada, aguarda 5min
                    2. Mede tensão de alimentação (220V ±10%)
                    3. Verifica fusível da placa eletrônica

                    📊 Normal: 198-242V AC | Fusível OK

                    ⚡ Voltou a piscar ou ligou normal?</p><div className="flex flex-wrap gap-2 mt-2"><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full text-[9px] flex items-center gap-1">🎙️ Áudio explicativo (0:45)</span><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full text-[9px] flex items-center gap-1">⚡ Teste IPM</span><span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full text-[9px] flex items-center gap-1">📖 Manual</span></div><div className="text-[9px] text-slate-500 text-right mt-1">10:42</div></div></div></div>
                  <div className="bg-[#f6f6f6] px-3 py-3 flex items-center gap-3 border-t border-slate-200 z-20"><svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg><div className="flex-1 bg-white border border-slate-200 rounded-full h-8 px-3 flex items-center"><span className="text-xs text-gray-700">Mensagem</span></div><svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-black/80 rounded-full z-30"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AUTHENTICITY SECTION */}
        <section className="py-20 bg-[#13151a] relative border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
              <ShieldCheck className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Eu sei o que é chegar na obra e o cliente respirando no pescoço.</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Meu nome é <strong>Will (@willrefrimix)</strong>. Trabalho há anos na correria do ar-condicionado.
                <br /><br />
                Eu sei o que é:
                <br />- Cliente dizendo que &quot;tá vazando mas não tá gelando&quot;
                <br />- Gastar 40 minutos procurando código de erro no PDF
                <br />- Fabricante que manda &quot;contate o suporte técnico&quot;
                <br />- Ter 5 manuais abertos ao mesmo tempo no celular
                <br /><br />
                Por isso criei o <strong>ZapPRO</strong>. Não é &quot;mais uma ferramenta de IA&quot;.
                <br />É o colega técnico que você queria ter no WhatsApp.
              </p>
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/10">
                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
                  {/* Placeholder for Will's avatar if available, using generic for now */}
                  <div className="w-full h-full bg-cyan-500 flex items-center justify-center text-white font-bold">W</div>
                </div>
                <div>
                  <p className="text-white font-bold">@willrefrimix</p>
                  <p className="text-cyan-400 text-sm">Refrigerista, não guru de internet</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 bg-[#0f1115] relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Do campo pra tela. <br /> Passo-a-passo como você fala.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: MessageCircle,
                  title: "Manda o problema do jeito que der",
                  desc: "Foto do alarme, áudio explicando o barulho ou só o código do display. O sistema entende 'refrigerês'."
                },
                {
                  icon: Play,
                  title: "Recebe o tutorial mastigado",
                  desc: "1. Desliga geral, checa cabo de sinal (2 fios finos)\n2. Mede tensão entre S1/S2 (tem que dar 12-15V DC)\n3. Se tá zerado = placa queimou\n\n📊 NORMAL: 12-15V DC + continuidade OK\n⚠️ SEM TENSÃO: problema placa condensadora\n\nDeu quanto de tensão?"
                },
                {
                  icon: Target,
                  title: "Vai refinando até achar o problema",
                  desc: "✅ Cada resposta = novo teste específico\n✅ Até achar o periférico exato danificado\n✅ Ou confirmar erro de instalação\n\nEconomia: 1h30 de diagnóstico → 8min"
                }
              ].map((step, i) => (
                <div key={i} className="bg-[#18181b] p-8 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 group">
                  <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                    <step.icon className="w-8 h-8 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 whitespace-pre-line leading-relaxed text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 bg-[#13151a] border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Não é chatbot genérico. <br /> É base de dados profissional.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: "Manuais completos (não resumo)",
                  desc: "Manual técnico atualizado, dica de campo, tabela de erro, procedimento de teste. Tudo explicado fácil e pronto pra aplicar.\n\nMarcas: Daikin, Midea, Gree, Springer, LG, Samsung, Elgin (Mercado brasileiro. Não gringo.)"
                },
                {
                  icon: Zap,
                  title: "Split/Inverter/VRF sem decoreba",
                  desc: "Desde o básico até sistema avançado: janela, parede, multi-split, VRF, VRV, tudo com lógica inverter.\n\nTudo com valores reais de teste: pressão, corrente, resistência de termistor, tensão."
                },
                {
                  icon: Binary,
                  title: "Diagnóstico iterativo (como técnico sênior faria)",
                  desc: "Não joga 10 possibilidades.\nFaz 1 teste → você responde → ele manda o próximo.\n\nAté fechar em 1 peça ou 1 erro de instalação."
                }
              ].map((feat, i) => (
                <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
                  <feat.icon className="w-10 h-10 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  <h3 className="text-xl font-bold text-white mb-4">{feat.title}</h3>
                  <p className="text-gray-400 whitespace-pre-line">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="py-24 bg-[#0f1115]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Serve pra qualquer momento da rotina.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Wrench,
                  title: "Técnico de campo",
                  desc: "Você que atende correria, recebe roteiro de teste, ajuste, diagnóstico e dica quente.\n\nSem enrolação — como técnico fala pra técnico."
                },
                {
                  icon: Users,
                  title: "Responsável técnico",
                  desc: "Treina equipe, padroniza procedimento, consulta rápida sem ter que baixar 5 GB de PDF."
                },
                {
                  icon: BarChart3,
                  title: "Gestor de assistência",
                  desc: "Reduz tempo médio de atendimento. Melhora taxa de resolução na primeira visita.\n\nLatência 0.4s. 99.8% de precisão (dados reais do sistema)."
                }
              ].map((use, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <use.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{use.title}</h3>
                  <p className="text-gray-400 whitespace-pre-line">{use.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-[#13151a] border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Perguntas diretas. Respostas diretas.</h2>
            <div className="space-y-4">
              {[
                { q: "É mais um curso disfarçado?", a: "Não. Zero curso. Zero grupo de Telegram.\nÉ assistente técnico no Zap. Ponto." },
                { q: "Funciona offline?", a: "Não. Precisa internet (qualquer 4G serve).\nMas resposta vem em 0.4s. Mais rápido que abrir PDF." },
                { q: "Substitui experiência?", a: "Não. Complementa.\nVocê continua sendo o técnico. O ZapPRO só acelera diagnóstico." },
                { q: "E se a marca não tiver?", a: "Tem as principais do Brasil: Daikin, Midea, Gree, Springer, LG, Samsung, Elgin.\nSe faltar, manda mensagem que a gente adiciona." }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-cyan-400">?</span> {item.q}
                  </h3>
                  <p className="text-gray-400 whitespace-pre-line pl-6">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-24 relative overflow-hidden bg-[#0f1115]">
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="bg-gradient-to-b from-[#1c1c21] to-[#131316] rounded-[40px] p-1 border border-white/10 shadow-2xl">
              <div className="bg-[#18181b] rounded-[36px] p-8 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Testar grátis. Sem cartão. Sem pegadinha.</h2>
                <p className="text-gray-300 mb-10">
                  Entra, manda dúvida, vê como é diferente. Nem grupo de zap nem IA genérica. É solução pensada – clica, testa e sente a diferença na rotina.
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-6xl font-bold text-white tracking-tighter">{PLAN_PRICE}</span>
                  <div className="text-left text-sm text-gray-400 leading-none"><div>/mês</div><div>fatura mensal</div></div>
                </div>
                <p className="text-cyan-400 text-sm mb-10 font-medium">(Menos que 1 revisão perdida por manual errado)</p>

                <div className="grid md:grid-cols-2 gap-4 mb-12 text-left max-w-lg mx-auto">
                  {['Acesso total ao sistema', 'Todos os manuais liberados', 'Diagnóstico ilimitado por 7 dias', 'Suporte prioritário'].map(f => (
                    <div key={f} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={handleSubscribeClick} className="w-full md:w-auto bg-white text-slate-950 px-12 py-4 rounded-xl font-bold text-lg hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center gap-2 mx-auto">
                  <Wrench className="w-5 h-5" />
                  🔧 Começar Teste Grátis Agora
                </button>

                {process.env.NODE_ENV !== 'production' && (
                  <a
                    href="https://checkout.stripe.com/test_dev_placeholder"
                    className="mt-4 inline-block bg-cyan-900/50 text-cyan-200 px-6 py-2 rounded-xl font-bold text-xs hover:bg-cyan-900 transition-colors border border-cyan-500/30"
                    aria-label="Assinar com Stripe (Dev)"
                  >
                    Checkout Stripe (Dev)
                  </a>
                )}

                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-sm text-gray-400">
                    <strong>7 dias de garantia incondicional</strong><br />
                    Cancela quando quiser. Sem multa. Sem burocracia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-white/5 bg-[#0a0a0c] text-center text-gray-400 text-sm">
          <p className="mb-2">Feito por quem vive obra.<br />Plataforma independente. Sem rabo preso com marca.</p>
          <p className="mb-4">&copy; {new Date().getFullYear()} ZapPRO - Soluções para Ar-condicionado</p>
          <p className="text-cyan-500/50 text-xs">Criado por @willrefrimix</p>
        </footer>
      </div>
    </>
  )
}

export default WebLanding
