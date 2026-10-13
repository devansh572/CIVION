"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCivionStore, Role } from "@/lib/civion-store";
import { 
  MessageSquare, Send, Bot, Sparkles, X, Minimize2, 
  Radio, HardHat, Briefcase, User, MapPin, CheckCircle2,
  Paperclip, ArrowUpRight, Mic, MicOff, Volume2, VolumeX,
  Globe, ChevronDown, Check, AlertCircle, Waves
} from "lucide-react";

export type SupportedLanguage = "en" | "hi" | "kn" | "ta" | "te" | "bn";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
];

interface Message {
  id: string;
  sender: "user" | "bot" | "ops";
  text: string;
  timestamp: string;
  actionTag?: string;
  ticketRef?: string;
  language?: SupportedLanguage;
}

// Translations and Localized responses
const TRANSLATIONS: Record<SupportedLanguage, {
  chatTitle: string;
  chatSub: string;
  placeholder: string;
  listening: string;
  speakPrompt: string;
  audioSearch: string;
  languageSelect: string;
  initialResident: string;
  initialAuthority: string;
  initialWorker: string;
  simulatedAudio: string;
  quickPrompts: { label: string; prompt: string }[];
}> = {
  en: {
    chatTitle: "Civic AI Copilot & Voice Search",
    chatSub: "Multilingual 24/7 Municipal Assistant",
    placeholder: "Ask Civion AI or use voice search...",
    listening: "Listening... Speak your civic query now",
    speakPrompt: "Tap mic to speak your issue in English",
    audioSearch: "Voice Audio Search",
    languageSelect: "Language",
    initialResident: "Hello! I am your Civion City Assistant. Ask me to track civic tickets (like #CIV-1048), explain SLA timelines, or check local repairs.",
    initialAuthority: "Operations Copilot online. 2 critical road hazards require crew assignment today. How can I assist with triage, SLA prediction, or crew routing?",
    initialWorker: "Field Comms active. Depot dispatch and equipment requests are monitored here. Speak or type to submit status updates.",
    simulatedAudio: "Sample Voice Queries",
    quickPrompts: [
      { label: "🔍 Track #CIV-1048", prompt: "What is the status of pothole CIV-1048?" },
      { label: "💧 Water leak SLA?", prompt: "What is the standard SLA for drinking water pipe bursts?" },
      { label: "⚡ Exposed streetlight wire", prompt: "How fast will BESCOM crew fix exposed streetlight wiring?" },
      { label: "📍 Ward 112 office", prompt: "Who is the zonal engineer for Indiranagar Ward 112?" },
    ]
  },
  hi: {
    chatTitle: "सिवियन एआई और वॉयस सर्च",
    chatSub: "बहुभाषी 24/7 नागरिक सहायता केंद्र",
    placeholder: "सिवियन एआई से पूछें या बोलकर खोजें...",
    listening: "सुन रहे हैं... कृपया अपनी नागरिक समस्या बोलें",
    speakPrompt: "हिन्दी में बोलने के लिए माइक दबाएं",
    audioSearch: "ऑडियो वॉयस सर्च",
    languageSelect: "भाषा",
    initialResident: "नमस्ते! मैं आपका सिवियन नागरिक सहायक हूँ। आप मुझसे शिकायत की स्थिति (जैसे #CIV-1048), सड़क मरम्मत या पानी की लीकेज के बारे में पूछ सकते हैं।",
    initialAuthority: "ऑपरेशन्स कंट्रोल ऑनलाइन है। 2 अति-गंभीर शिकायतों पर आज फील्ड वर्कर तैनात करना आवश्यक है।",
    initialWorker: "फील्ड वर्कर चैनल सक्रिय है। डिपो सामग्री या जेसीबी सहायता हेतु यहाँ संदेश या ऑडियो भेजें।",
    simulatedAudio: "नमूना वॉयस इनपुट",
    quickPrompts: [
      { label: "🔍 ट्रैक #CIV-1048", prompt: "गड्ढे CIV-1048 की वर्तमान स्थिति क्या है?" },
      { label: "💧 पानी लीकेज समय सीमा", prompt: "पीने के पानी की पाइपलाइन लीकेज ठीक करने की समय सीमा क्या है?" },
      { label: "⚡ स्ट्रीट लाइट मरम्मत", prompt: "टूटी हुई स्ट्रीट लाइट को कब तक ठीक किया जाएगा?" },
      { label: "📍 वार्ड 112 संपर्क", prompt: "इंदिरानगर वार्ड 112 के नगर निगम अधिकारी कौन हैं?" },
    ]
  },
  kn: {
    chatTitle: "ಸಿವಿಯನ್ ಎಐ ಮತ್ತು ಧ್ವನಿ ಶೋಧನೆ",
    chatSub: "ಬಹುಭಾಷಾ 24/7 ಪೌರ ಸಹಾಯ ಕೇಂದ್ರ",
    placeholder: "ಸಿವಿಯನ್ ಎಐಗೆ ಕೇಳಿ ಅಥವಾ ಧ್ವನಿ ಬಳಸಿ...",
    listening: "ಆಲಿಸಲಾಗುತ್ತಿದೆ... ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಮಾತನಾಡಿ",
    speakPrompt: "ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ",
    audioSearch: "ಧ್ವನಿ ಶೋಧನೆ",
    languageSelect: "ಭಾಷೆ",
    initialResident: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಿವಿಯನ್ ಸಿಟಿ ಸಹಾಯಕ. ರಸ್ತೆ ಗುಂಡಿ (#CIV-1048), ಕುಡಿಯುವ ನೀರಿನ ಸೋರಿಕೆ ಅಥವಾ ಬೀದಿ ದೀಪ ದುರಸ್ತಿಯ ಬಗ್ಗೆ ವಿಚಾರಿಸಿ.",
    initialAuthority: "ನಿಯಂತ್ರಣ ಕೊಠಡಿ ಲಭ್ಯವಿದೆ. 2 ತೀವ್ರ ಸ್ವರೂಪದ ಸಾರ್ವಜನಿಕ ದೂರುಗಳಿಗೆ ಇಂದು ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ ಅಗತ್ಯವಿದೆ.",
    initialWorker: "ಕ್ಷೇತ್ರ ಕಾರ್ಮಿಕರ ಸಂಪರ್ಕ ಸಕ್ರಿಯವಾಗಿದೆ. ಡಿಪೋ ಸಾಮಗ್ರಿ ಅಥವಾ ವಾಹನಗಳ ಅಗತ್ಯವಿದ್ದರೆ ಇಲ್ಲಿ ತಿಳಿಸಿ.",
    simulatedAudio: "ಮಾದರಿ ಧ್ವನಿ ಪ್ರಶ್ನೆಗಳು",
    quickPrompts: [
      { label: "🔍 ಸ್ಥಿತಿ #CIV-1048", prompt: "ರಸ್ತೆ ಗುಂಡಿ CIV-1048 ದೂರಿನ ಸ್ಥಿತಿ ಏನು?" },
      { label: "💧 ನೀರಿನ ಸೋರಿಕೆ ಸಮಯ", prompt: "ಕೊಳವೆ ಒಡೆದು ನೀರು ಪೋಲಾಗುವುದನ್ನು ಸರಿಪಡಿಸಲು ಎಷ್ಟು ಸಮಯ ಬೇಕು?" },
      { label: "⚡ ಬೀದಿ ದೀಪ ದುರಸ್ತಿ", prompt: "ಬೀದಿ ದೀಪದ ವೈರ್ ತೆರೆದಿರುವುದನ್ನು ಬೆಸ್ಕಾಂ ಯಾವಾಗ ಸರಿಪಡಿಸುತ್ತದೆ?" },
      { label: "📍 ವಾರ್ಡ್ 112 ಅಧಿಕಾರಿ", prompt: "ಇಂದಿರಾನಗರ ವಾರ್ಡ್ 112 ರ ಸಹಾಯಕ ಇಂಜಿನಿಯರ್ ಯಾರು?" },
    ]
  },
  ta: {
    chatTitle: "சிவியன் AI மற்றும் குரல் தேடல்",
    chatSub: "பன்மொழி 24/7 குடிமக்கள் உதவி மையம்",
    placeholder: "சிவியன் AI-யிடம் கேளுங்கள் அல்லது பேசவும்...",
    listening: "கேட்கிறது... உங்கள் புகாரை பேசவும்",
    speakPrompt: "தமிழில் பேச மைக் பொத்தானை அழுத்தவும்",
    audioSearch: "குரல் தேடல்",
    languageSelect: "மொழி",
    initialResident: "வணக்கம்! நான் உங்கள் சிவியன் நகர உதவியாளர். உங்கள் புகாரின் நிலையை (#CIV-1048) அறிய அல்லது புதிய புகார்களைப் பதிவு செய்ய என்னிடம் கேட்கலாம்.",
    initialAuthority: "கட்டளை மையம் தயார் நிலையில் உள்ளது. இன்று 2 அவசர புகார்களுக்கு பணியாளர்கள் ஒதுக்கப்பட வேண்டும்.",
    initialWorker: "களப்பணியாளர் தகவல் தொடர்பு பிரிவு செயலில் உள்ளது. உபகரணங்கள் மற்றும் நிலவரங்களை இங்கே பகிரவும்.",
    simulatedAudio: "மாதிரி குரல் உள்ளீடுகள்",
    quickPrompts: [
      { label: "🔍 புகார் #CIV-1048 நிலை", prompt: "குழி CIV-1048 புகாரின் தற்போதைய நிலை என்ன?" },
      { label: "💧 குடிநீர் கசிவு நேரம்", prompt: "குடிநீர் குழாய் கசிவை சரிசெய்வதற்கான கால அவகாசம் என்ன?" },
      { label: "⚡ மின்விளக்கு பழுது", prompt: "தெருவிளக்கு பழுதை சரிசெய்ய எவ்வளவு நேரம் ஆகும்?" },
      { label: "📍 வார்டு 112 அதிகாரி", prompt: "இந்திராநகர் வார்டு 112 அதிகாரி யார்?" },
    ]
  },
  te: {
    chatTitle: "సివియన్ AI & వాయిస్ సెర్చ్",
    chatSub: "బహుభాషా 24/7 పౌర సహాయ కేంద్రం",
    placeholder: "సివియన్ AI ని అడగండి లేదా మాట్లాడండి...",
    listening: "వింటోంది... దయచేసి మాట్లాడండి",
    speakPrompt: "తెలుగులో మాట్లాడటానికి మైక్ నొక్కండి",
    audioSearch: "వాయిస్ సెర్చ్",
    languageSelect: "భాష",
    initialResident: "నమస్కారం! నేను మీ సివియన్ సిటీ అసిస్టెంట్‌ని. రోడ్డు గుంతలు (#CIV-1048), తాగునీటి లీకేజీ లేదా వీధి దీపాల సమస్యలపై నన్ను అడగవచ్చు.",
    initialAuthority: "ఆపరేషన్స్ విభాగం ఆన్‌లైన్‌లో ఉంది. 2 అత్యవసర ఫిర్యాదులకు ఈరోజు వర్కర్లను కేటాయించాలి.",
    initialWorker: "ఫీల్డ్ వర్కర్ ఛానల్ యాక్టివ్‌గా ఉంది. సామగ్రి లేదా సహాయం కోసం ఇక్కడ మాట్లాడండి.",
    simulatedAudio: "నమూనా వాయిస్ ప్రశ్నలు",
    quickPrompts: [
      { label: "🔍 స్థితి #CIV-1048", prompt: "గుంత CIV-1048 ఫిర్యాదు స్థితి ఏమిటి?" },
      { label: "💧 నీటి లీకేజీ వ్యవధి", prompt: "తాగునీటి పైపులైన్ లీకేజీ మరమ్మతు వ్యవధి ఎంత?" },
      { label: "⚡ వీధి దీపాల మరమ్మతు", prompt: "స్ట్రీట్‌లైట్ సమస్య ఎప్పుడు పరిష్కరించబడుతుంది?" },
      { label: "📍 వార్డు 112 అధికారి", prompt: "ఇందిరానగర్ వార్డు 112 ఇంజనీర్ ఎవరు?" },
    ]
  },
  bn: {
    chatTitle: "সিভিয়ন এআই ও ভয়েস অনুসন্ধান",
    chatSub: "বহুভাষিক ২৪/৭ পৌর সহায়তা কেন্দ্র",
    placeholder: "সিভিয়ন এআই-কে জিজ্ঞাসা করুন বা বলুন...",
    listening: "শুনছি... আপনার অভিযোগ বলুন",
    speakPrompt: "বাংলায় কথা বলতে মাইক চাপুন",
    audioSearch: "ভয়েস অনুসন্ধান",
    languageSelect: "ভাষা",
    initialResident: "নমস্কার! আমি আপনার সিভিয়ন সহকারী। রাস্তার গর্ত (#CIV-1048), জলের পাইপলাইন বা পথবাতি সংক্রান্ত তথ্য জানতে আমাকে জিজ্ঞাসা করুন।",
    initialAuthority: "কন্ট্রোল রুম অনলাইন। আজ ২টি জরুরি অভিযোগের জন্য কর্মী বরাদ্দ প্রয়োজন।",
    initialWorker: "ফিল্ড কর্মী যোগাযোগ সক্রিয়। সামগ্রী বা সহায়তার জন্য এখানে জানান।",
    simulatedAudio: "নমুনা ভয়েস প্রশ্ন",
    quickPrompts: [
      { label: "🔍 টিকিট #CIV-1048", prompt: "CIV-1048 রাস্তার গর্তটির বর্তমান অবস্থা কি?" },
      { label: "💧 জলের লিকেজ সময়", prompt: "জল সরবরাহ পাইপলাইন মেরামতের জন্য কত সময় লাগে?" },
      { label: "⚡ পথবাতি মেরামত", prompt: "রাস্তার বাতিটি কখন মেরামত করা হবে?" },
      { label: "📍 ওয়ার্ড ১১২ কর্মকর্তা", prompt: "ইন্দিরানগর ওয়ার্ড ১১২-এর পৌর কর্মকর্তা কে?" },
    ]
  }
};

export const CivicChatbox: React.FC = () => {
  const { currentRole, currentUser, issues, theme, selectIssue } = useCivionStore();
  const isLight = theme === "light";

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  // 1. Multi-Language State
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // 2. Audio Search & Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showAudioHelper, setShowAudioHelper] = useState(false);
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  // Role-based initial messages
  const getInitialMessages = (role: Role, lang: SupportedLanguage): Message[] => {
    const langT = TRANSLATIONS[lang] || TRANSLATIONS.en;
    switch (role) {
      case "resident":
        return [
          {
            id: `m-res-${lang}`,
            sender: "bot",
            text: langT.initialResident,
            timestamp: "Just now",
            actionTag: langT.chatTitle,
            language: lang,
          }
        ];
      case "authority":
        return [
          {
            id: `m-auth-${lang}`,
            sender: "ops",
            text: langT.initialAuthority,
            timestamp: "Just now",
            actionTag: langT.chatTitle,
            language: lang,
          }
        ];
      case "field_worker":
        return [
          {
            id: `m-wrk-${lang}`,
            sender: "ops",
            text: langT.initialWorker,
            timestamp: "Just now",
            actionTag: langT.chatTitle,
            language: lang,
          }
        ];
    }
  };

  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(currentRole, selectedLanguage));
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Update initial message when role or language switches
  useEffect(() => {
    setMessages(getInitialMessages(currentRole, selectedLanguage));
  }, [currentRole, selectedLanguage]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  // Handle Speech Recognition Web API (Audio Search)
  const startAudioSearch = () => {
    setSpeechError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback if browser doesn't support Web Speech API
      setShowAudioHelper(true);
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
      }

      const langOption = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = langOption.speechCode;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError("Microphone permission denied. Click below to use simulated audio input.");
          setShowAudioHelper(true);
        } else {
          setSpeechError(`Audio error: ${event.error}. Try again or pick a query below.`);
          setShowAudioHelper(true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition start failed:", err);
      setIsListening(false);
      setShowAudioHelper(true);
    }
  };

  // Text-To-Speech Read Aloud Feature
  const handleReadAloud = (text: string, msgId: string) => {
    if (!("speechSynthesis" in window)) return;

    if (activeSpeechMessageId === msgId) {
      window.speechSynthesis.cancel();
      setActiveSpeechMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const langOption = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langOption.speechCode;
    utterance.rate = 1.0;

    utterance.onend = () => {
      setActiveSpeechMessageId(null);
    };

    utterance.onerror = () => {
      setActiveSpeechMessageId(null);
    };

    setActiveSpeechMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);
    setIsListening(false);
    setShowAudioHelper(false);

    // Multilingual AI Response Generation
    setTimeout(() => {
      let botResponse = "";
      let ticketRef: string | undefined = undefined;

      const lower = text.toLowerCase();

      // Detection handles English, Hindi, Kannada, Tamil, Telugu, Bengali keywords
      if (
        lower.includes("civ-1048") || lower.includes("pothole") || 
        lower.includes("गड्ढा") || lower.includes("ಗುಂಡಿ") || 
        lower.includes("குழி") || lower.includes("గుంత") || lower.includes("গর্ত")
      ) {
        ticketRef = "CIV-1048";
        switch (selectedLanguage) {
          case "hi":
            botResponse = "टिकट #CIV-1048 (इंदिरानगर मेट्रो के पास खतरनाक गड्ढा) वर्तमान में 'सबमिट किया गया' है और इसकी प्राथमिकता 92 है। 14 नागरिकों ने समर्थन दिया है। समाधान की समय सीमा 18 घंटे के भीतर है।";
            break;
          case "kn":
            botResponse = "ದೂರು #CIV-1048 (ಇಂದಿರಾನಗರ ಮೆಟ್ರೋ ಬಳಿ ರಸ್ತೆ ಗುಂಡಿ) 'ಸಲ್ಲಿಸಲಾಗಿದೆ' ಸ್ಥಿತಿಯಲ್ಲಿದ್ದು, ಆದ್ಯತೆ 92 ಆಗಿದೆ. 14 ನಾಗರಿಕರು ಬೆಂಬಲಿಸಿದ್ದಾರೆ. 18 ಗಂಟೆಗಳ ಒಳಗೆ ದುರಸ್ತಿ ಗುರಿ ಹೊಂದಲಾಗಿದೆ.";
            break;
          case "ta":
            botResponse = "புகார் #CIV-1048 (இந்திராநகர் மெட்ரோ அருகில் உள்ள குழி) 'சமர்ப்பிக்கப்பட்டது' நிலையில் முன்னுரிமை 92 ஆக உள்ளது. 18 மணி நேரத்திற்குள் சரிசெய்ய இலக்கு நிர்ணயிக்கப்பட்டுள்ளது.";
            break;
          case "te":
            botResponse = "ఫిర్యాదు #CIV-1048 (ఇందిరానగర్ మెట్రో సమీపంలో గుంత) ప్రస్తుతం 'సమర్పించబడింది' స్థితిలో ఉంది, ప్రాధాన్యత 92. 18 గంటల్లో పరిష్కరించబడుతుంది.";
            break;
          case "bn":
            botResponse = "টিকিট #CIV-1048 (ইন্দিরানগর মেট্রোর কাছে গভীর গর্ত) বর্তমানে 'জমা দেওয়া হয়েছে' অবস্থায় রয়েছে, অগ্রাধিকার ৯২। ১৮ ঘণ্টার মধ্যে কাজ শেষ করার লক্ষ্য।";
            break;
          default:
            botResponse = "Ticket #CIV-1048 (Deep hazardous pothole near Indiranagar Metro) is currently 'Submitted' with Priority 92. 14 residents have upvoted. Target SLA is within 18 hours.";
        }
      } else if (
        lower.includes("civ-1031") || lower.includes("water") || lower.includes("leak") ||
        lower.includes("पानी") || lower.includes("ನೀರು") || 
        lower.includes("தண்ணீர்") || lower.includes("నీరు") || lower.includes("জল")
      ) {
        ticketRef = "CIV-1031";
        switch (selectedLanguage) {
          case "hi":
            botResponse = "टिकट #CIV-1031 (सीएमएच रोड पार्क गेट पर पेयजल पाइपलाइन रिसाव) 'हल किया गया (सत्यापन लंबित)' है। फील्ड वर्कर ने मरम्मत पूर्ण कर दी है और जीपीएस वॉटरमार्क प्रूफ अपलोड किया है। नागरिक समीक्षा अपेक्षित है!";
            break;
          case "kn":
            botResponse = "ದೂರು #CIV-1031 (ಸಿಎಂಹೆಚ್ ರಸ್ತೆಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರು ಸೋರಿಕೆ) ದುರಸ್ತಿ ಪೂರ್ಣಗೊಂಡಿದೆ. ಕ್ಷೇತ್ರ ಕಾರ್ಮಿಕರು ಜಿಪಿಎಸ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ್ದಾರೆ. ನಾಗರಿಕರ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ!";
            break;
          case "ta":
            botResponse = "புகார் #CIV-1031 (குடிநீர் கசிவு) பழுதுபார்க்கப்பட்டுள்ளது. களப்பணியாளர் ஜிபிஎஸ் ஆதாரத்தை பதிவேற்றியுள்ளார். குடிமக்களின் மதிப்பாய்வு நிலுவையில் உள்ளது!";
            break;
          case "te":
            botResponse = "ఫిర్యాదు #CIV-1031 (తాగునీటి లీకేజీ) మరమ్మతు పూర్తయింది. వర్కర్ జీపీఎస్ ఆధారాలను అప్‌లోడ్ చేశారు. పౌరుల ధృవీకరణ కోసం వేచి ఉంది!";
            break;
          case "bn":
            botResponse = "টিকিট #CIV-1031 (পানীয় জলের পাইপলাইন লিকেজ) মেরামত সম্পন্ন হয়েছে। কর্মী জিপিএস প্রমাণ আপলোড করেছেন। নাগরিক অনুমোদনের অপেক্ষায় রয়েছে!";
            break;
          default:
            botResponse = "Ticket #CIV-1031 (High pressure potable water leakage at CMH Road) is marked 'Resolved (Pending Verification)'. Crew completed clamping with GPS proof. Awaiting citizen verification sign-off!";
        }
      } else if (
        lower.includes("sla") || lower.includes("turnaround") || lower.includes("time") ||
        lower.includes("समय") || lower.includes("ಸಮಯ") || lower.includes("நேரம்")
      ) {
        switch (selectedLanguage) {
          case "hi":
            botResponse = "उत्तर डिवीजन एसएलए मानक: पेयजल पाइपलाइन आपात स्थिति: 12-24 घंटे; खतरनाक गड्ढे: 24-48 घंटे; स्ट्रीट लाइट: 36 घंटे। समग्र नगर निगम अनुपालन 89.4% है।";
            break;
          case "kn":
            botResponse = "ಉತ್ತರ ವಲಯದ ಎಸ್‌ಎಲ್‌ಎ ಮಾನದಂಡಗಳು: ಕುಡಿಯುವ ನೀರಿನ ಸೋರಿಕೆ: 12-24 ಗಂಟೆ; ರಸ್ತೆ ಗುಂಡಿ: 24-48 ಗಂಟೆ; ಬೀದಿ ದೀಪ: 36 ಗಂಟೆ. ಒಟ್ಟಾರೆ ಪಾಲಿಕೆ ದಕ್ಷತೆ 89.4% ಆಗಿದೆ.";
            break;
          case "ta":
            botResponse = "வடக்கு மண்டல சேவை கால வரம்புகள்: குடிநீர் கசிவு: 12-24 மணி நேரம்; சாலை குழி: 24-48 மணி நேரம்; தெருவிளக்கு: 36 மணி நேரம். சராசரி செயல்திறன் 89.4% ஆகும்.";
            break;
          case "te":
            botResponse = "నార్త్ డివిజన్ SLA ప్రమాణాలు: నీటి లీకేజీ: 12-24 గంటలు; రోడ్డు గుంతలు: 24-48 గంటలు; వీధి దీపాలు: 36 గంటలు. మొత్తం పురపాలక సామర్థ్యం 89.4%.";
            break;
          case "bn":
            botResponse = "উত্তর বিভাগের এসএলএ মানদণ্ড: পানীয় জলের লিকেজ: ১২-২৪ ঘণ্টা; বিপজ্জনক গর্ত: ২৪-৪৮ ঘণ্টা; পথবাতি: ৩৬ ঘণ্টা। সার্বিক সম্মতি ৮৯.৪%।";
            break;
          default:
            botResponse = "North District SLA standards: Water leak emergencies: 12-24h; Hazardous potholes: 24-48h; Streetlights: 36h; General sanitation: 24h. Citywide compliance is 89.4%.";
        }
      } else {
        switch (selectedLanguage) {
          case "hi":
            botResponse = `आपका संदेश प्राप्त हुआ: "${text}"। सिवियन एआई ने इसे उत्तर डिवीजन नगर निगम रिकॉर्ड में दर्ज कर लिया है।`;
            break;
          case "kn":
            botResponse = `ನಿಮ್ಮ ಸಂದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ: "${text}"。 ಸಿವಿಯನ್ ಎಐ ಇದನ್ನು ವಲಯದ ದೂರು ಪುಸ್ತಕದಲ್ಲಿ ದಾಖಲಿಸಿದೆ.`;
            break;
          case "ta":
            botResponse = `உங்கள் செய்தி பெறப்பட்டது: "${text}"。 சிவியன் AI இதனை மண்டல பதிவேட்டில் சேர்த்துள்ளது.`;
            break;
          case "te":
            botResponse = `మీ సందేశం అందింది: "${text}"。 సివియన్ AI దీనిని డివిజన్ రికార్డుల్లో నమోదు చేసింది.`;
            break;
          case "bn":
            botResponse = `আপনার বার্তাটি গৃহীত হয়েছে: "${text}"। সিভিয়ন এআই এটিকে পৌর রেকর্ডে নথিভুক্ত করেছে।`;
            break;
          default:
            botResponse = `Received your message: "${text}". The Civion AI engine has logged this query to the North District municipal records.`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: currentRole === "resident" ? "bot" : "ops",
          text: botResponse,
          timestamp: "Just now",
          actionTag: currentRole === "resident" ? `${t.chatTitle}` : "Ops Radio",
          ticketRef,
          language: selectedLanguage,
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  const currentLangOption = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div className={`w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden mb-3 animate-fade-in transition-all ${
          isLight 
            ? "bg-[#faf9f6] border-slate-300 text-slate-900 shadow-slate-900/25" 
            : "bg-[#11171a]/95 border-white/15 text-white backdrop-blur-xl shadow-black/90"
        }`}>
          
          {/* Top Navigation & Language Switcher Bar */}
          <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
            isLight ? "bg-white border-slate-200" : "bg-[#161f23] border-white/10"
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-coral-500/15 border border-coral-500/30 flex items-center justify-center flex-shrink-0 text-coral-400">
                <Bot className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm leading-tight truncate">{t.chatTitle}</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  {t.chatSub}
                </p>
              </div>
            </div>

            {/* Language Selector Dropdown Trigger */}
            <div className="flex items-center gap-1 relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
                  isLight 
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800" 
                    : "bg-white/5 hover:bg-white/10 border-white/15 text-amber-300"
                }`}
                title="Change language / भाषा बदलें"
              >
                <Globe className="w-3.5 h-3.5 text-coral-400" />
                <span>{currentLangOption.nativeName}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Language Dropdown Menu */}
              {showLanguageDropdown && (
                <div className={`absolute right-0 top-9 w-44 rounded-2xl border shadow-2xl p-1.5 z-50 animate-fade-in ${
                  isLight ? "bg-white border-slate-300 text-slate-800" : "bg-[#182328] border-white/20 text-white"
                }`}>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-white/10 mb-1">
                    Select Language / भाषा
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        selectedLanguage === lang.code 
                          ? "bg-amber-500/20 text-amber-300 font-bold" 
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.nativeName}</span>
                        <span className="text-[10px] opacity-60 font-mono">({lang.name})</span>
                      </div>
                      {selectedLanguage === lang.code && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick prompt suggestions chips in current language */}
          <div className={`px-3 py-2 border-b overflow-x-auto scrollbar-thin flex gap-1.5 text-[11px] font-mono flex-shrink-0 ${
            isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/5"
          }`}>
            {t.quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full border transition-all ${
                  isLight 
                    ? "bg-white hover:bg-slate-200 border-slate-300 text-slate-700" 
                    : "bg-white/5 hover:bg-white/15 border-white/10 text-slate-300 hover:text-white hover:border-coral-500/50"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Live Audio Search Status Bar (when recording) */}
          {isListening && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between text-xs font-mono animate-pulse shadow-inner">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 animate-bounce" />
                <span>{t.listening} ({currentLangOption.name})...</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsListening(false);
                }}
                className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-[10px] font-bold"
              >
                Stop
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isSpeaking = activeSpeechMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender badge & Audio Speaker button */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[10px] font-mono text-slate-400">
                    <span>{isUser ? (currentUser?.name || "You") : msg.actionTag || t.chatTitle}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>

                    {/* Listen Aloud Button for Bot message */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleReadAloud(msg.text, msg.id)}
                        className={`ml-1 flex items-center gap-1 transition-colors ${
                          isSpeaking ? "text-amber-400 font-bold" : "hover:text-white"
                        }`}
                        title="Listen to this response / सुनें"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span className="text-[9px]">Playing...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span className="text-[9px]">Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed relative group ${
                    isUser
                      ? "bg-coral-500 text-white rounded-br-none shadow-md shadow-coral-500/20"
                      : isLight
                        ? "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                        : "bg-[#182328] border border-white/10 text-slate-200 rounded-bl-none shadow-md"
                  }`}>
                    {msg.text}

                    {/* Interactive Ticket Link if ticketRef exists */}
                    {msg.ticketRef && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-amberGold-400 font-bold">
                          LINKED: #{msg.ticketRef}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.ticketRef) selectIssue(msg.ticketRef);
                          }}
                          className="text-[10px] underline font-mono cursor-pointer hover:text-coral-400 flex items-center gap-0.5"
                        >
                          <span>Open Ticket</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-2">
                <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px]">Civion AI reasoning in {currentLangOption.nativeName}...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Audio Search Voice Sample Picker (when speech error occurs or requested) */}
          {showAudioHelper && (
            <div className="p-3 bg-black/60 border-t border-amber-500/30 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t.simulatedAudio} ({currentLangOption.name})</span>
                </span>
                <button onClick={() => setShowAudioHelper(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              {speechError && (
                <p className="text-[10px] text-rose-300 leading-tight">{speechError}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {t.quickPrompts.slice(0, 3).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(item.prompt);
                      setShowAudioHelper(false);
                      handleSendMessage(item.prompt);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-200 border border-amber-500/30 text-left"
                  >
                    🎙️ &quot;{item.prompt}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box Footer with Audio Search Mic Button */}
          <div className={`p-3 border-t ${
            isLight ? "bg-white border-slate-200" : "bg-[#141b1f] border-white/10"
          }`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.placeholder}
                  className={`w-full pl-3.5 pr-9 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors ${
                    isLight 
                      ? "bg-slate-50 border-slate-300 text-slate-900" 
                      : "bg-[#0d1117] border-white/10 text-white placeholder:text-slate-500"
                  }`}
                />

                {/* Voice Audio Search Mic Button inside input */}
                <button
                  type="button"
                  onClick={startAudioSearch}
                  className={`absolute right-2 p-1.5 rounded-lg transition-all cursor-pointer ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40"
                      : "text-slate-400 hover:text-amber-400 hover:bg-white/10"
                  }`}
                  title={`${t.audioSearch} (${currentLangOption.nativeName})`}
                >
                  <Mic className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Send Message Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-coral-500 hover:bg-coral-600 disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* FLOATING TRIGGER PILL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-full border shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
          isOpen
            ? "bg-coral-500 text-white border-coral-400 shadow-coral-500/30"
            : isLight
              ? "bg-white text-slate-900 border-slate-300 hover:border-coral-500 shadow-slate-900/15"
              : "bg-[#161f23] text-white border-white/15 hover:border-coral-500/60 shadow-black/80"
        }`}
      >
        {/* Pulsing indicator with Mic & Chat icons */}
        <div className="relative flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-coral-500/20 flex items-center justify-center text-coral-400 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>

        {/* Text and unread indicator */}
        <div className="text-left pr-1">
          <div className="text-xs font-bold leading-tight font-sans flex items-center gap-1.5">
            <span>Civic AI & Voice</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] text-amber-300 font-mono font-bold">
              {currentLangOption.code.toUpperCase()}
            </span>
            {unreadCount > 0 && !isOpen && (
              <span className="px-1.5 py-0.2 rounded-full bg-coral-500 text-[10px] text-white font-mono font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-slate-400 leading-tight">
            Voice Search &bull; 6 Languages
          </div>
        </div>
      </button>

    </div>
  );
};
