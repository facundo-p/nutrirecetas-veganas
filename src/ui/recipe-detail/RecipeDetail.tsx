export function RecipeDetail({ id }: { id: string }) {
  return (
    <header className="encabezado-pantalla">
      <span className="etiqueta-seccion">Receta</span>
      <h1>{id}</h1>
    </header>
  );
}
