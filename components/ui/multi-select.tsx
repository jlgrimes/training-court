"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface MultiSelectProps {
  options?: { label: string; value: string; icon?: React.ReactNode }[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  className,
  isLoading = false,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (value.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "grid h-10 w-full items-center rounded-md border border-input bg-background text-sm",
            "[grid-template-columns:minmax(0,1fr)_auto_auto]",
            "focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:bg-transparent hover:text-accent-foreground"
          )}
          disabled={disabled}
          aria-expanded={open}
        >
        <div className="flex justify-between flex-1 overflow-hidden">
            <div
              className="flex gap-1 flex-1 py-2 px-3 overflow-x-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "hsl(var(--border)) transparent",
              }}
            >
              {value.length === 0 ? (
                <span className="truncate">
                  {placeholder}
                </span>
              ) : (
                value.map((item) => {
                  const option = options?.find((opt) => opt.value === item);
                  return (
                    <>
                        <Badge key={item} variant="default" className="text-xs flex-nowrap inline-flex items-center">
                        {option?.icon}
                        <span className="whitespace-nowrap">{option?.label}</span>
                        <span
                            role="button"
                            tabIndex={0}
                            className="ml-1 hover:bg-destructive transition-all hover:text-destructive-foreground rounded-full p-0.5"
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleUnselect(item)
                            }
                            onClick={() => handleUnselect(item)}
                            >
                            <X className="h-3 w-3" />
                        </span>
                        </Badge>
                    </>
                  );
                })
              )}
            </div>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
              tabIndex={0}
              className={cn(
                "p-1 mx-1.5 my-auto h-full outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:bg-transparent rounded-sm cursor-pointer"
              )}
            >
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandList>
              <CommandEmpty className="p-0">
                {isLoading ? (
                  <div className="p-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-4 w-full mb-1 last:mb-0"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm py-4 text-muted-foreground">
                    No items found.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {options?.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option?.icon}
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}