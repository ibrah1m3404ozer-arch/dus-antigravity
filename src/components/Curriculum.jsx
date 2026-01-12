import React, { useState } from 'react';
import { useStudyData } from '../hooks/useStudyData';
import TopicCard from './TopicCard';
import { Search } from 'lucide-react';

function Curriculum() {
    const { data, updateTopicStatus, updateTopicNote, addImage, removeImage } = useStudyData();
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const filterTopics = (topics) => {
        if (!searchQuery) return topics;
        return topics.filter((t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const toggleSubject = (subjectId) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    };

    const getProgress = (topics) => {
        const completed = topics.filter(t => t.status === 'finished' || t.status === 'questions').length;
        return `${completed}/${topics.length}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        Müfredat
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Tüm konuların ilerleme durumunu takip edin.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Konu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none w-64 text-sm"
                    />
                </div>
            </div>

            <div className="space-y-8">
                {data.map((group) => (
                    <div key={group.id} className="space-y-4">
                        <h3 className="text-xl font-semibold text-primary/80 border-b border-border pb-2">
                            {group.title}
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {group.subjects.map((subject) => {
                                const isExpanded = expandedSubjects[subject.id] || searchQuery.length > 0;
                                const displayedTopics = filterTopics(subject.topics);

                                return (
                                    <div key={subject.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300">
                                        <button
                                            onClick={() => toggleSubject(subject.id)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${isExpanded ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                                <h4 className="text-lg font-medium">{subject.title}</h4>
                                            </div>
                                            <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                                {getProgress(subject.topics)} Tamamlandı
                                            </div>
                                        </button>

                                        {(isExpanded || searchQuery) && (
                                            <div className="p-4 pt-0 border-t border-border/50 bg-card/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                                    {displayedTopics.map((topic) => (
                                                        <TopicCard
                                                            key={topic.id}
                                                            topic={topic}
                                                            onStatusChange={updateTopicStatus}
                                                            onNoteUpdate={updateTopicNote}
                                                            onAddImage={addImage}
                                                            onRemoveImage={removeImage}
                                                        />
                                                    ))}
                                                </div>
                                                {displayedTopics.length === 0 && (
                                                    <p className="text-sm text-muted-foreground italic mt-2">Bu aramaya uygun konu bulunamadı.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Curriculum;
