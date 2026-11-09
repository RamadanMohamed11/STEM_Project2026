export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-dark text-white shadow-sm hover:bg-teal-dark hover:shadow-md hover:-translate-y-0.5 active:bg-teal-dark active:translate-y-0 active:scale-[0.98] transition-all duration-150 ease-out',
  secondary:
    'border border-line-strong bg-white text-navy shadow-sm hover:bg-surface-muted hover:border-slate/40 hover:shadow-md hover:-translate-y-0.5 active:bg-surface-muted active:translate-y-0 active:scale-[0.98] transition-all duration-150 ease-out',
  outline:
    'border border-teal text-teal-dark hover:bg-teal-soft hover:-translate-y-0.5 active:bg-teal-soft/80 active:translate-y-0 active:scale-[0.98] transition-all duration-150 ease-out',
  ghost:
    'text-ink/80 hover:bg-surface-muted hover:text-navy active:bg-surface-muted/80 active:scale-[0.98] transition-all duration-150 ease-out',
}

export const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-11 sm:min-h-9 px-3.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'min-h-11 px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'min-h-12 px-6 py-3 text-base rounded-xl gap-2.5',
}
