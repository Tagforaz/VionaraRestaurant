import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, Loader2, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AddressResult {
  displayName: string;
  street: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// ─── Photon API ───────────────────────────────────────────────────────────────
async function searchPhoton(query: string): Promise<AddressResult[]> {
  if (query.length < 3) return [];

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '6');
  url.searchParams.set('lang', 'en');      // Photon yalnız: de, en, fr, it dəstəkləyir
  url.searchParams.set('lat', '40.4093');  // Bakı mərkəzi — bias
  url.searchParams.set('lon', '49.8671');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data: PhotonResponse = await res.json();
  return data.features.map(parsePhotonFeature).filter(Boolean) as AddressResult[];
}

function parsePhotonFeature(feature: PhotonFeature): AddressResult | null {
  const p = feature.properties as any;
  const [lng, lat] = feature.geometry.coordinates;

  // Azərbaycan dışındakı nəticələri filtrələ
  if (p.countrycode && p.countrycode !== 'AZ') return null;

  // Küçə: street + housenumber, yoxsa name
  const streetName  = p.street || p.name || '';
  const houseNumber = p.housenumber ? ` ${p.housenumber}` : '';
  const street      = `${streetName}${houseNumber}`.trim();

  // Şəhər
  const city = p.city || p.county || p.state || 'Bakı';

  // Display name
  const parts = [street, city].filter(Boolean);
  const displayName = parts.join(', ');

  return {
    displayName,
    street: street || city,
    city,
    country: 'Azərbaycan',
    latitude: lat,
    longitude: lng,
  };
}

function dedup(results: AddressResult[]): AddressResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export const AddressAutocomplete = ({
  value, onChange, onSelect,
  placeholder = 'Küçə, məhəllə yazın...',
  required, className,
}: AddressAutocompleteProps) => {
  const [results, setResults]     = useState<AddressResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [selected, setSelected]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Kənara klikdə bağla
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = useCallback((val: string) => {
    onChange(val);
    setSelected(false);
    setActiveIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const parsed = dedup(await searchPhoton(val));
        setResults(parsed);
        setOpen(parsed.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [onChange]);

  const handleSelect = (result: AddressResult) => {
    setSelected(true);
    setOpen(false);
    setResults([]);
    setActiveIdx(-1);
    onSelect(result);
  };

  const handleClear = () => {
    onChange('');
    setSelected(false);
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        {selected
          ? <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          : <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        }
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && !selected && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10 pr-9',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            selected && 'border-green-500 focus-visible:ring-green-400'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : value
              ? <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
              : null
          }
        </div>
      </div>

      {/* Min chars hint */}
      {!open && !selected && value.length > 0 && value.length < 3 && (
        <p className="mt-1 text-xs text-muted-foreground">Axtarmaq üçün ən az 3 hərf yazın</p>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-xl overflow-hidden">
          <ul className="max-h-64 overflow-y-auto py-1">
            {results.map((result, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm flex items-start gap-2 transition-colors',
                    idx === activeIdx
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <MapPin className={cn(
                    'h-4 w-4 shrink-0 mt-0.5',
                    idx === activeIdx ? 'text-primary-foreground' : 'text-primary'
                  )} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {result.street}
                    </p>
                    <p className={cn(
                      'text-xs truncate',
                      idx === activeIdx ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {result.city}, {result.country}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">© OpenStreetMap · Photon</p>
          </div>
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && !loading && value.length >= 3 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-xl p-3 text-center">
          <p className="text-sm text-muted-foreground">Ünvan tapılmadı</p>
          <p className="text-xs text-muted-foreground mt-1">Küçə və ya məhəllə adını daha ətraflı yazın</p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;