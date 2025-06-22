import {
    Observable,
    Subject,
    BehaviorSubject,
    filter,
    switchMap,
    concat,
    concatMap,
    from,
} from 'rxjs';

export type Context = {
    get: <T>(key: string) => Observable<T>;
    set: <T>(key: string, value: T) => void;
};

export function initializeContext(cleanup$: Observable<void>) {
    const mappedObservables = new Map<string, BehaviorSubject<unknown>>();
    const contextValueSubject = new Subject<[string, unknown]>();
    const contextListener$ = new BehaviorSubject(mappedObservables);
    const contextValueReplay$ = concat(
        contextListener$.pipe(
            concatMap((mappedObservables) => {
                const latestValues = Array.from(mappedObservables.entries()).map(
                    ([key, obs]) => [key, obs.value] as [string, unknown],
                );
                return from(latestValues);
            }),
        ),
        contextValueSubject,
    );

    contextValueSubject.subscribe(([nextKey, nextValue]) => {
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
            contextValueSubject.next([key, value]);
        },
    };

    cleanup$.subscribe({
        complete: () => {
            contextValueSubject.complete();
            for (const observable of mappedObservables.values()) {
                observable.complete();
            }
        },
    });

    return { context, contextValueReplay$, contextValueSubject };
}
