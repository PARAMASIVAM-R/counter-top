import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router-dom';
import { JobPage } from './pages/JobPage';
import { JobsPage } from './pages/JobsPage';
import { NewJobPage } from './pages/NewJobPage';
import './index.css';

function Layout() {
  return (
    <>
      <header className="app-header">
        <Link to="/" className="app-title">Counter Quote</Link>
        <Link to="/jobs/new" className="button">New job</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

// A data router, so the job page can warn before leaving with unsaved changes (useBlocker).
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <JobsPage /> },
      { path: '/jobs/new', element: <NewJobPage /> },
      { path: '/jobs/:id', element: <JobPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
