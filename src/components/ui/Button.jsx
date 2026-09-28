import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-700 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  warm: 'bg-warm text-slate-900 hover:brightness-95 shadow-sm',
  teal: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 justify-center',
};

export default function Button({ variant = 'primary', size = 'md', icon: Icon, className, children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />}
      {children}
    </button>
  );
}
