var native_map = null;
var marker = null;
var tooltip = null;
var mouseMarker = null;
var placedMarker = null;
var latlng = null;

function main() {
    // setup map
    cartodb.createVis('map', 'http://rendezvous.cartodb.com/api/v2/viz/4bdd593e-1621-11e3-9eaf-53da8c591d44/viz.json').done(function(vis, layers) {
        native_map = vis.getNativeMap();

        //search control
        native_map.addControl( new L.Control.Search({
            url: 'http://nominatim.openstreetmap.org/search?format=json&q={s}',
            jsonpParam: 'json_callback',
            propertyName: 'display_name',
            propertyLoc: ['lat','lon'],
            markerLocation: false,
            autoType: false,
            autoCollapse: true,
            minLength: 2,
            zoom:10,
            position: 'topright',
        }) );

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
        $('.leaflet-container').css('cursor', 'crosshair');
        $("#latlng").text('');
        if(placedMarker) {
            native_map.removeLayer(placedMarker);
            placedMarker = null;
        }
        showMouseMarker();
    });
    $("#point-discard").click(function() {
        $('.leaflet-container').css('cursor', '');
        $('.editing').hide();
        discard();
    });
    $("#point-done").click(function() {
        $('.leaflet-container').css('cursor', '');
        $('.editing').hide();
        done();
    });

    $("#travelers").validate({
        errorClass: "control-label",
        highlight: function (element) {
            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        },
        success: function (element) {
            element.text('OK!').addClass('valid')
                .closest('.form-group').removeClass('has-error').addClass('has-success');
        },
        rules: {
            name: "required",
            description: { required: true, minlength: 25 },
            contact: "required",
            latlng: "required"
        },
        messages: {
            name: "Please enter your name or handle",
            description: { required: "Please enter a short description of your journey", minlength: "Description must be longer" },
            contact: "Please enter some contact details",
            latlng: "Please select your location on the map"
        },
        submitHandler: function(form) {
            form.submit();
        }
    });


} // main

function showMouseMarker() {
    mouseMarker = L.marker(native_map.getCenter(), {
        icon: L.divIcon({
            className: 'leaflet-mouse-marker cursor-crosshair',
            iconAnchor: [20, 20],
            iconSize: [40, 40],
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
    placedMarker = null;
    latlng = null;
    hideMouseMarker();
}

function done() {
    if(!latlng) return;
    $("#latlng").text(latlng.lat + ", " + latlng.lng);
    $("#submit").toggleClass("disabled", false);
    hideMouseMarker();
}

function hideMouseMarker() {
    native_map.removeLayer(mouseMarker);
    native_map.removeLayer(marker);
    tooltip.dispose();
    mouseMarker = null;
    marker = null;
}

function mapClicked() {
    if( !marker ) return;
    latlng = marker.getLatLng();
    if (!placedMarker) {
        placedMarker = new L.Marker(latlng, {
            icon: new L.Icon.Default(),
            zIndexOffset: 2000 // This should be > than the highest z-index any markers
        });
        native_map.addLayer(placedMarker);
    } else {
        placedMarker.setLatLng(latlng);
    }
    $("#point-done").toggleClass("disabled", false);
}

function validate() {

}
window.onload = main;
