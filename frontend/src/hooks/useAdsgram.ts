import { useCallback, useEffect, useRef, useState } from 'react';

export interface ShowPromiseResult {
    done: boolean; 
    description: string;
    state: 'load' | 'render' | 'playing' | 'destroy';
    error: boolean;
}

interface UseAdsgramProps {
    blockId: string;
    onReward: () => void;
    onError?: (result: ShowPromiseResult) => void;
}

export function useAdsgram({ blockId, onReward, onError }: UseAdsgramProps) {
    const adControllerRef = useRef<any>(undefined);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if ((window as any).Adsgram && blockId) {
            adControllerRef.current = (window as any).Adsgram.init({ blockId });
            setIsReady(true);
        } else {
            setIsReady(false);
        }
    }, [blockId]);

    const showAd = useCallback(async () => {
        if (adControllerRef.current) {
            setIsLoading(true);
            try {
                const result: ShowPromiseResult = await adControllerRef.current.show();
                if (result.done) {
                    onReward();
                } else {
                    if (onError) onError(result);
                }
            } catch (err: any) {
                if (onError) onError(err);
                else console.error('Adsgram Error:', err);
            } finally {
                setIsLoading(false);
            }
        } else {
            const errorResult: ShowPromiseResult = { 
                error: true, 
                done: false, 
                state: 'load', 
                description: 'Adsgram not initialized' 
            };
            if (onError) onError(errorResult);
            else console.error('Adsgram not initialized');
        }
    }, [onReward, onError, blockId]);

    return { showAd, isReady, isLoading };
}
