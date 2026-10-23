import { FranjaDeNutriente } from './BarraDeAporte';
import { CuadradoDeNutriente } from './CuadradoDeNutriente';
import { PuntoDeNutriente } from './PuntoDeNutriente';

/**
 * El vocabulario de color, para el catálogo del Glosario. No son íconos sino
 * las piezas reales de la app, con un ejemplo: si cambia la pieza, cambia acá.
 * Ocultas al lector de pantalla porque el significado va al lado, en texto.
 */

export function GlifoCuadrados({ className }: { className?: string }) {
  return (
    <span className={className ? `glifo-color ${className}` : 'glifo-color'} aria-hidden="true">
      <CuadradoDeNutriente nutrienteId="hierro" />
      <CuadradoDeNutriente nutrienteId="hierro" aporta={false} />
      <CuadradoDeNutriente nutrienteId="yodo" />
    </span>
  );
}

export function GlifoPuntos({ className }: { className?: string }) {
  return (
    <span className={className ? `glifo-color ${className}` : 'glifo-color'} aria-hidden="true">
      <PuntoDeNutriente punto="calcio" />
      <PuntoDeNutriente punto="ninguno" />
      <PuntoDeNutriente punto="condicional" />
    </span>
  );
}

const BARRA_DE_EJEMPLO = [
  { nutriente: 'hierro', relleno: 80 },
  { nutriente: 'magnesio', relleno: 45 },
  { nutriente: 'vitc', relleno: 100 },
  { nutriente: 'folato', relleno: 30 },
  { nutriente: 'proteina', relleno: 60 },
  { nutriente: 'fibra', relleno: 50 },
];

export function GlifoBarra({ className }: { className?: string }) {
  return (
    <span className={className ? `glifo-color ${className}` : 'glifo-color'} aria-hidden="true">
      <span className="barra-aporte glifo-barra">
        {BARRA_DE_EJEMPLO.map(({ nutriente, relleno }) => (
          <FranjaDeNutriente key={nutriente} nutrienteId={nutriente} relleno={relleno} />
        ))}
      </span>
    </span>
  );
}
