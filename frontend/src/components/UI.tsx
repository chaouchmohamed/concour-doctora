import React from 'react';
import { cn } from '../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    destructive: 'bg-danger text-white hover:bg-danger/90 btn-primary',
  };

  const sizes = {
    sm: 'min-h-[36px] px-4 py-1 text-small',
    md: 'min-h-[44px] px-6 py-2',
    lg: 'min-h-[52px] px-8 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, icon, className, ...props }: InputProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-small font-medium text-text-primary block">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'input-field',
            icon && 'pl-10',
            error && 'border-danger focus:ring-danger/10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[12px] text-danger font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export const Card = ({ children, className, variant = 'default', ...props }: { children: React.ReactNode; className?: string; variant?: 'default' | 'surface' } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn(variant === 'default' ? 'card' : 'card-surface', className)} {...props}>
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'accent' }) => {
  const variants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    neutral: 'bg-muted/10 text-muted border-muted/20',
    accent: 'bg-primary-accent/10 text-primary-accent border-primary-accent/20',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[12px] font-semibold border', variants[variant])}>
      {children}
    </span>
  );
};
