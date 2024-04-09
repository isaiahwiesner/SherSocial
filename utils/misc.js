const getGeneralizedPath = (path) => {
    return ("/" // Always start with a /
    + path.replace(/^\/|\/$/, "")) // Remove beginning and ending slash
    .replace(/\/+/g, "/") // Remove any multiple slashes in a row
};

const urlIsImage = (url) => {
    return new Promise(async (resolve) => {
        await fetch(url)
            .then(res => res.blob())
            .then(buff => resolve(buff.type.startsWith('image/')))
            .catch(() => resolve(false));
    });
};

module.exports = {
    getGeneralizedPath,
    urlIsImage
};