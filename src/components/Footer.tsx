import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EMAIL, MAP, PHONE, TEL } from '../data/site';

const time = () => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

/** The time where the work is done, as a small live reading; its colon blinks like a panel clock. */
function Clock() {
  const [t, setT] = useState(time);
  useEffect(() => { const id = setInterval(() => setT(time()), 15000); return () => clearInterval(id); }, []);
  const [h, m] = t.split(':');
  return <span className="ft-clock"><i aria-hidden="true" />Kalher, Thane <b className="mono">{h}<em>:</em>{m} IST</b></span>;
}

// CONTENT.md · Company facts, Products, Home §9 Certifications & downloads, Footer.
const PRODUCTS = [
  ['PLC / SCADA', 'plc-scada'], ['PCC', 'pcc'], ['MCC', 'mcc'], ['Draw-Out MCC / PCC', 'draw-out'], ['APFC', 'apfc'],
  ['VFD Panels', 'vfd'], ['DC Panels', 'dc'], ['Distribution Boards', 'distribution'], ['Control Desk', 'control-desk'], ['Console / Workstation', 'console'],
];
// TODO: CONFIRM — PDFs supplied; droped them in public/downloads/ under these names.
const DOWNLOADS = [
  ['Company Profile', 'COMPANY_PROFILE.pdf'], ['CPRI IP65 Certificate', 'CPRI_IP65_CERTIFICATE.pdf'], ['CPRI 65kA Certificate', 'CPRI_65KA_CERTIFICATE.pdf'], ['ISO Certificate', 'ISO_CERTIFICATE.pdf'],
  ['MSME Certificate', 'MSME_CERTIFICATE.pdf'], ['QAP for Electrical Panels', 'QAP_FOR_ELECTRICAL_PANELS.pdf'], ['QAP for Automation Panels', 'QAP_FOR_AUTOMATION_PANELS.pdf'], ['Transformer Testing Suite Brochure', 'COMPANY_PROFILE1.pdf'],
];
const CERTS = ['CPRI 65kA', 'CPRI IP65', 'ISO certified', 'MSME registered'];

// The page ends the way an engineering drawing does: a ruled title block.
export default function Footer() {
  return (
    <footer className="ft gut">
      <div className="wrap">
        <div className="ft-head">
          <div className="ft-brand">
            <Link className="logo" to="/" aria-label="Electrosoft home">
              <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="#0B5BD3" /></svg>
              ELECTROSOFT
            </Link>
            <p>Electrical control panels, plant automation, instrumentation and transformer testing systems. Designed, built and commissioned since 1989.</p>
          </div>
          <div className="ft-reach">
            <a href={`tel:${TEL}`}>{PHONE}</a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <Link className="pill" to="/contact">Get a Quote</Link>
          </div>
        </div>

        <div className="ft-block">
          <div className="ft-cell">
            <h3>Address</h3>
            <address>S7-1/2, Jai Mata Di Compound, Bhiwandi Road, Kalher, Dist. Thane – 421 302</address>
            <a className="ft-map" href={MAP} target="_blank" rel="noopener noreferrer">Open in Google Maps<span aria-hidden="true">↗</span></a>
            <p className="ft-hours">At work 362 days a year, 14 hours a day.</p>
            <ul className="ft-certs" aria-label="Certifications">{CERTS.map(c => <li key={c}>{c}</li>)}</ul>
          </div>

          <nav className="ft-cell ft-products" aria-label="Products">
            <h3>Products</h3>
            <ul>{PRODUCTS.map(([n, id]) => <li key={id}><Link to={`/products#${id}`}>{n}</Link></li>)}</ul>
          </nav>

          <nav className="ft-cell" aria-label="Downloads">
            <h3>Downloads</h3>
            <ul>{DOWNLOADS.map(([n, f]) => <li key={f}><a href={`/downloads/${f}`} download>{n}<span>PDF</span></a></li>)}</ul>
          </nav>
        </div>

        <div className="ft-bar">
          <span>© {new Date().getFullYear()} Electrosoft Automation Pvt. Ltd.</span>
          <Clock />
          <nav aria-label="Legal">
            <Link to="/track">Track your order</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
