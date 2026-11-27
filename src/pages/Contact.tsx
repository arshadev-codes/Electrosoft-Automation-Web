import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { RANGE } from '../data/products';
import { BENCHES } from '../data/testing';
import { createContactMotion } from './contactMotion';
import { Arrow } from '../components/ui';
import PhoneField, { hasPhoneDigits, isPhoneValid } from '../components/PhoneField';
import { EMAIL, MAP, PHONE, TEL } from '../data/site';
// CONTENT.md · Company facts and Contact
const ADDRESS = ['S7-1/2, Jai Mata Di Compound,', 'Bhiwandi Road, Kalher,', 'Dist. Thane – 421 302'];
const NEEDS = ['Panels', 'Automation', 'Transformer Testing', 'Other'] as const;
type Need = typeof NEEDS[number];

// ?product=<id>[,<id>…] (every "Request a quote" link on the site; the home line-up sends several)
// → what they asked about, and which requirement (the first item's)
const AUTOMATION = ['plc-scada', 'vfd', 'control-desk', 'console'];

const TEST_BENCHES_MAP: Record<string, string> = {
  'ai-powered': 'Advanced Fully Automatic Transformer Test Bench (MOD-ETB-9000-AI)',
  'aipowered': 'Advanced Fully Automatic Transformer Test Bench (MOD-ETB-9000-AI)',
  'fully-automatic': 'Fully Automatic Transformer Test Bench (MOD-ETB-7000-FA)',
  'fullyautomatic': 'Fully Automatic Transformer Test Bench (MOD-ETB-7000-FA)',
  'semi-automatic': 'Semi-automatic Transformer Test Bench (MOD-ETB-5000-SA)',
  'semiautomatic': 'Semi-automatic Transformer Test Bench (MOD-ETB-5000-SA)',
  'conventional': 'Conventional Transformer Test Bench (MOD-ETB-3000-CV)',
  'low-voltage': 'Low Voltage Mobile Test Trolley (MOD-LTT-1200-MB)',
  'lowvoltage': 'Low Voltage Mobile Test Trolley (MOD-LTT-1200-MB)',
};

function lookup(id: string): { need: Need | null; about: string } {
  const norm = id.toLowerCase().trim();
  if (norm === 'transformer-testing') return { need: 'Transformer Testing', about: 'Transformer Testing Suite' };
  if (TEST_BENCHES_MAP[norm]) return { need: 'Transformer Testing', about: TEST_BENCHES_MAP[norm] };
  const bench = BENCHES.find(b => b.id.toLowerCase() === norm);
  if (bench) return { need: 'Transformer Testing', about: bench.name };
  const p = RANGE.flatMap(g => g.items).find(x => x.id.toLowerCase() === norm);
  if (!p) return { need: null, about: '' };
  return { need: AUTOMATION.includes(norm) ? 'Automation' : norm === 'turnkey' || norm === 'assembly' ? 'Other' : 'Panels', about: p.name };
}
function fromProduct(param: string | null): { need: Need | null; about: string } {
  const found = (param ?? '').split(',').map(id => lookup(id.trim())).filter(x => x.about);
  if (!found.length) return { need: null, about: '' };
  return { need: found[0].need, about: found.map(x => x.about).join(', ') };
}

const okEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/*
 * 7 · Contact: the enquiry form is wired like a circuit. Four breakers in series (name, a way to reach
 * you, the requirement, the message) close as each is filled; when all four are shut, current reaches
 * the lamp and the send button lights. Beside it: how to reach us, and a drawn location card.
 *
 * TODO: CONFIRM — no form service yet (decided 2026-11-02): sending opens the visitor's email app
 * with the enquiry written out, or WhatsApp. Swap send() for a real service (Formspree, a Vercel
 * function…) when one is chosen.
 */
export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const [params] = useSearchParams();
  const pre = fromProduct(params.get('product'));
  const urlMessage = params.get('message');
  const urlNeed = params.get('need') as Need | null;

  const getCleanMessage = (m: string | null, about: string) => {
    if (m) return m.endsWith('\n') ? m : `${m}\n\n`;
    if (about) return `Enquiry about: ${about}\n\n`;
    return '';
  };

  const initialNeed = (urlNeed && NEEDS.includes(urlNeed)) ? urlNeed : pre.need;
  const initialMessage = getCleanMessage(urlMessage, pre.about);

  const [f, setF] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    need: initialNeed as Need | null,
    message: initialMessage
  });
  const [sent, setSent] = useState<'mail' | 'wa' | null>(null);
  const [tried, setTried] = useState(false);
  const [reachTouched, setReachTouched] = useState(false);

  useEffect(() => {
    const p = fromProduct(params.get('product'));
    const msg = params.get('message');
    const nd = params.get('need') as Need | null;
    const resolvedNeed = (nd && NEEDS.includes(nd)) ? nd : p.need;
    const resolvedMsg = getCleanMessage(msg, p.about);
    if (resolvedNeed || resolvedMsg) {
      setF(prev => ({
        ...prev,
        need: resolvedNeed ?? prev.need,
        message: resolvedMsg || prev.message
      }));
    }
  }, [params]);

  const hasPhone = hasPhoneDigits(f.phone);
  const hasEmail = f.email.trim() !== '';
  const phoneOk = !hasPhone || isPhoneValid(f.phone);
  const emailOk = !hasEmail || okEmail(f.email);

  const checks = [
    { id: 'name', label: 'Name', ok: f.name.trim().length > 1 },
    { id: 'reach', label: 'Phone or email', ok: (hasPhone || hasEmail) && phoneOk && emailOk },
    { id: 'need', label: 'Requirement', ok: f.need !== null },
    { id: 'msg', label: 'Message', ok: f.message.replace(/^Enquiry about:.*$/m, '').trim().length > 9 || f.message.trim().length > 9 },
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

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setF(s => ({ ...s, [k]: e.target.value }));
    setSent(null);
  };
  const setPhone = (val: string) => {
    setF(s => ({ ...s, phone: val }));
    setSent(null);
  };
  const text = () => [
    ['Name', f.name],
    ['Company', f.company],
    ['Phone', hasPhone ? f.phone : ''],
    ['Email', f.email],
    ['Requirement', f.need ?? ''],
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
            <div className="ct-row two" onBlur={() => setReachTouched(true)}>
              <div className={`fld${(tried || reachTouched) && !phoneOk ? ' bad' : bad('reach') ? ' bad' : ''}`}>
                <span>Phone <em>or Email</em></span>
                <PhoneField
                  value={f.phone}
                  onChange={setPhone}
                  required={!hasEmail}
                  invalid={(tried || reachTouched) && (!phoneOk || (!hasPhone && !hasEmail && tried))}
                />
              </div>
              <label className={`fld${(tried || reachTouched) && !emailOk ? ' bad' : bad('reach') ? ' bad' : ''}`}><span>Email <em>or phone</em></span>
                <input name="email" type="email" autoComplete="email" placeholder="name@company.com" value={f.email} onChange={set('email')} aria-invalid={(tried || reachTouched) && !emailOk} /></label>
            </div>
            {(bad('reach') || (reachTouched && ((hasEmail && !emailOk) || (hasPhone && !phoneOk)))) && (
              <p className="ct-err" role="alert">
                {!hasPhone && !hasEmail
                  ? 'Add a valid phone number or an email we can reply to.'
                  : !phoneOk
                    ? 'Enter a valid phone number for the selected country.'
                    : 'Enter a valid email address (e.g. name@company.com).'}
              </p>
            )}

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

            {/* the circuit: solid start/end, dotted connections with midpoint junctions between fields */}
            <div className={`ct-circuit${ready ? ' is-live' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 480 56" preserveAspectRatio="xMidYMid meet">
                <circle className="tap" cx="8" cy="22" r="5" />
                {checks.map((c, i) => {
                  const x = 34 + i * 100;
                  const inStart = i ? x - 34 : 13;
                  const outEnd = i < 3 ? x + 66 : 406;
                  return (
                    <g key={c.id} className={`brk${c.ok ? ' on' : ''}`}>
                      <path className="w w-solid" d={`M${inStart} 22H${x}`} />
                      <path className="blade" d={`M${x} 22H${x + 32}`} style={{ transformOrigin: `${x}px 22px` }} />
                      <path className="w w-dot" d={`M${x + 32} 22H${outEnd}`} />
                      <circle className="pin" cx={x} cy="22" r="3" />
                      <circle className="pin" cx={x + 32} cy="22" r="3" />
                      <circle className="junc" cx={outEnd} cy="22" r="2.8" />
                      <text x={x + 16} y="50" textAnchor="middle">{c.label}</text>
                    </g>
                  );
                })}
                <path className="w w-solid end" d="M406 22H446" />
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
              <li><span>Call</span><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}><a href={`tel:${TEL}`}>{PHONE}</a><a href="tel:908988444">908988444</a></div></li>
              <li><span>Email</span><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              <li><span>WhatsApp</span><a href={`https://wa.me/${TEL.slice(1)}`} target="_blank" rel="noopener noreferrer">{PHONE}</a></li>
            </ul>

            <div className="ct-map">
              <iframe
                title="Electrosoft Automation Pvt. Ltd. location on Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3766.927956812092!2d73.01540339987989!3d19.241971299898577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7bc1923e04d09%3A0x57feba79ed217de5!2sElectrosoft%20Automation%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1795589362752!5m2!1sen!2sin"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
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
