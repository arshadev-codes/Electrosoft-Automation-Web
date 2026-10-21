import { Link } from 'react-router-dom';

// CONTENT.md · Company facts, Products, Home §9 Certifications & downloads, Footer.
const PRODUCTS = [
  ['PLC / SCADA', 'plc-scada'], ['PCC', 'pcc'], ['MCC', 'mcc'], ['Draw-Out MCC / PCC', 'draw-out'], ['APFC', 'apfc'],
  ['VFD Panels', 'vfd'], ['DC Panels', 'dc'], ['Distribution Boards', 'distribution'], ['Control Desk', 'control-desk'], ['Console / Workstation', 'console'],
];
// TODO: CONFIRM — PDFs not supplied yet; drop them in public/downloads/ under these names.
const DOWNLOADS = [
  ['Company Profile', 'company-profile.pdf'], ['CPRI IP65 Certificate', 'cpri-ip65.pdf'], ['CPRI 65kA Certificate', 'cpri-65ka.pdf'], ['ISO Certificate', 'iso.pdf'],
  ['MSME Certificate', 'msme.pdf'], ['QAP for Electrical Panels', 'qap-electrical.pdf'], ['QAP for Automation Panels', 'qap-automation.pdf'], ['Transformer Testing Suite Brochure', 'testing-brochure.pdf'],
];
const CERTS = ['CPRI 65kA', 'CPRI IP65', 'ISO certified', 'MSME registered'];

export default function Footer() {
  return (
    <footer className="ft gut">
      <div className="wrap">
        <div className="ft-grid">
          <div className="ft-brand">
            <Link className="logo" to="/" aria-label="Electrosoft home">
              <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="#0B5BD3" /></svg>
              ELECTROSOFT
            </Link>
            <p>Electrical control panels, plant automation, instrumentation and transformer testing systems. Designed, built and commissioned since 1989.</p>
            <ul className="ft-certs" aria-label="Certifications">{CERTS.map(c => <li key={c}>{c}</li>)}</ul>
          </div>

          <div>
            <h3>Contact</h3>
            <address>
              <a href="tel:+918692888444">+91 86928 88444</a>
              <a href="mailto:info@electrosoftindia.com">info@electrosoftindia.com</a>
              <span>S7-1/2, Jai Mata Di Compound, Bhiwandi Road, Kalher, Dist. Thane – 421 302</span>
            </address>
            <Link className="pill" to="/contact">Get a Quote</Link>
          </div>

          <nav aria-label="Products">
            <h3>Products</h3>
            <ul>{PRODUCTS.map(([n, id]) => <li key={id}><Link to={`/products#${id}`}>{n}</Link></li>)}</ul>
          </nav>

          <nav aria-label="Downloads">
            <h3>Downloads</h3>
            <ul>{DOWNLOADS.map(([n, f]) => <li key={f}><a href={`/downloads/${f}`} download>{n}<span>PDF</span></a></li>)}</ul>
          </nav>
        </div>

        <div className="ft-bar">
          <span>© {new Date().getFullYear()} Electrosoft Automation Pvt. Ltd.</span>
          <nav aria-label="Legal">
            <Link to="/track">Track your order</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </nav>
        </div>
      </div>
      <div className="ft-mark" aria-hidden="true">ELECTROSOFT</div>
    </footer>
  );
}
