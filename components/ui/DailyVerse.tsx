'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Verse {
  reference: string;
  text: string;
}

// Sélection de versets bibliques apaisants
// (utilise un index basé sur le jour de l'année pour avoir un verset
// stable pour tout le monde le même jour)
const VERSES: Verse[] = [
  { reference: 'Jean 3:16', text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." },
  { reference: 'Psaumes 23:1', text: "L'Éternel est mon berger : je ne manquerai de rien." },
  { reference: 'Philippiens 4:13', text: 'Je puis tout par celui qui me fortifie.' },
  { reference: 'Romains 8:28', text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.' },
  { reference: 'Proverbes 3:5-6', text: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse.' },
  { reference: 'Jérémie 29:11', text: 'Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l\'espérance.' },
  { reference: 'Ésaïe 41:10', text: "Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu." },
  { reference: 'Matthieu 11:28', text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.' },
  { reference: 'Psaumes 46:1', text: 'Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.' },
  { reference: '1 Corinthiens 13:4', text: 'La charité est patiente, elle est pleine de bonté ; la charité n\'est point envieuse.' },
  { reference: 'Galates 5:22', text: 'Mais le fruit de l\'Esprit, c\'est l\'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité.' },
  { reference: 'Hébreux 11:1', text: 'Or la foi est une ferme assurance des choses qu\'on espère, une démonstration de celles qu\'on ne voit pas.' },
  { reference: 'Apocalypse 21:4', text: 'Il essuiera toute larme de leurs yeux, et la mort ne sera plus.' },
  { reference: 'Psaumes 27:1', text: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?" },
  { reference: 'Matthieu 5:16', text: 'Que votre lumière luise ainsi devant les hommes, afin qu\'ils voient vos bonnes œuvres.' },
  { reference: 'Romains 12:12', text: 'Réjouissez-vous en espérance. Soyez patients dans l\'affliction. Persévérez dans la prière.' },
  { reference: 'Éphésiens 2:8', text: 'C\'est par la grâce que vous êtes sauvés, par le moyen de la foi.' },
  { reference: 'Psaumes 119:105', text: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.' },
  { reference: 'Lamentations 3:22-23', text: "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin." },
  { reference: 'Jean 14:27', text: 'Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne.' },
  { reference: 'Romains 15:13', text: 'Que le Dieu de l\'espérance vous remplisse de toute joie et de toute paix dans la foi.' },
  { reference: 'Psaumes 34:18', text: "L'Éternel est près de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement." },
  { reference: 'Matthieu 6:33', text: 'Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.' },
  { reference: 'Jacques 1:12', text: 'Heureux l\'homme qui supporte patiemment la tentation.' },
  { reference: '1 Thessaloniciens 5:16-18', text: 'Soyez toujours joyeux. Priez sans cesse. Rendez grâces en toutes choses.' },
  { reference: 'Psaumes 37:4', text: "Fais de l'Éternel tes délices, et il te donnera ce que ton cœur désire." },
  { reference: 'Romains 5:8', text: 'Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous.' },
  { reference: 'Colossiens 3:23', text: 'Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.' },
  { reference: 'Matthieu 7:7', text: 'Demandez, et l\'on vous donnera ; cherchez, et vous trouverez ; frappez, et l\'on vous ouvrira.' },
  { reference: 'Psaumes 121:1-2', text: 'Je lève mes yeux vers les montagnes... D\'où me viendra le secours ? Le secours me vient de l\'Éternel, qui a fait les cieux et la terre.' },
  { reference: 'Ésaïe 40:31', text: 'Mais ceux qui se confient en l\'Éternel renouvellent leur force.' },
];

export function DailyVerse() {
  const [verse, setVerse] = useState<Verse | null>(null);

  useEffect(() => {
    // Index basé sur le jour de l'année (1-366) → même verset pour tous le même jour
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
    setVerse(VERSES[dayOfYear % VERSES.length]);
  }, []);

  if (!verse) return null;

  const share = () => {
    const text = `📖 Verset du jour\n\n"${verse.text}"\n— ${verse.reference}\n\nVia MonÉglise`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="daily-verse-card mx-4 mt-5 rounded-ios-xl p-5 shadow-ios-sm"
    >
      <div className="flex items-start gap-3">
        <div className="daily-verse-icon h-10 w-10 rounded-ios flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold tracking-[1.5px] text-ios-orange uppercase">Verset du jour</p>
          <p
            className="daily-verse-text mt-2 leading-relaxed italic"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 17 }}
          >
            « {verse.text} »
          </p>
          <p className="mt-2 text-[13px] font-semibold text-ios-orange">— {verse.reference}</p>
          <button
            onClick={share}
            className="daily-verse-share mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-ios-orange text-[12px] font-semibold shadow-ios-sm active:opacity-70"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager
          </button>
        </div>
      </div>
    </motion.div>
  );
}
