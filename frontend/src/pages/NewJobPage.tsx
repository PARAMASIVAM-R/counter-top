import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../api';
import { DEFAULT_PRICE_LIST } from '../counter/priceList';

const MATERIALS = DEFAULT_PRICE_LIST.materials.map((m) => m.name);

export function NewJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState('');
  const [material, setMaterial] = useState(MATERIALS[0]);

  const save = useMutation({
    mutationFn: createJob,
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${job.id}`);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ customerName: customerName.trim(), material });
  };

  return (
    <>
      <h1>New job</h1>
      <p className="muted page-intro">Who is it for, and which stone are they thinking of? Next you'll draw the counter and see the price.</p>
      {save.error && <p className="errors">{save.error.message}</p>}
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Customer
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Rivera kitchen"
            autoFocus
            required
          />
        </label>
        <div className="field">
          <span className="field-label">Material</span>
          <div className="segmented segmented-small" role="radiogroup" aria-label="Material">
            {MATERIALS.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={m === material} className={m === material ? 'active' : ''} onClick={() => setMaterial(m)}>
                {m}
              </button>
            ))}
          </div>
          <span className="hint">You can change it, and pick the exact stone colour, on the next screen.</span>
        </div>
        <button type="submit" className="button" disabled={save.isPending || !customerName.trim()}>
          {save.isPending ? 'Creating…' : 'Create job and draw counter'}
        </button>
      </form>
    </>
  );
}
