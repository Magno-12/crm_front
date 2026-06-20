import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldX className="h-14 w-14 text-destructive" />
      <div>
        <h1 className="text-2xl font-bold">Acceso denegado</h1>
        <p className="mt-1 text-muted-foreground">
          No tienes permisos para ver esta sección. Contacta a un administrador.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
