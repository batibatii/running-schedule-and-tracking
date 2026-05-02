"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { PillFieldType } from "@/types/playground";

interface GeneratorOption {
  value: string;
  label: string;
}

interface GeneratorSectionProps {
  title: string;
  fieldType: PillFieldType;
  onAddPill: (
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ) => void;
  options?: GeneratorOption[];
  inputType?: "number" | "pace";
  inputPlaceholder?: string;
  inputSuffix?: string;
}

export function GeneratorSection({
  title,
  fieldType,
  onAddPill,
  options,
  inputType,
  inputPlaceholder,
  inputSuffix,
}: GeneratorSectionProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleOptionClick = (option: GeneratorOption) => {
    onAddPill(fieldType, option.value, option.label);
    setOpen(false);
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;

    if (inputType === "number") {
      const num = parseFloat(inputValue);
      if (isNaN(num) || num <= 0) return;
      onAddPill(fieldType, num, `${num} KM`);
    } else if (inputType === "pace") {
      if (!/^\d{1,2}:\d{2}$/.test(inputValue)) return;
      onAddPill(fieldType, inputValue, inputValue);
    }

    setInputValue("");
    setOpen(false);
  };

  const handleSubmitOnKeyboardEnterEvent = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          {options ? (
            <div className="flex flex-col gap-1">
              {options.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-sm"
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleSubmitOnKeyboardEnterEvent}
                placeholder={inputPlaceholder}
                className="h-8 text-sm"
                autoFocus
              />
              {inputSuffix && (
                <span className="text-muted-foreground shrink-0 self-center text-xs">
                  {inputSuffix}
                </span>
              )}
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={handleInputSubmit}
              >
                Add
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
