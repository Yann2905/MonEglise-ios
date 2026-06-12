'use client';

import { useState } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { cn } from '@/lib/utils';

export default function LegalPage() {
  const [tab, setTab] = useState<'cgu' | 'privacy'>('cgu');

  return (
    <div className="min-h-[100dvh] bg-ios-bg-light pb-safe">
      <NavBar title={tab === 'cgu' ? "Conditions d'utilisation" : 'Politique de confidentialité'} back />

      <div className="px-4 mt-2">
        <div className="bg-ios-gray5 rounded-ios-lg p-1 flex">
          {(['cgu', 'privacy'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-ios text-[14px] font-semibold transition-all',
                tab === t ? 'bg-white text-ios-label-light shadow-ios-sm' : 'text-ios-gray'
              )}
            >
              {t === 'cgu' ? 'CGU' : 'Confidentialité'}
            </button>
          ))}
        </div>
      </div>

      <article className="px-5 mt-6 pb-12 prose prose-sm max-w-none text-[15px] leading-relaxed text-ios-label-light">
        {tab === 'cgu' ? <CGU /> : <Privacy />}
      </article>
    </div>
  );
}

function CGU() {
  return (
    <>
      <p className="text-[12px] text-ios-gray uppercase tracking-wider font-semibold">
        Dernière mise à jour : Juin 2026
      </p>
      <h2 className="text-[20px] font-bold mt-4">1. Objet</h2>
      <p>
        MonÉglise est une application permettant aux églises chrétiennes de gérer leur communauté
        (membres, familles, cultes, prédications, appels d'absence). L'usage de l'application implique
        l'acceptation des présentes conditions.
      </p>

      <h2 className="text-[20px] font-bold mt-4">2. Compte utilisateur</h2>
      <p>
        L'inscription nécessite un numéro de téléphone valide et un code d'invitation fourni par
        votre église. Chaque membre est responsable de la confidentialité de son compte. Le pasteur
        principal est administrateur de son église dans l'application.
      </p>

      <h2 className="text-[20px] font-bold mt-4">3. Données collectées</h2>
      <p>
        Voir la section "Politique de confidentialité". En résumé : prénom, nom, téléphone,
        quartier, photo de profil (optionnelle), rôle dans l'église.
      </p>

      <h2 className="text-[20px] font-bold mt-4">4. Usage acceptable</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Ne pas usurper l'identité d'un autre membre.</li>
        <li>Ne pas envoyer de messages offensants ou contraires à la foi.</li>
        <li>Ne pas tenter d'accéder aux données d'une autre église.</li>
        <li>Le pasteur peut supprimer un compte qui enfreint ces règles.</li>
      </ul>

      <h2 className="text-[20px] font-bold mt-4">5. Propriété intellectuelle</h2>
      <p>
        Les prédications, photos et contenus restent la propriété de leur auteur ou de l'église
        qui les a publiés. MonÉglise n'en revendique aucune propriété.
      </p>

      <h2 className="text-[20px] font-bold mt-4">6. Responsabilité</h2>
      <p>
        L'application est fournie "telle quelle". Nous mettons tout en œuvre pour assurer sa
        disponibilité et la sécurité des données, mais nous ne pouvons garantir une absence totale
        de pannes ou de pertes de données. Des backups quotidiens sont effectués.
      </p>

      <h2 className="text-[20px] font-bold mt-4">7. Suppression du compte</h2>
      <p>
        Vous pouvez demander la suppression de votre compte à tout moment via votre pasteur ou en
        nous contactant directement. La suppression est effective sous 7 jours.
      </p>

      <h2 className="text-[20px] font-bold mt-4">8. Modifications</h2>
      <p>
        Nous pouvons mettre à jour ces conditions. Toute modification importante sera notifiée aux
        utilisateurs dans l'application.
      </p>

      <h2 className="text-[20px] font-bold mt-4">9. Contact</h2>
      <p>
        Pour toute question : contactez votre pasteur ou l'équipe MonÉglise via l'adresse fournie
        par votre église.
      </p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <p className="text-[12px] text-ios-gray uppercase tracking-wider font-semibold">
        Dernière mise à jour : Juin 2026
      </p>

      <h2 className="text-[20px] font-bold mt-4">1. Qui collecte vos données</h2>
      <p>
        Les données sont collectées par votre église locale via l'application MonÉglise. Le
        pasteur principal de votre église est le responsable du traitement des données de sa
        communauté.
      </p>

      <h2 className="text-[20px] font-bold mt-4">2. Données collectées</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Identité</strong> : prénom, nom, genre, date de naissance (optionnel).</li>
        <li><strong>Contact</strong> : numéro de téléphone, quartier de résidence.</li>
        <li><strong>Image</strong> : photo de profil si vous en ajoutez une.</li>
        <li><strong>Activité religieuse</strong> : rôle dans l'église, familles auxquelles vous appartenez, présences/absences aux cultes.</li>
        <li><strong>Technique</strong> : jeton de notification push (FCM), date de dernière connexion.</li>
      </ul>

      <h2 className="text-[20px] font-bold mt-4">3. Finalités</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Gestion administrative de votre église.</li>
        <li>Communication entre le pasteur et les fidèles.</li>
        <li>Suivi de la présence aux cultes.</li>
        <li>Envoi des prédications audio.</li>
      </ul>

      <h2 className="text-[20px] font-bold mt-4">4. Base légale</h2>
      <p>
        Votre consentement explicite lors de l'inscription. Vous pouvez le retirer à tout moment
        en supprimant votre compte.
      </p>

      <h2 className="text-[20px] font-bold mt-4">5. Qui peut voir vos données</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Le pasteur principal de votre église : toutes les données.</li>
        <li>Les autres membres de votre église : prénom, nom, photo, rôle, familles, téléphone (pour appel).</li>
        <li>L'équipe technique MonÉglise : pour résoudre les bugs uniquement, sur demande.</li>
        <li><strong>Vos données ne sont JAMAIS revendues</strong> ni partagées avec des tiers à des fins commerciales.</li>
      </ul>

      <h2 className="text-[20px] font-bold mt-4">6. Sous-traitants</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Supabase</strong> (base de données et stockage, hébergé en Europe).</li>
        <li><strong>Cloudinary</strong> (stockage des audios et photos).</li>
        <li><strong>Firebase</strong> (notifications push).</li>
        <li><strong>Vercel</strong> (hébergement de l'application web).</li>
      </ul>

      <h2 className="text-[20px] font-bold mt-4">7. Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre
        compte, les données personnelles sont effacées sous 7 jours. Les backups expirent
        automatiquement après 30 jours.
      </p>

      <h2 className="text-[20px] font-bold mt-4">8. Vos droits</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Accès</strong> : voir toutes les données qu'on a sur vous (demandez à votre pasteur).</li>
        <li><strong>Rectification</strong> : modifier prénom, téléphone, photo via l'écran Profil.</li>
        <li><strong>Effacement</strong> : suppression du compte sur demande.</li>
        <li><strong>Portabilité</strong> : export de vos données au format JSON sur demande.</li>
        <li><strong>Opposition</strong> : refuser les notifications push depuis Profil → Notifications.</li>
      </ul>

      <h2 className="text-[20px] font-bold mt-4">9. Sécurité</h2>
      <p>
        Connexions chiffrées (HTTPS/TLS), stockage sécurisé chez Supabase et Cloudinary, backups
        quotidiens chiffrés, accès restreint à l'équipe technique.
      </p>

      <h2 className="text-[20px] font-bold mt-4">10. Mineurs</h2>
      <p>
        Pour les enfants de moins de 16 ans, l'inscription doit être faite par un parent ou
        tuteur légal.
      </p>

      <h2 className="text-[20px] font-bold mt-4">11. Contact</h2>
      <p>
        Pour exercer vos droits ou poser une question : adressez-vous à votre pasteur, ou écrivez
        à l'équipe MonÉglise.
      </p>
    </>
  );
}
