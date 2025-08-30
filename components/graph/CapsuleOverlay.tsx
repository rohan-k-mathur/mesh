// components/graph/CapsuleOverlay.tsx
type Capsule = { id: string; nodeIds: string[]; color: string; label?: string };
export default function CapsuleOverlay({ cy, capsules }: { cy: cytoscape.Core | null; capsules: Capsule[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!cy || !ref.current) return;
    const ctx = ref.current.getContext('2d')!;
    const draw = () => {
      const rect = cy.container().getBoundingClientRect();
      ref.current!.width = rect.width; ref.current!.height = rect.height;
      ctx.clearRect(0,0,rect.width,rect.height);
      capsules.forEach(({ nodeIds, color }) => {
        const pts = nodeIds
          .map(id => cy.getElementById(id))
          .filter(n => n.nonempty())
          .map(n => cy.renderer().projectIntoViewport(n.position('x'), n.position('y')))
          .map(([x,y]) => ({ x, y }));
        if (pts.length < 3) return;
        const hull = convexHull(pts); // implement monotone chain (10 lines)
        ctx.beginPath();
        ctx.moveTo(hull[0].x, hull[0].y);
        hull.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = `${color}22`; // translucent fill
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = 2;
        ctx.fill(); ctx.stroke();
      });
    };
    draw();
    cy.on('pan zoom drag free layoutstop add remove position', draw);
    return () => { cy.off('pan zoom drag free layoutstop add remove position', draw); };
  }, [cy, capsules]);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />;
}
