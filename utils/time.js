const getTimeSince = (timestamp) => {
    const difference = Date.now() - timestamp;
    if (Math.floor(difference/(1000*60*60*24*365)) > 0) {
        var num = Math.floor(difference/(1000*60*60*24*365));
        return `${num} year${num===1?'':'s'} ago`;
    }
    if (Math.floor(difference/(1000*60*60*24*30)) > 0) {
        var num = Math.floor(difference/(1000*60*60*24*30));
        return `${num} month${num===1?'':'s'} ago`;
    }
    if (Math.floor(difference/(1000*60*60*24*7)) > 0) {
        var num = Math.floor(difference/(1000*60*60*24*7));
        return `${num} week${num===1?'':'s'} ago`;
    }
    if (Math.floor(difference/(1000*60*60*24)) > 0) {
        var num = Math.floor(difference/(1000*60*60*24));
        return `${num} day${num===1?'':'s'} ago`;
    }
    if (Math.floor(difference/(1000*60*60)) > 0) {
        var num = Math.floor(difference/(1000*60*60));
        return `${num} hour${num===1?'':'s'} ago`;
    }
    if (Math.floor(difference/(1000*60)) > 0) {
        var num = Math.floor(difference/(1000*60));
        return `${num} minute${num===1?'':'s'} ago`;
    }
    var num = Math.floor(difference/(1000));
    return `${num} second${num===1?'':'s'} ago`;
};

module.exports = {
    getTimeSince
}