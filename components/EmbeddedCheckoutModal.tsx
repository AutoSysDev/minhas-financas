import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface EmbeddedCheckoutModalProps {
    clientSecret: string;
    onClose: () => void;
}

// Module-level cache to handle Strict Mode and race conditions
// This ensures we only create one checkout instance per clientSecret
const checkoutCache = new Map<string, {
    promise: Promise<any>;
    checkout: any | null;
    timeout: any;
    refCount: number;
}>();

export const EmbeddedCheckoutModal: React.FC<EmbeddedCheckoutModalProps> = ({ clientSecret, onClose }) => {
    const checkoutRef = useRef<HTMLDivElement>(null);
    const stripeRef = useRef<any>(null);

    useEffect(() => {
        if (!clientSecret || !checkoutRef.current) return;

        let cacheEntry = checkoutCache.get(clientSecret);

        if (!cacheEntry) {
            // Initialize new entry
            cacheEntry = {
                promise: (async () => {
                    // @ts-ignore
                    if (!window.Stripe) {
                        console.error("Stripe.js not loaded");
                        throw new Error("Stripe.js not loaded");
                    }
                    const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
                    if (!publishableKey) {
                        console.error("VITE_STRIPE_PUBLIC_KEY missing");
                        throw new Error("VITE_STRIPE_PUBLIC_KEY missing");
                    }
                    // @ts-ignore
                    const stripe = window.Stripe(publishableKey);
                    return stripe.initEmbeddedCheckout({ clientSecret });
                })(),
                checkout: null,
                timeout: null,
                refCount: 0
            };
            checkoutCache.set(clientSecret, cacheEntry);

            // Store the resolved checkout instance
            cacheEntry.promise.then(co => {
                if (cacheEntry) cacheEntry.checkout = co;
            }).catch(e => {
                console.error("Failed to init checkout:", e);
                // Remove from cache on error so we can retry
                checkoutCache.delete(clientSecret);
            });
        }

        // Cancel any pending destruction (Strict Mode handling)
        if (cacheEntry.timeout) {
            clearTimeout(cacheEntry.timeout);
            cacheEntry.timeout = null;
        }

        cacheEntry.refCount++;

        // Mount when ready
        let mounted = true;
        cacheEntry.promise.then(checkout => {
            if (mounted && checkoutRef.current) {
                try {
                    checkout.mount(checkoutRef.current);
                    stripeRef.current = checkout;
                } catch (e) {
                    console.error("Error mounting checkout:", e);
                }
            }
        });

        return () => {
            mounted = false;
            stripeRef.current = null;

            if (cacheEntry) {
                cacheEntry.refCount--;
                if (cacheEntry.refCount === 0) {
                    // Delay destruction slightly to allow for immediate remount (React Strict Mode)
                    cacheEntry.timeout = setTimeout(() => {
                        cacheEntry!.promise.then(checkout => {
                            try {
                                checkout.destroy();
                            } catch (e) {
                                console.warn("Error destroying checkout:", e);
                            }
                            checkoutCache.delete(clientSecret);
                        });
                    }, 500);
                }
            }
        };
    }, [clientSecret]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1A1F2C] rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col relative border border-gray-800 shadow-2xl">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1A1F2C] shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Icon name="lock" className="text-teal-400" />
                        Checkout Seguro
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-[#1A1F2C]" id="checkout-container">
                    <div ref={checkoutRef} className="w-full" />
                </div>
            </div>
        </div>
    );
};
