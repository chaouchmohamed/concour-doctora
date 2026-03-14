import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, AlertTriangle } from 'lucide-react';
import { Button } from '../components/UI';
import { ROUTES, APP_NAME } from '../constants';
import { motion } from 'motion/react';

export const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-surface) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md relative z-10"
            >
                {/* Large 404 */}
                <div className="relative mb-8">
                    <h1 className="text-[120px] lg:text-[160px] font-bold text-primary-accent/10 leading-none select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-primary-accent/10 rounded-full flex items-center justify-center">
                            <AlertTriangle size={40} className="text-primary-accent" />
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-text-primary mb-3">Page Not Found</h2>
                <p className="text-muted mb-8 max-w-sm mx-auto">
                    The page you're looking for doesn't exist or has been moved. Check the URL or navigate back.
                </p>

                <div className="flex items-center justify-center gap-4">
                    <Link to={ROUTES.HOME}>
                        <Button variant="secondary" className="gap-2">
                            <Home size={18} /> Go Home
                        </Button>
                    </Link>
                    <Link to={ROUTES.DASHBOARD}>
                        <Button className="gap-2">
                            <LayoutDashboard size={18} /> Dashboard
                        </Button>
                    </Link>
                </div>

                <p className="mt-12 text-[12px] text-muted opacity-60">
                    {APP_NAME} • Institutional Edition
                </p>
            </motion.div>
        </div>
    );
};
