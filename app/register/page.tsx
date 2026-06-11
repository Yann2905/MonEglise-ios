'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, UserPlus, Building2 } from 'lucide-react';

export default function RegisterChoicePage() {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-ios-bg-light pt-safe pb-safe">
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center -ml-2 px-2 py-2 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-7 w-7 text-brand-600" />
        </button>
      </div>

      <div className="px-6 mt-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="ios-large-title">Inscription</h1>
          <p className="mt-2 text-[17px] text-ios-gray tracking-sf-tight">
            Choisissez le type de compte à créer.
          </p>
        </motion.div>

        <div className="mt-10 space-y-4">
          <ChoiceCard
            delay={0.15}
            onClick={() => router.push('/register/church-code')}
            icon={<UserPlus className="h-7 w-7" />}
            color="text-brand-600 bg-brand-50"
            title="Je suis fidèle / membre"
            description="Rejoindre une église avec un code d'invitation."
          />

          <ChoiceCard
            delay={0.25}
            onClick={() => router.push('/register/admin')}
            icon={<Building2 className="h-7 w-7" />}
            color="text-ios-orange bg-orange-50"
            title="Je suis pasteur / administrateur"
            description="Créer une nouvelle église dans l'application."
          />
        </div>
      </div>
    </main>
  );
}

function ChoiceCard({
  delay,
  onClick,
  icon,
  color,
  title,
  description,
}: {
  delay: number;
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full bg-white rounded-ios-xl p-5 flex items-center gap-4 shadow-ios-sm active:shadow-ios"
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-ios-lg ${color}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-[17px] font-semibold text-ios-label-light tracking-sf-tight">
          {title}
        </h3>
        <p className="mt-0.5 text-[13px] text-ios-gray leading-snug">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-ios-gray3 flex-shrink-0" />
    </motion.button>
  );
}
