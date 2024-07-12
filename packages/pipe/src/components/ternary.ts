import {
    BehaviorSubject,
    Observable,
    Subject,
    distinctUntilChanged,
    switchMap,
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

    node$.pipe(
        switchMap((node) => {
            return cleanup$.pipe(
                tap(() => {
                    node.cleanup$.next();
                    node.cleanup$.complete();
                })
            );
        })
    );

    bool$
        .pipe(
            takeUntil(cleanup$),
            distinctUntilChanged(),
            withLatestFrom(node$),
            tap(([bool, node]) => {
                const parent = node.element.parentNode;
                const nextNode = bool ? truthyNode() : falsyNode();

                node.cleanup$.next();
                parent.appendChild(nextNode.element);

                node$.next(nextNode);
            })
        )
        .subscribe();

    return { cleanup$, element: initialNode.element };
};
