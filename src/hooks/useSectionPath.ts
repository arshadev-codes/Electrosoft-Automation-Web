import { createContext, useContext } from 'react';

/**
 * Provides the URL prefix for the current site section.
 * '' for the testing section (root), '/panel' for the panels section.
 *
 * Usage in any component:
 *   const { p, toPath, isPanel } = useSectionPath();
 *   <Link to={p('/contact')}>Contact</Link>  // → '/contact' or '/panel/contact'
 *   <Link to={p('/')}>Home</Link>            // → '/' or '/panel'
 */
export const SectionContext = createContext<string>('');

/**
 * Returns path builders and section info.
 * The root path '/' maps to the section home ('/panel' or '/').
 */
export function useSectionPath() {
  const base = useContext(SectionContext);
  const isPanel = base === '/panel';
  const p = (path: string): string => {
    if (path === '/') return base === '' ? '/' : base;
    return `${base}${path}`;
  };
  return { base, isPanel, p, toPath: p };
}
