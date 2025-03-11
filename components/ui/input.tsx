'use client'
import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onEnterPress?: (value: string) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onEnterPress, ...props }, ref) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputValue = (e.target as HTMLInputElement).value;
        onEnterPress?.(inputValue);
      }
    };

    return (
      <div className="relative flex items-center">
        <input
          type={type}
          className={cn(
            "flex h-20 w-[600px] rounded-md border border-input bg-background px-3 py-2 text-xl ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          onKeyDown={handleKeyPress}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }