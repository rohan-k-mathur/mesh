// ResizeHandle.tsx
import styles from './resize-handles.module.css';


export function ResizeHandle({
  corner,
  onPointerDown,
}: {
  corner: 'nw' | 'ne' | 'sw' | 'se';
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className={`${styles.base} ${styles[corner]}`}   // gives you 8×8 square
      onPointerDown={onPointerDown}
    />
  );
}
