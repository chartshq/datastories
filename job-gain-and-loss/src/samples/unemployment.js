/* eslint-disable no-shadow */
/* global muze, window, document */
const env = muze();
const { DataModel, Operators } = muze;
const helper = require('../utils/unemployment');
const CONSTANTS = require('../constants/unemployment');
const dataPromise = require('../../public/data/unemployment-data.json');
const schemaPromise = require('../../public/data/unemployment-schema.json');
const sectorsChart = require('./sectors-chart');

const { share, html } = Operators;
const {
    sanitizeRecessionData,
    layerAdditionStrategy,
    addLifecycleHooks,
    addRecessionCheckBox,
    updateCanvasLine,
    updateCanvasHeatmap,
    addInteactionWithOptionBox
} = helper;
const {
    DATE_TOOLTIP_MAP,
    FULL_MONTH_NAMES,
    MONTHS_ARR
} = CONSTANTS;

sectorsChart();

Promise.all([dataPromise, schemaPromise])
    .then(([originalData, schema]) => {
        const data = sanitizeRecessionData(originalData);
        let dm = new DataModel(data, schema);

        dm = dm.calculateVariable({
            name: 'month',
            type: 'dimension'
        }, ['date', (date) => {
            let returnMonth = (new Date(date).getMonth()).toString();
            if (returnMonth.length === 1) {
                returnMonth = `0${returnMonth}`;
            }
            return returnMonth;
        }]);

        dm = dm.calculateVariable({
            name: 'year',
            type: 'dimension',
            subtype: 'temporal',
            format: '%Y'
        }, ['date', (date) => `${new Date(date).getFullYear()}`]);

        dm = dm.groupBy(['month', 'year', 'date', 'recession']);
        dm = dm.sort([
            ['month', 'DESC']
        ]);

        const canvas = env.canvas();
        canvas
            .data(dm)
            .rows(['month'])
            .columns(['year'])
            .detail(['date', 'recession'])
            .width(1000)
            .transform({
                recessionDataModel: (datamodel) => datamodel.select((d) => {
                    return !!(+d.recession.value)
                })
            })
            .height(500)
            .mount('#heatmap')
            .color({
                field: 'unemp',
                range: ['rgb(82, 160, 69)', 'rgb(99, 188, 81)', 'rgb(162, 210, 146)',
                    'rgb(198, 226, 186)', 'rgb(238, 226, 189)', 'rgb(255, 214, 61)',
                    'rgb(249, 162, 36)', 'rgb(238, 58, 67)', 'rgb(206, 49, 57)'],
                step: true,
                stops: 9
            })
            .config({
                legend: {
                    label: false,
                    position: 'top',
                    color: {
                        title: {
                            text: () => ''
                        },
                        item: {
                            text: {
                                orientation: 'bottom',
                                formatter: (d) => {
                                    if (d[0] === 0) {
                                        return ['N/A'];
                                    } if (d[0] === 2) {
                                        return ['2% or less'];
                                    } if (d[1] === 11) {
                                        return ['11% or more'];
                                    }
                                    return ' ';
                                }
                            }
                        }
                    }
                },
                axes: {
                    x: {
                        showAxisName: false,
                        padding: 0.1,
                        tickFormat: (currentTick) => {
                            if (DATE_TOOLTIP_MAP[new Date(currentTick).getFullYear()]) {
                                return DATE_TOOLTIP_MAP[new Date(currentTick).getFullYear()];
                            }
                            return '';
                        },
                        nice: false
                    },
                    y: {
                        showAxisName: false,
                        padding: 0.05,
                        tickFormat: (currentTick) => MONTHS_ARR[+currentTick]
                    }
                },
                gridLines: {
                    x: { show: false },
                    y: { show: false }
                },
                border: {
                    style: 'none'
                },
                interaction: {
                    tooltip: {
                        formatter: (dm) => {
                            let tooltipContent = '';
                            const tooltipData = dm.getData().data;
                            const fieldConfig = dm.getFieldsConfig();

                            tooltipData.forEach((datum) => {
                                const unempVal = datum[fieldConfig.unemp.index];
                                const monthVal = datum[fieldConfig.month.index];
                                const yearVal = new Date(datum[fieldConfig.year.index]).getFullYear();
                                const monthName = FULL_MONTH_NAMES[+monthVal];
                                const dateString = `${monthName} ${yearVal}`;
                                tooltipContent += `
                                <div class='tooltip-container'>
                                    <p id='tooltip-date'>${dateString}</p>
                                    <p id='tooltip-unemp'>Overall: ${unempVal}%</p>
                                </div>
                                `;
                            });
                            return html`${tooltipContent}`;
                        }
                    }
                }
            })
            .title('Unemployment rate, overall')
            .layers([{
                mark: 'bar',
                encoding: {
                    y: 'month'
                }
            }]);

        const canvas1 = env.canvas();
        canvas1
            .data(dm)
            .rows(['unemp'])
            .columns(['date'])
            .width(1000)
            .detail(['year', 'recession'])
            .height(200)
            .mount('#line')
            .transform({
                recessionDataModel: (dm) => dm.select((d) => !!(+d.recession.value))
            })
            .title('Unemployment rates, overall')
            .layers([{
                mark: 'bar',
                encoding: {
                    x: 'date',
                    y: { field: null },
                    color: {
                        value: () => 'rgb(239, 240, 240)'
                    }
                },
                source: 'recessionDataModel',
                interaction: {
                    brushStroke: {
                        className: 'brush-stroke-class',
                        style: {
                            stroke: 'none',
                        },
                    },
                    doubleStroke: {
                        style: {
                            stroke: 'none',
                        },
                    },
                }
            },{
                mark: 'line',
                interpolate: 'catmullRom',
                encoding: {
                    y: 'unemp',
                    color: {
                        value: () => 'black'
                    }
                }
            },{
                mark: 'text',
                encoding: {
                    x: { field: null },
                    y: { field: null },
                    text: {
                        value: 'RECESSION'
                    }
                },
                className: 'summary-text',
                encodingTransform: (points) => { /* Post drawing, position transformation of text */
                    points[0].update.x = 50;
                    points[0].update.y = 15;
                    return points;
                }
            }])
            .config({
                axes: {
                    x: {
                        showAxisName: false,
                        nice: false
                    },
                    y: {
                        showAxisName: false
                    }
                },
                gridLines: {
                    x: { show: false },
                    y: { show: true }
                },
                interaction: {
                    tooltip: {
                        formatter: (dm) => {
                            let tooltipContent = '';
                            const tooltipData = dm.getData().data;
                            const fieldConfig = dm.getFieldsConfig();

                            tooltipData.forEach((datum) => {
                                const unempVal = datum[fieldConfig.unemp.index];
                                const dateVal = datum[fieldConfig.date.index];
                                const dateObj = new Date(dateVal);
                                const monthName = dateObj.toLocaleString('default', { month: 'long' });
                                const dateString = `${monthName} ${dateObj.getFullYear()}`;
                                tooltipContent += `
                                <div class='tooltip-container'>
                                    <p id='tooltip-date'>${dateString}</p>
                                    <p id='tooltip-unemp'>Overall: ${unempVal}%</p>
                                </div>
                                `;
                            });
                            return html`${tooltipContent}`;
                        }
                    }
                }
            });

        const canvasHeatmap = canvas;
        const canvasLine = canvas1;
        muze.ActionModel
            .for(canvasHeatmap, canvasLine)
            .enableCrossInteractivity();

        addLifecycleHooks({
            updateCanvasLine,
            updateCanvasHeatmap,
            layerAdditionStrategy,
            html,
            share,
            canvasHeatmap,
            addRecessionCheckBox,
            canvasLine,
            document,
            addInteactionWithOptionBox
        });
    });
