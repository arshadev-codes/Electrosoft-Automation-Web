import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import TestingSolutions from './pages/TestingSolutions';
import Projects from './pages/Projects';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import { useSmoothScroll } from './hooks/useSmoothScroll';

// dev-only tool that saves the code-built 3D models as .glb files (never in the production build)
const DevExport = import.meta.env.DEV ? lazy(() => import('./pages/DevExport')) : null;

export default function App() {
  useSmoothScroll();
  return (
    <>
      <Header />
      <PageTransition>
        {location => (
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/transformer-testing" element={<TestingSolutions />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            {DevExport && <Route path="/dev/export" element={<Suspense fallback={null}><DevExport /></Suspense>} />}
          </Routes>
        )}
      </PageTransition>
      <Footer />
    </>
  );
}
