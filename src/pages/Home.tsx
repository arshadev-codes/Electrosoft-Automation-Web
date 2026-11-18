import Hero from '../sections/Hero';
import Proof from '../sections/Proof';
import Lines from '../sections/Lines';
import Testing from '../sections/Testing';
import Report from '../sections/Report';
import Why from '../sections/Why';
import RoutineTests from '../sections/RoutineTests';
import Dossier from '../sections/Dossier';

export default function Home() {
  return (
    <main>
      <Hero />
      <Proof />
      <Lines />
      <Dossier />
      <Testing />
      <Report />
      <Why />
      <RoutineTests />
    </main>
  );
}
