import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { searchCiiu } from '@/features/prospects/api/prospects.api';

interface Props {
  value: string;
  onChange: (code: string) => void;
}

/** Input con autocompletado del catálogo CIIU (código o descripción). */
export function CiiuPicker({ value, onChange }: Props) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(term, 250);

  const { data } = useQuery({
    queryKey: ['ciiu', 'search', debounced],
    queryFn: () => searchCiiu(debounced),
    enabled: open && debounced.length >= 2,
  });

  return (
    <div className="relative">
      <Input
        value={open ? term : value}
        placeholder="Código o actividad (ej. 8610 u hospital)"
        onFocus={() => {
          setTerm(value);
          setOpen(true);
        }}
        onChange={(e) => setTerm(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && data && data.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {data.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(c.code);
                  setTerm(c.code);
                  setOpen(false);
                }}
              >
                <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                <span className="flex-1">{c.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
