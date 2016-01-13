(function (angular, d3) {
    'use strict';

    angular
        .module('treemap', [])
        .directive('treemap', function ($compile) {
	return {
		restrict: 'E',
		scope: {
			data: '=',
			parentElementId: '@',
			id: '@',
			colorLabel: '@',
			sizeLabel: '@',
			maxVal: '@',
			search: '@'
		},

		link: function(scope, element, attrs){
			var maindata;
			var searchFilterFunction = function(str){

				var arr = document.getElementsByClassName('cell');
				for(var q in arr){
					if(isNaN(q)){
						continue;
					}
					var tmpObj = arr[q];
					if(!tmpObj){
						continue;
					}
					if(str && str != ''){
						if(tmpObj.getElementsByTagName('text')[0].innerHTML.split('<')[0].toUpperCase().indexOf(str.toUpperCase()) == -1){
							tmpObj.style.opacity = .1;
						}else{
							tmpObj.style.opacity = 1;
						}
					}else{
						tmpObj.style.opacity = 1;
					}
				}
			};

			var loadTreemap =  function(data){
				if(data && data.children){

                    var optionsHeight = 20;
                    function blendColors(color1, color2, percent,threshold) {
                        if(percent > threshold ) {
                            percent -= threshold ;
                            percent = percent/(1-threshold);
                        } else {
                            percent = percent/threshold;
                        }
                        var remaining = 1 - percent;

                        var red1 = (color1 >> 16) & 255 ;
                        var green1 = (color1 >> 8) & 255 ;
                        var blue1 = color1 & 255 ;

                        var red2 = (color2 >> 16) & 255 ;
                        var green2 = (color2 >> 8) & 255 ;
                        var blue2 = color2 & 255 ;

                        color1 = ((red1 * percent) << 16) + ((green1 * percent) << 8) + blue1 * percent;
                        color2 = ((red2 * remaining) << 16) + ((green2 * remaining) << 8) + blue2 * remaining;

                        return '#'+(color1 + color2).toString(16).toUpperCase().split('.')[0];
                    }

                    function position() {
                        this.style("left", function(d) { return d.x + "px"; })
                            .style("top", function(d) { return d.y + "px"; })
                            .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
                            .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
                    }
                    var w = document.getElementById(attrs.parentelementid).offsetWidth,
                        h = document.getElementById(attrs.parentelementid).offsetHeight - optionsHeight,
                        x = d3.scale.linear().range([0, w]),
                        y = d3.scale.linear().range([0, h]),
                        color = d3.scale.category20c(),
                        root,
                        node;

                    var dim = {'w':w, 'h':h, 'x': x, 'y':y, 'data': data}

                    var gapWidth = 1;

					var dummyarr = [];
					for(var q in data.children){
						var subsObj = data.children[q];
						var dummySubsObj = {};
						dummySubsObj.name = subsObj.name;
						for(var b in subsObj.children){
							if(!dummySubsObj.children){
								dummySubsObj.children = [];
							}
							var vmObj = subsObj.children[b];
							if(vmObj[scope.sizeLabel] && vmObj[scope.sizeLabel] != 0){
								dummySubsObj.children.push(vmObj);
							}
						}
						if(dummySubsObj.children && dummySubsObj.children.length > 0){
							dummyarr.push(dummySubsObj);
						}
					}

					data = {'children':dummyarr,'name':'root'};
                    if(!data.children || data.children.length == 0){
                        d3.select("#"+attrs.id).append("div")
                            .html('No Data Available')
                            .style("text-align","center")
                            .style("color","#FF454F")
                            .style("font-size","18px")
                            .style("padding-top",h/2+'px');
                        return;
                    }

					var treemap = d3.layout.treemap()
						.size([w, h])
						.sticky(true)
						.value(function(d) { return d[scope.sizeLabel]; });

					var optionsDiv =  d3.select("#"+attrs.id).append("div")
						.style("width", w + "px")
						.style("height", optionsHeight + "px")
						.style("margin", "auto");

					var colorDiv = optionsDiv.append("div");

					var newColorDiv = colorDiv.append("div").attr("id","parent-color-gradient")
						.append("div").attr("id","color-gradient");
					newColorDiv.append("div")
						.style("display", "initial")
						.style("position", "absolute")
						.style("left", 0).attr("id","color-gradient-no-1")
						.style("top", "10px")
						.style("font-size", "10px")
						.html('0');
					newColorDiv.append("div")
						.style("display", "initial")
						.style("position", "absolute")
						.style("left", "85%").attr("id","color-gradient-no-3")
						.style("top", "10px")
						.style("font-size", "10px")
						.html('100');
					newColorDiv.append("div")
						.style("display", "initial")
						.style("position", "absolute")
						.style("left", "45%").attr("id","color-gradient-no-2")
						.style("top", "10px")
						.style("font-size", "10px")
						.html('50');

					var svg = d3.select('#'+attrs.id).append("div")
						.attr("class", "chart")
						.style("width", w + "px")
						.style("height", h + "px")
						.append("svg:svg")
						.attr("width", w)
						.attr("height", h)
						.attr("id","main-svg")
						.style("border","1px solid #ccc")
						.style("background-color","grey");

					var data = data;
					node = root = data;

					var nodes = treemap.nodes(root)
						.filter(function(d) { return !d.children; });

					d3.select('#'+attrs.id).append("svg:g")
						.attr("transform", "translate(.5,.5)");

					var cell = svg.selectAll("g")
						.data(nodes)
						.enter().append("svg:g")
						.attr("class", "cell")
						.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
						.attr("ng-class",function(d) { return "{'opaqueClass' :'"+ d.name + "'.indexOf(attr) == -1  }" ;})
						.on("click", function(d) {
							if(isIE() === false)
								return zoom(node == d.parent ? root : d.parent);
						});

					cell.append("svg:rect")
						.attr("width", function(d) { return d.dx - gapWidth; })
						.attr("height", function(d) { return d.dy - gapWidth; })
						.style("fill", function(d) {
							var threshold = .5;
							var val = d[scope.colorLabel] ;
							var maxVal = 100;
							if(scope.maxVal){
								maxVal = parseInt(scope.maxVal);
							}
							document.getElementById('color-gradient-no-2').innerHTML = Math.abs(maxVal/2);
							document.getElementById('color-gradient-no-3').innerHTML = Math.abs(maxVal);
							var minColor = parseInt("40664D",16);
							var midColor = parseInt("FFCC00",16);
							var maxColor = parseInt("990000",16);
							var calculatedVal = Math.abs(val) / maxVal;

							if(calculatedVal <= threshold){
								return blendColors(midColor, minColor,calculatedVal,threshold);
							}

							if(calculatedVal > threshold && calculatedVal <= 1){
								return blendColors(maxColor,midColor,calculatedVal,threshold);
							}

							if(calculatedVal > 1){
								return blendColors(maxColor,midColor, 1,threshold);
							}
						})
						.append("svg:title").html(function(d) {return 'Name'+' : '+ d.name+'\n'+scope.colorLabel+' : '+ d[scope.colorLabel]+'\n'+scope.sizeLabel+' : '+d[scope.sizeLabel]});

					cell.append("svg:text")
						.attr("x", function(d) { return d.dx / 2; })
						.attr("y", function(d) { return d.dy / 2; })
						.attr("dy", ".35em")
						.attr("text-anchor", "middle")
						.text(function(d) { return d.name; })
						.attr("fill",'whitesmoke')
						.style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; })
						.append("svg:title").html(function(d) {return 'Name'+' : '+ d.name+'\n'+scope.colorLabel+' : '+ d[scope.colorLabel]+'\n'+scope.sizeLabel+' : '+ d[scope.sizeLabel]});

					d3.select(window).on("click", function() {
						//zoom(root);
					});

					d3.select("select").on("change", function() {
						treemap.value(this.value == "size" ? size : count).nodes(root);
						zoom(node);
					});

					for(var tmp in root.children ){
						var obj = root.children[tmp];
						var varx = obj.x ;
						var vary = obj.y ;
						var varwidth = obj.x + obj.dx ;
						var varheight = obj.y + obj.dy ;
						var idname = obj.name ;
						var attrbs = [
							{x1: varx,     y1: vary,      x2:varwidth, y2:vary, stroke: 'red', 'stroke-width': 15,'class': 'border-rect','id':idname},
							{x1: varwidth, y1: vary,      x2:varwidth, y2:varheight, stroke: 'red', 'stroke-width': 15,'class': 'border-rect','id':idname},
							{x1: varwidth, y1: varheight, x2:varx,     y2:varheight, stroke: 'red', 'stroke-width': 15,'class': 'border-rect','id':idname},
							{x1: varx,     y1: varheight, x2:varx,     y2:vary, stroke: 'red', 'stroke-width': 15,'class': 'border-rect','id':idname},
						];

						for(var t1 in attrbs){
							var attrsVar = attrbs[t1];
							var el= document.createElementNS('http://www.w3.org/2000/svg', 'line');
							for (var k in attrsVar) {
								el.setAttribute(k, attrsVar[k]);
							}
							document.getElementById('main-svg').appendChild(el);
						}

						var svgg = d3.select('#main-svg').append('g');
							
							svgg
								.attr("id", tmp)
								.on("click", function(d) {
									if(isIE() === false)
										return zoom(root.children[this.id]);
								})
								.attr('transform', 'translate('+(varx)+', '+(vary)+')')
								.append('rect')
								.style('fill', '#fff')
								.attr("width", obj.dx)
								.attr("height", 22)
								.attr("class", "subs-cls");
								
							svgg.append("text")
								.attr("class", "subs-cls")
								.attr("x", '10')
								.attr("y", '16')
								.text(idname);

					}


					// Support Functions/Methods
					// Zoom IN/OUT Function
					function zoom(d) {
						var kx = w / d.dx, ky = h / d.dy;
						x.domain([d.x, d.x + d.dx]);
						y.domain([d.y, d.y + d.dy]);

						var t = svg.selectAll("g.cell").transition()
							.duration(d3.event.altKey ? 7500 : 750)
							.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

						t.select("rect")
							.attr("width", function(d) { return kx * d.dx - gapWidth; })
							.attr("height", function(d) { return ky * d.dy - gapWidth; });

						t.select("text")
							.attr("x", function(d) { return kx * d.dx / 2; })
							.attr("y", function(d) { return ky * d.dy / 2; })
							.style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

						node = d;
						d3.event.stopPropagation();
						var borderRect = document.getElementsByClassName('border-rect');
						var subsCls = document.getElementsByClassName('subs-cls');
						var i = 0 ;
						
						var elementSubs = document.getElementById('first-subs-cls');
						var elementSubs1 = document.getElementById('first-subs-cls1');
						
						if(d.name == data.name){
							setTimeout(function(){
								for (var i = 0; i < borderRect.length; i ++) {
									borderRect[i].style.display = 'block';
								}

								for (var i = 0; i < subsCls.length; i ++) {
									subsCls[i].style.display = 'block';
								}
																
								elementSubs.style.display = 'none';
								elementSubs1.style.display = 'none';
							}, 500);
						} else {
							for (var i = 0; i < borderRect.length; i ++) {
								borderRect[i].style.display = 'none';
							}
							for (var i = 0; i < subsCls.length; i ++) {
								subsCls[i].style.display = 'none';
							}
							
							if(!elementSubs || elementSubs.length == 0){
								var idname = d.name;
								var svgg = d3.select('#main-svg').append('g');
							
								svgg									
									.on("click", function(d) {
										if(isIE() === false)
											return zoom(root);
									})
									.attr('transform', 'translate(0, 0)')
									.append('rect')
									.attr("id", 'first-subs-cls')
									.style('fill', '#fff')
									.attr("width", w)									
									.attr("height", 22)		
									.attr("class", "dup-subs-cls");
									
								svgg.append("text")	
									.attr("id", 'first-subs-cls1')
									.attr("class", "dup-subs-cls")
									.attr("x", '10')
									.attr("y", '16')									
									.text(idname);
									
								//var attr = {x: 0,y: 0,dy:"1em",dx:".5em",id : 'first-subs-cls',style :'font-size: 15px;font-weight: bold;opacity : .5'}
								//var elText= document.createElementNS('http://www.w3.org/2000/svg', 'text');
								//for (var k1 in attr){
								// elText.setAttribute(k1, attr[k1]);
								//}
								//elText.innerHTML = d.name;
								//document.getElementById('main-svg').appendChild(elText);
							} else {
								d3.select('#main-svg #first-subs-cls1').text(d.name);								
								
								elementSubs.style.display = 'block';
								elementSubs1.style.display = 'block';
							}
						}
					}
					// Zoom IN/OUT Function

					function size(d) {
						return d[scope.sizeLabel];
					}

					function count(d) {
						return 1;
					}


					// Support Functions/Methods
				}
			}

			scope.$watch('data', function(data){
				maindata = data;
			});
			scope.$watch('colorLabel', function(data){
				if(!data){
					return;
				}
				var list = document.getElementById(attrs.id);
				while (list.hasChildNodes()) {
					list.removeChild(list.firstChild);
				}
				loadTreemap(maindata);
				searchFilterFunction(scope.search);
			});

			scope.$watch('search', function(data){
				if(!data){
					searchFilterFunction('');
				}else {
					searchFilterFunction(data);
				}
			});

		}
	}
});

}(angular, d3));

function isIE() {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer, return version number
            return true;        

   return false
}