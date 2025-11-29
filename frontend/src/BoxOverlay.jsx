export default function BoxOverlay({ boxes }) {
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
            }}
        >
            {Object.keys(boxes).map((pageKey) =>
                boxes[pageKey].map((b, idx) => (
                    <div
                        key={`${pageKey}-${idx}`}
                        style={{
                            position: "absolute",
                            border: "1px solid red",
                            top: b.y0,
                            left: b.x0,
                            width: b.x1 - b.x0,
                            height: b.y1 - b.y0,
                        }}
                    />
                ))
            )}
        </div>
    );
}
