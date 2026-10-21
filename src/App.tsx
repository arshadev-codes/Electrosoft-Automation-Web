import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { useSmoothScroll } from './hooks/useSmoothScroll';

// dev-only tool that saves the code-built 3D models as .glb files (never in the production build)
const DevExport = import.meta.env.DEV ? lazy(() => import('./pages/DevExport')) : null;

export default function App() {
  useSmoothScroll();
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        {DevExport && <Route path="/dev/export" element={<Suspense fallback={null}><DevExport /></Suspense>} />}
      </Routes>
      <Footer />
    </>
  );
}
