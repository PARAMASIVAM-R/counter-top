import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useBlocker, useParams } from 'react-router-dom';
import { getJob, type Job, updateJob } from '../api';
import { EdgeLegend, LegInputs, ShapePicker } from '../components/CounterControls';
import { CounterDrawing } from '../components/CounterDrawing';
import { OptionsPanel, QuotePanel } from '../components/QuotePanels';
import { type Drawing, materialName, parseDrawing, serializeDrawing } from '../counter/drawing';
import { DEFAULT_PRICE_LIST } from '../counter/priceList';
import { quote as priceQuote } from '../counter/quote';
import { createCounter, validateCounter } from '../counter/shapes';

const prices = DEFAULT_PRICE_LIST;

export function JobPage() {
  const id = Number(useParams().id);
  const { data: job, error } = useQuery({ queryKey: ['jobs', id], queryFn: () => getJob(id) });

  if (error) return <p className="errors">{error.message}</p>;
  if (!job) return <p>Loading…</p>;
  // Keyed by job, so the editor's state starts fresh from what was saved.
  return <JobEditor key={job.id} job={job} />;
}

function JobEditor({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const [drawing, setDrawing] = useState<Drawing>(() => parseDrawing(job.drawing, job.material));
  // What is in the database ('' if never quoted), and what the page started with, to tell whether anything changed.
  const [savedJson, setSavedJson] = useState(() => (job.drawing ? serializeDrawing(drawing) : ''));
  const [startJson] = useState(() => serializeDrawing(drawing));
  const { counter, options } = drawing;

  const json = serializeDrawing(drawing);
  const neverSaved = savedJson === '';
  const dirty = json !== (neverSaved ? startJson : savedJson);
  const problems = validateCounter(counter);
  const quote = useMemo(() => priceQuote(counter, options, prices), [counter, options]);

  const save = useMutation({
    mutationFn: () => updateJob({ ...job, material: materialName(options.materialId), drawing: json, quoteTotal: quote.total }),
    onSuccess: (saved) => {
      setSavedJson(saved.drawing);
      queryClient.setQueryData(['jobs', job.id], saved);
      queryClient.invalidateQueries({ queryKey: ['jobs'], exact: true });
    },
  });
  const canSave = (dirty || neverSaved) && problems.length === 0 && !save.isPending;

  useUnsavedChangesWarning(dirty);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (canSave) save.mutate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canSave, save]);

  const status = save.isPending ? 'Saving…' : dirty ? 'Unsaved changes' : neverSaved ? 'Not quoted yet' : 'Saved';

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>{job.customerName}</h1>
          <span className={`status${dirty ? ' status-dirty' : ''}`}>{status}</span>
        </div>
        <button type="button" className="button" disabled={!canSave} onClick={() => save.mutate()} title="Save (Ctrl+S)">
          Save quote
        </button>
      </div>
      {save.error && <p className="errors">Could not save: {save.error.message}</p>}

      <div className="workspace">
        <div className="main-column">
          <section className="card drawing-card" aria-label="Drawing">
            <div className="toolbar">
              <ShapePicker kind={counter.kind} onSelect={(kind) => setDrawing({ ...drawing, counter: createCounter(kind) })} />
              <span className="muted">Click an edge to change it, a corner dot to round it</span>
            </div>
            {problems.length > 0 && (
              <ul className="errors" role="alert">
                {problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            <CounterDrawing counter={counter} onChange={(c) => setDrawing({ ...drawing, counter: c })} invalid={problems.length > 0} />
            <EdgeLegend />
          </section>

          <div className="panels">
            <section className="card">
              <h2>Sizes</h2>
              <LegInputs counter={counter} onChange={(c) => setDrawing({ ...drawing, counter: c })} />
            </section>
            <section className="card">
              <h2>Stone and options</h2>
              <OptionsPanel options={options} prices={prices} onChange={(o) => setDrawing({ ...drawing, options: o })} />
            </section>
          </div>
        </div>

        <aside className="card quote-card" aria-label="Quote">
          <h2>Quote</h2>
          <QuotePanel quote={quote} minimumJob={prices.minimumJob} />
        </aside>
      </div>
    </>
  );
}

/** Asks before leaving the page, by link or by closing the tab, when there are unsaved changes. */
function useUnsavedChangesWarning(when: boolean) {
  const blocker = useBlocker(when);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('You have unsaved changes to this quote. Leave without saving?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);
}
