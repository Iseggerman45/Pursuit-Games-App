
import React from 'react';
import { Users, Swords, Home, Sun, Zap, Armchair, Hand, Tag, Trophy, Smile, Sparkles, Brain, Music, Timer, Ghost } from 'lucide-react';

interface TagIconProps {
    tag: string;
    className?: string;
}

export const TagIcon: React.FC<TagIconProps> = ({ tag, className = "w-4 h-4" }) => {
    const lower = tag.toLowerCase();
    const props = { className };

    if (lower.includes('team')) return <Users {...props} />;
    if (lower.includes('free for all')) return <Swords {...props} />;
    if (lower.includes('student') || lower.includes('leader') || lower.includes('vs')) return <Trophy {...props} />;
    if (lower.includes('no prop')) return <Hand {...props} />;
    if (lower.includes('indoor')) return <Home {...props} />;
    if (lower.includes('outdoor')) return <Sun {...props} />;
    if (lower.includes('high energy') || lower.includes('active') || lower.includes('run')) return <Zap {...props} />;
    if (lower.includes('sit') || lower.includes('quiet') || lower.includes('low energy')) return <Armchair {...props} />;
    if (lower.includes('ice breaker')) return <Sparkles {...props} />;
    if (lower.includes('brain') || lower.includes('puzzle') || lower.includes('think') || lower.includes('guess')) return <Brain {...props} />;
    if (lower.includes('music') || lower.includes('song')) return <Music {...props} />;
    if (lower.includes('quick') || lower.includes('minute')) return <Timer {...props} />;
    if (lower.includes('funny') || lower.includes('fun') || lower.includes('laugh')) return <Smile {...props} />;
    if (lower.includes('scary') || lower.includes('night')) return <Ghost {...props} />;

    return <Tag {...props} />;
};
