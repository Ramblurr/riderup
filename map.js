var native_map = null;
var marker = null;
var tooltip = null;
var mouseMarker = null;
var placedMarker = null;
var latlng = null;
var map_vis = null;

function main() {
    // setup map
    cartodb.createVis('map', 'http://rendezvous.cartodb.com/api/v2/viz/4bdd593e-1621-11e3-9eaf-53da8c591d44/viz.json').done(function(vis, layers) {
        map_vis = vis;
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
        closeOnExternalClick: false,
        closeOnClick:false
    });
    $("#sidepanel").openMbExtruder(true);

    $("#choose-point").click(function() {
        $('.editing').show();
        $('.leaflet-container').css('cursor', 'crosshair');
        clearLatLng();
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

window.setInterval(refreshMap, 5000);

//} // main

$(document).ready(function() {
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
        console.log("submit handler)");
        insertData();
        return false;
    }
});
});
}


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
    hideMouseMarker();
    clearLatLng();
}

function done() {
    if(!latlng) return;
    $("#data-submit").toggleClass("disabled", false);
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
    setLatLng(marker.getLatLng());
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

function setLatLng(ll) {
    latlng = ll;
    ll_str = latlng.lat + "," + latlng.lng
    $('input[name=latlng]').val(ll_str);
    $("#latlng").text(ll_str);
}

function clearLatLng(){
    latlng = null;
    $("#latlng").text('');
    $('input[name=latlng]').val('');
}

function insertData() {

    var cartodb_api_key = 'e7ee67b39a9f66b9dd7d2cbf16d7cd64d73d338f';
    var cartodb_user = 'rendezvous';
    var sql = new cartodb.SQL({ user: cartodb_user, api_key: cartodb_api_key  });

    var loc = "CDB_LatLng("+latlng.lat+","+latlng.lng+")";

    var name = $('input[name=name]').val();
    var description = $('textarea[name=description]').val();
    var contact = $('input[name=contact]').val();

    /**
    * Remove all single quotes
    */
    name = name.replace("'","''");
    description = description.replace("'","''");
    contact =  contact.replace("'","''");

    var query = "INSERT INTO traveler_data(name,description,contact,the_geom) VALUES('"+name+"','"+description+"','"+contact+"',"+loc+")";
    console.log(query);

    sql.execute(query).done(function(data) {
        refreshMap();
    }).error(function(errors) {
        console.log("error:" + errors);
    });
}

function refreshMap() {
    layer = map_vis.getLayers()[1].invalidate();
}


window.onload = main;
