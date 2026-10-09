import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, Send, Sparkles, Volume2, VolumeX, Mic, MicOff, 
  HelpCircle, BookOpen, Layers, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { chatWithAssistant } from '../api/assistant';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export default function AIAssistantPage() {
  const { t, i18n } = useTranslation();

  const getWelcomeText = (lang) => {
    if (lang === 'ta') {
      return 'வணக்கம்! என்டைட்டில் AI (Entitle AI) உதவி மையத்திற்கு வரவேற்கிறோம்! அரசு நலத்திட்டங்கள், உதவித்தொகைகள், அரசு வேலைத் தேர்வுகள், அல்லது இ-ஆதார், பான் கார்டு, வருமானச் சான்றிதழ் வழிகாட்டல் குறித்து உங்கள் கேள்விகளைக் கேளுங்கள்.';
    }
    if (lang === 'hi') {
      return 'नमस्ते! एंटाइटल AI (Entitle AI) सहायता केंद्र में आपका स्वागत है! केंद्रीय व राज्य सरकारी योजनाओं, छात्रवृत्तियों, सरकारी नौकरियों, और ई-सेवा दस्तावेजों के बारे में कुछ भी पूछें।';
    }
    if (lang === 'te') {
      return 'నమస్కారం! ఎంటైటిల్ AI (Entitle AI) సహాయ కేంద్రానికి స్వాగతం! ప్రభుత్వ సంక్షేమ పథకాలు, ఉద్యోగ పరీక్షలు లేదా పత్రాల వివరాల గురించి మీ ప్రశ్నలను అడగండి.';
    }
    return `Welcome to ${t('brand.name') || 'Entitle AI'} Assistant! Ask me any question about central or state welfare schemes, college scholarships, eligibility rules, government job exams (TNPSC, SSC, RRB), or step-by-step guidance to download Aadhaar, PAN card, and income certificates.`;
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
  const { isSupported: micSupported, isListening, startListening, stopListening } = useSpeechRecognition();
  const { isSupported: ttsSupported, isSpeaking, speak, stop } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: res.reply,
          suggested: res.suggested_questions
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Encountered a server communication error. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <Bot className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          {t('brand.name') || 'Entitle AI'} Welfare Scheme & Career Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Ask questions in English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം, বাংলা, मराठी, or ગુજરાતી.
        </p>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col h-[650px] max-h-[75vh]">
        
        {/* Messages list */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/70 text-sm">
          {messages.map((m, idx) => {
            const isBot = m.sender === 'bot';
            return (
              <div key={idx} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                <div className={`p-4 rounded-3xl max-w-[85%] leading-relaxed ${
                  isBot 
                    ? 'bg-white text-slate-900 border border-slate-200/90 shadow-xs whitespace-pre-wrap' 
                    : 'bg-teal-700 text-white font-medium shadow-xs'
                }`}>
                  {m.text}
                </div>

                {/* Speak button */}
                {isBot && ttsSupported && (
                  <button
                    type="button"
                    onClick={() => isSpeaking ? stop() : speak(m.text)}
                    className="mt-1 text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1 font-semibold pl-2"
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Stop Audio' : 'Read aloud'}</span>
                  </button>
                )}

                {/* Suggested chip prompts */}
                {isBot && m.suggested && m.suggested.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.suggested.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(sug)}
                        className="px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold hover:bg-teal-100 transition-colors text-left"
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
            <div className="flex items-center gap-2 p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs animate-pulse max-w-xs">
              <Bot className="w-4 h-4 text-teal-600" />
              <span>Analyzing welfare databases...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={i18n.language === 'ta' ? "திட்டங்கள் அல்லது ஆவணங்கள் குறித்து கேட்கவும்..." : "Type your question or scheme topic..."}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm font-semibold focus:border-teal-600 focus:outline-none"
          />

          {micSupported && (
            <button
              type="button"
              onClick={() => isListening ? stopListening() : startListening(text => setInputVal(text))}
              className={`p-3 rounded-2xl transition-colors ${
                isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !inputVal.trim()}
            className="p-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white transition-colors disabled:opacity-50 touch-target"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>

    </div>
  );
}
