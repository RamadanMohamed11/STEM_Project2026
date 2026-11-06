export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-teal text-white shadow-sm hover:bg-teal-dark hover:shadow active:bg-teal-dark active:scale-[0.99]',
  secondary:
    'border border-line-strong bg-white text-navy shadow-sm hover:bg-surface-muted hover:border-slate/40 active:bg-surface-muted active:scale-[0.99]',
  outline:
    'border border-teal text-teal hover:bg-teal-soft active:bg-teal-soft/80',
  ghost:
    'text-ink/80 hover:bg-surface-muted hover:text-navy active:bg-surface-muted/80',
}

export const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'min-h-11 px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'min-h-12 px-6 py-3 text-base rounded-xl gap-2.5',
}
