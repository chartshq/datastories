const CONSTANTS = require('../constants/unemployment');

const {
  // TITLE_DESCRIPTION,
  FULL_MONTH_NAMES,
  TOOLTIP_TEXT,
  TITLE_TEXT,
  LEGEND_TEXT,
} = CONSTANTS;

function monthDiff(d1, d2) {
  let months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth() + 1;
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

function dateFormatConverter(today) {
  let dd = today.getDate();
  let mm = today.getMonth() + 1;

  const yyyy = today.getFullYear();
  if (dd < 10) {
    dd = `0${dd}`;
  }
  if (mm < 10) {
    mm = `0${mm}`;
  }
  return `${mm}/${dd}/${yyyy}`;
}

const helper = {
  sanitizeRecessionData: (data) => {
    let first = true;
    let startDate = data[0].date;
    let prevDate = data[0].date;
    // let endDate = data[0].date;
    const dates = [];
    const filteredData = data.filter((d) => +d.recession === 1);
    filteredData.map((d, i) => {
      if (first === true) {
        startDate = d.date;
        prevDate = d.date;
        first = false;
      }
      if ((monthDiff(
        new Date(prevDate),
        new Date(d.date),
      )) > 1) {
        dates.push({
          startDate,
          endDate: filteredData[i - 1].date,
        });
        startDate = d.date;
        prevDate = d.date;
      } else {
        prevDate = d.date;
      }
      return d;
    });
    dates.push({
      startDate,
      endDate: prevDate,
    });
    let j = 0;
    let currentDate;
    let sDate = new Date(dates[j].startDate);
    let eDate = new Date(dates[j].endDate);
    const formattedData = data.map((d) => {
      const shallowD = { ...d };
      currentDate = new Date(d.date);
      if (+d.recession === 1) {
        if (currentDate > eDate) {
          j += 1;
          sDate = dates[j] && new Date(dates[j].startDate);
          eDate = dates[j] && new Date(dates[j].endDate);
        }

        if (currentDate >= sDate && currentDate <= eDate) {
          shallowD.startDate = dateFormatConverter(sDate);
          shallowD.endDate = dateFormatConverter(eDate);
        }
      }
      return shallowD;
    });
    return formattedData;
  },
  layerAdditionStrategy: {
    unemp: [],
    men: ['men', 'women'],
    women: ['men', 'women'],
    white: ['white', 'hispanic', 'black'],
    hispanic: ['white', 'hispanic', 'black'],
    black: ['white', 'hispanic', 'black'],
    lessThanHS: ['hsGrad', 'bachelors', 'someCollege', 'lessThanHS'],
    hsGrad: ['lessThanHS', 'bachelors', 'someCollege', 'hsGrad'],
    bachelors: ['lessThanHS', 'hsGrad', 'someCollege', 'bachelors'],
    someCollege: ['lessThanHS', 'hsGrad', 'bachelors', 'someCollege'],
    years16to24: ['years25to34', 'years35to44', 'years45to54', 'years55more', 'years16to24'],
    years25to34: ['years16to24', 'years35to44', 'years45to54', 'years55more', 'years25to34'],
    years35to44: ['years16to24', 'years25to34', 'years45to54', 'years55more', 'years35to44'],
    years45to54: ['years16to24', 'years25to34', 'years35to44', 'years55more', 'years45to54'],
    years55more: ['years16to24', 'years25to34', 'years35to44', 'years45to54', 'years55more'],
  },
  addLifecycleHooks: ({
    updateCanvasLine,
    updateCanvasHeatmap,
    layerAdditionStrategy,
    html,
    share,
    canvasHeatmap,
    addRecessionCheckBox,
    canvasLine,
    document,
    addInteactionWithOptionBox,
  }) => {
    Promise.all([
      canvasLine.once('canvas.animationend'),
      canvasHeatmap.once('canvas.animationend'),
    ]).then(() => {
      const heatmapChart = document.getElementById('heatmap');
      const heatmapChartTitle = heatmapChart.getElementsByClassName('muze-title-cell')[0].parentNode;
      const node = document.createElement('div');
      node.innerHTML = `<label><input type = 'checkbox' name = 'recession' class = 'recession-check'
      value = 'recession'> <span class='recession-checkbox-text'> Show Recessions</span></label><br>`;
      heatmapChartTitle.appendChild(node);

      const lineChart = document.getElementById('line');
      const lineChartTitle = lineChart.getElementsByClassName('muze-title-cell')[0].parentNode;
      const node1 = document.createElement('div');
      node1.innerHTML = `
                <ul class='static-legend'>
                    <li id='static-legend-always'><span class='always'></span>Overall</li>
                    <li id='static-legend-selected'><span class='selected'></span> Awesome</li>
                    <li id='static-legend-restAll'><span class='restAll'></span> Others</li>
                </ul>`;
      lineChartTitle.appendChild(node1);

      addInteactionWithOptionBox({
        updateCanvasLine,
        layerAdditionStrategy,
        html,
        share,
        updateCanvasHeatmap,
        addRecessionCheckBox,
        canvasLine,
        canvasHeatmap,
        document,
      });
    });
  },
  addRecessionCheckBox: (document, canvasHeatmap) => {
    const checkbox = document.getElementsByClassName('recession-check')[0];
    checkbox.addEventListener('change', () => {
      let layersHeatmap = [{
        mark: 'bar',
        encoding: {
          y: 'month',
        },
      }];
      if (checkbox.checked) {
        layersHeatmap.push({
          mark: 'point',
          className: 'point-layer-stroke',
          encoding: {
            y: 'month',
            color: {
              value: () => 'black',
            },
            shape: {
              value: () => 'square',
            },
            size: {
              value: () => 30,
            }
          },
          source: 'recessionDataModel',
        });
      } else {
        layersHeatmap = [{
          mark: 'bar',
          encoding: {
            y: 'month',
          },
        }];
      }
      canvasHeatmap.layers(layersHeatmap);
    });
  },
  updateCanvasLine: ({
    layerAdditionStrategy, value, canvasLine, categoryValue, html, share,
  }) => {
    const layers = [{
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
      mark: 'text',
          encoding: {
              x: { field: null },
              y: { field: null },
              text: {
                  value: 'RECESSION'
              }
          },
          encodingTransform: (points) => { /* Post drawing, position transformation of text */
              points[0].update.x = 50;
              points[0].update.y = 15;
              return points;
          },
  }];
    const formatterObj = {
      recessionDataModel: (dm) => dm.select((d) => !!(+d.recession.value))
    };
    layerAdditionStrategy[value].forEach((val) => {
      formatterObj[val] = (model) => model.select((d) => d[val].value !== 0);
    });
    layers.push({
      mark: 'line',
      interpolate: 'catmullRom',
      encoding: {
        y: 'unemp',
        color: {
          value: () => '#231e1f',
        },
      },
    });
    layerAdditionStrategy[value].forEach((d) => {
      layers.push({
        mark: 'line',
        interpolate: 'catmullRom',
        className: value === d ? 'stroke-line-active' : 'stroke-line-inactive',
        encoding: {
          y: d,
          color: {  
            value: () => (value === d ? '#0079ae' : '#999999'),
          },
        },
        source: d,
      });
    });

    canvasLine
      .transform(formatterObj)
      .layers(layers)
      .rows([share('unemp', ...layerAdditionStrategy[value])])
      .config({
        interaction: {
          axes: {
            x: {
              showAxisName: false,
              nice: false,
            },
            y: {
              showAxisName: false,
            },
          },
          gridLines: {
            x: { show: false },
            y: { show: false },
          },
          tooltip: {
            formatter: (dm) => {
              let tooltipContent = '';
              const tooltipData = dm.getData().data;
              const fieldConfig = dm.getFieldsConfig();
              tooltipData.forEach((datum) => {
                const unempVal = datum[fieldConfig.unemp.index];
                const otherVal = datum[fieldConfig[value].index];
                const dateVal = datum[fieldConfig.date.index];
                const dateObj = new Date(dateVal);
                const monthName = dateObj.toLocaleString('default', { month: 'long' });
                const dateString = `${monthName} ${dateObj.getFullYear()}`;
                const lhsValue = TOOLTIP_TEXT[value];
                const selectedTooltip = value !== 'unemp'
                  ? `<p id='tooltip-selected'>${lhsValue}: ${otherVal ? `${otherVal} %` : 'N/A'}</p>`
                  : '';
                tooltipContent += `
                    <div class='tooltip-container'>
                        <p id='tooltip-date'>${dateString}</p>
                        <p id='tooltip-unemp-border'>Overall: ${unempVal}%</p>
                        ${selectedTooltip}
                    </div>
                    `;
              });
              return html`${tooltipContent}`;
            },
          },
        },
      })
      .title(`Unemployment rates ${categoryValue}`);
  },
  updateCanvasHeatmap: ({
    value, canvasHeatmap, html, categoryValue,
  }) => {
    canvasHeatmap
      .color({
        field: value,
        range: ['rgb(239, 240, 240)', 'rgb(73,142,61)', 'rgb(82, 160, 69)', 'rgb(99, 188, 81)', 'rgb(162, 210, 146)',
          'rgb(198, 226, 186)', 'rgb(238, 226, 189)', 'rgb(255, 214, 61)',
          'rgb(249, 162, 36)', 'rgb(238, 58, 67)', 'rgb(206, 49, 57)'],
        step: true,
        stops: [0, 0.01, 2, 4, 5, 6, 7, 8, 9, 10],
      })
      .detail('unemp')
      .config({
        legend: {
          label: false,
          position: 'top',
        },
        border: {
          style: 'none',
        },
        interaction: {
          tooltip: {
            formatter: (dm) => {
              let tooltipContent = '';
              const tooltipData = dm.getData().data;
              const fieldConfig = dm.getFieldsConfig();
              tooltipData.forEach((datum) => {
                const tooltipValue = datum[fieldConfig[value].index];
                const monthVal = datum[fieldConfig.month.index];
                const yearVal = new Date(datum[fieldConfig.year.index]).getFullYear();

                const monthName = FULL_MONTH_NAMES[+monthVal];
                const dateString = `${monthName} ${yearVal}`;
                const lhsValue = TOOLTIP_TEXT[value];
                tooltipContent += `
                    <div class='tooltip-container'>
                        <p id='tooltip-date'>${dateString}</p>
                        <p id='tooltip-unemp'>${lhsValue}: ${tooltipValue ? `${tooltipValue} %` : 'N/A'}</p>
                    </div>
                  `;
              });
              return html`${tooltipContent}`;
            },
          },
        },
      })
      .title(`Unemployment rates ${categoryValue} ${LEGEND_TEXT[value]
        ? `: ${LEGEND_TEXT[value].active}`
        : ''}`);
  },
  addInteactionWithOptionBox: ({
    updateCanvasLine,
    layerAdditionStrategy,
    html,
    share,
    updateCanvasHeatmap,
    addRecessionCheckBox,
    canvasLine,
    canvasHeatmap,
    document,
  }) => {
    const header = document.getElementById('table');
    const btns = header.getElementsByClassName('table-item-btn');
    for (let i = 0; i < btns.length; i += 1) {
      const ref = btns[i];
      // eslint-disable-next-line no-loop-func
      ref.addEventListener('click', () => {
        const { value } = ref;
        const current = document.getElementsByClassName('active');
        current[0].className = current[0].className.replace(' active', '');
        if (value !== 'unemp') {
          const staticLegendSelected = document.getElementById('static-legend-selected');
          staticLegendSelected.style.display = 'block';
          staticLegendSelected.innerHTML = `<span class='selected'></span>${LEGEND_TEXT[value].active}`;
          const staticLegendRestAll = document.getElementById('static-legend-restAll');
          staticLegendRestAll.innerHTML = `<span class='restAll'></span>${LEGEND_TEXT[value].inactive}`;
          staticLegendRestAll.style.display = 'block';
        } else {
          const staticLegendSelected = document.getElementById('static-legend-selected');
          staticLegendSelected.style.display = 'none';
          const staticLegendRestAll = document.getElementById('static-legend-restAll');
          staticLegendRestAll.style.display = 'none';
        }
        ref.className += ' active';
        const categoryValue = TITLE_TEXT[value];
        updateCanvasLine({
          layerAdditionStrategy, value, canvasLine, categoryValue, html, share,
        });
        updateCanvasHeatmap({
          value, canvasHeatmap, html, categoryValue,
        });
      });
    }
    addRecessionCheckBox(document, canvasHeatmap);
  },
};

module.exports = helper;
