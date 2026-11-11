import { lazy, Suspense } from 'react';
import { Router, useRouter } from './lib/router';
import Site from './site/Site';

const Admin = lazy(() => import('./admin/Admin'));

function Routes() {
  const { path } = useRouter();
  if (path.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="boot">Cargando panel…</div>}>
        <Admin />
      </Suspense>
    );
  }
  return <Site />;
}

export default function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
