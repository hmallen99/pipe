import { Observable, merge } from 'rxjs';

export type Component<Props extends Record<string, Observable<unknown>>> = (
    props: Props
) => HTMLElement;

export function createElement<
    Props extends Record<string, Observable<unknown>>,
>(
    component: Component<Props> | string,
    props: Props,
    children?: HTMLElement[]
) {
    let element: HTMLElement;

    if (typeof component === 'string') {
        element = document.createElement(component);
        for (const [key, obs$] of Object.entries(props)) {
            obs$.subscribe((value) => {
                element[key] = value;
            });
        }
    } else {
        element = component(props);
    }

    if (children) {
        for (const child of children) {
            element.appendChild(child);
        }
    }

    merge(Object.values(props)).subscribe({
        complete: () => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            } else {
                document.removeChild(element);
            }
        },
    });

    return element;
}
