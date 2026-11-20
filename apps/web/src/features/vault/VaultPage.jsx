// Pirento Vault dashboard.
import {useRef} from 'react';
import {PageHero} from '../../components/PageHero';
import {Section} from '../../components/ui/Heading';
import {useSignedIn} from '../auth/useSignedIn';
import {Files} from './FilesPanel';
import {Passwords} from './PasswordsPanel';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Vault() {
  const {redirect, user} = useSignedIn();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Pirento Vault', description: 'Files and passwords, encrypted at rest.'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Vault · Dashboard"
        title="Your files, / locked at rest."
        hl="locked at rest."
        intro="Everything here is encrypted with AES-256-GCM before it is stored. Pirento holds the key, so this is not end-to-end encryption."
      />
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-6 lg:grid-cols-2">
          <Files />
          <Passwords />
        </div>
      </Section>
    </div>
  );
}
