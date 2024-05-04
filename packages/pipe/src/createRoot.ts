import { Component, createElement } from './createElement';
import { Observable, Subject } from 'rxjs';

export const createRoot = (
    container: HTMLElement,
    component: Component<{ render$: Observable<void> }>
) => {
    const render$ = new Subject<void>();
    const element = createElement(component, { render$ });
    container.appendChild(element);

    return {
        render: () => {
            render$.next();
        },
        unmount: () => {
            render$.complete();
        },
    };
};
