import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Check, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { HELP_TOPICS, currentTopicId } from './help-content';

export function HelpFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [selectedId, setSelectedId] = useState('general');

  // Al abrir, arranca en el tema de la pantalla actual (dinámico).
  useEffect(() => {
    if (open) setSelectedId(currentTopicId(pathname));
  }, [open, pathname]);

  const topic = HELP_TOPICS.find((t) => t.id === selectedId) ?? HELP_TOPICS[0]!;
  const activeByRoute = currentTopicId(pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="¿Cómo funciona?"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition hover:brightness-105 active:scale-95"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden sm:inline">¿Cómo funciona?</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle>¿Cómo funciona?</DialogTitle>
                <DialogDescription>
                  Explora cómo funciona cada parte del CRM.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid max-h-[70vh] grid-cols-1 overflow-hidden sm:grid-cols-[210px_1fr]">
            {/* Menú de temas */}
            <nav className="overflow-y-auto border-b p-2 sm:border-b-0 sm:border-r">
              <ul className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
                {HELP_TOPICS.map((t) => (
                  <li key={t.id} className="shrink-0 sm:shrink">
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        'w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition sm:whitespace-normal',
                        selectedId === t.id
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'hover:bg-muted',
                      )}
                    >
                      {t.title}
                      {t.id === activeByRoute && (
                        <span className="ml-1 text-[10px] text-muted-foreground">• aquí</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contenido del tema */}
            <div className="space-y-3 overflow-y-auto p-5">
              <div>
                <h2 className="text-lg font-semibold">{topic.title}</h2>
                <p className="text-sm text-muted-foreground">{topic.intro}</p>
              </div>

              {topic.sections.map((section) => (
                <div key={section.heading} className="rounded-xl border bg-muted/30 p-4">
                  <h3 className="mb-2.5 text-sm font-semibold text-foreground">
                    {section.heading}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {topic.tip && (
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="leading-relaxed text-foreground">{topic.tip}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
