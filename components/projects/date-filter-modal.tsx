"use client";

import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProjectFilters } from "@/lib/types";

interface DateFilterModalProps {
    filters: ProjectFilters;
    onApply: (filters: Partial<ProjectFilters>) => void;
    onClear: () => void;
}

export function DateFilterModal({ filters, onApply, onClear }: DateFilterModalProps) {
    const [open, setOpen] = useState(false);
    const [dateField, setDateField] = useState<Required<ProjectFilters>["dateField"]>(
        filters.dateField || "created_at"
    );
    const [dateFrom, setDateFrom] = useState(filters.dateFrom || "");
    const [dateTo, setDateTo] = useState(filters.dateTo || "");

    // Update local state when filters change externally
    useEffect(() => {
        setDateField(filters.dateField || "created_at");
        setDateFrom(filters.dateFrom || "");
        setDateTo(filters.dateTo || "");
    }, [filters]);

    const handleApply = () => {
        onApply({
            dateField,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
        });
        setOpen(false);
    };

    const handleClear = () => {
        setDateFrom("");
        setDateTo("");
        setDateField("created_at"); // Reset to default
        onClear(); // This should clear parent state
        setOpen(false);
    };

    const applyPreset = (preset: "today" | "yesterday" | "week" | "month" | "thisMonth" | "lastMonth") => {
        const now = new Date();
        let from, to;

        switch (preset) {
            case "today":
                from = startOfDay(now);
                to = endOfDay(now);
                break;
            case "yesterday":
                const yesterday = subDays(now, 1);
                from = startOfDay(yesterday);
                to = endOfDay(yesterday);
                break;
            case "week":
                from = subDays(now, 7);
                to = endOfDay(now);
                break;
            case "month":
                from = subDays(now, 30);
                to = endOfDay(now);
                break;
            case "thisMonth":
                from = startOfMonth(now);
                to = endOfMonth(now);
                break;
            case "lastMonth":
                const lastMonth = subMonths(now, 1);
                from = startOfMonth(lastMonth);
                to = endOfMonth(lastMonth);
                break;
        }

        setDateFrom(format(from, "yyyy-MM-dd"));
        setDateTo(format(to, "yyyy-MM-dd"));
    };

    const hasActiveDateFilter = !!filters.dateFrom || !!filters.dateTo;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={hasActiveDateFilter ? "secondary" : "outline"} className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {hasActiveDateFilter ? "Date Filtered" : "Filter Date"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filter by Date</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Date Field</Label>
                        <Select
                            value={dateField}
                            onValueChange={(v) => setDateField(v as any)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">Created At</SelectItem>
                                <SelectItem value="updated_at">Updated At</SelectItem>
                                <SelectItem value="start_date">Start Date</SelectItem>
                                <SelectItem value="end_date">End Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Presets</Label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <Button variant="outline" size="sm" onClick={() => applyPreset("today")}>
                                Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => applyPreset("yesterday")}>
                                Yesterday
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => applyPreset("week")}>
                                Last 7 Days
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => applyPreset("month")}>
                                Last 30 Days
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => applyPreset("thisMonth")}>
                                This Month
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => applyPreset("lastMonth")}>
                                Last Month
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>From</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>To</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={handleClear} className="sm:mr-auto">
                        Clear Date Filter
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleApply}>Apply Filter</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
