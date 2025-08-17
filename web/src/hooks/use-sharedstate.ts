import { getItem, setItem } from '@/lib/state';
import { useEffect, useState } from 'react';

export default function useSharedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        const stored = getItem(key);
        try {
            return stored !== null ? JSON.parse(stored) as T : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            setItem(key, JSON.stringify(state));
        } catch {
            //TODO: Handle storage errors
        }
    }, [key, state]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setState(JSON.parse(e.newValue) as T);
                } catch {
                    //TODO: Handle parse errors
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [state, setState];
}