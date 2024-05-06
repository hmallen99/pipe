import { Subject } from 'rxjs';
import { PipeNode } from './createElement';

export const createRoot = (container: HTMLElement) => {
    let prevCleanup$: Subject<void> | null = null;

    return {
        render: (node: PipeNode) => {
            prevCleanup$?.next();
            prevCleanup$?.complete();
            const { element, cleanup$ } = node;
            prevCleanup$ = cleanup$;
            container.appendChild(element);
        },
        unmount: () => {
            prevCleanup$.next();
            prevCleanup$.complete();
        },
    };
};
