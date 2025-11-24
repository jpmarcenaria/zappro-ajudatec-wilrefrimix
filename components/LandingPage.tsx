import React from 'react';
import { UserPlan } from '../types';
import { AUTHOR_HANDLE, PLAN_PRICE } from '../constants';

interface LandingPageProps {
  onStartTrial: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartTrial, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold">Z</div>
            <span className="font-bold text-xl text-slate-800">ZapPRO</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-slate-600 hover:text-emerald-600 font-medium text-sm hidden md:block">
              Já sou assinante
            </button>
            <button 
              onClick={onStartTrial}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-emerald-200"
            >
              Testar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-0">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              Para Técnicos HVAC-R
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
              Seu Consultor Técnico <span className="text-emerald-600">24 Horas por Dia</span>
            </h1>
            <p className="text-lg text-slate-600">
              Diagnósticos precisos, manuais na palma da mão e a experiência do {AUTHOR_HANDLE} para você nunca mais travar em um chamado técnico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onStartTrial}
                className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transition-colors shadow-xl"
              >
                Começar Teste de 1 Dia
              </button>
              <button 
                onClick={onLogin}
                className="bg-white border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5"/>
                Entrar com Google
              </button>
            </div>
            <p className="text-xs text-slate-500">
              *Não requer cartão de crédito para testar.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 md:p-6 max-w-sm mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Mock Chat Interface */}
              <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                 <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">Z</div>
                 <div>
                    <p className="font-bold text-slate-800">ZapPRO</p>
                    <p className="text-xs text-green-500">Online agora</p>
                 </div>
              </div>
              <div className="space-y-3 text-sm">
                 <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg rounded-tr-none ml-auto max-w-[90%]">
                    ZapPRO, essa Fujitsu Inverter tá dando erro de comunicação. O LED operation pisca 5 vezes.
                 </div>
                 <div className="bg-slate-100 text-slate-800 p-3 rounded-lg rounded-tl-none mr-auto max-w-[95%]">
                    <p className="font-semibold mb-1">Diagnóstico Rápido:</p>
                    <p>O código de 5 piscadas no Operation geralmente indica <strong>Erro de Comunicação Serial</strong>.</p>
                    <br/>
                    <p>✅ <strong>Verifique:</strong></p>
                    1. Tensão entre terminais 3 (comunicação) e N? Deve oscilar (DC).
                    <br/>
                    2. Fusível da placa externa queimado?
                    <br/>
                    3. Cabos oxidados?
                    <br/><br/>
                    Quer que eu mostre o esquema elétrico desse modelo?
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que usar o ZapPRO?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
                Não é só um chatbot. É uma ferramenta de trabalho pensada para a realidade do campo, com lama, sol e pressão do cliente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Respostas Instantâneas",
                desc: "Esqueça horas procurando em grupos de WhatsApp. Tire a dúvida na hora e feche o serviço."
              },
              {
                icon: "📸",
                title: "Análise de Imagens",
                desc: "Envie foto da placa eletrônica ou do esquema. A IA identifica componentes e caminhos para você."
              },
              {
                icon: "🔊",
                title: "Modo Mãos Livres",
                desc: "Fale sua dúvida por áudio e ouça a resposta. Ideal para quando você está em cima da escada."
              },
              {
                icon: "📚",
                title: "Manuais Integrados",
                desc: "Acesso a especificações técnicas de milhares de modelos Inverter e Convencionais."
              },
              {
                icon: "📹",
                title: "Análise de Vídeo",
                desc: "Grave o comportamento do LED piscando e o ZapPRO interpreta o código de erro pra você."
              },
              {
                icon: "🎓",
                title: "Método Will Refrimix",
                desc: "Treinado com as melhores práticas e dicas de quem vive a refrigeração de verdade."
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 border border-slate-100 rounded-xl hover:shadow-lg transition-shadow bg-slate-50">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-slate-800">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Investimento que se paga no primeiro serviço</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Free Plan */}
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 opacity-80 hover:opacity-100 transition-opacity">
               <h3 className="text-xl font-bold mb-2">Teste Grátis</h3>
               <div className="text-4xl font-bold mb-6">R$ 0</div>
               <ul className="text-left space-y-4 mb-8 text-slate-300">
                 <li>✓ Acesso total por 1 dia</li>
                 <li>✓ Consultas ilimitadas</li>
                 <li>✓ Análise de fotos e áudio</li>
               </ul>
               <button onClick={onStartTrial} className="w-full py-3 rounded-lg border border-white font-bold hover:bg-white hover:text-slate-900 transition-colors">
                 Começar Agora
               </button>
            </div>

            {/* PRO Plan */}
            <div className="bg-emerald-600 p-8 rounded-2xl shadow-2xl transform md:scale-105 relative">
               <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                 MAIS POPULAR
               </div>
               <h3 className="text-xl font-bold mb-2">Plano PRO</h3>
               <div className="text-5xl font-bold mb-2">{PLAN_PRICE}</div>
               <div className="text-sm opacity-80 mb-6">/mês</div>
               <ul className="text-left space-y-4 mb-8 text-emerald-50 font-medium">
                 <li className="flex items-center gap-2">✓ <span>Acesso Ilimitado 24/7</span></li>
                 <li className="flex items-center gap-2">✓ <span>Inteligência Avançada (Gemini Pro)</span></li>
                 <li className="flex items-center gap-2">✓ <span>Análise de Vídeos Complexos</span></li>
                 <li className="flex items-center gap-2">✓ <span>Suporte Prioritário</span></li>
               </ul>
               <button onClick={onLogin} className="w-full py-4 bg-white text-emerald-700 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg">
                 Assinar Agora
               </button>
               <p className="mt-4 text-xs opacity-70">Cancele quando quiser.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} ZapPRO. Todos os direitos reservados.</p>
        <p className="mt-2">Desenvolvido com tecnologia Google Gemini.</p>
      </footer>
    </div>
  );
};

export default LandingPage;