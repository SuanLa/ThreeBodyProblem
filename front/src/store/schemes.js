// 参数方案的 localStorage 持久化与 JSON 文件导入导出

const KEY = "tbp-schemes";
const MAX_SCHEMES = 50;

export function listSchemes() {
    try {
        const raw = localStorage.getItem(KEY);
        const arr = raw === null ? [] : JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

// 保存方案，同名覆盖，最新的排最前
export function saveScheme(name, protocol) {
    const schemes = listSchemes().filter((s) => s.name !== name);
    schemes.unshift({name, savedAt: Date.now(), protocol});
    const trimmed = schemes.slice(0, MAX_SCHEMES);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
    return trimmed;
}

export function removeScheme(name) {
    const schemes = listSchemes().filter((s) => s.name !== name);
    localStorage.setItem(KEY, JSON.stringify(schemes));
    return schemes;
}

// 触发浏览器下载 JSON 文件
export function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                resolve(JSON.parse(reader.result));
            } catch {
                reject(new Error("不是有效的 JSON 文件"));
            }
        };
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsText(file);
    });
}

export function isScheme(data) {
    return Boolean(
        data &&
        data.type === "threebody-scheme" &&
        data.protocol &&
        data.protocol.Objects &&
        Array.isArray(data.protocol.Objects.objects) &&
        data.protocol.Objects.objects.length > 0
    );
}

export function isRecording(data) {
    return Boolean(
        data &&
        data.type === "threebody-recording" &&
        data.protocol &&
        Array.isArray(data.frames) &&
        data.frames.length > 1
    );
}
