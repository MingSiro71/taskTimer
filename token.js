const getRandom = (length) => {
    const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(Array(length)).map(() => S[Math.floor(Math.random() * S.length)]).join('');
}

export { getRandom };