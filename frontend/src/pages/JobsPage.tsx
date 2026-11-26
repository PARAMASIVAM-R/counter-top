import { useQuery } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getJobs, type Job } from '../api';
import { CounterThumbnail } from '../components/CounterThumbnail';
import { formatMoney } from '../components/QuotePanels';
import { parseDrawing } from '../counter/drawing';
import { colorFor, DEFAULT_PRICE_LIST } from '../counter/priceList';

const SHAPE_NAMES = { straight: 'Straight', L: 'L-shape', U: 'U-shape' };
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function JobsPage() {
  const navigate = useNavigate();
  const { data: jobs, error } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });

  if (error) return <p className="errors">{error.message}</p>;
  if (!jobs) return <p>Loading…</p>;

  if (jobs.length === 0) {
    return (
      <>
        <h1>Jobs</h1>
        <section className="card empty-state">
          <h2>No jobs yet</h2>
          <p>Create a job for a customer, draw their counter, and see the price as you go.</p>
          <Link to="/jobs/new" className="button">Create the first job</Link>
        </section>
      </>
    );
  }

  const quotedCount = jobs.filter(isQuoted).length;
  // The name cell holds a real link for keyboards and screen readers; the rest of the row is a mouse shortcut to it.
  const openRow = (job: Job) => (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('a')) navigate(`/jobs/${job.id}`);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Jobs</h1>
          <p className="muted page-intro">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} · {quotedCount} quoted. Open a job to draw the counter and price it.
          </p>
        </div>
      </div>
      <table className="jobs">
        <thead>
          <tr>
            <th aria-label="Shape preview" />
            <th>Customer</th>
            <th>Shape</th>
            <th>Created</th>
            <th className="amount">Quote</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const quoted = isQuoted(job);
            const { counter, options } = parseDrawing(job.drawing, job.material);
            const material = DEFAULT_PRICE_LIST.materials.find((m) => m.id === options.materialId) ?? DEFAULT_PRICE_LIST.materials[0];
            const color = colorFor(material, options.colorId, options.level);
            return (
              <tr key={job.id} className="job-row" onClick={openRow(job)}>
                <td className="thumb-cell">
                  {quoted ? <CounterThumbnail counter={counter} color={color} /> : <span className="thumbnail thumbnail-empty" />}
                </td>
                <td>
                  <Link to={`/jobs/${job.id}`} className="job-name">{job.customerName}</Link>
                  <div className="hint">{quoted ? `${color.name} ${material.name.toLowerCase()}` : job.material}</div>
                </td>
                <td>{quoted ? SHAPE_NAMES[counter.kind] : <span className="muted">—</span>}</td>
                <td className="muted">{dateFormat.format(new Date(job.createdDate))}</td>
                <td className="amount">
                  {quoted ? <strong>{formatMoney(job.quoteTotal)}</strong> : <span className="badge">Not quoted yet</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function isQuoted(job: Job) {
  return job.drawing !== '';
}
