import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryCatalogStore } from '@/hooks/use-query-explorer';

// renders the selectable list of preset query definitions.
function QueryCatalog(): JSX.Element {
    // tracks the selected query so the active button can be highlighted.
    const { catalog, selectedQueryId, selectQuery } = useQueryCatalogStore();

    return (
        <Card>
            <CardHeader className="gap-1">
                <CardTitle className="text-2xl">Queries</CardTitle>
                <CardDescription>
                    Select one query from preset list.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* keeps the long query list scrollable within the side panel. */}
                <ScrollArea className="h-[640px] pr-4">
                    <div className="space-y-3">
                        {/* each catalog item becomes a button that changes the active query. */}
                        {catalog.map((query) => (
                            <Button
                                key={query.id}
                                type="button"
                                variant={selectedQueryId === query.id ? 'secondary' : 'ghost'}
                                size="lg"
                                className="h-auto w-full cursor-pointer justify-start whitespace-normal border border-transparent px-4 py-4 text-left hover:border-border hover:bg-accent hover:shadow-sm"
                                onClick={() => selectQuery(query.id)}
                            >
                                <div className="flex w-full flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">Query {query.number}</span>
                                    </div>
                                    <span
                                        className="text-base font-semibold text-foreground"
                                    >
                                        {query.title}
                                    </span>
                                    <p className="text-sm leading-6 text-muted-foreground">{query.summary}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export { QueryCatalog };
