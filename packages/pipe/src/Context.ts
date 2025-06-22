import { Observable, Subject, BehaviorSubject, filter, switchMap } from 'rxjs';

export type Context = {
    get: <T>(key: string) => Observable<T>;
    set: <T>(key: string, value: T) => void;
};

export function initializeContext(cleanup$: Observable<void>) {
    const mappedObservables = new Map<string, Subject<unknown>>();
    const contextValues$ = new Subject<[string, unknown]>();
    const contextListener$ = new BehaviorSubject(mappedObservables);

    contextValues$.subscribe(([nextKey, nextValue]) => {
        if (!mappedObservables.has(nextKey)) {
            mappedObservables.set(nextKey, new BehaviorSubject(nextValue));
        } else {
            mappedObservables.get(nextKey)!.next(nextValue);
        }
        contextListener$.next(mappedObservables);
    });

    const context: Context = {
        get: <T>(key: string) => {
            return contextListener$.pipe(
                filter((mappedObservables) => mappedObservables.has(key)),
                switchMap((mappedObservables) => {
                    return mappedObservables.get(key) as Observable<T>;
                }),
            );
        },
        set: <T>(key: string, value: T) => {
            contextValues$.next([key, value]);
        },
    };

    cleanup$.subscribe({
        complete: () => {
            contextValues$.complete();
            for (const observable of mappedObservables.values()) {
                observable.complete();
            }
        },
    });

    return { context, contextValues$ };
}
