import {
	BufferAttribute,
	BufferGeometry,
	FileLoader,
	Float32BufferAttribute,
	Loader,
	LoaderUtils
} from "./node_modules/three/build/three.module.js";
import { Inflate } from "./node_modules/three/examples/jsm/libs/inflate.module.min.js";

var VTKLoader = function ( manager ) {

	Loader.call( this, manager );

};

VTKLoader.prototype = Object.assign( Object.create( Loader.prototype ), {

	constructor: VTKLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new FileLoader( scope.manager );
		loader.setPath( scope.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( scope.requestHeader );
		loader.setWithCredentials( scope.withCredentials );
		loader.load( url, function ( text ) {

			try {

				onLoad( scope.parse( text ) );

			} catch ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		}, onProgress, onError );

	},

	parse: function ( data ) {

		function parseASCII( data ) {

			// connectivity of the triangles
			var indices = [];

			// triangles vertices
			var positions = [];

			// red, green, blue colors in the range 0 to 1
			var colors = [];

			// normal vector, one per vertex
			var normals = [];

			var result;

			// pattern for detecting the end of a number sequence
			var patWord = /^[^\d.\s-]+/;

			// pattern for reading vertices, 3 floats or integers
			var pat3Floats = /(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)/g;

			// pattern for connectivity, an integer followed by any number of ints
			// the first integer is the number of polygon nodes
			var patConnectivity = /^(\d+)\s+([\s\d]*)/;

			// indicates start of vertex data section
			var patPOINTS = /^POINTS /;

			// indicates start of polygon connectivity section
			var patPOLYGONS = /^POLYGONS /;

			// indicates start of triangle strips section
			var patTRIANGLE_STRIPS = /^TRIANGLE_STRIPS /;
			var patCELLS = /^CELLS /;

			// POINT_DATA number_of_values
			var patPOINT_DATA = /^POINT_DATA[ ]+(\d+)/;

			// CELL_DATA number_of_polys
			var patCELL_DATA = /^CELL_DATA[ ]+(\d+)/;

			// Start of color section
			var patCOLOR_SCALARS = /^COLOR_SCALARS[ ]+(\w+)[ ]+3/;

			// NORMALS Normals float
			var patNORMALS = /^NORMALS[ ]+(\w+)[ ]+(\w+)/;

			var inPointsSection = false;
			var inPolygonsSection = false;
			var inTriangleStripSection = false;
			var inPointDataSection = false;
			var inCellDataSection = false;
			var inColorSection = false;
			var inNormalsSection = false;

			var lines = data.split( '\n' );

			for ( var i in lines ) {

				var line = lines[ i ].trim();

				if ( line.indexOf( 'DATASET' ) === 0 ) {

					var dataset = line.split( ' ' )[ 1 ];

					if ( dataset !== 'POLYDATA' &&  dataset !== 'UNSTRUCTURED_GRID') throw new Error( 'Unsupported DATASET type: ' + dataset );

				} else if ( inPointsSection ) {

					// get the vertices
					while ( ( result = pat3Floats.exec( line ) ) !== null ) {

						if ( patWord.exec( line ) !== null ) break;

						var x = parseFloat( result[ 1 ] );
						var y = parseFloat( result[ 2 ] );
						var z = parseFloat( result[ 3 ] );
						positions.push( x, y, z );

					}

				} else if ( inPolygonsSection ) {

					if ( ( result = patConnectivity.exec( line ) ) !== null ) {

						// numVertices i0 i1 i2 ...
						var numVertices = parseInt( result[ 1 ] );
						var inds = result[ 2 ].split( /\s+/ );

						if ( numVertices >= 3 ) {

							var i0 = parseInt( inds[ 0 ] );
							var i1, i2;
							var k = 1;
							// split the polygon in numVertices - 2 triangles
							for ( var j = 0; j < numVertices - 2; ++ j ) {

								i1 = parseInt( inds[ k ] );
								i2 = parseInt( inds[ k + 1 ] );
								indices.push( i0, i1, i2 );
								k ++;

							}

						}

					}

				} else if ( inTriangleStripSection ) {

					if ( ( result = patConnectivity.exec( line ) ) !== null ) {

						// numVertices i0 i1 i2 ...
						var numVertices = parseInt( result[ 1 ] );
						var inds = result[ 2 ].split( /\s+/ );

						if ( numVertices >= 3 ) {

							var i0, i1, i2;
							// split the polygon in numVertices - 2 triangles
							for ( var j = 0; j < numVertices - 2; j ++ ) {

								if ( j % 2 === 1 ) {

									i0 = parseInt( inds[ j ] );
									i1 = parseInt( inds[ j + 2 ] );
									i2 = parseInt( inds[ j + 1 ] );
									indices.push( i0, i1, i2 );

								} else {

									i0 = parseInt( inds[ j ] );
									i1 = parseInt( inds[ j + 1 ] );
									i2 = parseInt( inds[ j + 2 ] );
									indices.push( i0, i1, i2 );

								}

							}

						}

					}

				} else if ( inPointDataSection || inCellDataSection ) {

					if ( inColorSection ) {

						// Get the colors

						while ( ( result = pat3Floats.exec( line ) ) !== null ) {

							if ( patWord.exec( line ) !== null ) break;

							var r = parseFloat( result[ 1 ] );
							var g = parseFloat( result[ 2 ] );
							var b = parseFloat( result[ 3 ] );
							colors.push( r, g, b );

						}

					} else if ( inNormalsSection ) {

						// Get the normal vectors

						while ( ( result = pat3Floats.exec( line ) ) !== null ) {

							if ( patWord.exec( line ) !== null ) break;

							var nx = parseFloat( result[ 1 ] );
							var ny = parseFloat( result[ 2 ] );
							var nz = parseFloat( result[ 3 ] );
							normals.push( nx, ny, nz );

						}

					}

				}

				if ( patPOLYGONS.exec( line ) !== null ) {

					inPolygonsSection = true;
					inPointsSection = false;
					inTriangleStripSection = false;

				} else if ( patPOINTS.exec( line ) !== null ) {

					inPolygonsSection = false;
					inPointsSection = true;
					inTriangleStripSection = false;

				} else if ( patTRIANGLE_STRIPS.exec( line ) !== null || patCELLS.exec( line ) !== null ) {

					inPolygonsSection = false;
					inPointsSection = false;
					inTriangleStripSection = true;

				} else if ( patPOINT_DATA.exec( line ) !== null ) {

					inPointDataSection = true;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;

				} else if ( patCELL_DATA.exec( line ) !== null ) {

					inCellDataSection = true;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;

				} else if ( patCOLOR_SCALARS.exec( line ) !== null ) {

					inColorSection = true;
					inNormalsSection = false;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;

				} else if ( patNORMALS.exec( line ) !== null ) {

					inNormalsSection = true;
					inColorSection = false;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;

				}

			}

			var geometry = new BufferGeometry();
			geometry.setIndex( indices );
			geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );


			// console.log("indices.length: ", indices.length);  // 7032
			// console.log("positions.length: ", positions.length);  // 3600
			// console.log("positions.count: ", geometry.attributes.position.count)  // 1200

			for(let i=0; i<positions.length; i++){
				colors.push(Math.random());
			}

			if ( normals.length === positions.length ) {

				geometry.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

			}

			if ( colors.length !== indices.length ) {  // 7032

				// stagger

				if ( colors.length === positions.length ) {  // 3600

					geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

				}

			} else {  // 几何体级别的赋值  colors.length == indices.length

				// cell

				geometry = geometry.toNonIndexed();

			
				var numTriangles = geometry.attributes.position.count / 3;

				// for(let i=0; i<numTriangles*3; i++){
				// 	colors.push(Math.random());
				// }

				// 此时说明 colors的每3位，分别表示一个三角形整体的r,g,b
				// 这时候要把它转换成每个顶点，相当于额外拷贝2份（一共三份）

				console.log("---------");
				console.log(numTriangles);

				if ( colors.length === ( numTriangles * 3 ) ) {
					
					var newColors = [];

					for ( var i = 0; i < numTriangles; i ++ ) {

						var r = colors[ 3 * i + 0 ];
						var g = colors[ 3 * i + 1 ];
						var b = colors[ 3 * i + 2 ];

						newColors.push( r, g, b );
						newColors.push( r, g, b );
						newColors.push( r, g, b );

					}

					geometry.setAttribute( 'color', new Float32BufferAttribute( newColors, 3 ) );

				}

			}

			return geometry;

		}

		// get the 5 first lines of the files to check if there is the key word binary
		var meta = LoaderUtils.decodeText( new Uint8Array( data, 0, 250 ) ).split( '\n' );

		return parseASCII( LoaderUtils.decodeText( data ) );


	}

} );

export { VTKLoader };
