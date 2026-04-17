import { Gauge } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryCatalogStore } from '@/hooks/use-query-explorer';
import { cn } from '@/lib/utils';

function QueryCatalog(): JSX.Element {
    const { catalog, selectedQueryId, selectQuery } = useQueryCatalogStore();
    const queryCountLabel = catalog.length === 1 ? '1 preset query' : `${catalog.length} preset queries`;

    return (
        <Card>
            <CardHeader className="gap-1">
                <CardTitle className="text-2xl">Queries</CardTitle>
                <CardDescription>
                    Select one query from your preset list. {queryCountLabel}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[640px] pr-4">
                    <div className="space-y-3">
                        {catalog.map((query) => (
                            <Button
                                key={query.id}
                                type="button"
                                variant={selectedQueryId === query.id ? 'secondary' : 'ghost'}
                                size="lg"
                                className={cn(
                                    'h-auto w-full justify-start whitespace-normal px-4 py-4 text-left'
                                )}
                                onClick={() => selectQuery(query.id)}
                            >
                                <div className="flex w-full flex-col gap-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">Query {query.number}</span>
                                        <Gauge className="size-4 text-muted-foreground" />
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
