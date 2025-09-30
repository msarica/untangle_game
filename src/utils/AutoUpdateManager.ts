/**
 * AutoUpdateManager handles automatic PWA updates without user interaction
 */
export class AutoUpdateManager {
    private registration: ServiceWorkerRegistration | null = null;
    private updateCheckInterval: number | null = null;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');

                // Check for updates immediately
                await this.checkForUpdates();

                // Listen for service worker updates
                this.registration.addEventListener('updatefound', () => {
                    console.log('New service worker found, updating automatically...');
                    this.handleUpdateFound();
                });

                // Listen for controller changes (when new SW takes control)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('Service worker controller changed, reloading page...');
                    window.location.reload();
                });

                // Set up periodic update checks (every 5 minutes)
                this.startPeriodicUpdateChecks();

                // Check for updates when the app becomes visible again
                document.addEventListener('visibilitychange', async () => {
                    if (!document.hidden) {
                        try {
                            await this.checkForUpdates();
                        } catch (error) {
                            console.error('Failed to check for updates on visibility change:', error);
                        }
                    }
                });

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    private handleUpdateFound(): void {
        if (!this.registration) return;

        const newWorker = this.registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New content is available - update automatically
                    console.log('New version available, applying update automatically...');
                    this.applyUpdate();
                } else {
                    // Content is cached for the first time
                    console.log('Content is cached for offline use');
                }
            }
        });
    }

    private async applyUpdate(): Promise<void> {
        if (!this.registration) return;

        const newWorker = this.registration.waiting;
        if (newWorker) {
            // Tell the new service worker to skip waiting and take control
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    public async checkForUpdates(): Promise<boolean> {
        if (!this.registration) return false;

        try {
            await this.registration.update();
            return true;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return false;
        }
    }

    private startPeriodicUpdateChecks(): void {
        // Check for updates every 5 minutes
        this.updateCheckInterval = window.setInterval(async () => {
            try {
                await this.checkForUpdates();
            } catch (error) {
                console.error('Failed to check for updates:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    public destroy(): void {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
    }

    public getCurrentVersion(): string {
        // Return the version from the service worker cache name
        return this.registration ? 'current' : 'unknown';
    }
}
