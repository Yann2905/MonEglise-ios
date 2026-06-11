# MonÉglise — Version Web/iOS PWA

App web Next.js de MonÉglise — version iPhone (installable PWA) qui partage la même base Supabase + Cloudinary + Edge Functions que l'app Android Flutter.

## 🎨 Design

Style **iOS 18 premium** :
- Liquid glass (backdrop-blur) sur navbar / tab bar
- Coins continus "squircle" (style Apple)
- Spring animations Framer Motion
- SF Pro Display/Text (fallback système Apple)
- Tab bar flottante avec halo blur
- Bottom sheets natifs

## 🚀 Setup local

```bash
cd moneglise-ios
npm install
cp .env.example .env.local
# Édite .env.local si besoin (les valeurs par défaut pointent sur le bon Supabase)
npm run dev
```

→ http://localhost:3000

## 📦 Deploy Vercel

1. Push ce dossier sur GitHub
2. Va sur https://vercel.com/new
3. Importe le repo `MonEglise-ios`
4. Vercel détecte Next.js → "Deploy"
5. Une fois déployé, configure les **Environment Variables** dans Settings :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_IMAGE_PRESET`
   - `NEXT_PUBLIC_CLOUDINARY_AUDIO_PRESET`
6. Redeploy

## 📱 Installation sur iPhone

1. Ouvre l'URL Vercel dans **Safari** (pas Chrome !)
2. Bouton **Partager** (carré avec flèche)
3. **Sur l'écran d'accueil**
4. L'app apparaît comme une vraie app iOS

## ✅ Features implémentées

- [x] Setup Next.js + Tailwind + TS
- [x] Design system iOS 18 (tokens, composants UI)
- [x] PWA manifest + meta tags iOS
- [x] AuthProvider (login direct sans OTP, auto-login localStorage)
- [x] Welcome screen avec blobs animés
- [x] Login par téléphone

## 🚧 En cours (sessions suivantes)

- [ ] Inscription membre (code église → formulaire)
- [ ] Inscription admin
- [ ] Dashboard admin (membres, familles, sermons, programmes, notifs)
- [ ] Dashboard membre
- [ ] Détails familles + Comité des responsables
- [ ] Lecteur audio sermons
- [ ] Notifications + Realtime
- [ ] Profil + upload avatar Cloudinary
- [ ] Service worker pour cache offline

## 🔧 Stack

- **Next.js 14** (App Router)
- **TypeScript 5**
- **Tailwind CSS 3.4** avec design tokens iOS 18
- **Framer Motion** pour les animations
- **Supabase JS** (même DB que l'Android)
- **Lucide React** pour les icônes
- **react-hot-toast** pour les notifications
