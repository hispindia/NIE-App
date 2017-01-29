/**
 * Created by harsh on 15/12/16.
 */

import React from 'react';
import ReactDOM from 'react-dom';
//import L from 'leaflet';
import ajax from './ajax-wrapper'
import $ from 'jquery';
import dhis2API from './dhis2API/dhis2API';
import moment from 'moment';
import dhis2Map from './maps/map';
import mUtility from './maps/mapUtilities';
import {AlertPopUp} from './components/components';

var map;
var api = new dhis2API();

window.refresh = function(){


    var c_dist=$('#c_dist').val();
    var threshold=$('#threshold').val();
    var startDate = $('#date').val();
    var diff = moment(new Date()).diff(startDate,'days');
    
    $('#movingPeriod').text(diff);
    getEvents(startDate).then(function(events){
        var coords =  extractCoordsFromEvents(events);
        buildMap(coords,c_dist,threshold);
    });



}

window.alertConfirmed = function(){
    alert("SMS alerts to go here!");

}

$('document').ready(function(){
    map = new dhis2Map();

    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    var format = "YYYY-MM-DD";
    $('#date').val(moment(startDate).format(format));

    map.init("mapid",[13.23521,80.3332],9);
    // control that shows state info on hover
    /*
      var info = L.control();

      info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update();
      return this._div;
      };

      info.update = function (props) {
      this._div.innerHTML = '<h4></h4>' +  (props ?
      '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
      : '');
      };

      map.addToMap(info);
    */
    ajax.request({
        type: "GET",
        async: true,
        contentType: "application/json",
        url: "../../organisationUnits?filter=level:eq:5&fields=id,name,coordinates&paging=false"
    },function(error,response){
        if (error){

        }else{
             addOrgUnits(getCoordinatesFromOus(response.organisationUnits));
        }
    })

    // coordinates to be filtered here.
    var startDate = $('#date').val();
    getEvents(startDate).then(function(events){
        var coords =  extractCoordsFromEvents(events);
        buildMap(coords,5,3);
    });

});

function getEvents(startDate){
    var def = $.Deferred();

    var endDate = new Date();
    var format = "YYYY-MM-DD";

    ajax.request({
        type: "GET",
        async: true,
        contentType: "application/json",
        url: "../../events?orgUnit="+api.getRootOrgUnitUid()+"&ouMode=DESCENDANTS&startDate="+moment(startDate).format(format)+"&endDate="+moment(endDate).format(format)+"&skipPaging=true"
    },function(error,response){
        if (error){
            def.resolve(null);
        }else{
            def.resolve(response.events);
        }
    })
    return def.promise();
}

function extractCoordsFromEvents(events){

    var result = [];
    for (var i=0;i<events.length;i++){       
        if (events[i].coordinate){
            if (events[i].coordinate.latitude!=0&&events[i].coordinate.longitude!=0){
                if (events[i].program == "xqoEn6Je5Kj"){
                    var type = "unknown";
                    if (events[i].programStage == "Fy9tjDYgdBi"){
                        var val = findValueAgainstId(events[i].dataValues,"dataElement","ylhxXcMMuZC","value");
                        if (val == "AFI" || val == "ADD"){
                            type = val;
                        }else{continue;}
                    }else 
                        if (events[i].programStage == "jo25vJdB3qx"){
                            if (events[i].dataValues.length>0){
                                type="LAB";
                            }else{continue;}
                        }
                    
                    result.push({
                        id : events[i].event , 
                        coordinates : events[i].coordinate, 
                        orgUnit : events[i].orgUnitName,
                        type : type
                       
                    })
                }
                
            }
        }
        
    }
    return result;
}

function findValueAgainstId(data,idKey,id,valKey){
    
    for (var i=0;i<data.length;i++){
        if (data[i][idKey]==id){
            return data[i][valKey]
        }
    }
return null;
    
}
function getCoordinatesFromOus(ous){

    var ouCoords = [];
    for (var key in ous){
        if (ous[key].coordinates){
            var coords = JSON.parse(ous[key].coordinates);
            //reverseCoordinates(coords[0]);

            ouCoords.push(coords[0]);
        }
    }
    return ouCoords;
}

function reverseCoordinates(coords){

    for (var i=0;i<coords.length;i++){
        for (var j=0;j<coords[i].length;j++){
            var temp = coords[i][j][0];
            coords[i][j][0] = coords[i][j][1];
            coords[i][j][1] = temp;
        }
    }
    return coords;
}

function addOrgUnits(blockCoords){

    
    // a GeoJSON multipolygon
    var mp = {
        "type": "Feature",
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": blockCoords
        },
        "properties": {
            "name": "MultiPolygon",
            key : "block"

            
        }
    };
    var style = { color: "black",
                  opacity: 0.75,
                  fillColor: "white",
                  fillOpacity: 0,
                  weight : 2,
                  //                  dashArray: '5, 5',

                }

    var pointToLayer = function(feature, latlng) {
        feature.properties.style = style;
    };

    map.addGeoJson(mp,null,style);

}

function buildMap(coords,c_dist,threshold){
    if (threshold < 3){alert("threshold cannot be less than 3"); return}

    map.clearLayers();

    window.coords=coords;
    var featureCollection = mUtility.clusterize(coords,c_dist,threshold);
    
    var icon = getCustomIcon();

    //var redAlertMarker = new icon({iconUrl: 'images/red-icon.png'})
    var feverDotIcon =L.divIcon({
        className:'alert-icon leaflet-clickable',
        html:'<i class="alert-icon"></i>'
    });
    
    var feverIcon =getCustomIcon('yellow');

    var pointToLayer = function(feature, latlng) {
        if (feature.properties){
            switch(feature.properties.type){
            case 'centroid' : 
                var centroidIcon =L.divIcon({
                    className:'alert-icon-centroid leaflet-clickable',
                    html:'<i class="alert-icon-centroid"><b>['+feature.properties.clusterSize+']</b></i>'
                });
                
                return L.marker(latlng,{
                    icon : centroidIcon
                });
            case 'LAB' :  
                return L.marker(latlng,{
                    icon : getCustomIcon('violet')
                });
                
            case 'AFI' :   return L.marker(latlng,{
                icon : getCustomIcon('yellow')
            });
            case 'ADD' :
                return L.marker(latlng,{
                    icon : getCustomIcon('orange')
                });
                
            }
        }
        
        return L.marker(latlng, {
            // icon: icon
        });
        
    }
    var pointsLayers =  map.addGeoJson(featureCollection.geoJsonPointFeatures,pointToLayer,null,onEachFeature); 
  /*  var markers = L.markerClusterGroup({  });
    markers.addLayer(pointsLayers);
    map.getMap().addLayer(markers);
*/
    /*   
         pointToLayer = getPointToLayer(feverIcon,feverDotIcon);  
         var style = function(){
         return { color: "darkred",
         opacity: 0.75,
         fillColor: "red",
         fillOpacity: 0.1,                
         dashArray: '5, 5',
         //weight: 5

         }
         }
         // var onEachFeature = onEachFeature;
         map.addGeoJson(featureCollection.geoJsonPolygonFeatures,pointToLayer,style,onEachFeature);
    */
    addClustergons(map.getMap(),featureCollection.geoJsonPolygonFeatures)

    addLegend(map.getMap())
    //  setTimeout(function(){ReactDOM.render(<AlertPopUp />, document.getElementById('alert'))},10000)

    // map.();
}

function addLegend(map){
var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend');
            var html = '<img src="images/marker-icon-yellow.png"  height="31" width="25"> : AFI<br>'+
	    '<img src="images/marker-icon-orange.png"  height="31" width="25"> : ADD<br>'+
	    '<img src="images/marker-icon-violet.png"  height="31" width="25"> : LAB';

		div.innerHTML = html;
		return div;
	};

	legend.addTo(map);

}
function addClustergons(map,gjson){

    var geojson;
    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
	    weight: 2,
	    color: 'darkred',
            opacity: 0.9,
            fillColor: "black",
            fillOpacity: 0.05,   
	    dashArray: '',
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
	    layer.bringToFront();
        }

        //	info.update(layer.feature.properties);
    }


    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        //	info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    var style = function(){
        return { color: "black",
            opacity: 0.75,
            fillColor: "red",
            fillOpacity: 0.1,                
            dashArray: '5, 5',
            weight: 3

        }
    }

    var onEachFeature = function (feature, layer)
    {
        layer.on({
	      mouseover: highlightFeature,
	     mouseout: resetHighlight,
	    //   click: zoomToFeature
	});
        /*
          if (feature.properties.type == 'centroid'){                
          layer.bindPopup('<div id="alert"><i>Cluster Found</i><br><input type="button" value="Please confirm" onclick="alertConfirmed()"></div>');
          
          }else{
          layer.bindPopup('<div id="alert"><i>Fever Case[<b> '+feature.properties.label+'</b>]<br></div>');
          }
        */
        
    }

    geojson = L.geoJson(gjson, {
	style: style,
	onEachFeature: onEachFeature
    }).addTo(map);


    

}
function onEachFeature (feature, layer)
{
    if (feature.properties.type == 'centroid'){                
        layer.bindPopup('<div id="alert"><i>Cluster Found</i><br><input type="button" value="Please confirm" onclick="alertConfirmed()"></div>');
        
    }else{
        layer.bindPopup('<div id="alert"><i>Fever Case[<b> '+feature.properties.label+'</b>]<br></div>');
    }

}


function getPointToLayer(centroidIcon,icon){
    return function(feature, latlng) {
        if (feature.properties)
            if (feature.properties.type == 'centroid'){
                var centroidIcon =L.divIcon({
                    className:'alert-icon-centroid leaflet-clickable',
                    html:'<i class="alert-icon-centroid"><b>['+feature.properties.clusterSize+']</b></i>'
                });                                      
                return L.marker(latlng,{
                    icon : centroidIcon
                })
            }

        return L.marker(latlng, {
            // icon: icon
        });
    };

}
function getCustomIcon(name){
    return   new L.Icon({
        //  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        iconUrl: 'images/marker-icon-'+name+'.png',
        //  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        shadowUrl: 'images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

}
