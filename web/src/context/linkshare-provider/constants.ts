export interface LinkShareState {
    open: boolean;
    title: string;
    description: string;
    url: string;
}

export interface LinkShareContextType {
    shareLink: (title: string, description: string, url: string) => void;
    closeDialog: () => void;
}
