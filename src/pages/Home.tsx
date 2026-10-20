import Hero from '../sections/Hero';
import Proof from '../sections/Proof';
import Lineup from '../sections/Lineup';

export default function Home() {
  return (
    <main>
      <Hero />
      <Proof />
      {/* 1.3 Statement and 1.4 Two business lines still to come; 1.5 built ahead of order at the user's request. */}
      <Lineup />
      <section className="after-hero gut">
        <div className="wrap"><p className="mono">Next: 1.3 Statement · 1.4 Two business lines</p></div>
      </section>
    </main>
  );
}
