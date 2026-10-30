import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div
        ref={containerRef}
        className={cn('relative inline-block text-left', open ? 'z-50' : '')}
        data-dropdown-open={open ? 'true' : undefined}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = React.useContext(DropdownContext);
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setOpen(!open);
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = 'right',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  const { open } = React.useContext(DropdownContext);
  if (!open) return null;

  const alignClass =
    align === 'left' ? 'left-0 origin-top-left' :
    align === 'center' ? 'left-1/2 -translate-x-1/2 origin-top' :
    'right-0 origin-top-right';

  return (
    <div
      className={cn(
        'absolute z-50 mt-1.5 min-w-[190px] rounded-xl border border-border/90 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 focus:outline-none',
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  destructive = false,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  destructive?: boolean;
}) {
  const { setOpen } = React.useContext(DropdownContext);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors select-none text-left',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border/60" />;
}
