import * as _ from 'lodash';
import randomColor from 'randomcolor';

export class Map {
    constructor(mapOptions) {
        var defaults = {
            container: 'map',
            style: 'mapbox://styles/morgenkaffee/cimsw88b8002l8sko6hhm2pr1',
            center: [5.9701, 46.1503],
            zoom: 9
        };
        this.mapOptions = _.extend(mapOptions, defaults);

        this.layers = [];
        this.map = new mapboxgl.Map(this.mapOptions);
        this.map.addControl(new mapboxgl.Navigation({ position: 'top-left' }));
        this.map.on('click', (e) => this.displayPopup(e));
    }

    displayPopup(e) {
        var features = this.map.queryRenderedFeatures(e.point, {
            layers: this.layers
        });

        if (!features.length) {
            return;
        }

        var feature = features[0];

        // Populate the popup and set its coordinates
        // based on the feature found.
        var popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(renderDebugPopup(feature.properties))
            .addTo(this.map);
    }

    recreateDebugLayers(layerId, sourceId, result) {
        this.layers = [
            layerId + '_line',
            layerId + '_point',
            layerId + '_polygon',
        ];
        this.map.batch((batch) => {
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
            this.map.addSource(sourceId, {
                "type": "geojson",
                "data": result
            });
            createDebugLayers(batch, layerId, sourceId, randomColor());
        });
    }
}

function createDebugLayers(map, id, source, color) {
    try {
        map.removeLayer(id + "_line");
        map.removeLayer(id + "_point");
        map.removeLayer(id + "_polygon");
    } catch(err) {
        //Layer don't exist yet
    }

    var layerBelow = 'water';
    map.addLayer(createLineLayer(id + "_line", source, color), layerBelow);
    map.addLayer(createPointLayer(id + "_point", source, color), layerBelow);
    map.addLayer(createPolygonLayer(id + "_polygon", source, color), layerBelow);
};

function createLineLayer(id, source, color) {
    return {
        "id": id,
        "type": "line",
        "source": source,
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": color,
            "line-width": 2
        },
        "filter": ["all", ["==", "$type", "LineString" ]]
    };
}

function createPointLayer(id, source, color) {
    return {
        "id": id,
        "type": "circle",
        "source": source,
        "paint": {
            "circle-radius": 2,
            "circle-color": color,
        },
        "filter": ["all", ["==", "$type", "Point" ]]
    };
}

function createPolygonLayer(id, source, color) {
    return {
        "id": id,
        "type": "fill",
        "source": source,
        "paint": {
            "fill-color": color,
            "fill-opacity": 0.8
        },
        "filter": ["all", ["==", "$type", "Polygon" ]]
    };
}

function renderDebugPopup(props) {
	var html = '<table class="debug-props">';
	for (var key in props) {
		html += '<tr class="debug-prop">';
		html += '<td class="debug-prop-key">';
		html += key;
		html += '</td>';
		html += '<td class="debug-prop-value">';
		html += props[key];
		html += '</td>';
		html += '</tr>';
	}
	html += '</div>';
	return html;
}