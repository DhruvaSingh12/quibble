import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface ChatSelectionActionBarProps {
    selectedCount: number;
    onCancel: () => void;
    onDeleteMe: () => void;
    onDeleteEveryone: () => void;
    canDeleteEveryone: boolean;
}

export function ChatSelectionActionBar({
    selectedCount,
    onCancel,
    onDeleteMe,
    onDeleteEveryone,
    canDeleteEveryone
}: ChatSelectionActionBarProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    if (selectedCount === 0) return null;

    return (
        <>
            <div className="absolute top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur z-50 border-b border-border/40 flex items-center justify-between px-4 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-muted transition-colors text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                    <span className="font-medium text-foreground">{selectedCount} selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors border border-destructive/20"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-background rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Delete Messages</h3>
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete {selectedCount} {selectedCount === 1 ? 'message' : 'messages'}?
                            </p>
                        </div>
                        <div className="flex flex-col border-t border-border/50 bg-muted/30">
                            {canDeleteEveryone && (
                                <button
                                    className="px-6 py-4 text-sm font-medium text-destructive hover:bg-muted transition-colors border-b border-border/50"
                                    onClick={() => { setShowDeleteModal(false); onDeleteEveryone(); }}
                                >
                                    Delete for everyone
                                </button>
                            )}
                            <button
                                className="px-6 py-4 text-sm font-medium text-destructive hover:bg-muted transition-colors border-b border-border/50"
                                onClick={() => { setShowDeleteModal(false); onDeleteMe(); }}
                            >
                                Delete for me
                            </button>
                            <button
                                className="px-6 py-4 text-sm font-medium hover:bg-muted transition-colors"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
