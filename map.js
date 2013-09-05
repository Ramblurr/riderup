var native_map = null;
var marker = null;
var tooltip = null;
var mouseMarker = null;
var placedMarker

function main() {
    // setup map
    cartodb.createVis('map', 'http://rendezvous.cartodb.com/api/v2/viz/4bdd593e-1621-11e3-9eaf-53da8c591d44/viz.json').done(function(vis, layers) {
        native_map = vis.getNativeMap();
        native_map.on('mousemove', function(e) {
            if (!mouseMarker) return;
            tooltip.updatePosition(e.latlng);
            mouseMarker.setLatLng(e.latlng);
            if (!marker) {
                marker = new L.Marker(e.latlng, {
                    icon: new L.Icon.Default(),
                    zIndexOffset: 2000 // This should be > than the highest z-index any markers
                });
                // Bind to both marker and map to make sure we get the click event.
                marker.on('click', mapClicked);
                mouseMarker.on('click', mapClicked);
                mouseMarker.addTo(native_map);
                native_map.on('click', mapClicked);
                native_map.addLayer(marker);
            } else {
                marker.setLatLng(e.latlng);
            }
        }, this);
    });
    // setup sidepanel
    $("#sidepanel").buildMbExtruder({
        position: "left",
        width: 300,
        positionFixed: false,
        top: 100,
        extruderOpacity: .8,
        onExtOpen: function() {},
        onExtContentLoad: function() {},
        onExtClose: function() {},
        extruderOpacity: 0.8,
    });
    $("#sidepanel").openMbExtruder(true);

    $("#choose-point").click(function() {
        $('.editing').show();
        $('.leaflet-container').css('cursor', 'default');
        showMouseMarker();
    });
    $("#point-discard").click(function() {
        $('.editing').hide();
        discard();
    });
    $("#point-done").click(function() {
        $('.editing').hide();
        hideMouseMarker();
    });
} // main

function showMouseMarker() {
    mouseMarker = L.marker(native_map.getCenter(), {
        icon: L.divIcon({
            className: 'leaflet-mouse-marker',
            iconAnchor: [20, 20],
            iconSize: [40, 40]
        }),
        opacity: 0,
        zIndexOffset: 2000 // This should be > than the highest z-index any markers
    });
    tooltip = new L.Tooltip(native_map);
    tooltip.updateContent({
        text: "Click map to set your location."
    });
}

function discard() {
    native_map.removeLayer(placedMarker);
    hideMouseMarker();
}

function hideMouseMarker() {
    native_map.removeLayer(mouseMarker);
    native_map.removeLayer(marker);
    tooltip.dispose();
    mouseMarker = null;
    marker = null;
    placedMarker = null;
}

function mapClicked() {
    if (!placedMarker) {
        placedMarker = new L.Marker(marker.getLatLng(), {
            icon: new L.Icon.Default(),
            zIndexOffset: 2000 // This should be > than the highest z-index any markers
        });
        native_map.addLayer(placedMarker);
    } else {
        placedMarker.setLatLng(marker.getLatLng());
    }
    $("#point-done").toggleClass("disabled", false);
}
window.onload = main;
