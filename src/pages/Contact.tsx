import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { RANGE } from '../data/products';
import { BENCHES } from '../data/testing';
import { createContactMotion } from './contactMotion';
import { Arrow } from '../components/ui';

// CONTENT.md · Company facts and Contact
const PHONE = '+91 86928 88444', TEL = '+918692888444', EMAIL = 'info@electrosoftindia.com';
const ADDRESS = ['S7-1/2, Jai Mata Di Compound,', 'Bhiwandi Road, Kalher,', 'Dist. Thane – 421 302'];
const MAP = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Jai Mata Di Compound, Bhiwandi Road, Kalher, Thane 421302');
const NEEDS = ['Panels', 'Automation', 'Transformer Testing', 'Other'] as const;
type Need = typeof NEEDS[number];

// ?product=<id> (every "Request a quote" link on the site) → what they asked about, and which requirement
const AUTOMATION = ['plc-scada', 'vfd', 'control-desk', 'console'];
function fromProduct(id: string | null): { need: Need | null; about: string } {
  if (!id) return { need: null, about: '' };
  if (id === 'transformer-testing') return { need: 'Transformer Testing', about: 'Transformer Testing Suite' };
  const bench = BENCHES.find(b => b.id === id);
  if (bench) return { need: 'Transformer Testing', about: bench.name };
  const p = RANGE.flatMap(g => g.items).find(x => x.id === id);
  if (!p) return { need: null, about: '' };
  return { need: AUTOMATION.includes(id) ? 'Automation' : id === 'turnkey' || id === 'assembly' ? 'Other' : 'Panels', about: p.name };
}

const okEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const okPhone = (v: string) => v.replace(/\D/g, '').length >= 8;

/*
 * 7 · Contact: the enquiry form is wired like a circuit. Four breakers in series (name, a way to reach
 * you, the requirement, the message) close as each is filled; when all four are shut, current reaches
 * the lamp and the send button lights. Beside it: how to reach us, and a drawn location card.
 *
 * TODO: CONFIRM — no form service yet (your call, 2026-11-02): sending opens the visitor's email app
 * with the enquiry written out, or WhatsApp. Swap send() for a real service (Formspree, a Vercel
 * function…) when one is chosen.
 */
export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const [params] = useSearchParams();
  const pre = fromProduct(params.get('product'));
  const [f, setF] = useState({ name: '', company: '', phone: '', email: '', need: pre.need as Need | null, message: pre.about ? `Enquiry about: ${pre.about}\n\n` : '' });
  const [sent, setSent] = useState<'mail' | 'wa' | null>(null);
  const [tried, setTried] = useState(false);

  const checks = [
    { id: 'name', label: 'Name', ok: f.name.trim().length > 1 },
    { id: 'reach', label: 'Phone or email', ok: (f.phone !== '' || f.email !== '') && (f.phone === '' || okPhone(f.phone)) && (f.email === '' || okEmail(f.email)) },
    { id: 'need', label: 'Requirement', ok: f.need !== null },
    { id: 'msg', label: 'Message', ok: f.message.replace(/^Enquiry about:.*$/m, '').trim().length > 9 },
  ];
  const ready = checks.every(c => c.ok);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createContactMotion(el, matchMedia('(prefers-reduced-motion: reduce)').matches), el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const before = document.title;
    document.title = 'Contact — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF(s => ({ ...s, [k]: e.target.value })); setSent(null); };
  const text = () => [
    ['Name', f.name], ['Company', f.company], ['Phone', f.phone], ['Email', f.email], ['Requirement', f.need ?? ''],
  ].filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v.trim()}`).join('\n') + '\n\n' + f.message.trim();

  const send = (via: 'mail' | 'wa') => {
    setTried(true);
    if (!ready) {
      ref.current?.querySelector<HTMLElement>(`[data-check="${checks.find(c => !c.ok)!.id}"]`)?.focus();
      return;
    }
    const subject = `Enquiry: ${f.need}${f.company.trim() ? ` · ${f.company.trim()}` : ''}`;
    window.location.href = via === 'mail'
      ? `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text())}`
      : `https://wa.me/${TEL.slice(1)}?text=${encodeURIComponent(`${subject}\n\n${text()}`)}`;
    setSent(via);
  };
  const submit = (e: FormEvent) => { e.preventDefault(); send('mail'); };
  const bad = (id: string) => tried && !checks.find(c => c.id === id)!.ok;

  return (
    <main className="ct" ref={ref}>
      <section className="ct-hero gut" aria-labelledby="ct-h">
        <div className="wrap">
          <h1 className="ct-h1" id="ct-h"><span className="ln"><span>Let's build yours.</span></span></h1>
          <p className="ct-lede">Tell us what you need: a single panel, a plant's automation or a complete transformer test system. We reply with a quote built on a full Bill of Material.</p>
        </div>
      </section>

      <section className="ct-body gut" aria-label="Enquiry and contact details">
        <div className="wrap ct-grid">
          <form className="ct-form" onSubmit={submit} noValidate aria-describedby="ct-note">
            <div className="ct-form-top"><b>Enquiry</b><span className="mono">To {EMAIL}</span></div>

            <div className="ct-row two">
              <label className={`fld${bad('name') ? ' bad' : ''}`}><span>Name</span>
                <input data-check="name" name="name" autoComplete="name" value={f.name} onChange={set('name')} required aria-invalid={bad('name')} /></label>
              <label className="fld"><span>Company <em>optional</em></span>
                <input name="company" autoComplete="organization" value={f.company} onChange={set('company')} /></label>
            </div>
            <div className="ct-row two">
              <label className={`fld${bad('reach') ? ' bad' : ''}`}><span>Phone</span>
                <input data-check="reach" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} aria-invalid={bad('reach')} /></label>
              <label className={`fld${bad('reach') ? ' bad' : ''}`}><span>Email</span>
                <input name="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={bad('reach')} /></label>
            </div>
            {bad('reach') && <p className="ct-err" role="alert">Add a phone number or an email we can reply to.</p>}

            <fieldset className={`ct-need${bad('need') ? ' bad' : ''}`}>
              <legend>Requirement</legend>
              <div>
                {NEEDS.map((n, i) => (
                  <label key={n} className={f.need === n ? 'on' : ''}>
                    <input type="radio" name="need" value={n} checked={f.need === n} data-check={i === 0 ? 'need' : undefined}
                      onChange={() => { setF(s => ({ ...s, need: n })); setSent(null); }} />{n}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={`fld${bad('msg') ? ' bad' : ''}`}><span>Message</span>
              <textarea data-check="msg" name="message" rows={5} value={f.message} onChange={set('message')} aria-invalid={bad('msg')}
                placeholder="The load list, the plant, the transformer rating, or simply what you need, in your words." /></label>

            {/* the circuit: four breakers in series, a lamp at the end */}
            <div className={`ct-circuit${ready ? ' is-live' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 480 56" preserveAspectRatio="xMidYMid meet">
                <circle className="tap" cx="8" cy="22" r="5" />
                {checks.map((c, i) => {
                  const x = 34 + i * 100;
                  return (
                    <g key={c.id} className={`brk${c.ok ? ' on' : ''}`}>
                      <path className="w" d={`M${i ? x - 34 : 13} 22H${x}`} />
                      <path className="blade" d={`M${x} 22H${x + 32}`} style={{ transformOrigin: `${x}px 22px` }} />
                      <circle className="pin" cx={x} cy="22" r="3" /><circle className="pin" cx={x + 32} cy="22" r="3" />
                      <text x={x + 16} y="50" textAnchor="middle">{c.label}</text>
                    </g>
                  );
                })}
                <path className="w end" d="M398 22H446" />
                <path className="flow" d="M13 22H446" />
                <circle className="lamp" cx="458" cy="22" r="11" />
                <path className="lamp-x" d="M451 15L465 29M465 15L451 29" />
              </svg>
              <ol className="ct-checks">{checks.map(c => <li key={c.id} className={c.ok ? 'on' : ''}><i />{c.label}</li>)}</ol>
              <span className="ct-ready mono">{ready ? 'Ready to send' : `${checks.filter(c => c.ok).length} / 4 closed`}</span>
            </div>

            <div className="ct-send">
              <button type="submit" className={`pill ct-go${ready ? ' ready' : ''}`}>Send enquiry<Arrow /></button>
              <button type="button" className="line-btn" onClick={() => send('wa')}>Send on WhatsApp</button>
            </div>
            <p className="ct-note" id="ct-note" role="status">
              {sent === 'mail' ? 'Your email app should open with the enquiry written out. Press send there.'
                : sent === 'wa' ? 'WhatsApp should open with the enquiry written out. Press send there.'
                : 'Sending opens your email app (or WhatsApp) with everything filled in.'}
            </p>
          </form>

          <aside className="ct-side">
            <ul className="ct-ways">
              <li><span>Call</span><a href={`tel:${TEL}`}>{PHONE}</a></li>
              <li><span>Email</span><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              <li><span>WhatsApp</span><a href={`https://wa.me/${TEL.slice(1)}`} target="_blank" rel="noopener noreferrer">{PHONE}</a></li>
              <li><span>At work</span><p>362 days a year, 14 hours a day</p></li>
            </ul>

            {/* location, drawn: a schematic of Bhiwandi Road, not to scale */}
            <div className="ct-map">
              <svg viewBox="0 0 360 250" aria-hidden="true">
                <defs><pattern id="ctGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(11,91,211,.07)" /></pattern></defs>
                <rect width="360" height="250" fill="url(#ctGrid)" />
                <path className="road-edge" pathLength={1} d="M226 -10C214 60 150 92 146 140S118 214 104 262" />
                <path className="road" pathLength={1} d="M226 -10C214 60 150 92 146 140S118 214 104 262" />
                <path className="road-mid" d="M226 -10C214 60 150 92 146 140S118 214 104 262" />
                <text className="town" x="248" y="24">to Bhiwandi</text>
                <text className="town" x="118" y="238">to Thane</text>
                <text className="rd" x="148" y="226" transform="rotate(-71 148 226)">Bhiwandi Road</text>
                <g className="pin-g">
                  <circle className="pulse" cx="148" cy="130" r="10" />
                  <path className="pin" d="M148 132c-9-12-13-18-13-24a13 13 0 0 1 26 0c0 6-4 12-13 24z" />
                  <circle cx="148" cy="108" r="4.5" fill="#fff" />
                </g>
                <text className="site" x="172" y="112">Electrosoft</text>
                <text className="site-2" x="172" y="128">Kalher</text>
                <g className="north"><path d="M330 46V22M324 30l6-8 6 8" /><text x="330" y="60" textAnchor="middle">N</text></g>
                <text className="nts" x="14" y="240">Not to scale</text>
              </svg>
              <div className="ct-map-foot">
                <address>{ADDRESS.map(l => <span key={l}>{l}</span>)}</address>
                <a className="line-btn" href={MAP} target="_blank" rel="noopener noreferrer">Open in Google Maps<Arrow /></a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
