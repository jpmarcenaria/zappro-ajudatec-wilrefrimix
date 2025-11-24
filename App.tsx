import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ChatInterface from './components/ChatInterface';
import AuthModal from './components/AuthModal';
import { User, UserPlan } from './types';
import { TRIAL_DURATION_MS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'payment'>('login');

  // Load state from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('zappro_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Check trial expiration
      if (parsedUser.plan === UserPlan.TRIAL && parsedUser.trialStartDate) {
        if (Date.now() - parsedUser.trialStartDate > TRIAL_DURATION_MS) {
            parsedUser.plan = UserPlan.EXPIRED;
        }
      }
      setUser(parsedUser);
    }
  }, []);

  const handleLogin = (isPaidUpgrade: boolean) => {
    // Simulating Google OAuth Success
    const newUser: User = {
      id: 'user_123',
      name: 'Técnico Exemplo',
      email: 'tecnico@exemplo.com',
      plan: isPaidUpgrade ? UserPlan.PRO : (user?.plan || UserPlan.TRIAL),
      trialStartDate: user?.trialStartDate || Date.now()
    };
    
    setUser(newUser);
    localStorage.setItem('zappro_user', JSON.stringify(newUser));
    setShowAuthModal(false);
  };

  const startTrial = () => {
     const trialUser: User = {
         id: 'guest_' + Date.now(),
         name: 'Visitante',
         email: '',
         plan: UserPlan.TRIAL,
         trialStartDate: Date.now()
     };
     setUser(trialUser);
     localStorage.setItem('zappro_user', JSON.stringify(trialUser));
  };

  const openUpgradeModal = () => {
      setAuthMode('payment');
      setShowAuthModal(true);
  };

  const openLoginModal = () => {
      setAuthMode('login');
      setShowAuthModal(true);
  }

  // Routing Logic
  if (!user || user.plan === UserPlan.FREE) {
    return (
      <>
        <LandingPage onStartTrial={startTrial} onLogin={openLoginModal} />
        <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            onConfirm={(pay) => handleLogin(pay)}
            mode={authMode}
        />
      </>
    );
  }

  if (user.plan === UserPlan.EXPIRED) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                  <div className="text-4xl mb-4">⏰</div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Seu teste acabou</h2>
                  <p className="text-slate-600 mb-6">Para continuar acessando o consultor técnico ZapPRO, faça o upgrade para o plano PRO.</p>
                  <button 
                    onClick={openUpgradeModal}
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold"
                  >
                      Assinar PRO
                  </button>
                  <button onClick={() => { localStorage.removeItem('zappro_user'); setUser(null); }} className="mt-4 text-slate-400 text-sm underline">
                      Voltar ao início
                  </button>
              </div>
               <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                onConfirm={(pay) => handleLogin(pay)}
                mode="payment"
            />
          </div>
      )
  }

  return (
    <>
        <ChatInterface user={user} onUpgradeClick={openUpgradeModal} />
        <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            onConfirm={(pay) => handleLogin(pay)}
            mode="payment"
        />
    </>
  );
};

export default App;