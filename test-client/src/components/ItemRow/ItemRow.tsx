interface ItemRowProps {
  id: number;
  onClick: (id: number) => void;
}

export function ItemRow({ id, onClick }: ItemRowProps) {
  return (
    <button type="button" className="item-row" onClick={() => onClick(id)}>
      {id}
    </button>
  );
}
