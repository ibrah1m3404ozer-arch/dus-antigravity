export const STATUS_CONFIG = {
    'not-started': { label: 'Başlanmadı', color: 'bg-slate-700 text-slate-300', next: 'studying' },
    'studying': { label: 'Çalışılıyor', color: 'bg-blue-600 text-white', next: 'finished' },
    'finished': { label: 'Bitirildi', color: 'bg-emerald-600 text-white', next: 'review1' },
    'review1': { label: 'Tekrar 1', color: 'bg-yellow-600 text-white', next: 'review2' },
    'review2': { label: 'Tekrar 2', color: 'bg-orange-600 text-white', next: 'questions' },
    'questions': { label: 'Sorular Çözüldü', color: 'bg-purple-600 text-white', next: 'not-started' },
};

export const INITIAL_CURRICULUM = [
    {
        id: 'clinical-sci',
        title: 'Klinik Bilimler',
        subjects: [
            {
                id: 'prosthetics',
                title: 'Protetik Diş Tedavisi',
                topics: [
                    { id: 'p_1', title: 'Diş Anatomisi ve Oklüzyon', status: 'not-started', questionCount: 0 },
                    { id: 'p_2', title: 'Sabit Protezler: Prensipler ve Preparasyon', status: 'not-started', questionCount: 0 },
                    { id: 'p_3', title: 'Sabit Protezler: Ölçü ve Materyaller', status: 'not-started', questionCount: 0 },
                    { id: 'p_4', title: 'Sabit Protezler: Estetik ve Simantasyon', status: 'not-started', questionCount: 0 },
                    { id: 'p_5', title: 'Hareketli Bölümlü Protezler', status: 'not-started', questionCount: 0 },
                    { id: 'p_6', title: 'Tam Protezler', status: 'not-started', questionCount: 0 },
                    { id: 'p_7', title: 'İmplantüstü Protezler', status: 'not-started', questionCount: 0 },
                    { id: 'p_8', title: 'TME Rahatsızlıkları', status: 'not-started', questionCount: 0 },
                    { id: 'p_9', title: 'Çene Yüz Protezleri', status: 'not-started', questionCount: 0 },
                    { id: 'p_10', title: 'Dental Materyaller', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'restorative',
                title: 'Restoratif Diş Tedavisi',
                topics: [
                    { id: 'res_1', title: 'Karyoloji ve Çürük Etiyolojisi', status: 'not-started', questionCount: 0 },
                    { id: 'res_2', title: 'Kavite Preparasyonu', status: 'not-started', questionCount: 0 },
                    { id: 'res_3', title: 'Adezyon ve Bonding', status: 'not-started', questionCount: 0 },
                    { id: 'res_4', title: 'Kompozit Rezinler', status: 'not-started', questionCount: 0 },
                    { id: 'res_5', title: 'Amalgam Restorasyonlar', status: 'not-started', questionCount: 0 },
                    { id: 'res_6', title: 'Işık Cihazları', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'surgery',
                title: 'Ağız, Diş ve Çene Cerrahisi',
                topics: [
                    { id: 's_1', title: 'Lokal ve Genel Anestezi', status: 'not-started', questionCount: 0 },
                    { id: 's_2', title: 'Diş Çekimi ve Komplikasyonlar', status: 'not-started', questionCount: 0 },
                    { id: 's_3', title: 'Gömülü Dişler', status: 'not-started', questionCount: 0 },
                    { id: 's_4', title: 'Odontojenik Enfeksiyonlar', status: 'not-started', questionCount: 0 },
                    { id: 's_5', title: 'Kistler ve Tümörler', status: 'not-started', questionCount: 0 },
                    { id: 's_6', title: 'Maksillofasiyal Travmalar', status: 'not-started', questionCount: 0 },
                    { id: 's_7', title: 'Ortognatik Cerrahi', status: 'not-started', questionCount: 0 },
                    { id: 's_8', title: 'TME Hastalıkları', status: 'not-started', questionCount: 0 },
                    { id: 's_9', title: 'İmplant Cerrahisi', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'radio',
                title: 'Ağız, Diş ve Çene Radyolojisi',
                topics: [
                    { id: 'rad_1', title: 'Radyasyon Fiziği', status: 'not-started', questionCount: 0 },
                    { id: 'rad_2', title: 'Projeksiyon Teknikleri', status: 'not-started', questionCount: 0 },
                    { id: 'rad_3', title: 'Radyografik Yorumlama', status: 'not-started', questionCount: 0 },
                    { id: 'rad_4', title: 'Radyografik Hatalar', status: 'not-started', questionCount: 0 },
                    { id: 'rad_5', title: 'İleri Görüntüleme (CBCT, MRI)', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'perio',
                title: 'Periodontoloji',
                topics: [
                    { id: 'per_1', title: 'Periodontal Anatomi', status: 'not-started', questionCount: 0 },
                    { id: 'per_2', title: 'Dişeti Hastalıkları', status: 'not-started', questionCount: 0 },
                    { id: 'per_3', title: 'Periodontitis', status: 'not-started', questionCount: 0 },
                    { id: 'per_4', title: 'Periodontal Tedavi (Faz 1)', status: 'not-started', questionCount: 0 },
                    { id: 'per_5', title: 'Periodontal Cerrahi (Faz 2)', status: 'not-started', questionCount: 0 },
                    { id: 'per_6', title: 'Mukogingival Cerrahi', status: 'not-started', questionCount: 0 },
                    { id: 'per_7', title: 'İmplantoloji', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'ortho',
                title: 'Ortodonti',
                topics: [
                    { id: 'ort_1', title: 'Büyüme ve Gelişim', status: 'not-started', questionCount: 0 },
                    { id: 'ort_2', title: 'Sefalometri', status: 'not-started', questionCount: 0 },
                    { id: 'ort_3', title: 'Anomaliler ve Etiyoloji', status: 'not-started', questionCount: 0 },
                    { id: 'ort_4', title: 'Ortodontik Tedavi Yöntemleri', status: 'not-started', questionCount: 0 },
                    { id: 'ort_5', title: 'Ortognatik Cerrahi', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'endo',
                title: 'Endodonti',
                topics: [
                    { id: 'end_1', title: 'Pulpa Histolojisi ve Fizyolojisi', status: 'not-started', questionCount: 0 },
                    { id: 'end_2', title: 'Kök Kanal Anatomisi', status: 'not-started', questionCount: 0 },
                    { id: 'end_3', title: 'Endodontik Mikrobiyoloji', status: 'not-started', questionCount: 0 },
                    { id: 'end_4', title: 'Teşhis ve Tedavi Planı', status: 'not-started', questionCount: 0 },
                    { id: 'end_5', title: 'Kanal Preparasyonu', status: 'not-started', questionCount: 0 },
                    { id: 'end_6', title: 'Kanal Dolumu', status: 'not-started', questionCount: 0 },
                    { id: 'end_7', title: 'Travmatik Yaralanmalar', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'pedodonti',
                title: 'Çocuk Diş Hekimliği (Pedodonti)',
                topics: [
                    { id: 'ped_1', title: 'Çocukta Muayene ve Davranış Yönlendirmesi', status: 'not-started', questionCount: 0 },
                    { id: 'ped_2', title: 'Süt Dişi Tedavileri', status: 'not-started', questionCount: 0 },
                    { id: 'ped_3', title: 'Genç Daimi Diş Tedavileri (Apexogenezis/Apexifikasyon)', status: 'not-started', questionCount: 0 },
                    { id: 'ped_4', title: 'Yer Tutucular', status: 'not-started', questionCount: 0 },
                    { id: 'ped_5', title: 'Koruyucu Uygulamalar', status: 'not-started', questionCount: 0 }
                ]
            }
        ]
    },
    {
        id: 'basic-sci',
        title: 'Temel Bilimler',
        subjects: [
            {
                id: 'anatomy',
                title: 'Anatomi',
                topics: [
                    { id: 'ana_1', title: 'Kemikler (Osteology)', status: 'not-started', questionCount: 0 },
                    { id: 'ana_2', title: 'Eklemler (Arthrology)', status: 'not-started', questionCount: 0 },
                    { id: 'ana_3', title: 'Kaslar (Myology)', status: 'not-started', questionCount: 0 },
                    { id: 'ana_4', title: 'Sinir Sistemi (Neuroanatomy)', status: 'not-started', questionCount: 0 },
                    { id: 'ana_5', title: 'Dolaşım Sistemi', status: 'not-started', questionCount: 0 },
                    { id: 'ana_6', title: 'İç Organlar', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'physiology',
                title: 'Fizyoloji',
                topics: [
                    { id: 'fiz_1', title: 'Hücre Fizyolojisi', status: 'not-started', questionCount: 0 },
                    { id: 'fiz_2', title: 'Kan ve Bağışıklık', status: 'not-started', questionCount: 0 },
                    { id: 'fiz_3', title: 'Kas ve İskelet Sistemi', status: 'not-started', questionCount: 0 },
                    { id: 'fiz_4', title: 'Dolaşım ve Solunum', status: 'not-started', questionCount: 0 },
                    { id: 'fiz_5', title: 'Sindirim ve Boşaltım', status: 'not-started', questionCount: 0 },
                    { id: 'fiz_6', title: 'Sinir ve Duyu Fizyolojisi', status: 'not-started', questionCount: 0 },
                    { id: 'fiz_7', title: 'Endokrin Sistem', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'biochemistry',
                title: 'Tıbbi Biyokimya',
                topics: [
                    { id: 'bio_1', title: 'Karbonhidratlar', status: 'not-started', questionCount: 0 },
                    { id: 'bio_2', title: 'Lipidler', status: 'not-started', questionCount: 0 },
                    { id: 'bio_3', title: 'Proteinler ve Aminoasitler', status: 'not-started', questionCount: 0 },
                    { id: 'bio_4', title: 'Enzimler', status: 'not-started', questionCount: 0 },
                    { id: 'bio_5', title: 'Vitaminler ve Koenzimler', status: 'not-started', questionCount: 0 },
                    { id: 'bio_6', title: 'Nükleotidler ve Nükleik Asitler', status: 'not-started', questionCount: 0 },
                    { id: 'bio_7', title: 'Hormonlar', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'microbiology',
                title: 'Tıbbi Mikrobiyoloji',
                topics: [
                    { id: 'mik_1', title: 'Genel Bakteriyoloji', status: 'not-started', questionCount: 0 },
                    { id: 'mik_2', title: 'İmmünoloji', status: 'not-started', questionCount: 0 },
                    { id: 'mik_3', title: 'Viroloji', status: 'not-started', questionCount: 0 },
                    { id: 'mik_4', title: 'Mikoloji', status: 'not-started', questionCount: 0 },
                    { id: 'mik_5', title: 'Parazitoloji', status: 'not-started', questionCount: 0 },
                    { id: 'mik_6', title: 'Antimikrobiyaller', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'pathology',
                title: 'Tıbbi Patoloji',
                topics: [
                    { id: 'pat_1', title: 'Hücre Hasarı ve Adaptasyon', status: 'not-started', questionCount: 0 },
                    { id: 'pat_2', title: 'İnflamasyon ve Onarım', status: 'not-started', questionCount: 0 },
                    { id: 'pat_3', title: 'Neoplazi', status: 'not-started', questionCount: 0 },
                    { id: 'pat_4', title: 'Hemodinamik Bozukluklar', status: 'not-started', questionCount: 0 },
                    { id: 'pat_5', title: 'Oral Patoloji (Tümör/Kist)', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'pharmacology',
                title: 'Tıbbi Farmakoloji',
                topics: [
                    { id: 'far_1', title: 'Genel Farmakoloji', status: 'not-started', questionCount: 0 },
                    { id: 'far_2', title: 'Otonom Sinir Sistemi', status: 'not-started', questionCount: 0 },
                    { id: 'far_3', title: 'Santral Sinir Sistemi', status: 'not-started', questionCount: 0 },
                    { id: 'far_4', title: 'Kardiyovasküler Sistem', status: 'not-started', questionCount: 0 },
                    { id: 'far_5', title: 'Endokrin Farmakolojisi', status: 'not-started', questionCount: 0 },
                    { id: 'far_6', title: 'Kemoterapötikler', status: 'not-started', questionCount: 0 }
                ]
            },
            {
                id: 'biology',
                title: 'Tıbbi Biyoloji ve Genetik',
                topics: [
                    { id: 'biy_1', title: 'Hücre Biyolojisi ve Organeller', status: 'not-started', questionCount: 0 },
                    { id: 'biy_2', title: 'Hücre Döngüsü ve Bölünme', status: 'not-started', questionCount: 0 },
                    { id: 'biy_3', title: 'Moleküler Genetik (DNA/RNA)', status: 'not-started', questionCount: 0 },
                    { id: 'biy_4', title: 'Kalıtım Modelleri (Mendel/Mendel Dışı)', status: 'not-started', questionCount: 0 },
                    { id: 'biy_5', title: 'Sitogenetik ve Kromozom Anomalileri', status: 'not-started', questionCount: 0 },
                    { id: 'biy_6', title: 'Tıbbi Teknolojiler (PCR, Klonlama)', status: 'not-started', questionCount: 0 }
                ]
            }
        ]
    }
];
