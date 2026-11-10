import { useEffect, useState } from 'react';

// O Chrome dispara "beforeinstallprompt" uma vez, cedo. Guardamos o evento para usar na tela Perfil.
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as InstallEvent;
  subs.forEach((f) => f());
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  subs.forEach((f) => f());
});

export function useInstalar() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  return {
    podeInstalar: deferred !== null,
    instalado: standalone,
    instalar: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      subs.forEach((f) => f());
    },
  };
}
