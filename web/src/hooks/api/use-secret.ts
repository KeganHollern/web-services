import { useEffect, useState, useRef } from 'react';
import { fetchSecret } from '@/api/secret'; // Adjust path as needed
import { decryptSecret } from '@/lib/crypto'; // Adjust path as needed

interface UseSecretResult {
    content: string | null;
    error: string | null;
    isLoading: boolean;
}

export function useSecret(id: string, hash: string): UseSecretResult {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) {
            console.debug('Skipping duplicate API call');
            return;
        }

        if (!hash || hash === '#') {
            setError('Missing or invalid decryption key');
            setIsLoading(false);
            return;
        }

        const key = hash.slice(1);
        hasFetched.current = true;

        fetchSecret(id)
            .then(encrypted => {
                const decrypted = decryptSecret(encrypted, key);
                setContent(decrypted);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [id, hash]);

    return { content, error, isLoading };
}