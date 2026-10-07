import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/utils.ts';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-display font-extrabold tracking-tight transition-[transform,filter,background-color] duration-100 disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-white select-none',
  {
    variants: {
      variant: {
        default:
          'bg-lime text-ink shadow-[0_6px_0_#8eae12] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_3px_0_#8eae12]',
        quiet: 'bg-white/10 text-cream border border-white/15 hover:bg-white/15',
        ghost: 'bg-transparent text-cream hover:bg-white/10',
        danger:
          'bg-danger text-white shadow-[0_6px_0_#9a2e18] active:translate-y-[3px] active:shadow-[0_3px_0_#9a2e18]',
      },
      size: {
        default: 'h-12 px-4 text-base',
        lg: 'h-16 px-6 text-2xl w-full',
        icon: 'size-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

function Button({ className, variant, size, asChild = false, type = 'button', ref, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));
  if (asChild) {
    return <Slot ref={ref} className={classes} {...props} />;
  }
  return <button ref={ref} type={type} className={classes} {...props} />;
}

export { Button };
