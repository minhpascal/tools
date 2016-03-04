/*
Plugin Name: amCharts Best Fit Line
Description: Automatically generates a best fit line for serial graphs
Author: Martynas Majeris, amCharts
Version: 1.0.3
Author URI: http://www.amcharts.com/

Copyright 2015 amCharts

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Please note that the above license covers only this plugin. It by all means does
not apply to any other amCharts products that are covered by different licenses.
*/

/* globals AmCharts */
/* jshint -W061 */

AmCharts.addInitHandler( function( chart ) {

	// check for graphs that have best fit line enabled
	for ( var i = 0; i < chart.graphs.length; i++ ) {
		var graph = chart.graphs[ i ],
			firstIndex,
			lastIndex = 0;
		if ( graph.bestFitLine !== undefined ) {
			// found a graph
			// generate values
			var x = [],
				y = [];
			for ( var z = 0; z < chart.dataProvider.length; z++ ) {

				// get value
				var value = chart.dataProvider[ z ][ graph.valueField ];
				if ( value !== undefined ) {

					// calculate category
					var cat = getCategoryIndex( chart.dataProvider[ z ][ chart.categoryField ], z, chart );

					// assign only non-undefined values
					x.push( cat );
					y.push( chart.dataProvider[ z ][ graph.valueField ] );

					// set indexes
					if ( firstIndex === undefined )
						firstIndex = z;
					lastIndex = z;
				}
			}

			// calculate endpoints
			var lineData = findLineByLeastSquares( x, y );

			// create a graph for the best fit line
			var trendGraph = graph.bestFitLine;
			trendGraph.valueField = graph.valueField + "FitLine";
			chart.graphs.push( trendGraph );

			// add data points
			chart.dataProvider[ firstIndex ][ trendGraph.valueField ] = lineData[ 1 ][ 0 ];
			chart.dataProvider[ lastIndex ][ trendGraph.valueField ] = lineData[ 1 ][ lineData[ 1 ].length - 1 ];

			// add events to handle parent graph hiding
			// if parent graph is hidden, hide trend graph as well
			if ( trendGraph.hideWithParent === true ) {

				// init a list of graphs that need to toggle together with trend lines
				if ( chart.graphsWithTrendLines === undefined )
					chart.graphsWithTrendLines = [];

				// add current graph
				chart.graphsWithTrendLines.push( graph );

				// set graph hidden tag
				graph.hiddenBefore = graph.hidden === true;

				// use "drawn" event to check for any changes in graph toggles
				if ( chart.graphsWithTrendLines.length === 1 ) {
					chart.addListener( "drawn", function( e ) {

						// check if graphs have been toggled
						for ( var i = 0; i < chart.graphsWithTrendLines.length; i++ ) {
							var graph = chart.graphsWithTrendLines[ i ];

							// anything changed?
							if ( graph.hidden === graph.hiddenBefore )
								return;

							// set current setting
							graph.hiddenBefore = graph.hidden;

							// reset trend graph the same way
							if ( graph.hidden && !graph.bestFitLine.hidden ) {
								chart.hideGraph( graph.bestFitLine );
							} else if ( !graph.hidden && graph.bestFitLine.hidden ) {
								chart.showGraph( graph.bestFitLine );
							}
						}

					} );
				}
			}
		}
	}

	/**
	 * Returns numeric representation of the category
	 */
	function getCategoryIndex( category, index, chart ) {
		var cat = index;
		if ( chart.categoryAxis.parseDates === true ) {
			// try resolving date if dataDateFormat is set
			if ( chart.dataDateFormat !== undefined ) {
				var d = AmCharts.stringToDate( category, chart.dataDateFormat );
			} else {
				var d = new Date( category );
			}
			cat = d.getTime();
			if ( !cat )
				cat = category;
		}
		return cat;
	}

	/**
	 * A function to generate best fit data
	 * https://dracoblue.net/dev/linear-least-squares-in-javascript/
	 */
	function findLineByLeastSquares( values_x, values_y ) {
		var sum_x = 0;
		var sum_y = 0;
		var sum_xy = 0;
		var sum_xx = 0;
		var count = 0;

		/*
		 * We'll use those variables for faster read/write access.
		 */
		var x = 0;
		var y = 0;
		var values_length = values_x.length;

		if ( values_length != values_y.length ) {
			throw new Error( 'The parameters values_x and values_y need to have same size!' );
		}

		/*
		 * Nothing to do.
		 */
		if ( values_length === 0 ) {
			return [
				[],
				[]
			];
		}

		/*
		 * Calculate the sum for each of the parts necessary.
		 */
		for ( var v = 0; v < values_length; v++ ) {
			x = values_x[ v ];
			y = values_y[ v ];
			sum_x += x;
			sum_y += y;
			sum_xx += x * x;
			sum_xy += x * y;
			count++;
		}

		/*
		 * Calculate m and b for the formular:
		 * y = x * m + b
		 */
		var m = ( count * sum_xy - sum_x * sum_y ) / ( count * sum_xx - sum_x * sum_x );
		var b = ( sum_y / count ) - ( m * sum_x ) / count;

		/*
		 * We will make the x and y result line now
		 */
		var result_values_x = [];
		var result_values_y = [];

		for ( var v = 0; v < values_length; v++ ) {
			x = values_x[ v ];
			y = x * m + b;
			result_values_x.push( x );
			result_values_y.push( y );
		}

		return [ result_values_x, result_values_y ];
	}

}, [ "serial" ] );