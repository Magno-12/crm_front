import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { withSampleData } from '@/features/emails/lib/templates';
import type { EmailTemplateRead } from '@/types/api';

export function TemplatePreviewDialog({
  template,
  onOpenChange,
}: {
  template: EmailTemplateRead | null;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{template?.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">Asunto: {template?.subject}</p>
        </DialogHeader>
        {template && (
          <iframe
            title="preview"
            srcDoc={withSampleData(template.body_html)}
            className="h-[70vh] w-full bg-white"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
