import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Link2, Copy, Check, Twitter, Linkedin,
    MessageCircle, Globe, Share2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const OVERLAY = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const MODAL = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 260 } },
    exit: { opacity: 0, scale: 0.94, y: 10, transition: { duration: 0.18 } }
};

export default function ShareModal({ isOpen, onClose, url, title, description, type = 'project', onGenerateCard }) {
    const [copied, setCopied] = useState(false);
    const shareUrl = url || window.location.href;
    const shareTitle = title || 'Check this out on Codeptor';
    const shareText = description || 'Found something amazing on Codeptor!';

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error('Could not copy link');
        }
    }, [shareUrl]);

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
                onClose();
            } catch { }
        }
    };

    const socials = [
        {
            name: 'Twitter / X',
            icon: Twitter,
            color: '#000',
            bg: '#f0f0f0',
            hover: '#e2e2e2',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            color: '#0A66C2',
            bg: '#e8f0fc',
            hover: '#d1e3f8',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: '#25D366',
            bg: '#e6faf0',
            hover: '#d0f2e0',
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[998] flex items-center justify-center p-4"
                    variants={OVERLAY}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
                        variants={MODAL}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Gradient strip based on type */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${type === 'profile'
                            ? 'from-pink-500 via-rose-500 to-orange-400'
                            : 'from-blue-600 via-indigo-600 to-violet-500'}`} />

                        <div className="p-7">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${type === 'profile'
                                        ? 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-rose-200'
                                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'}`}>
                                        {type === 'profile' ? <Sparkles className="w-6 h-6 text-white" /> : <Globe className="w-6 h-6 text-white" />}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-900 text-lg tracking-tight">Share {type === 'profile' ? 'Profile' : 'Project'}</h3>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{type === 'profile' ? 'Your identity' : 'Your creation'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all hover:rotate-90"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Designer Card CTA - High Impact */}
                            {onGenerateCard && (
                                <motion.button
                                    onClick={() => {
                                        onClose();
                                        onGenerateCard();
                                    }}
                                    className="w-full relative group mb-8 overflow-hidden rounded-[2rem] p-6 transition-all"
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Animated background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${type === 'profile'
                                        ? 'from-rose-600 via-pink-600 to-orange-500 group-hover:from-rose-500 group-hover:via-pink-500 group-hover:to-orange-400'
                                        : 'from-blue-700 via-indigo-700 to-violet-600 group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-violet-500'}`} />
                                    
                                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                                    <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
                                    
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-5 text-white">
                                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 rotate-6 group-hover:rotate-0 transition-all duration-500 shadow-xl shadow-black/10">
                                                <Sparkles className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-base uppercase tracking-wider mb-0.5">Designer Card</p>
                                                <p className="text-sm text-white/80 font-medium italic">Ready for social media</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 -mr-1 group-hover:translate-x-1 transition-transform">
                                            <Share2 className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </motion.button>
                            )}

                            {/* Copy Link */}
                            <div className="mb-5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Link</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 min-w-0">
                                        <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 truncate">{shareUrl}</span>
                                    </div>
                                    <motion.button
                                        onClick={copyLink}
                                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${copied
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Social Sharing */}
                            <div className="mb-5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Share on</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {socials.map(({ name, icon: Icon, color, bg, hover, url: shareUrl }) => (
                                        <motion.a
                                            key={name}
                                            href={shareUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 transition-all"
                                            style={{ background: bg }}
                                            whileHover={{ scale: 1.05, background: hover }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color }} />
                                            <span className="text-xs font-semibold text-gray-600">{name}</span>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>

                            {/* Native Share (mobile) */}
                            {navigator.share && (
                                <motion.button
                                    onClick={nativeShare}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Globe className="w-4 h-4" />
                                    Share via Device
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
