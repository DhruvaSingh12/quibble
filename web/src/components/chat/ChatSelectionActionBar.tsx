import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
    FaFaceDizzy,
    FaFaceGrinWide,
    FaFaceGrinHearts,
    FaFaceGrinSquintTears,
    FaFaceKissWinkHeart,
    FaFaceSadCry,
    FaFaceSurprise,
    FaHeart,
    FaThumbsUp,
    FaFaceKiss
} from 'react-icons/fa6';

interface ChatSelectionActionBarProps {
    selectedCount: number;
    onCancel: () => void;
    onDeleteMe: () => void;
    onDeleteEveryone: () => void;
    canDeleteEveryone: boolean;
    onReact: (emoji: string) => void;
}

export function ChatSelectionActionBar({
    selectedCount,
    onCancel,
    onDeleteMe,
    onDeleteEveryone,
    canDeleteEveryone,
    onReact
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
                    {selectedCount === 1 && (
                        <div className="hidden sm:flex items-center gap-1.5 mr-4 bg-muted/40 p-1.5 rounded-full border border-border/50">
                            {[
                                { id: 'face-dizzy', icon: FaFaceDizzy },
                                { id: 'face-grin-wide', icon: FaFaceGrinWide },
                                { id: 'face-grin-hearts', icon: FaFaceGrinHearts },
                                { id: 'face-grin-squint-tears', icon: FaFaceGrinSquintTears },
                                { id: 'face-kiss-wink-heart', icon: FaFaceKissWinkHeart },
                                { id: 'face-sad-cry', icon: FaFaceSadCry },
                                { id: 'face-surprise', icon: FaFaceSurprise },
                                { id: 'heart', icon: FaHeart },
                                { id: 'thumbsup', icon: FaThumbsUp },
                                { id: 'face-kiss', icon: FaFaceKiss }
                            ].map((reaction) => (
                                <button
                                    key={reaction.id}
                                    className={`p-1.5 hover:bg-muted rounded-full transition-transform hover:scale-110`}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReact(reaction.id); }}
                                >
                                    <reaction.icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors border border-destructive/20"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {selectedCount === 1 && (
                <div className="sm:hidden absolute top-16 left-1/2 -translate-x-1/2 py-1 px-2.5 bg-background/95 backdrop-blur-md z-40 border border-border/60 shadow-lg rounded-2xl flex items-center justify-center max-w-[90vw] animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-5 gap-1">
                        {[
                            { id: 'face-dizzy', icon: FaFaceDizzy },
                            { id: 'face-grin-wide', icon: FaFaceGrinWide },
                            { id: 'face-grin-hearts', icon: FaFaceGrinHearts },
                            { id: 'face-grin-squint-tears', icon: FaFaceGrinSquintTears },
                            { id: 'face-kiss-wink-heart', icon: FaFaceKissWinkHeart },
                            { id: 'face-sad-cry', icon: FaFaceSadCry },
                            { id: 'face-surprise', icon: FaFaceSurprise },
                            { id: 'heart', icon: FaHeart },
                            { id: 'thumbsup', icon: FaThumbsUp },
                            { id: 'face-kiss', icon: FaFaceKiss }
                        ].map((reaction) => (
                            <button
                                key={reaction.id}
                                className={`p-2 hover:bg-muted rounded-full transition-transform active:scale-95`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReact(reaction.id); }}
                            >
                                <reaction.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
