'use client';

import { useEffect } from 'react';

export function BodyClassHandler() {
    useEffect(() => {
        // Clean up any classes added by browser extensions that might cause hydration issues
        const cleanupClasses = ['vsc-initialized'];

        cleanupClasses.forEach(className => {
            if (document.body.classList.contains(className)) {
                document.body.classList.remove(className);
            }
        });

        // Add a class to indicate the app is fully hydrated
        document.body.classList.add('app-hydrated');

        return () => {
            document.body.classList.remove('app-hydrated');
        };
    }, []);

    return null;
}
