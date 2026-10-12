import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DemoPlayground } from '@/components/demo-playground';
import { Brand } from '@/components/brand';
import { pageHead } from '@/lib/site';

export const Route = createFileRoute('/demo')({
  head: () => pageHead('Demo Account', 'Try Aviator, Casino, and Trading games on KSH WIN using demo credits.'),
  component: DemoRoutePage,
});

function DemoRoutePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between border-b pb-4">
        <Brand />
        <div className="flex items-center gap-2">
          <button
            onClick={() => void navigate({ to: '/auth' })}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted"
          >
            Sign In
          </button>
          <button
            onClick={() => void navigate({ to: '/auth' })}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            Create Real Account & Deposit
          </button>
        </div>
      </header>

      <DemoPlayground onGoToAuth={() => void navigate({ to: '/auth' })} />
    </main>
  );
}
