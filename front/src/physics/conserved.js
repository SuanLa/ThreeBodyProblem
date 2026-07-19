// 守恒量计算：由推送帧中的质量、位置、速度实时求出
// 总能量、总动量、总角动量与两两间距。孤立引力系统中
// 前三者理论上守恒，其漂移程度反映数值积分误差

function distance(a, b) {
    return Math.hypot(
        b.Position.X - a.Position.X,
        b.Position.Y - a.Position.Y,
        b.Position.Z - a.Position.Z
    );
}

export function computeMetrics(objects, g) {
    let ke = 0;
    let px = 0, py = 0, pz = 0;
    let lx = 0, ly = 0, lz = 0;

    for (const b of objects) {
        const m = b.Mess;
        const s = b.Speed;
        const r = b.Position;

        ke += 0.5 * m * (s.XSpeed ** 2 + s.YSpeed ** 2 + s.ZSpeed ** 2);

        px += m * s.XSpeed;
        py += m * s.YSpeed;
        pz += m * s.ZSpeed;

        lx += m * (r.Y * s.ZSpeed - r.Z * s.YSpeed);
        ly += m * (r.Z * s.XSpeed - r.X * s.ZSpeed);
        lz += m * (r.X * s.YSpeed - r.Y * s.XSpeed);
    }

    let pe = 0;
    const dists = [];
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const d = distance(objects[i], objects[j]);
            dists.push(d);
            if (d > 0) {
                pe -= (g * objects[i].Mess * objects[j].Mess) / d;
            }
        }
    }

    return {
        t: objects[0].Time,
        energy: ke + pe,
        momentum: Math.hypot(px, py, pz),
        angMomentum: Math.hypot(lx, ly, lz),
        d12: dists[0] ?? 0,
        d13: dists[1] ?? 0,
        d23: dists[2] ?? 0,
    };
}

// 主/孪生系统的轨迹分离距离 δ = sqrt(Σᵢ |rᵢ − rᵢ'|²)
export function computeSeparation(objects, twin) {
    let sum = 0;
    const n = Math.min(objects.length, twin.length);
    for (let i = 0; i < n; i++) {
        sum += (objects[i].Position.X - twin[i].Position.X) ** 2
            + (objects[i].Position.Y - twin[i].Position.Y) ** 2
            + (objects[i].Position.Z - twin[i].Position.Z) ** 2;
    }
    return Math.sqrt(sum);
}

// 数值的自适应显示格式
export function formatValue(v) {
    if (v === null || v === undefined || Number.isNaN(v)) {
        return "—";
    }
    const abs = Math.abs(v);
    if (abs !== 0 && (abs >= 10000 || abs < 0.001)) {
        return v.toExponential(2);
    }
    return v.toFixed(3);
}
