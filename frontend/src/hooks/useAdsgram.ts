import { useCallback, useEffect, useRef } from 'react';

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

    useEffect(() => {
        if ((window as any).Adsgram && blockId) {
            adControllerRef.current = (window as any).Adsgram.init({ blockId });
        }
    }, [blockId]);

    const showAd = useCallback(async () => {
        if (adControllerRef.current) {
            try {
                const result: ShowPromiseResult = await adControllerRef.current.show();
                if (result.done) {
                    onReward();
                } else {
                    // Ad was skipped or failed to render
                    if (onError) onError(result);
                }
            } catch (err: any) {
                // Network error or script blocked
                if (onError) onError(err);
                else console.error('Adsgram', err);
            }
        } else {
            if (onError) onError({ error: true, done: false, state: 'load', description: 'Adsgram not initialized' });
        }
    }, [onReward, onError, blockId]);

    return showAd;
}
