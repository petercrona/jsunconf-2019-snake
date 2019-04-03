// From https://gist.github.com/blixt/f17b47c62508be59987b

export const mb32 = (a: number) => {
    let t: number;
    return () => (
        a = a + 1831565813 | 0,
        t = Math.imul(a ^ a >>> 15, 1 | a),
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t,
        (t ^ t >>> 14) >>> 0) / 2 ** 32;
};
