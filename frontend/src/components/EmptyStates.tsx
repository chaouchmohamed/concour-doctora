import React from 'react';
import {
    Users,
    Calendar,
    FileText,
    History,
    Search,
    Inbox
} from 'lucide-react';
import { Button } from './UI';
import { cn } from '../constants';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'search' | 'error';
}

export const EmptyState = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-6",
                variant === 'error' ? "bg-danger/10 text-danger" : "bg-surface/30 text-primary-accent"
            )}>
                {icon || <Inbox size={32} />}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
            <p className="text-small text-muted max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} className="gap-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

// Pre-configured variants for common use cases
export const NoCandidatesEmpty = ({ onAction }: { onAction?: () => void }) => (
    <EmptyState
        icon={<Users size={32} />}
        title="No Candidates Yet"
        description="Import candidates from a CSV file or add them manually to get started."
        actionLabel="Import Candidates"
        onAction={onAction}
    />
);

export const NoExamsEmpty = ({ onAction }: { onAction?: () => void }) => (
    <EmptyState
        icon={<Calendar size={32} />}
        title="No Exams Scheduled"
        description="Create your first exam to begin planning the session schedule."
        actionLabel="Create Exam"
        onAction={onAction}
    />
);

export const NoResultsEmpty = () => (
    <EmptyState
        icon={<FileText size={32} />}
        title="No Results Available"
        description="Results will appear here once the deliberation process is complete."
    />
);

export const NoAuditEntriesEmpty = () => (
    <EmptyState
        icon={<History size={32} />}
        title="No Activity Recorded"
        description="Audit entries will appear here as users interact with the system."
    />
);

export const SearchEmpty = () => (
    <EmptyState
        icon={<Search size={32} />}
        title="No Results Found"
        description="Try adjusting your search terms or clearing the filters."
        variant="search"
    />
);
