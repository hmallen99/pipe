import {
    BehaviorSubject,
    Observable,
    Subject,
    distinctUntilChanged,
    takeUntil,
    tap,
    withLatestFrom,
} from 'rxjs';
import { PipeNode } from '../createElement';

export const Ternary = (
    bool$: Observable<boolean>,
    truthyNode: () => PipeNode,
    falsyNode: () => PipeNode
): PipeNode => {
    const cleanup$ = new Subject<void>();
    const initialNode = truthyNode();
    const node$ = new BehaviorSubject(initialNode);

    const outNode = {
        cleanup$,
        element: initialNode.element,
    };

    cleanup$.subscribe(initialNode.cleanup$);

    bool$
        .pipe(
            takeUntil(cleanup$),
            distinctUntilChanged(),
            withLatestFrom(node$),
            tap(([bool, node]) => {
                const parent = node.element.parentNode;
                node.cleanup$.next();
                node.cleanup$.complete();

                const nextNode = bool ? truthyNode() : falsyNode();
                cleanup$.subscribe(nextNode.cleanup$);
                outNode.element = nextNode.element;
                parent.appendChild(nextNode.element);

                node$.next(nextNode);
            })
        )
        .subscribe();

    return outNode;
};
