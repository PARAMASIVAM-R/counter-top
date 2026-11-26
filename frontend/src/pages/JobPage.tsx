import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getJob } from '../api';
import { EdgeLegend, LegInputs, MeasurementList, ShapePicker } from '../components/CounterControls';
import { CounterDrawing } from '../components/CounterDrawing';
import { createCounter, measure, validateCounter } from '../counter/shapes';

export function JobPage() {
  const id = Number(useParams().id);
  const { data: job, error } = useQuery({ queryKey: ['jobs', id], queryFn: () => getJob(id) });
  const [counter, setCounter] = useState(() => createCounter('L'));

  if (error) return <p className="errors">{error.message}</p>;
  if (!job) return <p>Loading…</p>;

  const problems = validateCounter(counter);

  return (
    <>
      <div className="page-title">
        <h1>{job.customerName}</h1>
        <p className="muted">{job.material}</p>
      </div>

      <div className="workspace">
        <section className="card drawing-card" aria-label="Drawing">
          <div className="toolbar">
            <ShapePicker kind={counter.kind} onSelect={(kind) => setCounter(createCounter(kind))} />
            <span className="muted">Click an edge to change it, a corner dot to round it</span>
          </div>
          {problems.length > 0 && (
            <ul className="errors" role="alert">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          <CounterDrawing counter={counter} onChange={setCounter} invalid={problems.length > 0} />
          <EdgeLegend />
        </section>

        <aside className="side">
          <section className="card">
            <h2>Sizes</h2>
            <LegInputs counter={counter} onChange={setCounter} />
          </section>
          <section className="card">
            <h2>Measurements</h2>
            {problems.length ? <p className="muted">Fix the sizes to see measurements.</p> : <MeasurementList m={measure(counter)} />}
          </section>
        </aside>
      </div>
    </>
  );
}
