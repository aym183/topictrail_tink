'use client'
import * as React from "react"
import { cn } from "@/lib/utils"
import { BackendHandler} from "@/app/backend-handler"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onEnterPress?: (nodes: any[], edges: any[]) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onEnterPress, ...props }, ref) => {
    const handleKeyPress = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputValue = (e.target as HTMLInputElement).value;
        const response = await BackendHandler.processUserInput(inputValue);

        if (response.success) {
          const branchId = sessionStorage.getItem('branch_id');
          if (branchId) {
            const { nodes, edges } = await BackendHandler.fetchNodesAndEdges(branchId);
            onEnterPress?.(nodes, edges);
          }
        }
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
        {/* <button 
          className="absolute right-2 h-10 px-4 rounded-md bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800/30 hover:border-gray-400 transition-colors duration-200"
          onClick={async () => {
            if (ref && typeof ref === 'object' && 'current' in ref && ref.current) {
              const inputValue = ref.current.value;
              const response = await BackendHandler.processUserInput(inputValue);

              if (response.success) {
                const branchId = sessionStorage.getItem('branch_id');
                if (branchId) {
                  const { nodes, edges } = await BackendHandler.fetchNodesAndEdges(branchId);
                  onEnterPress?.(nodes, edges);
                }
              }
            }
          }}
        >
          Go
        </button> */}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }