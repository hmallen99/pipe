import { endWith, pairwise, startWith, Subject } from 'rxjs';
import { PipeNode } from './createElement';

export const createRoot = (container: HTMLElement) => {
    const node$ = new Subject<PipeNode>();

    node$.pipe(startWith(null), endWith(null), pairwise()).subscribe(([previousNode, nextNode]) => {
        if (previousNode) {
            previousNode.cleanup$.next();
            previousNode.cleanup$.complete();
        }

        if (nextNode) {
            container.appendChild(nextNode.element);
        }
    });

    return {
        render: (node: PipeNode) => {
            node$.next(node);
        },
        unmount: () => {
            node$.complete();
        },
    };
};
