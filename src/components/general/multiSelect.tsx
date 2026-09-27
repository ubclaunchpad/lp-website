"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/helpers";

// Matches max-h-80 on the listbox
const MAX_DROPDOWN_HEIGHT = 320;
// Matches the h-10 option rows
const OPTION_HEIGHT = 40;
// Gap between the trigger and the listbox, plus breathing room from the edge
const DROPDOWN_GAP = 4;
const EDGE_PADDING = 8;

type Placement = { openUp: boolean; maxHeight: number };

// Returns the visible area the dropdown can occupy: the viewport, narrowed by
// every ancestor that clips overflow (e.g. a scrolling dialog body).
function getVisibleBounds(element: HTMLElement) {
  let top = 0;
  let bottom = window.innerHeight;
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY !== "visible") {
      const rect = parent.getBoundingClientRect();
      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
    }
    parent = parent.parentElement;
  }
  return { top, bottom };
}

function computePlacement(trigger: HTMLElement, optionCount: number): Placement {
  const rect = trigger.getBoundingClientRect();
  const bounds = getVisibleBounds(trigger);
  const spaceBelow = bounds.bottom - rect.bottom - DROPDOWN_GAP - EDGE_PADDING;
  const spaceAbove = rect.top - bounds.top - DROPDOWN_GAP - EDGE_PADDING;
  const desiredHeight = Math.min(
    MAX_DROPDOWN_HEIGHT,
    optionCount * OPTION_HEIGHT + 2,
  );
  const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
  const available = openUp ? spaceAbove : spaceBelow;
  return {
    openUp,
    maxHeight: Math.max(OPTION_HEIGHT, Math.min(MAX_DROPDOWN_HEIGHT, available)),
  };
}

function OptionsDropdown({
  options,
  value,
  onChange,
  allowMultiple,
  onClose,
  listboxId,
  placement,
}: {
  options: Record<string, string>[];
  value: (string | number)[];
  onChange: (value: string[]) => void;
  allowMultiple: boolean;
  onClose: () => void;
  listboxId: string;
  placement: Placement;
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (activeIndex >= 0) {
      const activeItem = listRef.current?.children[activeIndex] as HTMLElement;
      activeItem?.focus();
    }
  }, [activeIndex]);

  return (
    <ul
      id={listboxId}
      ref={listRef}
      role="listbox"
      aria-label="Options"
      aria-multiselectable={allowMultiple}
      tabIndex={-1}
      style={{ maxHeight: placement.maxHeight }}
      className={cn(
        "absolute border border-background-500 w-full",
        placement.openUp ? "bottom-full mb-1" : "top-full mt-1",
        "overflow-y-auto overflow-x-hidden bg-background-700 flex flex-col rounded shadow-lg transform z-50",
      )}
    >
      {options.map((option, index) => (
        <li
          key={index}
          role="option"
          tabIndex={0}
          aria-selected={value?.includes(option.value)}
          className={cn(
            "flex items-center h-10 flex-shrink-0 gap-2  p-2 outline-none :not(:first) border-t border-background-500",
            value?.includes(option.value)
              ? "bg-lp-500"
              : "hover:bg-background-800 bg-opacity-45",
            "focus:ring-2 focus:ring-lp-500",
          )}
          onClick={() => {
            if (!allowMultiple) {
              if (value?.includes(option.value)) {
                onChange([]);
                onClose();
                return;
              }
              onChange([option.value]);
              onClose();
              return;
            }
            if (value?.includes(option.value)) {
              onChange(value.filter((value) => value !== option.value));
            } else {
              onChange([...(value || []), option.value]);
            }
          }}
          onKeyDown={(e) => {
            switch (e.key) {
              case "Enter":
              case " ":
                e.preventDefault();
                if (!allowMultiple) {
                  if (value?.includes(option.value)) {
                    onChange([]);
                    onClose();
                    return;
                  }
                  onChange([option.value]);
                  onClose();
                  return;
                }
                if (value?.includes(option.value)) {
                  onChange(value.filter((value) => value !== option.value));
                } else {
                  onChange([...(value || []), option.value]);
                }
                break;
              case "ArrowDown":
                e.preventDefault();
                setActiveIndex(Math.min(index + 1, options.length - 1));
                break;
              case "ArrowUp":
                e.preventDefault();
                setActiveIndex(Math.max(index - 1, 0));
                break;
              case "Escape":
                e.preventDefault();
                onClose();
                break;
            }
          }}
        >
          <span className="w-6">
            {value?.includes(option.value) ? "✓" : ""}
          </span>
          <span>{option.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MultiSelect({
  options,
  value,
  onChange,
  allowMultiple = false,
  emptyText = "Choose",
  className,
  chipClassName,
  compact = false,
  onBlur,
}: {
  value: (string | number)[];
  options: Record<string, string>[];
  onChange: (value: string[]) => void;
  allowMultiple: boolean;
  className?: string;
  chipClassName?: string;
  // Denser trigger for use inside table cells
  compact?: boolean;
  emptyText?: string;
  onBlur?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOptions = options.filter((option) => {
    if (value === null) return false;
    if (Array.isArray(value)) return value.includes(option.value);
    return value === option.value;
  });

  const listboxId = "multiselect-listbox";
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement>({
    openUp: false,
    maxHeight: MAX_DROPDOWN_HEIGHT,
  });

  // Measure before paint so the listbox never flashes on the wrong side
  useLayoutEffect(() => {
    if (isOpen && ref.current) {
      setPlacement(computePlacement(ref.current, options.length));
    }
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen && onBlur) {
      onBlur();
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={ref}>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
        ></div>
      )}

      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          "flex border border-background-600 bg-background-700 items-center min-h-11 rounded p-2 gap-2 w-full",
          compact && "min-h-8 px-1.5 py-1 text-xs",
          className,
          isOpen && "border border-background-500 border-solid",
        )}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="text-white justify-center flex items-center gap-2">
          {selectedOptions !== [null] &&
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className={cn("p-0.5 px-2 rounded bg-lp-500", chipClassName)}
              >
                {option.label}
              </span>
            ))}
          <span
            className={cn("text-background-200", compact ? "text-xs" : "text-sm")}
          >
            {selectedOptions.length === 0 && emptyText}
          </span>
        </span>
      </button>

      {isOpen && (
        <OptionsDropdown
          options={options}
          value={value}
          onChange={onChange}
          allowMultiple={allowMultiple}
          onClose={() => setIsOpen(false)}
          listboxId={listboxId}
          placement={placement}
        />
      )}
    </div>
  );
}
