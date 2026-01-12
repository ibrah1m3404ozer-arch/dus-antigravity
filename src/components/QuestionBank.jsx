import React, { useState, useEffect } from 'react';
import { getQuestions, deleteQuestion, saveQuestion } from '../utils/db';
import { Brain, Shuffle, CheckCircle2, XCircle, Trash2, Home, BookOpen, Layers, Edit2, Check, Filter } from 'lucide-react';

const DUS_SUBJECTS = [
    "Anatomi", "Fizyoloji", "Biyokimya", "Mikrobiyoloji", "Patoloji", "Farmakoloji",
    "Protetik Diş Tedavisi", "Restoratif Diş Tedavisi", "Endodonti", "Periodontoloji",
    "Ortodonti", "Pedodonti", "Ağız Diş ve Çene Cerrahisi", "Ağız Diş ve Çene Radyolojisi",
    "Genel"
];

function QuestionBank() {
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("Tümü");

    // Category Editing State
    const [editingId, setEditingId] = useState(null);

    // Subject Selection Modal
    const [showSubjectModal, setShowSubjectModal] = useState(false);

    // Quiz Mode
    const [quizMode, setQuizMode] = useState(false);
    const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getQuestions();
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setQuestions(sortedData);

        // Extract Categories
        const cats = [...new Set(sortedData.map(q => q.category || 'Genel'))];
        setCategories(['Tümü', ...cats]);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu soruyu havuzdan silmek istediğine emin misin?')) {
            await deleteQuestion(id);
            await loadData();
        }
    };

    const handleCategoryUpdate = async (question, newCategory) => {
        await saveQuestion({ ...question, category: newCategory });

        const updatedQuestions = questions.map(q =>
            q.id === question.id ? { ...q, category: newCategory } : q
        );
        setQuestions(updatedQuestions);
        setEditingId(null);

        const cats = [...new Set(updatedQuestions.map(q => q.category || 'Genel'))];
        setCategories(['Tümü', ...cats]);
    };

    // Quiz Functions
    const startRandomQuiz = () => {
        const pool = questions;
        if (pool.length === 0) return;

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        launchQuiz(selected);
    };

    const startSubjectQuiz = (subject) => {
        const pool = questions.filter(q => (q.category || 'Genel') === subject);

        if (pool.length === 0) {
            alert(`${subject} kategorisinde henüz soru yok.`);
            return;
        }

        // Limit to 20 or user selectable? Random 20 for now.
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 20); // Slightly more for subject specific
        launchQuiz(selected);
        setShowSubjectModal(false);
    };

    const launchQuiz = (selectedQuestions) => {
        setActiveQuizQuestions(selectedQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setQuizMode(true);
    };

    const handleOptionSelect = (option) => {
        if (isAnswerRevealed) return;
        setSelectedOption(option);
    };

    const checkAnswer = () => {
        setIsAnswerRevealed(true);
        const currentQ = activeQuizQuestions[currentQuestionIndex];
        if (selectedOption === currentQ.correctAnswer || (currentQ.correctAnswer && currentQ.correctAnswer.includes(selectedOption))) {
            setScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < activeQuizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerRevealed(false);
        } else {
            alert(`Quiz Bitti! Skorunuz: ${score} / ${activeQuizQuestions.length}`);
            setQuizMode(false);
        }
    };

    // Filtering
    const displayedQuestions = activeCategory === 'Tümü'
        ? questions
        : questions.filter(q => (q.category || 'Genel') === activeCategory);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 reltive">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        🏆 Soru Bankası
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Havuza kaydettiğin tüm sorular burada.
                    </p>
                </div>

                {!quizMode && questions.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={startRandomQuiz}
                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                            <Shuffle size={16} />
                            Rastgele Sınav
                        </button>
                        <button
                            onClick={() => setShowSubjectModal(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                        >
                            <Filter size={16} />
                            Konu Seç & Sınav Yap
                        </button>
                    </div>
                )}
            </div>

            {/* Subject Selection Modal */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowSubjectModal(false)}>
                    <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="text-lg font-bold">Hangi Dersten Sınav Olacaksın?</h3>
                            <button onClick={() => setShowSubjectModal(false)}><XCircle className="text-muted-foreground hover:text-foreground" /></button>
                        </div>
                        <div className="overflow-y-auto p-2">
                            {DUS_SUBJECTS.map((subject) => {
                                const count = questions.filter(q => (q.category || 'Genel') === subject).length;
                                return (
                                    <button
                                        key={subject}
                                        onClick={() => startSubjectQuiz(subject)}
                                        disabled={count === 0}
                                        className="w-full text-left px-4 py-3 hover:bg-secondary rounded-lg flex justify-between items-center group transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <span className="font-medium">{subject}</span>
                                        <span className="text-xs bg-secondary group-hover:bg-background px-2 py-1 rounded text-muted-foreground">
                                            {count} Soru
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Tabs (Visual Separation only given specific request, but user wanted modal flow primarily) */}
            {!quizMode && !showSubjectModal && categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/50">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeCategory === cat ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-card border border-border hover:border-purple-500/30'}`}
                        >
                            <Layers size={14} />
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* QUIZ INTERFACE */}
            {quizMode && activeQuizQuestions.length > 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                            Soru {currentQuestionIndex + 1} / {activeQuizQuestions.length}
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-primary">Skor: {score}</span>
                            <button onClick={() => setQuizMode(false)} className="text-muted-foreground hover:text-destructive">
                                <XCircle size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Question */}
                    <h3 className="text-xl font-medium mb-6 leading-relaxed">
                        {activeQuizQuestions[currentQuestionIndex].question}
                    </h3>

                    {/* Options */}
                    <div className="space-y-3">
                        {activeQuizQuestions[currentQuestionIndex].options?.map((option, idx) => {
                            const currentQ = activeQuizQuestions[currentQuestionIndex];
                            const isSelected = selectedOption === option;

                            let styleClass = "border-border hover:bg-secondary/50";

                            if (isAnswerRevealed) {
                                // Check which is correct (flexible match)
                                const isCorrectTarget = option === currentQ.correctAnswer || (currentQ.correctAnswer && currentQ.correctAnswer.includes(option)) || option.startsWith(currentQ.correctAnswer?.split(')')[0]);

                                if (isCorrectTarget) {
                                    styleClass = "border-emerald-500 bg-emerald-500/20 text-emerald-500 font-bold";
                                }
                                else if (isSelected) {
                                    styleClass = "border-destructive bg-destructive/20 text-destructive";
                                }
                            } else if (isSelected) {
                                styleClass = "border-primary bg-primary/10 ring-1 ring-primary";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={isAnswerRevealed}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${styleClass}`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {isAnswerRevealed && (
                        <div className="mt-6 p-4 bg-secondary/30 rounded-xl animate-in fade-in border-l-4 border-purple-500">
                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-purple-400">
                                <Brain size={16} />
                                Açıklama ve Analiz
                            </h4>
                            <p className="text-sm text-foreground/90 leading-relaxed text-justify">
                                {activeQuizQuestions[currentQuestionIndex].explanation}
                            </p>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="mt-8 flex justify-end">
                        {!isAnswerRevealed ? (
                            <button
                                onClick={checkAnswer}
                                disabled={!selectedOption}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-transform active:scale-95"
                            >
                                Kontrol Et
                            </button>
                        ) : (
                            <button
                                onClick={nextQuestion}
                                className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl font-bold transition-transform active:scale-95 flex items-center gap-2"
                            >
                                Sonraki Soru
                                <Shuffle size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* QUESTION LIST MODE */
                <div className="grid grid-cols-1 gap-4">
                    {displayedQuestions.length === 0 ? (
                        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
                            <Brain size={64} className="mx-auto text-muted-foreground/20 mb-4" />
                            <p className="text-lg text-muted-foreground">Bu kategoride henüz soru yok.</p>
                        </div>
                    ) : (
                        displayedQuestions.map((q) => (
                            <div key={q.id} className="bg-card border border-border rounded-xl p-6 group hover:border-purple-500/50 transition-colors relative">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(q.id)} className="p-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex gap-2 mb-3 items-center">
                                    {/* Editable Category Badge */}
                                    {editingId === q.id ? (
                                        <select
                                            className="px-2 py-1 bg-background border border-primary text-primary text-xs rounded font-bold outline-none"
                                            value={q.category || 'Genel'}
                                            onChange={(e) => handleCategoryUpdate(q, e.target.value)}
                                            onBlur={() => setEditingId(null)}
                                            autoFocus
                                        >
                                            {DUS_SUBJECTS.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => setEditingId(q.id)}
                                            className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded uppercase tracking-wider hover:bg-purple-500/20 flex items-center gap-1 group/badge"
                                            title="Kategoriyi değiştirmek için tıkla"
                                        >
                                            {q.category || 'Genel'}
                                            <Edit2 size={10} className="opacity-0 group-hover/badge:opacity-100" />
                                        </button>
                                    )}

                                    <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">
                                        {q.difficulty || 'Zorlu'}
                                    </span>
                                </div>

                                <h3 className="font-medium text-lg mb-4 text-justify leading-relaxed">{q.question}</h3>

                                {/* Options Preview for List View */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                    {q.options && q.options.length > 0 ? (
                                        q.options.map((opt, i) => {
                                            const isCorrect = opt === q.correctAnswer || (q.correctAnswer && q.correctAnswer.includes(opt));
                                            return (
                                                <div key={i} className={`p-3 rounded-lg text-sm border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-medium' : 'bg-secondary/30 border-transparent text-muted-foreground'}`}>
                                                    {opt}
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="col-span-2 p-3 bg-destructive/10 text-destructive text-sm rounded">
                                            ⚠️ Şık verisi bulunamadı.
                                        </div>
                                    )}
                                </div>

                                <div className="bg-secondary/30 p-4 rounded-lg text-sm text-muted-foreground text-justify border-l-4 border-muted">
                                    <span className="font-bold text-foreground block mb-1">Cevap & Açıklama:</span>
                                    {q.explanation}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default QuestionBank;
