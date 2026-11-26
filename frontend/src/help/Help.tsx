import { createContext, type ReactNode, useContext } from 'react';
import { GLOSSARY } from './glossary';

/** Shows a glossary entry in the help box. A no-op where there is no help box. */
const ShowHelp = createContext<(id: string) => void>(() => {});

export const HelpProvider = ShowHelp.Provider;

export function useShowHelp() {
  return useContext(ShowHelp);
}

/** A trade word: point at it, focus it or tap it to see what it means. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const show = useShowHelp();
  if (!GLOSSARY[id]) return <>{children}</>;
  return (
    <span className="term" tabIndex={0} onMouseEnter={() => show(id)} onFocus={() => show(id)} onClick={() => show(id)}>
      {children}
    </span>
  );
}

export function HelpBox({ id }: { id: string | null }) {
  const entry = id ? GLOSSARY[id] : null;
  return (
    <section className="card help-box" aria-live="polite" aria-label="What does this mean?">
      <h2>What does this mean?</h2>
      {entry ? (
        <>
          <h3>{entry.title}</h3>
          {entry.picture}
          <p>{entry.text}</p>
        </>
      ) : (
        <p className="muted">
          Point at any <span className="term">underlined word</span>, or anything on the drawing, to see what it means in plain words.
        </p>
      )}
    </section>
  );
}
