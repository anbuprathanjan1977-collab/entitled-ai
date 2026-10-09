import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, 
  Volume2, VolumeX, Mic, MicOff, ArrowRight 
} from 'lucide-react';
import { chatWithAssistant } from '../api/assistant';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export default function AIAssistantWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const getWelcomeText = (lang) => {
    if (lang === 'ta') {
      return 'வணக்கம்! நான் உங்கள் என்டைட்டில் AI (Entitle AI) உதவியாளர். அரசு நலத்திட்டங்கள், தேர்வுகள் அல்லது சான்றிதழ் வழிகாட்டல் குறித்து என்ன கேட்க விரும்புகிறீர்கள்?';
    }
    if (lang === 'hi') {
      return 'नमस्ते! मैं आपका एंटाइटल AI (Entitle AI) सहायक हूँ। सरकारी योजनाओं, छात्रवृत्ति या परीक्षा की जानकारी के लिए आप क्या पूछना चाहते हैं?';
    }
    if (lang === 'te') {
      return 'నమస్కారం! నేను మీ ఎంటైటిల్ AI (Entitle AI) సహాయకుడిని. ప్రభుత్వ పథకాలు లేదా పరీక్షల గురించి మీకు ఏమి సహాయం కావాలి?';
    }
    return `Hello! I am your ${t('brand.name') || 'Entitle AI'} Assistant. How can I help you with government schemes, job exams, or document downloads (Aadhaar, PAN, Income Certificate) today?`;
  };

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: getWelcomeText(i18n.language)
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Web Speech Hooks
  const { isSupported: micSupported, isListening, startListening, stopListening } = useSpeechRecognition();
  const { isSupported: ttsSupported, isSpeaking, speak, stop } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Update initial message when language changes if user hasn't chatted yet
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{ sender: 'bot', text: getWelcomeText(i18n.language) }];
      }
      return prev;
    });
  }, [i18n.language]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputVal;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await chatWithAssistant(query.trim(), i18n.language);
      const botMsg = { 
        sender: 'bot', 
        text: res.reply, 
        suggested: res.suggested_questions 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'I am currently unable to reach the server. Please check your network connection or try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setInputVal(text);
      });
    }
  };

  const handleSpeakMessage = (text) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-teal-700 via-teal-600 to-amber-500 text-white font-extrabold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all touch-target focus-visible:ring-4 focus-visible:ring-teal-500/40"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">Ask {t('brand.name') || 'Entitle AI'}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>{t('brand.name') || 'Entitle AI'} Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </h3>
                <span className="text-[11px] text-teal-200 font-medium">
                  Schemes, Exams & e-Sevai Guide
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stop();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs sm:text-sm">
            {messages.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={idx} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    isBot 
                      ? 'bg-white text-slate-800 border border-slate-200/90 shadow-2xs whitespace-pre-wrap' 
                      : 'bg-teal-700 text-white font-medium shadow-2xs'
                  }`}>
                    {m.text}
                  </div>

                  {/* Bot Speak Button */}
                  {isBot && ttsSupported && (
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(m.text)}
                      className="mt-1 text-[11px] text-slate-500 hover:text-teal-700 flex items-center gap-1 font-semibold"
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                    </button>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {isBot && m.suggested && m.suggested.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.suggested.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(sug)}
                          className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold hover:bg-teal-100 transition-colors text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs animate-pulse">
                <Bot className="w-4 h-4 text-teal-600" />
                <span>{t('brand.name') || 'Entitle AI'} is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (on initial start) */}
          {messages.length === 1 && (
            <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleSend(i18n.language === 'ta' ? 'படிநிலைகள் என்ன' : 'what are steps')}
                className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold whitespace-nowrap"
              >
                {i18n.language === 'ta' ? 'படிநிலைகள் என்ன' : 'What are steps'}
              </button>
              <button
                type="button"
                onClick={() => handleSend(i18n.language === 'ta' ? 'இ-ஆதார் பதிவிறக்கம் செய்வது எப்படி?' : 'How to download e-Aadhaar card?')}
                className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold whitespace-nowrap"
              >
                {i18n.language === 'ta' ? 'ஆதார் பதிவிறக்கம்' : 'Download Aadhaar'}
              </button>
              <button
                type="button"
                onClick={() => handleSend(i18n.language === 'ta' ? 'கலைஞர் மகளிர் உரிமைத் திட்டம்' : 'Kalaignar Magalir Urimai Thittam')}
                className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold whitespace-nowrap"
              >
                {i18n.language === 'ta' ? 'மகளிர் உரிமைத் திட்டம்' : 'Magalir Urimai'}
              </button>
              <button
                type="button"
                onClick={() => handleSend(i18n.language === 'ta' ? 'அரசு வேலை தேர்வுகள்' : 'Government job exams')}
                className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold whitespace-nowrap"
              >
                {i18n.language === 'ta' ? 'அரசு தேர்வுகள்' : 'Govt Jobs & Exams'}
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={i18n.language === 'ta' ? "திட்டங்கள் அல்லது ஆவணங்கள் குறித்து கேட்கவும்..." : "Ask anything about schemes, exams, or documents..."}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:border-teal-600 focus:outline-none"
            />

            {micSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition-colors ${
                  isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !inputVal.trim()}
              className="p-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition-colors disabled:opacity-50 touch-target"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
