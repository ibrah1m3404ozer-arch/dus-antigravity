import React, { useRef, useState } from 'react';
import { useStudyData } from '../hooks/useStudyData';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { resetDB } from '../utils/db';

function Settings() {
    const { exportData, importData } = useStudyData();
    const fileInputRef = useRef(null);
    const [importStatus, setImportStatus] = useState(null);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [keySaved, setKeySaved] = useState(false);
    const [testStatus, setTestStatus] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleApiKeyChange = (e) => {
        const newValue = e.target.value.trim();
        setApiKey(newValue);
        localStorage.setItem('gemini_api_key', newValue);
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 2000);
    };

    const runConnectionTest = async () => {
        if (!apiKey) {
            setTestStatus({ type: 'error', message: "Lütfen önce bir API anahtarı girin." });
            return;
        }
        if (!apiKey.startsWith("AIza")) {
            setTestStatus({ type: 'error', message: "HATA: Geçersiz Anahtar Formatı. 'AIza' ile başlamalı." });
            return;
        }

        setTestStatus({ type: 'loading', message: "Bağlantı tesi yapılıyor..." });
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || response.statusText);

            setTestStatus({
                type: 'success',
                message: `✅ BAŞARILI! Erişim izni doğrulandı.`
            });
        } catch (error) {
            setTestStatus({ type: 'error', message: "Bağlantı Hatası: " + error.message });
        }
    };



    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await importData(file);
            setImportStatus('success');
            setTimeout(() => setImportStatus(null), 3000);
            e.target.value = null;
        } catch (err) {
            setImportStatus('error');
            setTimeout(() => setImportStatus(null), 3000);
        }
    };

    const confirmReset = async () => {
        try {
            await resetDB();
        } catch (error) {
            alert("Sıfırlama hatası: " + error.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                    Ayarlar
                </h2>
                <p className="text-muted-foreground mt-1">Profilini kişiselleştir ve verilerini yönet.</p>
            </div>

            <div className="space-y-8">

                {/* AI Config */}
                <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-4">AI Bağlantısı</h3>
                    <p className="text-sm text-muted-foreground mb-4">Google Gemini API anahtarınızı girerek asistanı aktifleştirin.</p>

                    <div className="flex gap-4">
                        <input
                            type="password"
                            placeholder="API Anahtarı (AIza...)"
                            className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                        />
                        <button onClick={runConnectionTest} className="px-5 py-3 bg-secondary hover:bg-secondary/80 font-medium rounded-xl transition-colors">
                            {testStatus?.type === 'loading' ? <Loader2 className="animate-spin" /> : 'Test Et'}
                        </button>
                    </div>
                    {testStatus && (
                        <div className={`mt-4 p-3 rounded-xl text-sm border ${testStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                            {testStatus.message}
                        </div>
                    )}
                </section>



                {/* 3. Data Management */}
                <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-4">Veri Yönetimi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={exportData} className="flex items-center justify-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            <Download className="text-primary" />
                            <div className="text-left">
                                <span className="block font-bold">Yedekle (Dışa Aktar)</span>
                                <span className="text-xs text-muted-foreground">Verilerini indir ve sakla</span>
                            </div>
                        </button>
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center justify-center gap-3 p-4 rounded-xl border border-border hover:bg-muted transition-colors relative">
                            <Upload />
                            <div className="text-left">
                                <span className="block font-bold">Geri Yükle (İçe Aktar)</span>
                                <span className="text-xs text-muted-foreground">JSON dosyasından yükle</span>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                        </button>
                    </div>
                    {importStatus === 'success' && <div className="mt-3 text-green-500 flex items-center gap-2"><CheckCircle2 size={16} /> Başarıyla yüklendi!</div>}
                </section>

                {/* 4. Danger Zone */}
                <section className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-red-500 mb-2">Tehlikeli Bölge</h3>
                    {!showResetConfirm ? (
                        <button onClick={() => setShowResetConfirm(true)} className="text-xs text-red-500 hover:text-red-400 underline">
                            Uygulamayı Sıfırla
                        </button>
                    ) : (
                        <div className="flex gap-3 items-center">
                            <span className="text-xs text-red-500 font-bold">Emin misin?</span>
                            <button onClick={confirmReset} className="px-3 py-1 bg-red-500 text-white text-xs rounded font-bold">EVET</button>
                            <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1 bg-secondary text-xs rounded">İptal</button>
                        </div>
                    )}
                </section>

            </div>
        </div >
    );
}

export default Settings;
