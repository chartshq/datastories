const dataFormatter = {
    formatData: function (data, sectorMap) {
        let finalData = [];
        let newObj = {};

        data.forEach((datum, i) => {
            const dataArr = datum.data;
            for (let i = 0; i < dataArr.length; i++) {
                if (!newObj.hasOwnProperty(dataArr[i].year)) {
                    newObj[dataArr[i].year] = [];
                }
                newObj[dataArr[i].year].push(dataArr[i]);

                dataArr[i].seriesID = datum.seriesID;
                dataArr[i].sectorName = sectorMap[datum.seriesID];
                dataArr[i].value = +dataArr[i].value;
                dataArr[i].footnotesCode = dataArr[i].footnotes[0].code;
                dataArr[i].footnotesText = dataArr[i].footnotes[0].text;
                
                let change = 0;
                if (dataArr[i + 1]) {
                    change = (((+dataArr[i].value) - (+dataArr[i + 1].value)) / dataArr[i + 1].value) * 100;
                }

                dataArr[i].change = change;
                delete dataArr[i].footnotes;
            }

            i--;
            finalData = [...finalData, ...dataArr];
        });

        const monthWiseObj = {};

        Object.keys(newObj).forEach(y => {
            monthWiseObj[y] = {};

            newObj[y].forEach(d => {
                if (!monthWiseObj[y].hasOwnProperty(d.periodName)) {
                    monthWiseObj[y][d.periodName] = [];
                }
                monthWiseObj[y][d.periodName].push(d);
            });

            newObj[y].forEach(d => {
                const allPoints = monthWiseObj[y][d.periodName];

                allPoints.sort((a, b) => b.change - a.change);
                
                const zeroPoints = allPoints.filter(p => p.change === 0);
                const nonZeroPoints = allPoints.filter(p => p.change !== 0);
                let position = nonZeroPoints.findIndex(d => d.change <= 0);

                nonZeroPoints.forEach(dd => {
                    dd.id = position;
                    position -= 1;
                });
                zeroPoints.forEach((p, i) => {
                    if (nonZeroPoints[nonZeroPoints.length - 1]) {
                        p.id = -20 - (i + 1);
                    }
                });
            });
        });

        return finalData;
    }
};

module.exports = dataFormatter;
