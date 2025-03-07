const uuid = (): string => {
    const s = [];
    const hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits[Math.floor(Math.random() * 0x10)];
    }
    s[14] = "4";
    s[19] = hexDigits[(parseInt(s[19], 16) & 0x3) | 0x8];
    s[8] = s[13] = s[18] = s[23] = "-";
    return s.join("");
};

export function rotatePoint({ x, y }: { x: number; y: number }) {
    return {
        x: y,
        y: x,
    };
}

export function deepCopy(node: any) {
    let obj: Record<string, any> = { _key: uuid() };
    for (var key in node) {
        if (node[key] === null) {
            obj[key] = null;
        } else if (Array.isArray(node[key])) {
            obj[key] = node[key].map((x: any) => deepCopy(x));
        } else if (typeof node[key] === "object") {
            obj[key] = deepCopy(node[key]);
        } else {
            obj[key] = node[key];
        }
    }
    return obj;
}