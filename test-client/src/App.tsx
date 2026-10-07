import "./App.css";

import { useItems } from "./hooks/useItems";
import { ItemRow } from "./components/ItemRow/ItemRow";

function App() {
  const {
    items,
    selectedItems,
    loading,
    error,
    hasMore,
    loadMore,
    select,
    unselect,
  } = useItems();

  return (
    <div className="app">
      <h1>ID Selector</h1>

      <div className="lists">
        <section>
          <h2>Available</h2>

          {loading && items.length === 0 && <p>Loading...</p>}

          {error && <p>{error}</p>}

          {items.map((id) => (
            <ItemRow key={id} id={id} onClick={select} />
          ))}

          {hasMore && (
            <button type="button" onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </section>

        <section>
          <h2>Selected</h2>

          {selectedItems.map((id) => (
            <ItemRow key={id} id={id} onClick={unselect} />
          ))}
        </section>
      </div>
    </div>
  );
}

export default App;
