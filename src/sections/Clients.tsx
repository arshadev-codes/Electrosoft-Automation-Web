import { useRef } from 'react';
import { useCinematic } from '../hooks/useCinematic';

// CONTENT.md · Home §8 Clients (32). Logos from the old site (electrosoftindia.com/img/clients-logos), trimmed to WebP.
const CLIENTS: [string, string][] = [
  ['godrej', 'Godrej'], ['crompton-greaves', 'Crompton Greaves'], ['reliance-industries', 'Reliance Industries'], ['indian-oil', 'Indian Oil'],
  ['thane-mahanagar', 'Thane Mahanagar Palika'], ['aditya-birla', 'Aditya Birla Group'], ['air-india', 'Air India'], ['areva', 'Areva'],
  ['barc', 'BARC'], ['chemtrols', 'Chemtrols'], ['dnp-infrastructures', 'DNP Infrastructures'],
  // TODO: CONFIRM — CONTENT.md says "Emirates"; the old site's logo is Emirates Transformer & Switchgear
  ['emirates', 'Emirates Transformer & Switchgear'],
  ['esselworld', 'Essel World'],
  // TODO: CONFIRM — CONTENT.md says "Europoxy"; the old site's europoxy.png shows Global Transformers and Switchgears Fzco
  ['europoxy', 'Global Transformers and Switchgears'],
  ['evio', 'Evio'], ['fuchs', 'FUCHS'], ['fuji-electric', 'Fuji Electric'], ['gail-india-limited', 'GAIL India'],
  ['gammon-skanska', 'Gammon Skanska'], ['hind-rectifiers', 'Hind Rectifiers'], ['indiabulls', 'Indiabulls'], ['jsw', 'JSW'],
  ['kdmc', 'Kalyan Dombivali Municipal Corporation'], ['lupin-pharmaceuticals', 'Lupin Pharmaceuticals'], ['municipal-corporation-gurugram', 'Municipal Corporation of Gurugram'],
  ['prolific', 'Prolific'], ['ramky', 'Ramky'], ['rexel', 'Rexel'], ['rotomotive', 'Rotomotive'], ['siyarams', "Siyaram's"], ['sudhir', 'Sudhir'], ['vijai-marine', 'Vijai Marine'],
];

// mostly-white logos: darkened so they read on the light tiles
const LIGHT = ['lupin-pharmaceuticals'];

export default function Clients() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.cl-wrap', { exit: false }); // the footer follows; nothing to leave into

  return (
    <section id="clients" ref={ref} aria-labelledby="clients-h">
      <div className="cl-wrap">
        <div className="cl-head sec-head">
          <h2 id="clients-h">Trusted where failure isn't an option.</h2>
          <p><b>80%+</b> of our business comes from repeat customers.</p>
        </div>
        <ul className="cl-wall">
          {CLIENTS.map(([file, name]) => (
            <li key={file} className={LIGHT.includes(file) ? 'light' : undefined}>
              <img src={`/img/clients/${file}.webp`} alt={name} title={name} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
