import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { motion } from "motion/react";
import { ShieldCheck, Sparkles, Wand2, Info } from "lucide-react";
import GlowCard from "./GlowCard";

interface AuthGuardProps {
  title?: string;
  description?: string;
  featureBadge?: string;
  onSuccess?: () => void;
  inline?: boolean;
}

export default function AuthGuard({
  title = "Unlock Unlimited Access",
  description = "Join our exclusive creator ecosystem. Authorize your account with Google below to unlock instant script generation, full captions, multi-device backup archives, and AI voice profiling.",
  featureBadge = "PRO FEATURE",
  onSuccess,
  inline = false
}: AuthGuardProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Authentication trigger failed:", err);
      setError("Authorization canceled or blocked by popup blocker. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const innerContent = (
    <GlowCard glowColor="purple" className="p-6 bg-[#111111]/90 border-white/5 relative max-w-sm mx-auto text-center">
      <div className="absolute top-4 right-4 bg-[#C8FF5A]/10 text-[#C8FF5A] border border-[#C8FF5A]/20 py-0.5 px-2 rounded-full text-[8px] font-mono font-bold tracking-widest uppercase">
        {featureBadge}
      </div>

      <div className="flex justify-center mb-4">
        <div className="p-3 bg-gradient-to-tr from-purple-500/20 to-[#FF4FD8]/20 rounded-2xl text-[#FF4FD8] animate-pulse">
          <Wand2 size={24} />
        </div>
      </div>

      <h3 className="text-lg font-black font-sans text-white uppercase tracking-tight mb-2">
        {title}
      </h3>
      
      <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6 font-sans">
        {description}
      </p>

      {error && (
        <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-mono flex items-center gap-1.5 justify-center">
          <Info size={11} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignIn}
        disabled={loading}
        className="w-full py-3 px-4 bg-[#C8FF5A] hover:bg-opacity-90 disabled:bg-[#C8FF5A]/40 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider font-mono shadow-[0_4px_20px_rgba(200,255,90,0.2)]"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.997 0-.746-.08-1.32-.176-1.885H12.24z" />
          </svg>
        )}
        <span>{loading ? "AUTHORIZING..." : "SIGN IN WITH GOOGLE"}</span>
      </motion.button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-[9px] text-[#71717A] tracking-wider uppercase font-mono">
        <ShieldCheck size={11} className="text-[#C8FF5A]" />
        <span>Secure Firebase Authorization</span>
      </div>
    </GlowCard>
  );

  if (inline) {
    return <div className="py-6">{innerContent}</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 min-h-[50vh]">
      {innerContent}
    </div>
  );
}
