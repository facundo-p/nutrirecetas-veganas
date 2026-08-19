export function IngredientDetail({ id }: { id: string }) {
  return (
    <header className="encabezado-pantalla">
      <span className="etiqueta-seccion">Ingrediente</span>
      <h1>{id}</h1>
    </header>
  );
}
