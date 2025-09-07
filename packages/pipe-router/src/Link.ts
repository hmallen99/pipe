import { Component, createElement, map } from '@hmallen99/pipe';
import { NavigationContext, NavigationContextKey } from './Router';

export const Link: Component<{ url: string; id: string }> = ({ url, id }, _, context) => {
    const navigationContext$ = context.get(NavigationContextKey);

    const click$ = navigationContext$.pipe(
        map<NavigationContext, () => void>(({ navigateTo }) => {
            return () => {
                navigateTo(url);
            };
        }),
    );

    return createElement('button', {
        id,
        className: 'pipe-router-link',
        onclick: click$,
    });
};
