// JavaScript Document

var config = JSON.parse(animaConfig);

var container = config.containerElement;
	topoJSON = config.topoJSONFile;
	animationFile = config.animationFile;
	

var width = 938,
    height = 500;

var projection = d3.geo.mercator()
    .scale(150)
	.translate([width / 2, height / 1.5]);
	
var path = d3.geo.path().projection(projection);

var svg = d3.select("#"+container).append("svg")
	.attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);

d3.json(topoJSON, function(error, world) {
	svg.append("g")
		.attr("id", "contries")
		.selectAll('.country')
		.data(topojson.feature(world, world.objects.countries).features)
		.enter().append("path")
		.attr("id", function(d) {return d.id})
		.attr("d", path)
});

/* Some zoom functionality adopted from http://www.tnoda.com/blog/2013-12-07 */
function zoom(xyz) {
	svg.selectAll("g").transition()
    	.duration(750)
    	.attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")");
}

/* A method for computing the bounding box for the list of elements that must be within the map's zoom */
function compute_zoom(elementList) {
	var bottom = null;
	var top = null;
	var left = null;
	var right = null;
	
	for(i = 0; i < elementList.length; i++) {	
		var rect = svg.select('#'+elementList[i]).node().getBBox();
		
		if (!bottom || rect.y < bottom) bottom = rect.y;
		if (!top || (rect.y + rect.height) > top) top = rect.y + rect.height;
		if (!left || rect.x < left) left = rect.x
		if (!right || (rect.x + rect.width) > right) right = rect.x + rect.width;
	}
	
	var w_scale = (right - left) / width;
	var h_scale = (top - bottom) / height;
	
	var z = .96 / Math.max(w_scale, h_scale);
  	var x = (right + left) / 2;
  	var y = (top + bottom) / 2 + (height / z / 6);
  	return [x, y, z];
}

$(window).resize(function() {
  var w = $("#map").width();
  svg.attr("width", w);
  svg.attr("height", w * height / width);
});

$('#start').on("click", function(e) {
	$(this).hide();
	$('#player').html("Loading...");

	var jqxhr = $.ajax({ url: "animations/intro.json", async: false, dataType:"json"})
	.done(function(response) {
		
			var audioPlayer = document.createElement("audio");
			audioPlayer.setAttribute("src", "intro.ogg");
			audioPlayer.setAttribute("id", "audioPlayer");
			audioPlayer.setAttribute("autoplay", "autoplay");
			audioPlayer.setAttribute("controls","controls");
			audioPlayer.load();
			
			var nextAnimation = 0;
			var numAnimations = response.animations.length;
			
			$('#player').html('');
			$('#player').append(audioPlayer);
			audioPlayer.play();
						
			$(audioPlayer).bind('timeupdate', function() {
				if (this.currentTime > response.animations[nextAnimation].delay) {
					var index = nextAnimation;
					nextAnimation++;
					
					if (nextAnimation >= numAnimations) $(audioPlayer).unbind('timeupdate');
					
					$('#animationSheet').attr('href', response.animations[index].stylesheet);	
					
					var selectList = new Array();
					var zoomList = new Array();
					var selectAll = false;

					for(var i = 0; i < response.animations[index].selection.length; i++) {
						var selection = response.animations[index].selection[i];
						if (selection.zoom) {
							if (selection.name == "") selectAll = true;
							zoomList.push(selection.name);
						}
					}
					var xyz;
					
					if (zoomList.length > 0) {
						if (selectAll) xyz = [width / 2, height / 1.5, 1];
						else xyz = compute_zoom(zoomList);		
					}
					
					zoom(xyz);
				}
			});
			$(audioPlayer).bind('ended', function() {
				$('#player').html("");
				$('#continue').show();
			});
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		alert(textStatus+" "+errorThrown);
	});
});