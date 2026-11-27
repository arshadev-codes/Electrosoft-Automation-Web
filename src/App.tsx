import { lazy, Suspense } from 'react';
import {
  Route,
  Routes,
  useLocation,
  Navigate,
} from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import LiveWire from './components/LiveWire';
import Lens from './components/Lens';
import FloatingRippleNav from './components/FloatingRippleNav';
import { SectionContext } from './hooks/useSectionPath';

import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import TestingSolutions from './pages/TestingSolutions';
import PanelHome from './pages/PanelHome';
// import Projects from './pages/Projects'; // NOTE: Uncomment to restore Projects page
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';

import { useSmoothScroll } from './hooks/useSmoothScroll';

const DevExport = import.meta.env.DEV
  ? lazy(() => import('./pages/DevExport'))
  : null;

export default function App() {
  useSmoothScroll();

  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  const isPanel = normalizedPath === '/panel' || normalizedPath.startsWith('/panel/');
  const basePath = isPanel ? '/panel' : '';

  return (
    <SectionContext.Provider value={basePath}>
      <Lens />
      <LiveWire />

      <Header basePath={basePath} />

      <PageTransition>
        {location => (
          <Routes location={location}>
            {/* ── Testing Section (root) ── */}
            <Route path="/" element={<Home />} />
            <Route path="/transformer-testing" element={<TestingSolutions />} />

            {/* Testing shared pages */}
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            {/* NOTE: Projects page temporarily commented out for deployment.
                Redirects safely prevent broken links or 404s.
                To restore: uncomment import at line 22 and route below, then remove Navigate. */}
            {/* <Route path="/projects" element={<Projects />} /> */}
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />

            {/* ── Panel Section (/panel/*) ── */}
            <Route path="/panel" element={<PanelHome />} />
            <Route path="/panel/about" element={<About />} />
            <Route path="/panel/products" element={<Products />} />
            {/* NOTE: Projects page temporarily commented out for deployment.
                Redirects safely prevent broken links or 404s.
                To restore: uncomment import at line 22 and route below, then remove Navigate. */}
            {/* <Route path="/panel/projects" element={<Projects />} /> */}
            <Route path="/panel/projects" element={<Navigate to="/panel" replace />} />
            <Route path="/panel/gallery" element={<Gallery />} />
            <Route path="/panel/contact" element={<Contact />} />

            {/* Legacy URL redirect */}
            <Route path="/panels" element={<Navigate to="/panel" replace />} />
            <Route path="/panels/*" element={<Navigate to="/panel" replace />} />

            {DevExport && (
              <Route
                path="/dev/export"
                element={
                  <Suspense fallback={null}>
                    <DevExport />
                  </Suspense>
                }
              />
            )}
          </Routes>
        )}
      </PageTransition>

      <Footer basePath={basePath} />
      <FloatingRippleNav />
    </SectionContext.Provider>
  );
}
