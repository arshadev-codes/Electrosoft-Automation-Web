import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import { useSmoothScroll } from './hooks/useSmoothScroll';

export default function App() {
  useSmoothScroll();
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}
