const helper = require('./helper');

const run = async () => {
    await helper.takeSnap();
    return;
};

setTimeout(run, 3000);
