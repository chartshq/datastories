var env = muze();
var DataModel = muze.DataModel;
var html = muze.Operators.html;
var dataFormatter = require('../utils/sectors');
var dataPromise = require('../../public/data/sectors.json');
var sectorMap = require('../../public/data/sector-id-map.json');
var schema = require('../../public/data/sectors-schema.json');
const monthsArr = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

const sectorsChart = function () {
	Promise.all([dataPromise])
		.then(([data]) => {
			const sanitizedData = dataFormatter.formatData(data, sectorMap);
			var months = {
				January: 1,
				February: 2,
				March: 3,
				April: 4,
				May: 5,
				June: 6,
				July: 7,
				August: 8,
				September: 9,
				October: 10,
				November: 11,
				December: 12
			};
			
			let dm = new DataModel(sanitizedData, schema, { mode: 'exact' });
			dm = dm.select(d => {
				return d.periodName.value !== 'January' || new Date(d.year.value).getFullYear() !== 2008;
			});

			dm = dm.calculateVariable({
				name: 'date', 
				type: 'dimension',
				subtype: 'temporal',
				format: '%d/%m/%Y'
			}, ['year', 'periodName', (y, p) => {
				return `01/${months[p]}/${new Date(y).getFullYear()}`;
			}]);

			const canvas = env.canvas();
			canvas
				.data(dm)
				.width(1350)
				.height(580)
				.rows(['id'])
				.columns([['date']])
				.transform({
					recessionDataModel: (dm) => dm.select((d) => {
						return d.date.internalValue < 1201824000000;
					})
				})
				.layers([{
					mark: 'point',
					crossline: true,
					encoding: {
						size: {
							value: () => 90,
						}
					},
					interaction: {
						colorChange: {
							style: {
								fill: '#000',
								'fill-opacity': 0.8,
							}
						}
					}
				}, {
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
						points[0].update.y = 40;
						return points;
					},
				}, {
					mark: 'bar',
					encoding: {
						x: {
							value: () => 0
						},
						y: { field: null },
						color: {
							value: () => '#f3f3f3'
						},
					},
					source: 'recessionDataModel',
					interaction: {
						highlight: {
							style: {
								stroke: 'none',
							}
						}
					}
				}])
				.detail(['change', 'sectorName'])
				.color({
					field: 'change',
					range: [
						"rgb(206, 71, 46)", "rgb(240, 83, 54)",
						"rgb(250, 162, 36)", "rgb(255, 215, 62)",
						"rgb(239, 227, 190)", "rgb(198, 227, 187)",
						"rgb(163, 211, 147)", "rgb(100, 188, 82)",
						"rgb(0, 153, 220)"
					],
					step: true,
					stops: [-1, -0.8, -0.5, -0.25, 0, 0.25, 0.5, 0.75]
				})
				.config({
					gridLines: {
						x: { show: false },
						y: { show: false }
					},
					border: {
						style: "none"
					},
					legend: {
						position: 'top',
						color: {
							show: true,
							title: {
								text: () => ''
							},
							item: {
								text: {
									orientation: 'bottom',
									formatter: (d, i) => {
										if (d[0] === -1 || d[0] === 0 || d[1] === '0.8') {
											return ` ${d[0]}% `;
										}
										return ' ';
									}
								}
							},
						},
					},
					axes: {
						x: {
							showAxisName: false,
							tickFormat: (currentTick, index, ticks) => {
								let sanitizedTick;

								if (!!new Date(currentTick).getFullYear()) {
									sanitizedTick = currentTick;
								}
								if (currentTick === '2018') sanitizedTick = null;
								return sanitizedTick || '';
							},
						},
						y: {
							name: '< SECTORS FALLING SECTORS RISING >',
							tickFormat: (currentTick, index, ticks) => {
								if (currentTick === -25) return 'Unch.'
								return currentTick;
							},
						}
					},
					interaction: {
						tooltip: {
							formatter: (dm, config, context) => {
								let tooltipContent = '';
								const target = context.payload.target;
								const newDm = dm.select(d =>
									d.date.internalValue === target[1][0] && d.sectorName.value === target[1][1]
								);
								const tooltipData = newDm.getData().data;
								const fieldConfig = dm.getFieldsConfig();

								tooltipData.forEach((datum, i) => {
									const sectorVal = datum[fieldConfig.sectorName.index];
									const changeVal = datum[fieldConfig.change.index];
									const dateVal = new Date(datum[fieldConfig.date.index]);
									const dateString = `${monthsArr[dateVal.getMonth()]} ${dateVal.getFullYear()}`;

									tooltipContent += `
									<div class="tooltip-container">
										<p id="tooltip-date">${sectorVal}</p>
										<p id="tooltip-heatmap">${changeVal.toFixed(2)}% in ${dateString}</p>
									</div>
									`;
								});
								return html`${tooltipContent}`;
							}
						}
					}
				})
				.mount('#heatmap-point-chart');

			const { SurrogateSideEffect } = muze.SideEffects.standards;

			muze.ActionModel
				.for(canvas)
				.dissociateBehaviour(['select', 'click'], ['brush', 'drag'])
				.registerSideEffects(class ColorChanger extends SurrogateSideEffect {
					static formalName () {
						return 'color-changer';
					}

					static target() {
						return 'visual-unit';
					}
		
					apply (selectionSet, payload) {
						// Remove hover interaction from all points
						this.applyInteractionStyle(selectionSet.completeSet, {
							interactionType: 'colorChange',
							apply: false
						});

						if (payload.target) {
							const sectorName = payload.target[1][1];
							const dataModel = selectionSet.completeSet.model;
							const sameSectorPoints = dataModel.select(d => d.sectorName.value === sectorName);

							if (selectionSet.mergedEnter.model) {
								// Apply hover interaction on related points
								this.applyInteractionStyle({
									uids: sameSectorPoints.getUids().map(d => [d])
								}, {
									interactionType: 'colorChange',
									apply: true
								});
							}
						}
						return this;
					}
				})
				.mapSideEffects({
					highlight: ['color-changer']
				})
		});
}

module.exports = sectorsChart;
