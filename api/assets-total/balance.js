module.exports = function (req, res) {
    'use strict';

    const values = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
    const steps = 100000;
    const step = (endDate - startDate) / steps;

    let date = startDate.valueOf();
    for (let i = 0; i < steps; i++) {
        values.push({ x: date, y: new Date(date).getDate() + Math.sin(date) });
        date += step;
    }

    res.end(JSON.stringify(values));
};
