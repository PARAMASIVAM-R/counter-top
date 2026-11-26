import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getJobs, type Job } from '../api';
import { formatMoney } from '../components/QuotePanels';
import { parseDrawing } from '../counter/drawing';

const SHAPE_NAMES = { straight: 'Straight', L: 'L-shape', U: 'U-shape' };

export function JobsPage() {
  const { data: jobs, error } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });

  if (error) return <p className="errors">{error.message}</p>;
  if (!jobs) return <p>Loading…</p>;

  return (
    <>
      <h1>Jobs</h1>
      <table>
        <thead>
          <tr><th>#</th><th>Customer</th><th>Material</th><th>Shape</th><th className="amount">Quote</th></tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td><Link to={`/jobs/${job.id}`}>{job.customerName}</Link></td>
              <td>{job.material}</td>
              <td>{job.drawing ? SHAPE_NAMES[parseDrawing(job.drawing, job.material).counter.kind] : '—'}</td>
              <td className="amount">{quoted(job) ? formatMoney(job.quoteTotal) : <span className="muted">Not quoted</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function quoted(job: Job) {
  return job.drawing !== '';
}
