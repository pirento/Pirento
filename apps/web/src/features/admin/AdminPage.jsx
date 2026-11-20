// Admin: /admin/<section>, shown inside the app layout whose sidebar lists the sections.
import {Navigate, useParams} from 'react-router-dom';
import {PageHero} from '../../components/PageHero';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {usePageMeta} from '../../lib/page';
import {isStaffRole, roleLabel, sectionsFor} from './adminNav';
import {SECTIONS} from './sections';

export function Admin() {
  const {section, id} = useParams();
  const {redirect, user} = useSignedIn({loginPath: '/admin/login'});
  const allowed = sectionsFor(user?.role);
  const current = allowed.find((s) => s.id === section);
  usePageMeta({title: `${current?.label ?? 'Admin'} — Pirento Admin`});

  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  if (!isStaffRole(user.role)) return <NotFound />;
  // Unknown or not-allowed sections fall back to the first one this role may open.
  if (!current) return <Navigate to={`/admin/${allowed[0].id}`} replace />;

  const Body = SECTIONS[current.id];
  return (
    <>
      <PageHero label={`Pirento Admin · ${roleLabel(user.role)}`} title={current.label} intro={current.intro} />
      <Body me={user} id={id} />
    </>
  );
}
