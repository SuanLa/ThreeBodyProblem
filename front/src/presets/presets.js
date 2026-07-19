// 经典三体预设。全部使用归一化单位 G=1（天体力学文献惯例），
// 由后端协议的可选字段 G/Dt/Method 传给仿真内核

const G = 1;

function body(mass, pos, vel) {
    return {
        Mess: mass,
        Position: {X: pos[0], Y: pos[1], Z: pos[2] || 0},
        Speed: {XSpeed: vel[0], YSpeed: vel[1], ZSpeed: vel[2] || 0},
        Time: 0,
    };
}

// Chenciner-Montgomery 八字轨道标准初值（等质量 m=1，周期 T≈6.3259）
// 文献：A remarkable periodic solution of the three-body problem, Ann. Math. 152 (2000)
function figure8() {
    const px = 0.97000436, py = -0.24308753;
    const vx = -0.93240737, vy = -0.86473146;
    return [
        body(1, [px, py], [-vx / 2, -vy / 2]),
        body(1, [-px, -py], [-vx / 2, -vy / 2]),
        body(1, [0, 0], [vx, vy]),
    ];
}

// 拉格朗日等边三角形周期解：三个等质量天体绕质心做圆周运动。
// 边长 a=2 时每体到质心 r=a/√3，圆轨道速度 v=√(G·m/a)。
// 该构型是经典的不稳定平衡，数值误差会让它在数个周期后瓦解——本身就是很好的演示
function lagrange() {
    const m = 1;
    const a = 2;
    const r = a / Math.sqrt(3);
    const v = Math.sqrt((G * m) / a);
    const angles = [90, 210, 330].map((deg) => (deg * Math.PI) / 180);
    return angles.map((th) =>
        body(m, [r * Math.cos(th), r * Math.sin(th)], [-v * Math.sin(th), v * Math.cos(th)])
    );
}

function totalEnergy(bodies) {
    let e = 0;
    for (const b of bodies) {
        const s = b.Speed;
        e += 0.5 * b.Mess * (s.XSpeed ** 2 + s.YSpeed ** 2 + s.ZSpeed ** 2);
    }
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const pi = bodies[i].Position, pj = bodies[j].Position;
            const d = Math.hypot(pj.X - pi.X, pj.Y - pi.Y, pj.Z - pi.Z);
            if (d > 0) e -= (G * bodies[i].Mess * bodies[j].Mess) / d;
        }
    }
    return e;
}

// 随机初值：质量与位置随机，速度做两个约束——
// 1) 总动量归零，避免整个系统漂出视野；
// 2) 总能量为负（束缚系统），避免天体直接飞散
function randomBodies() {
    const bodies = [];
    for (let i = 0; i < 3; i++) {
        const mass = 0.6 + Math.random() * 0.9;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const rr = 0.8 + Math.random() * 1.2;
        const pos = [
            rr * Math.sin(phi) * Math.cos(theta),
            rr * Math.sin(phi) * Math.sin(theta),
            rr * Math.cos(phi) * 0.4, // 压扁 Z 轴让轨道更贴近视平面
        ];
        const vel = [(Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.25];
        bodies.push(body(mass, pos, vel));
    }

    // 总动量归零
    const totalMass = bodies.reduce((s, b) => s + b.Mess, 0);
    const pAvg = ["XSpeed", "YSpeed", "ZSpeed"].map(
        (k) => bodies.reduce((s, b) => s + b.Mess * b.Speed[k], 0) / totalMass
    );
    for (const b of bodies) {
        b.Speed.XSpeed -= pAvg[0];
        b.Speed.YSpeed -= pAvg[1];
        b.Speed.ZSpeed -= pAvg[2];
    }

    // 能量非负时按比例缩小速度，直到系统被引力束缚
    for (let guard = 0; guard < 20 && totalEnergy(bodies) >= 0; guard++) {
        for (const b of bodies) {
            b.Speed.XSpeed *= 0.7;
            b.Speed.YSpeed *= 0.7;
            b.Speed.ZSpeed *= 0.7;
        }
    }

    return bodies;
}

export const PRESETS = [
    {
        id: "figure8",
        name: "八字轨道",
        description: "Chenciner-Montgomery 周期解：三个等质量天体沿同一条 8 字形曲线追逐运动，周期约 6.33 个时间单位。",
        build: () => ({
            objects: figure8(),
            dt: 0.005,
            method: "verlet",
            softening: 0,
            radius: 0.08,
            camera: [0, 0.6, 4.5],
        }),
    },
    {
        id: "lagrange",
        name: "拉格朗日三角",
        description: "三个等质量天体保持等边三角形构型绕质心旋转。该平衡不稳定，数值扰动会让它在几个周期后瓦解，可观察混沌的萌芽。",
        build: () => ({
            objects: lagrange(),
            dt: 0.01,
            method: "verlet",
            softening: 0,
            radius: 0.12,
            camera: [0, 1.2, 5.5],
        }),
    },
    {
        id: "random",
        name: "随机初值",
        description: "随机生成的束缚三体系统（总动量为零、总能量为负）。每次应用都会生成一组新的初始条件，大概率演化出混沌轨道。",
        build: () => ({
            objects: randomBodies(),
            dt: 0.004,
            method: "verlet",
            softening: 0.05,
            radius: 0.12,
            camera: [0, 2, 6],
        }),
    },
];

// 把预设构建为完整的协议对象（Radius/Camera/Preset 为前端专用字段，后端解析时会忽略）
export function buildPresetProtocol(preset) {
    const built = preset.build();
    return {
        Star: true,
        Timestamp: Math.floor(Date.now() / 1000),
        SleepTime: 1,
        G: G,
        Dt: built.dt,
        Method: built.method,
        Softening: built.softening,
        Radius: built.radius,
        Camera: built.camera,
        Preset: preset.id,
        Objects: {objects: built.objects},
    };
}
