import type { ComponentType } from 'react';
import {
  IconAsterisco,
  IconBandaAprox,
  IconBandeja,
  IconBrotesIc,
  IconCapsula,
  IconCarta,
  IconCobertura,
  IconCopoNieve,
  IconCuchara,
  IconEscudoB12,
  IconEspiga,
  IconEstrellaBrotada,
  IconFlor,
  IconFrasco,
  IconFrascoFermento,
  IconHeladera,
  IconHojaCaida,
  IconHojaEntera,
  IconHojaMedia,
  IconHojaPunteada,
  IconLibro,
  IconLlama,
  IconMortero,
  IconPlato,
  IconRamaBifurca,
  IconReloj,
  IconSemanaArco,
  IconSol,
  IconSustituir,
  IconTemporada,
  IconZanahoria,
  type IconProps,
} from './icons';

/**
 * Catálogo del set de íconos: cada uno con su significado. Lo consume la
 * pestaña "Íconos" del Glosario (pedido explícito de Facu: todo ícono explicado).
 */

export interface CatalogEntry {
  id: string;
  Componente: ComponentType<IconProps>;
  significado: string;
  /** Categoría de receta que representa, cuando el ícono es de tipo: la usa el tema para colorearlo. */
  cat?: 'principal' | 'dulce' | 'preparado' | 'pan' | 'conserva';
  grupo: 'semáforo' | 'ventana' | 'datos' | 'tipo de receta' | 'prácticos' | 'alerta' | 'extras' | 'navegación';
}

export const ICON_CATALOG: CatalogEntry[] = [
  { id: 'hoja-entera', Componente: IconHojaEntera, significado: 'Nutriente cubierto en su ventana (≥90 %)', grupo: 'semáforo' },
  { id: 'hoja-media', Componente: IconHojaMedia, significado: 'Cobertura parcial del objetivo (60–90 %)', grupo: 'semáforo' },
  { id: 'hoja-caida', Componente: IconHojaCaida, significado: 'Insuficiente en su ventana (<60 %)', grupo: 'semáforo' },
  { id: 'capsula', Componente: IconCapsula, significado: 'Cubierto por suplemento declarado', grupo: 'semáforo' },
  { id: 'hoja-punteada', Componente: IconHojaPunteada, significado: 'Sin datos suficientes en la ventana', grupo: 'semáforo' },
  { id: 'sol', Componente: IconSol, significado: 'Nutriente que se evalúa por día', grupo: 'ventana' },
  { id: 'semana-arco', Componente: IconSemanaArco, significado: 'Se evalúa por semana (móvil de 7 días)', grupo: 'ventana' },
  { id: 'banda-aprox', Componente: IconBandaAprox, significado: 'Valor con banda de incertidumbre (rango)', grupo: 'datos' },
  { id: 'brotes-ic', Componente: IconBrotesIc, significado: 'Índice de confianza del dato (1 a 3 brotes)', grupo: 'datos' },
  { id: 'cobertura', Componente: IconCobertura, significado: 'Cobertura del cálculo: % del peso con dato', grupo: 'datos' },
  { id: 'mortero', Componente: IconMortero, significado: 'Receta salada', cat: 'principal', grupo: 'tipo de receta' },
  { id: 'flor', Componente: IconFlor, significado: 'Receta dulce', cat: 'dulce', grupo: 'tipo de receta' },
  { id: 'espiga', Componente: IconEspiga, significado: 'Pan / masa', cat: 'pan', grupo: 'tipo de receta' },
  { id: 'frasco', Componente: IconFrasco, significado: 'Preparado: componente reutilizable', cat: 'preparado', grupo: 'tipo de receta' },
  {
    id: 'frasco-fermento',
    Componente: IconFrascoFermento,
    significado: 'Conserva o fermento (escabeches, encurtidos)',
    cat: 'conserva',
    grupo: 'tipo de receta',
  },
  { id: 'rama-bifurca', Componente: IconRamaBifurca, significado: 'Variante de otra receta', grupo: 'tipo de receta' },
  { id: 'bandeja', Componente: IconBandeja, significado: 'Combo (plato compuesto)', cat: 'principal', grupo: 'tipo de receta' },
  { id: 'reloj', Componente: IconReloj, significado: 'Tiempo total (preparación + cocción)', grupo: 'prácticos' },
  { id: 'llama', Componente: IconLlama, significado: 'Dificultad (1 a 3 llamas)', grupo: 'prácticos' },
  { id: 'plato', Componente: IconPlato, significado: 'Porciones que rinde', grupo: 'prácticos' },
  { id: 'asterisco', Componente: IconAsterisco, significado: 'Ingrediente imprescindible del plato', grupo: 'prácticos' },
  { id: 'sustituir', Componente: IconSustituir, significado: 'Sustituible / sustitución disponible', grupo: 'prácticos' },
  { id: 'copo-nieve', Componente: IconCopoNieve, significado: 'Va bien al freezer', grupo: 'prácticos' },
  { id: 'heladera', Componente: IconHeladera, significado: 'Guarda en heladera (días)', grupo: 'prácticos' },
  { id: 'temporada', Componente: IconTemporada, significado: 'En temporada (AMBA)', grupo: 'prácticos' },
  { id: 'escudo-b12', Componente: IconEscudoB12, significado: 'Advertencia B12: levadura no siempre fortificada', grupo: 'alerta' },
  { id: 'estrella-brotada', Componente: IconEstrellaBrotada, significado: 'Candidata a clásica / probada y aprobada', grupo: 'extras' },
  { id: 'cuchara', Componente: IconCuchara, significado: 'Indulgente: para disfrutar sin cuentas', grupo: 'extras' },
  { id: 'carta', Componente: IconCarta, significado: 'Sección Recetario', grupo: 'navegación' },
  { id: 'zanahoria', Componente: IconZanahoria, significado: 'Sección Ingredientes', grupo: 'navegación' },
  { id: 'libro', Componente: IconLibro, significado: 'Sección Glosario', grupo: 'navegación' },
];
