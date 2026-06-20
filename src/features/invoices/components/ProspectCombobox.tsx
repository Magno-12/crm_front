import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { listProspects } from '@/features/prospects/api/prospects.api';

interface Props {
  value: string;
  onChange: (id: string, label: string) => void;
}

const MIN_CHARS = 2;

/** Autocompletado de prospectos: escribe y aparecen coincidencias en vivo. */
export function ProspectCombobox({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const blurTimer = useRef<number | undefined>(undefined);
  const debounced = useDebounce(query.trim(), 250);

  const { data, isFetching } = useQuery({
    queryKey: ['prospects', 'combobox', debounced],
    queryFn: () => listProspects({ q: debounced, page: 1, page_size: 25 }),
    enabled: open && debounced.length >= MIN_CHARS,
  });

  const results = data?.items ?? [];

  const select = (id: string, label: string) => {
    onChange(id, label);
    setSelectedLabel(label);
    setQuery(label);
    setOpen(false);
  };

  const clear = () => {
    onChange('', '');
    setSelectedLabel('');
    setQuery('');
    setOpen(true);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          placeholder="Escribe razón social o NIT (mín. 2 letras)…"
          className="pl-9 pr-9"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange('', ''); // al reescribir, deselecciona
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 150);
          }}
          aria-label="Buscar prospecto"
          autoComplete="off"
        />
        {(value || query) && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        )}
      </div>

      {value && selectedLabel && !open && (
        <p className="mt-1 flex items-center gap-1 text-xs text-success">
          <Check className="h-3 w-3" /> Seleccionado
        </p>
      )}

      {open && debounced.length >= MIN_CHARS && (
        <div
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-elevated"
          onMouseDown={(e) => {
            // Evita que el blur del input cierre antes del click.
            e.preventDefault();
            window.clearTimeout(blurTimer.current);
          }}
        >
          {isFetching && results.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">Sin coincidencias.</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => select(p.id, p.razon_social)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                  value === p.id && 'bg-accent',
                )}
              >
                <span className="font-medium">{p.razon_social}</span>
                <span className="text-xs text-muted-foreground">
                  NIT {p.nit}
                  {p.ciudad ? ` · ${p.ciudad}` : ''}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
