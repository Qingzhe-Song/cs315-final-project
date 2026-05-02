import { Play } from 'lucide-react';
import type { ChangeEvent, FormEvent, JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCustomQueryFormStore } from '@/hooks/use-query-explorer';
import { runCustomQuery } from '@/stores/query-explorer';

// shared select styling keeps the custom sort control aligned with inputs.
const selectClassName =
    'h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

// renders the custom query form for ad hoc game filtering.
function CustomQueryCard(): JSX.Element {
    // pulls form values and query status from the central query store.
    const { customFormValues, statusText, isRunning, updateCustomFormValue } = useCustomQueryFormStore();

    // writes every input change back to the matching form field name.
    function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
        const { name, value } = event.currentTarget;
        updateCustomFormValue(name, value);
    }

    // prevents browser navigation and starts the custom query request.
    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        void runCustomQuery();
    }

    return (
        <Card>
            <CardHeader>
                <div className="space-y-4">
                    {/* identifies this card as the custom query builder. */}
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-primary">
                            <span className="text-xs font-medium uppercase tracking-wide">Custom Query</span>
                        </div>
                        <CardTitle className="text-2xl">Build a Custom Query</CardTitle>
                    </div>
                    <Separator />
                </div>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* groups all custom filters in a responsive grid. */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="space-y-2">
                            <span className="text-sm font-medium">Title Contains</span>
                            <Input
                                name="title_keyword"
                                value={customFormValues.title_keyword}
                                onChange={handleInputChange}
                                placeholder="optional"
                                className="h-10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">Genre Contains</span>
                            <Input
                                name="genre_keyword"
                                value={customFormValues.genre_keyword}
                                onChange={handleInputChange}
                                placeholder="optional"
                                className="h-10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">Earliest Release Year</span>
                            <Input
                                name="min_release_year"
                                type="number"
                                value={customFormValues.min_release_year}
                                onChange={handleInputChange}
                                className="h-10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">Maximum Price</span>
                            <Input
                                name="max_price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={customFormValues.max_price}
                                onChange={handleInputChange}
                                placeholder="optional"
                                className="h-10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">Minimum Reviews</span>
                            <Input
                                name="min_reviews"
                                type="number"
                                min="0"
                                value={customFormValues.min_reviews}
                                onChange={handleInputChange}
                                className="h-10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">Sort By</span>
                            <select
                                name="sort_by"
                                value={customFormValues.sort_by}
                                onChange={handleInputChange}
                                className={selectClassName}
                            >
                                <option value="reviews">Most Reviews</option>
                                <option value="recommendation">Best Recommendation %</option>
                                <option value="recent">Newest Release</option>
                                <option value="price">Lowest Price</option>
                            </select>
                        </label>

                        {/* caps result size before the value is sent to the backend. */}
                        <label className="space-y-2">
                            <span className="text-sm font-medium">Rows to Show</span>
                            <Input
                                name="limit"
                                type="number"
                                min="1"
                                max="100"
                                value={customFormValues.limit}
                                onChange={handleInputChange}
                                className="h-10"
                            />
                        </label>
                    </div>

                    {/* status text and submit action share the bottom row. */}
                    <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium">Status</p>
                            <p className="mt-1 text-sm text-muted-foreground">{statusText}</p>
                        </div>
                        <Button type="submit" disabled={isRunning}>
                            <Play className="size-4" />
                            {isRunning ? 'Running...' : 'Run Query'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export { CustomQueryCard };
