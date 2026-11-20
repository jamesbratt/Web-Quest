const POINT_SPACING = 35
const ELEVATION_STEP = 30

export function createGroundProfile (nodes, right, bottom) {
    const points = []
    let x = -15
    let y = bottom - 35

    const addPoint = () => {
        points.push({ x, y: Math.max(48, Math.min(y, bottom)) })
    }

    const visit = (children, nested = false) => {
        children.forEach((node, index) => {
            x += POINT_SPACING
            const lastAtRoot = !nested && index === children.length - 1
            if (!lastAtRoot) addPoint()

            if (node.children.length > 0) {
                y -= ELEVATION_STEP
                visit(node.children, true)
            }
        })

        if (nested) {
            x += POINT_SPACING
            y += ELEVATION_STEP
            addPoint()
        }
    }

    visit(nodes)
    if (points.length === 0) return () => bottom

    points.unshift({ x: 0, y: points[0].y })
    const last = points[points.length - 1]
    if (last.x < right) {
        points.push({ x: Math.min(right, last.x + POINT_SPACING), y: bottom })
    }

    const slopes = points.slice(1).map((point, i) => (point.y - points[i].y) / (point.x - points[i].x))
    const tangents = points.map((_, i) => {
        const before = slopes[i - 1]
        const after = slopes[i]
        // Flatten extrema and use a harmonic mean elsewhere to avoid overshoot.
        return before * after > 0 ? (2 * before * after) / (before + after) : 0
    })

    return (position) => {
        let low = 0
        let high = points.length - 1
        if (position <= points[low].x) return points[low].y
        if (position >= points[high].x) return points[high].y

        while (high - low > 1) {
            const middle = Math.floor((low + high) / 2)
            if (position < points[middle].x) high = middle
            else low = middle
        }

        const start = points[low]
        const end = points[high]
        const span = end.x - start.x
        const t = (position - start.x) / span
        const u = 1 - t
        return u * u * ((1 + 2 * t) * start.y + t * span * tangents[low])
            + t * t * ((3 - 2 * t) * end.y - u * span * tangents[high])
    }
}
