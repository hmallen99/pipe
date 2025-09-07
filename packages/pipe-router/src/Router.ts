import { BehaviorSubject, Component, createElement, PipeNode } from '@hmallen99/pipe';

export type Routes = Record<string, Component<Record<string, unknown>>>;
export type NavigationContext = {
    navigateTo: (newPage: string) => void;
};
export const NavigationContextKey = 'navigationContext';
const PAGE_KEY = 'default';

export const Router: Component<{ routes: Routes; id: string; defaultRoute?: string }> = (
    { routes, id, defaultRoute = '/' },
    cleanup$,
    context,
) => {
    const initialPage = window.history.state?.page ?? defaultRoute;
    if (window.history.state === null || !window.history.state.page) {
        window.history.replaceState({ page: initialPage }, '', initialPage);
    }

    const selectedRoute$ = new BehaviorSubject<[string, PipeNode]>([
        PAGE_KEY,
        createElement(routes[initialPage], {}),
    ]);

    const navigateTo = (newPage: string) => {
        selectedRoute$.next([PAGE_KEY, createElement(routes[newPage], {})]);
        history.pushState({ page: newPage }, '', `${newPage}`);
    };

    const popStateListener = (event: PopStateEvent) => {
        if (event.state.page) {
            navigateTo(event.state.page);
        } else {
            navigateTo(defaultRoute);
        }
    };

    window.addEventListener('popstate', popStateListener);

    cleanup$.subscribe({
        complete: () => {
            window.removeEventListener('popstate', popStateListener);
        },
    });

    context.set(NavigationContextKey, { navigateTo });

    return createElement('div', { id, className: 'pipe-router-container' }, selectedRoute$);
};
