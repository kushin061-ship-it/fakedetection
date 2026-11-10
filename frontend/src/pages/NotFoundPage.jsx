import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="404 - Page Not Found"
        subtitle="The requested route does not exist or has been relocated within the Fake Review Detection suite."
        badge={
          <Badge variant="fake" size="sm">
            HTTP 404
          </Badge>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Error
          </span>
        }
      />

      <Card className="p-12 text-center max-w-xl mx-auto shadow-soft-md">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Lost in Navigation?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          The path you are trying to access could not be found. Return to the Overview dashboard or use the sidebar navigation.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" icon={Home}>
              Back to Overview
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </Card>
    </div>
  );
}

export default NotFoundPage;
