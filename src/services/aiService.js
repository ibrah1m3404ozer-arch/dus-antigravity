import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CORE HELPER: Model Hunting & Error Handling ---
const runGeminiRequest = async (prompt, apiKey, outputJson = false) => {
    if (!apiKey) {
        throw new Error("API Anahtarı eksik. Lütfen Ayarlar sayfasından ekleyin.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Candidate models in order of preference
    // ✅ These models are verified to work with v1beta API
    const candidateModels = [
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    let lastError = null;

    for (const modelName of candidateModels) {
        try {
            console.log(`Attempting AI request with model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: outputJson ? "application/json" : "text/plain"
                }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.warn(`${modelName} failed:`, error.message);
            lastError = error;

            if (error.message.includes("403") || error.message.includes("API key")) {
                break; // Fatal auth error
            }
        }
    }

    // Error Handling
    console.error("All models failed. Final Error:", lastError);
    let userMessage = "İşlem başarısız oldu.";
    const msg = lastError?.message || "";

    if (msg.includes("403")) userMessage = "🔑 Yetkilendirme Hatası (403): Anahtarı kontrol edin.";
    else if (msg.includes("404")) userMessage = "🚫 Model Bulunamadı (404): Bu anahtar mevcut modelleri desteklemiyor.";
    else if (msg.includes("429")) userMessage = "⏳ Kota Aşıldı (429): Çok sık istek gönderdiniz.";
    else if (msg.includes("400")) userMessage = "❌ Geçersiz İstek (400).";
    else if (msg.includes("fetch failed")) userMessage = "🌐 Bağlantı Hatası.";

    throw new Error(`${userMessage} (${msg})`);
};


// --- 1. SUMMARIZE ---
export const summarizeText = async (text, apiKey) => {
    const prompt = `Sen uzman bir Diş Hekimliği Eğitmenisin (DUS Hazırlık).
Aşağıdaki akademik metni analiz et ve şu formatta Türkçe çıktı ver:

DERS: [Ders Adı]
KONU: [Konu Başlığı]
---
💡 KLİNİK İPUÇLARI & ÖNEMLİ NOKTALAR:
- Madde 1
- Madde 2
...
🔑 DUS İÇİN KRİTİK BİLGİLER:
- [Sınav ipucu]
...
📝 KISA ÖZET:
[Paragraf]

Metin:
${text}`;

    return runGeminiRequest(prompt, apiKey, false);
};

// --- 2. FLASHCARDS (PEARLS) ---
export const generateFlashcards = async (text, apiKey, count = 10) => {
    const prompt = `Sen bir DUS (Diş Hekimliği Uzmanlık Sınavı) koçusun.
    Aşağıdaki metinden ${count} adet "Hap Bilgi" (Flashcard) çıkar.
    
    Çıktı JSON formatında olmalı ve şu array yapısında olmalı:
    [
      { "category": "Kategori Adı", "content": "Bilgi içeriği..." }
    ]

    Kurallar:
    1. Sadece JSON döndür. Markdown bloğu kullanma ('\`\`\`json' vb. yazma).
    2. Bilgiler kısa, net ve sınav odaklı olsun.
    3. Metin: "${text.slice(0, 15000)}"`; // Limit text length for token limits

    const jsonStr = await runGeminiRequest(prompt, apiKey, true);
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("AI yanıtı okunamadı (JSON format hatası).");
    }
};

export const generateQuiz = async (text, apiKey, preferences = "Zor, Klinik Vaka", count = 10) => {
    const prompt = `Sen bir DUS Soru Hazırlama Komisyonu üyesisin.
    Aşağıdaki metne dayanarak, "${preferences}" seviyesinde ${count} adet Çoktan Seçmeli Soru hazırla.
    
    Çıktı JSON formatında olmalı ve şu array yapısında olmalı:
    [
      { 
        "question": "Soru metni...", 
        "options": ["A) Seçenek 1", "B) Seçenek 2", "C) Seçenek 3", "D) Seçenek 4", "E) Seçenek 5"], 
        "answer": "A) Seçenek 1", 
        "explanation": "Detaylı açıklama..." 
      }
    ]

Metin:
${text}`;

    const jsonStr = await runGeminiRequest(prompt, apiKey, true);
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("AI yanıtı okunamadı (JSON format hatası).");
    }
};

// --- 4. PODCAST SCRIPT ---
export const generatePodcastScript = async (text, apiKey) => {
    const prompt = `Sen eğlenceli ve öğretici bir Diş Hekimliği podcast sunucususun.
Aşağıdaki metni, bir öğrenciye konuyu anlatıyormuş gibi, samimi, akıcı ve sohbet havasında bir konuşma metnine çevir.
"Merhaba arkadaşlar" diye başla, aralara "Bakın burası çok önemli", "Hadi bir örnek verelim" gibi ifadeler serpiştir.
Sadece konuşma metnini yaz, parantez içi reji notları VS EKLEME.

Metin:
${text}`;

    return runGeminiRequest(prompt, apiKey, false);
};
