import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-screen flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                {/* Background Image with Overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
                    style={{ backgroundImage: 'url("/images/auth-bg.png")' }}
                >
                    <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px]" />
                </div>
                
                <div className="relative z-20 flex items-center justify-between">
                    <Link href={home()} className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
                    </Link>
                    
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-1">
                            Platform
                        </span>
                        <h2 className="text-xl font-black tracking-tight text-white uppercase">
                            {name}
                        </h2>
                    </div>
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2 border-l-2 border-primary/50 pl-6">
                        <p className="text-lg font-medium italic leading-relaxed text-zinc-200">
                            &ldquo;Ensuring operational excellence and system reliability through 
                            proactive monitoring and strategic outage planning.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                            Corporate Infrastructure Management
                        </footer>
                    </blockquote>
                </div>
            </div>
            
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden mb-4"
                    >
                        <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
                    </Link>
                    
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="text-base text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {children}
                    </div>
                    
                    <p className="px-8 text-center text-xs text-muted-foreground">
                        By clicking continue, you agree to our{' '}
                        <a href="#" className="underline underline-offset-4 hover:text-primary">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="underline underline-offset-4 hover:text-primary">
                            Privacy Policy
                        </a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
