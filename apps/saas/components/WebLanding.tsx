'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MessageCircle, Mic, Camera, FileText, CheckCircle, Menu, X } from 'lucide-react'

export default function WebLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. Header (Navbar) - Estilo Original Clean */}
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ZapPRO</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/login" className="text-slate-600 hover:text-emerald-600 transition-colors text-sm font-medium">
                Login
              </Link>
              <Link
                href="/login?mode=signup"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              >
                Testar Grátis
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-emerald-600 text-sm font-medium">
                Assinar
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-emerald-600 p-2">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100">
            <div className="px-4 pt-2 pb-4 space-y-3">
              <Link href="/login" className="block text-slate-600 hover:text-emerald-600 py-2">Login</Link>
              <Link href="/login?mode=signup" className="block bg-emerald-600 text-center text-white py-3 rounded-lg font-bold">Testar Grátis</Link>
              <Link href="#pricing" className="block text-slate-600 text-center py-2 rounded-lg">Assinar</Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section - Layout Original Clean */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy - Novo Texto */}
            <div className="text-center lg:text-left space-y-8">
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                Do Split Inverter ao <span className="text-emerald-600">VRF premium</span>
              </h1>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-700">
                Suporte técnico mastigado no WhatsApp
              </h2>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Receba o diagnóstico, o passo-a-passo e as dicas do campo, direto pelo Zap.
                Resolva qualquer manutenção, sem enrolação, sem clubismo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link
                  href="/login?mode=signup"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold px-8 py-4 rounded-lg shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Teste grátis agora
                </Link>
              </div>
              <p className="text-sm text-slate-500">
                Descubra como é fácil resolver qualquer problema, em qualquer sistema ou marca.
              </p>
            </div>

            {/* Mockup - Estilo Clean */}
            <div className="relative mx-auto lg:mr-0 max-w-[320px] lg:max-w-[380px]">
              <div className="relative bg-white rounded-[3rem] border-8 border-slate-100 shadow-2xl overflow-hidden aspect-[9/19]">
                {/* Screen Header */}
                <div className="bg-emerald-600 h-16 flex items-center px-6 gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">ZP</div>
                  <div className="text-white font-medium">ZapPRO Assistente</div>
                </div>

                {/* Chat Area */}
                <div className="bg-[#e5ddd5] h-full p-4 space-y-4 overflow-hidden relative">
                  {/* User Message */}
                  <div className="flex justify-end relative z-10">
                    <div className="bg-[#dcf8c6] text-slate-800 p-3 rounded-l-lg rounded-br-lg shadow-sm max-w-[85%] text-sm leading-snug">
                      Ar-condicionado não liga, LED piscando, erro no display... me ajuda?
                      <span className="text-[10px] text-slate-500 block text-right mt-1">10:42</span>
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="flex justify-start relative z-10">
                    <div className="bg-white text-slate-800 p-3 rounded-r-lg rounded-bl-lg shadow-sm max-w-[90%] text-sm leading-snug space-y-2">
                      <p className="font-bold text-emerald-600 text-xs">ZapPRO IA</p>
                      <p>Opa, parceiro! 🛠️ Vamos resolver isso.</p>
                      <p>Qual é a marca e o modelo? Ou se preferir, manda uma foto da etiqueta ou do erro no display que eu identifico na hora!</p>
                      <span className="text-[10px] text-slate-500 block text-right mt-1">10:42</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section - Grid Clean */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">IA Treinada no Campo</h3>
              <p className="text-slate-600 mb-4">
                GPT-4o Inside, mas com conhecimento de obra. Inteligência mastigada, aplicada por quem vive da manutenção.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Áudio Nativo</h3>
              <p className="text-slate-600 mb-4">
                Fale durante o serviço. Descreva ruídos e sintomas enquanto trabalha e receba respostas na hora.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Visão Computacional</h3>
              <p className="text-slate-600 mb-4">
                Diagnóstico por foto. Envie foto de placa, erro ou etiqueta para identificação visual imediata.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Roteiro Mastigado</h3>
              <p className="text-slate-600 mb-4">
                Assistente de testes que entrega o procedimento ideal para cada problema, sem manuais extensos.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 md:col-span-2 lg:col-span-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Biblioteca Prática sem Filtro</h3>
              <p className="text-slate-600 mb-4">
                Do Split convencional até VRF topo de linha. Todo conteúdo organizado para consulta rápida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer Clean */}
      <footer className="bg-white border-t border-slate-100 py-12 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">Criado por refrigeristas, para refrigeristas. Zero vínculo ou favoritismo de marca.</p>
          <p>&copy; {new Date().getFullYear()} ZapPRO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
