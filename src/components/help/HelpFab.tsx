import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Check, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getHelpTopic } from './help-content';

export function HelpFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const topic = getHelpTopic(pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="¿Cómo funciona esta pantalla?"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition hover:brightness-105 active:scale-95"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden sm:inline">¿Cómo funciona?</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle>{topic.title} · ¿Cómo funciona?</DialogTitle>
                <DialogDescription>{topic.intro}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {topic.sections.map((section) => (
              <div key={section.heading} className="rounded-xl border bg-muted/30 p-4">
                <h3 className="mb-2.5 text-sm font-semibold text-foreground">{section.heading}</h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {topic.tip && (
            <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="leading-relaxed text-foreground">{topic.tip}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
