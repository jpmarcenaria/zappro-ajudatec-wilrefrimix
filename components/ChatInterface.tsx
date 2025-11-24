import React, { useState, useRef, useEffect } from 'react';
import { Message, Attachment, User, UserPlan } from '../types';
import { sendMessageToGemini, generateSpeech, transcribeAudio } from '../services/geminiService';
import { AUTHOR_HANDLE } from '../constants';

// --- WhatsApp Style Audio Player ---
const PCMAudioPlayer: React.FC<{ base64Data: string; isUser?: boolean }> = ({ base64Data, isUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const decodeAudio = async () => {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = ctx;

        const dataView = new DataView(bytes.buffer);
        const numSamples = bytes.buffer.byteLength / 2;
        const buffer = ctx.createBuffer(1, numSamples, 24000);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < numSamples; i++) {
           const sample = dataView.getInt16(i * 2, true);
           channelData[i] = sample < 0 ? sample / 32768 : sample / 32767;
        }
        
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
      } catch (e) {
        console.error("Audio Decode Error");
      }
    };
    decodeAudio();
    return () => { stop(); audioCtxRef.current?.close(); };
  }, [base64Data]);

  const play = () => {
    if (!audioCtxRef.current || !audioBufferRef.current) return;
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioCtxRef.current.destination);
    
    // Auto-stop when playback finishes
    source.onended = () => {
       // We let the progress loop handle the UI reset to ensure sync
    };

    const offset = pausedAtRef.current % audioBufferRef.current.duration;
    source.start(0, offset);
    
    sourceRef.current = source;
    startTimeRef.current = audioCtxRef.current.currentTime - offset;
    setIsPlaying(true);
    
    const updateProgress = () => {
        if (!audioCtxRef.current) return;
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        if (elapsed >= duration) { 
            setIsPlaying(false); 
            pausedAtRef.current = 0; 
            setProgress(0); 
            return; 
        }
        setProgress(elapsed);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    };
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const pause = () => {
    if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current = null; }
    if (audioCtxRef.current) { pausedAtRef.current = audioCtxRef.current.currentTime - startTimeRef.current; }
    cancelAnimationFrame(animationFrameRef.current);
    setIsPlaying(false);
  };

  const stop = () => { pause(); pausedAtRef.current = 0; setProgress(0); }

  const formatTime = (t: number) => {
      const min = Math.floor(t / 60);
      const sec = Math.floor(t % 60);
      return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div className="flex items-center gap-3 min-w-[240px] mt-1 select-none">
         <button 
            onClick={isPlaying ? pause : play}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
         >
             {isPlaying ? (
                 <svg className="w-8 h-8 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
             ) : (
                 <svg className="w-8 h-8 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
             )}
         </button>
         <div className="flex-1 flex flex-col justify-center gap-1">
             <div className="h-1.5 bg-slate-300 rounded-full w-full overflow-hidden relative cursor-pointer">
                 <div 
                    className={`h-full ${isUser ? 'bg-blue-500' : 'bg-green-500'} rounded-full transition-all duration-100 relative`}
                    style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                 >
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 ${isUser ? 'bg-blue-600' : 'bg-green-600'} rounded-full shadow opacity-100`}></div>
                 </div>
             </div>
             <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                 <span>{formatTime(progress)}</span>
                 <span>{formatTime(duration)}</span>
             </div>
         </div>
         <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${isUser ? 'bg-slate-200' : 'bg-emerald-100'} flex items-center justify-center`}>
                 {isUser ? <span className="text-slate-500">🎤</span> : <span className="text-emerald-600 text-xs font-bold">IA</span>}
            </div>
         </div>
    </div>
  );
};

// --- Main Chat Interface ---

interface ChatInterfaceProps {
  user: User;
  onUpgradeClick: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onUpgradeClick }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Fala, parceiro! Sou o **ZapPRO**, seu especialista em HVAC-R.\n\nFui treinado nas manhas do ${AUTHOR_HANDLE} e nos manuais de serviço.\n\nQual a marca e modelo do ar que tá dando dor de cabeça hoje? Manda foto da placa, PDF do manual, vídeo do erro ou áudio que a gente resolve.`,
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, statusMessage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        
        let type: Attachment['type'] = 'image';
        if (file.type.startsWith('video')) type = 'video';
        else if (file.type === 'application/pdf' || file.type === 'text/plain') type = 'document';

        const newAttachment: Attachment = {
          type,
          url: URL.createObjectURL(file), // For PDF this might just be the file link logic
          mimeType: file.type,
          data: base64String,
          name: file.name
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
          setAudioPreviewUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200); 
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Erro no microfone:", err);
      alert("Erro ao acessar microfone. Verifique permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
        
        if (totalSize < 2000) { 
            console.warn("Áudio muito curto/vazio. Ignorando.");
            audioChunksRef.current = [];
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            return;
        }

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const result = reader.result as string;
            const base64Audio = result.includes(',') ? result.split(',')[1] : result;
            
            setStatusMessage('Transcrevendo áudio...');
            try {
                const transcribedText = await transcribeAudio(base64Audio, mimeType);
                if (transcribedText && transcribedText.trim().length > 0) {
                    setInputText(prev => {
                        const spacer = prev ? '\n' : '';
                        return `${prev}${spacer}${transcribedText}`;
                    });
                }
            } catch (e) {
                console.error("Falha na transcrição", e);
            } finally {
                setStatusMessage('');
            }
        };
        reader.readAsDataURL(audioBlob);
        
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const clearAudioPreview = () => {
      if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
          setAudioPreviewUrl(null);
      }
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || inputText;
    const hasContent = textToSend.trim().length > 0 || attachments.length > 0 || audioPreviewUrl !== null;

    if (!hasContent || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachments([]);
    clearAudioPreview();
    
    setIsLoading(true);
    setStatusMessage('Consultando manuais...');

    try {
      const textLower = userMsg.content.toLowerCase();
      // Expanded search keywords for Brazilian context
      const useSearch = 
        textLower.includes("preço") || 
        textLower.includes("onde comprar") || 
        textLower.includes("manual") ||
        textLower.includes("pdf") ||
        textLower.includes("erro") ||
        textLower.includes("código") ||
        textLower.includes("pisca") ||
        textLower.includes("sensor") ||
        textLower.includes("tabela");

      const response = await sendMessageToGemini(userMsg.content, userMsg.attachments || [], useSearch);
      
      let audioData = undefined;
      // Generate audio for responses up to 4000 chars (handled by service)
      if (response.text.length > 0) {
          setStatusMessage('Gravando áudio...');
          audioData = await generateSpeech(response.text) || undefined;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        groundingUrls: response.groundingUrls,
        audioData: audioData 
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const isTrial = user.plan === UserPlan.TRIAL;

  // Custom Formatter for Technical Content
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        if (line.trim().startsWith('###')) {
            return <h3 key={i} className="text-[#00a884] font-bold text-lg mt-4 mb-2">{line.replace(/###/g, '').trim()}</h3>;
        }
        if (line.trim().startsWith('##')) {
            return <h2 key={i} className="text-slate-900 font-bold text-base mt-3 mb-1">{line.replace(/##/g, '').trim()}</h2>;
        }
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const content = line.replace(/^[\*\-]\s/, '');
            const parts = content.split(/(\*\*.*?\*\*)/g);
            return (
                <div key={i} className="flex gap-2 ml-1 mb-1 items-start">
                    <span className="text-[#00a884] font-bold mt-1">•</span>
                    <p className="text-slate-800 leading-relaxed text-sm">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="font-bold text-black">{part.replace(/\*\*/g, '')}</strong>;
                            }
                            return <span key={j}>{part}</span>;
                        })}
                    </p>
                </div>
            );
        }
        if (line.trim().length > 0) {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-2 leading-relaxed text-sm text-slate-800">
                     {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-bold text-black">{part.replace(/\*\*/g, '')}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                    })}
                </p>
            );
        }
        return <div key={i} className="h-1"></div>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5]">
      {/* WhatsApp Header */}
      <header className="bg-[#008069] p-3 px-4 flex justify-between items-center shadow-md z-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
             <span className="font-bold text-[#008069] text-xl">Z</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-tight">ZapPRO</h1>
            <p className="text-xs text-green-100 opacity-90 truncate w-32 md:w-auto">{statusMessage || 'Online'}</p>
          </div>
        </div>
        {isTrial && (
            <button 
                onClick={onUpgradeClick}
                className="bg-white text-[#008069] text-xs font-bold py-1.5 px-3 rounded-full shadow hover:bg-green-50 transition-colors"
            >
                ASSINAR PRO
            </button>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-fixed">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative max-w-[85%] md:max-w-[65%] rounded-lg px-3 py-2 shadow-sm text-sm ${
                msg.role === 'user'
                  ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                  : 'bg-white text-slate-800 rounded-tl-none'
              }`}
            >
              {/* Bot Name */}
              {msg.role === 'model' && <p className="text-xs font-bold text-[#008069] mb-1">ZapPRO IA</p>}

              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {msg.attachments.map((att, idx) => {
                     if (att.type === 'document') {
                         return (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-100 rounded border border-slate-200 w-full">
                                <span className="text-2xl">📄</span>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-slate-700 truncate">{att.name || 'Documento'}</p>
                                    <p className="text-[9px] text-slate-500 uppercase">PDF / DOC</p>
                                </div>
                            </div>
                         );
                     }
                     return att.type === 'image' ? 
                     <img key={idx} src={att.url} alt="anexo" className="w-full max-w-[200px] h-auto object-cover rounded-lg" /> :
                     <video key={idx} src={att.url} className="w-full max-w-[200px] object-cover rounded-lg" controls />;
                  })}
                </div>
              )}

              {/* Formatted Content */}
              <div className="leading-relaxed break-words">
                 {renderFormattedText(msg.content)}
              </div>

              {/* Grounding Sources */}
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      <p className="font-bold mb-1">Fontes:</p>
                      <ul className="space-y-1">
                          {msg.groundingUrls.map((url, idx) => (
                              <li key={idx}>
                                  <a href={url.uri} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate block">
                                      🔗 {url.title || 'Link externo'}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}

              {/* Audio Player */}
              {msg.audioData && <PCMAudioPlayer base64Data={msg.audioData} isUser={false} />}

              <div className="flex justify-end items-center gap-1 mt-1">
                <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'user' && <span className="text-blue-500 text-[10px] font-bold">✓✓</span>}
              </div>

               {/* Quick Actions / Chips */}
              {msg.role === 'model' && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                      <button onClick={() => handleSend("Me mostre o esquema elétrico")} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">⚡ Esquema Elétrico</button>
                      <button onClick={() => handleSend("Quais os valores dos sensores?")} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">🌡️ Valores Sensores</button>
                      <button onClick={() => handleSend("Como testar o compressor?")} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">⚙️ Teste Compressor</button>
                  </div>
              )}

              {/* Bubble Tail SVG */}
              <div className={`absolute top-0 w-3 h-3 ${msg.role === 'user' ? '-right-2 text-[#d9fdd3]' : '-left-2 text-white transform -scale-x-100'}`}>
                   <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor"><path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path><path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path></svg>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex justify-start animate-fade-in">
                <div className="bg-white px-4 py-2 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-500 italic">
                   {statusMessage || 'Digitando...'}
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] px-2 py-2 md:px-4 md:py-3 flex items-end gap-2 border-t border-slate-300">
        {/* Attachment Button */}
         <div className="relative">
             <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:bg-slate-200 rounded-full transition-colors mb-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.254 3.174.653.882.882 1.323 1.653 1.232 2.635-.044.536-.278 1.042-.71 1.473l-9.546 9.546c-.961.96-2.262 1.487-3.593 1.487-1.33 0-2.631-.526-3.59-1.486a5.05 5.05 0 0 1-1.488-3.59V15.56c0-1.329.526-2.63 1.486-3.589l8.697-8.697c.305-.305.803-.291 1.09.013l.241.25c.302.314.288.795-.035 1.118l-8.686 8.687a4.13 4.13 0 0 0-1.213 2.934z"></path></svg>
             </button>
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*,.pdf,.txt" />
             {attachments.length > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#f0f2f5]"></div>}
         </div>

         {/* Text Input */}
         <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 mb-1 shadow-sm border border-slate-200 focus-within:border-slate-300 transition-colors">
             <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isRecording ? `Gravando... ${recordingTime}s` : "Digite uma mensagem"}
                className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-base py-1 scrollbar-hide placeholder-slate-400"
                rows={1}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
             />
         </div>

         {/* Mic / Send Button */}
         <div className="mb-1">
             {(inputText || attachments.length > 0 || audioPreviewUrl) ? (
                 <button onClick={() => handleSend()} className="p-3 bg-[#008069] text-white rounded-full shadow hover:bg-[#006d59] transition-all transform active:scale-95">
                     <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                 </button>
             ) : (
                 <button 
                    onMouseDown={startRecording} onMouseUp={stopRecording}
                    onTouchStart={startRecording} onTouchEnd={stopRecording}
                    className={`p-3 rounded-full transition-all shadow ${isRecording ? 'bg-red-500 text-white scale-110 shadow-red-200' : 'bg-[#008069] text-white hover:bg-[#006d59]'}`}
                 >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 1.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                 </button>
             )}
         </div>
      </div>

      {/* Attachments Preview Bar */}
      {attachments.length > 0 && (
          <div className="absolute bottom-20 left-4 right-4 bg-white p-2 rounded-lg shadow-lg border border-slate-200 flex gap-2 overflow-x-auto z-20 animate-fade-in-up">
               {attachments.map((att, i) => (
                   <div key={i} className="relative shrink-0">
                       {att.type === 'image' ? <img src={att.url} className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-xs rounded border">{att.type}</div>}
                       <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow">×</button>
                   </div>
               ))}
          </div>
      )}

      {/* Audio Preview Bar */}
      {audioPreviewUrl && (
          <div className="absolute bottom-20 left-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-slate-200 flex items-center gap-3 z-20 animate-fade-in-up">
               <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 animate-pulse">🎤</div>
               <span className="text-sm text-slate-600 flex-1 font-medium">Áudio gravado</span>
               <button onClick={clearAudioPreview} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>
      )}
    </div>
  );
};

export default ChatInterface;
