import { Play } from 'lucide-react';
import type { ChangeEvent, FormEvent, JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryFormStore } from '@/hooks/use-query-explorer';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { runSelectedQuery } from '@/stores/query-explorer';

// renders the parameter form for the selected preset query.
function QueryFormCard(): JSX.Element {
    // reads the selected query, editable params, and run status from the store.
    const { queryTitle, querySummary, selectedQuery, formValues, statusText, isRunning, updateFormValue } =
        useQueryFormStore();

    // updates the parameter matching the changed input name.
    function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
        const { name, value } = event.currentTarget;
        updateFormValue(name, value);
    }

    // keeps submission in react and starts the selected stored procedure.
    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        void runSelectedQuery();
    }

    return (
        <Card>
            <CardHeader>
                <div className="space-y-4">
                    <div>
                        <CardTitle className="text-2xl">{queryTitle}</CardTitle>
                        <CardDescription className="mt-2 max-w-3xl leading-6">{querySummary}</CardDescription>
                    </div>
                    <Separator />
                </div>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* creates inputs from catalog metadata so each query can differ. */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {selectedQuery?.inputs.map((input) => (
                            <label key={input.name} className="space-y-2">
                                <span className="text-sm font-medium">{input.label}</span>
                                <Input
                                    id={input.name}
                                    name={input.name}
                                    type={input.type}
                                    value={formValues[input.name] ?? String(input.default)}
                                    onChange={handleInputChange}
                                    className="h-10"
                                />
                            </label>
                        ))}
                    </div>

                    {/* shows current status beside the disabled-aware run button. */}
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

export { QueryFormCard };
