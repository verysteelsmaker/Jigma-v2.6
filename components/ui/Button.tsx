import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 active:scale-95 duration-200";
  
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm",
    destructive: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 hover:border-red-500 hover:text-red-500 dark:hover:text-red-400",
    outline: "border border-neutral-200 bg-transparent hover:bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800",
    ghost: "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    icon: "h-9 w-9",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;