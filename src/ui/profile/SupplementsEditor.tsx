import { useState } from 'react';
import type { SuplementoDeclarado } from '../../db/schema';
import type { Nutrient } from '../../seed/schema';
import { amountUnitOf } from '../../domain/units';
import { aporteDiarioEquivalente } from '../../domain/supplements';
import { formatNumber } from '../common/format';

/**
 * Suplementos declarados. No es un detalle administrativo: un suplemento que
 * cumple el esquema apaga la exigencia alimentaria de ese nutriente, así que la
 * app muestra el equivalente diario para que se vea por qué cubre (o por qué no).
 */

const FRECUENCIAS: Array<{ valor: SuplementoDeclarado['frecuencia']; etiqueta: string }> = [
  { valor: 'diaria', etiqueta: 'todos los días' },
  { valor: '3x_semana', etiqueta: '3 veces por semana' },
  { valor: '2x_semana', etiqueta: '2 veces por semana' },
  { valor: 'semanal', etiqueta: '1 vez por semana' },
];

interface Props {
  suplementos: SuplementoDeclarado[];
  nutrientes: Nutrient[];
  onChange: (siguiente: SuplementoDeclarado[]) => void;
}

export function SupplementsEditor({ suplementos, nutrientes, onChange }: Props) {
  const [nutrienteId, setNutrienteId] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState<SuplementoDeclarado['frecuencia']>('diaria');

  const nutrientePorId = new Map(nutrientes.map((n) => [n.id, n]));

  const agregar = () => {
    const nutriente = nutrientePorId.get(nutrienteId);
    if (!nutriente || Number(dosis) <= 0) return;
    onChange([
      ...suplementos,
      {
        nutriente_id: nutriente.id,
        dosis: Number(dosis),
        unidad: amountUnitOf(nutriente.clave_ingrediente),
        frecuencia,
      },
    ]);
    setNutrienteId('');
    setDosis('');
    setFrecuencia('diaria');
  };

  return (
    <fieldset className="campo">
      <legend className="campo-etiqueta">Suplementos que tomás</legend>
      <p className="campo-ayuda">
        Si un suplemento cubre el objetivo del nutriente, el semáforo deja de exigirlo por comida.
      </p>

      {suplementos.length > 0 && (
        <ul className="lista-suplementos">
          {suplementos.map((s, i) => {
            const nutriente = nutrientePorId.get(s.nutriente_id);
            const frec = FRECUENCIAS.find((f) => f.valor === s.frecuencia)!;
            return (
              <li key={`${s.nutriente_id}-${i}`} className="suplemento">
                <span>
                  <strong>{nutriente?.nombre ?? s.nutriente_id}</strong> · {formatNumber(s.dosis, 0)} {s.unidad}{' '}
                  {frec.etiqueta}
                  <em className="campo-ayuda"> equivale a {formatNumber(aporteDiarioEquivalente(s), 1)} {s.unidad}/día</em>
                </span>
                <button
                  type="button"
                  className="boton-chico"
                  onClick={() => onChange(suplementos.filter((_, j) => j !== i))}
                  aria-label={`Quitar ${nutriente?.nombre ?? s.nutriente_id}`}
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="campos-fila">
        <label className="campo">
          <span className="campo-etiqueta">Nutriente</span>
          <select value={nutrienteId} onChange={(e) => setNutrienteId(e.target.value)} aria-label="Nutriente del suplemento">
            <option value="">Elegir…</option>
            {nutrientes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="campo-etiqueta">
            Dosis {nutrienteId !== '' && `(${amountUnitOf(nutrientePorId.get(nutrienteId)!.clave_ingrediente)})`}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            aria-label="Dosis del suplemento"
          />
        </label>
        <label className="campo">
          <span className="campo-etiqueta">Cada cuánto</span>
          <select
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value as SuplementoDeclarado['frecuencia'])}
            aria-label="Frecuencia del suplemento"
          >
            {FRECUENCIAS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="button" className="boton-secundario" onClick={agregar} disabled={nutrienteId === '' || Number(dosis) <= 0}>
        Agregar suplemento
      </button>
    </fieldset>
  );
}
