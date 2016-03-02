;(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(factory);
    } else if ( typeof exports === 'object' ) {
        module.exports = factory;
    } else {
        root.srcBox = factory(root);
    }
})(this, function (root) {
	//
	// Object variant for array.length
	//
	Object.size = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};

	//
	// Variables
	//
	var api = {
	    breakpoint : 0
	  , breakpointVal : 0
	  , currentBreakpoint : 0
	  , lazyElems : []
	  , mergedElements : []
	  , selector : {}
	  , viewPortWidth : 0
	  //
	  // Methods
	  //
	  , addEvent : function addEvent (evnt, el, func) {
				if (el.addEventListener) { // W3C DOM
					el.addEventListener(evnt,func,false);
				} else if (el.attachEvent) { // IE DOM
					el.attachEvent('on' + evnt, func);
				} else { // No much to do
					el[evnt] = func;
				}
			}
			// underscore debounce function
	  , debounce : function debounce (func, wait, immediate) {
				var timeout;
				return function() {
					var context = this, args = arguments
						, later = function() {
							timeout = null;
							if (!immediate) func.apply(context, args);
						}
						, callNow = immediate && !timeout;

					clearTimeout(timeout);
					timeout = setTimeout(later, wait);
					if (callNow) func.apply(context, args);
				};
			}
	  , devicePixelRatio : function devicePixelRatio () {
				return 'devicePixelRatio' in window
					? window.devicePixelRatio
					: 1
			}
	  , extend : function extend (defaults, options) {
				var extended = {};

				api.forEach(defaults, function (value, prop) {
					extended[prop] = defaults[prop];
				});

				api.forEach(options, function (value, prop) {
					extended[prop] = options[prop];
				});

				return extended;
			}
	  , forEach : function forEach (collection, callback, scope) {
				if (Object.prototype.toString.call(collection) === '[object Object]') {
					for (var prop in collection) {
						if (Object.prototype.hasOwnProperty.call(collection, prop)) {
							callback.call(scope, collection[prop], prop, collection);
						}
					}
				} else {
					for (var i = 0, len = collection.length; i < len; i++) {
						callback.call(scope, collection[i], i, collection);
					}
				}
			}
	  , getBreakpoint : function getBreakpoint (breakpoints, vWidth) {
				var _vWidth = vWidth
					, i = 0
					, breakpoint = {}
					, _breakpoint
					, maxWidth
					, minDpr
					, minWidth
					, hide;

				while (_breakpoint = breakpoints[i]) {
					minWidth = _breakpoint['minWidth'];
					maxWidth = _breakpoint['maxWidth'];
					minDpr   = 'minDevicePixelRatio' in _breakpoint ? _breakpoint['minDevicePixelRatio'] : 0;
					hide   = 'hide' in _breakpoint;

					// Viewport width found
					if (vWidth > 0) {
						if (minWidth && maxWidth  && vWidth >= minWidth && vWidth <= maxWidth ||
							minWidth && !maxWidth && vWidth >= minWidth ||
							maxWidth && !minWidth && vWidth <= maxWidth) {
							
							if (!minDpr || minDpr && api.devicePixelRatio() >= minDpr) {
								breakpoint = _breakpoint;
								if (maxWidth && hide) breakpoint.folder = 'hide';
							}
						}
					// Viewport width not found so let's find the smallest image size
					// (mobile first approach).
					} else if (_vWidth <= 0 || minWidth < _vWidth || maxWidth < _vWidth) {
						_vWidth = minWidth || maxWidth || _vWidth;
						breakpoint = _breakpoint;
					}
					i++;
				}

				return breakpoint;
			}
	  , getViewportWidthInCssPixels : function getViewportWidthInCssPixels () {
				var math = Math
					, widths = [
						window.innerWidth
						, window.document.documentElement.clientWidth
						, window.document.documentElement.offsetWidth
						, window.document.body.clientWidth]
					, i = 0
					, width
					, screenWidth = window.screen.width;

				for (; i < widths.length; i++) {
					// If not a number remove it
					if (isNaN(widths[i])) {
						widths.splice(i, 1);
						i--;
					}
				}

				if (widths.length) {
					width = math.max.apply(math, widths);

					// Catch cases where the viewport is wider than the screen
					if (!isNaN(screenWidth)) {
						width = math.min(screenWidth, width);
					}
				}

				return width || screenWidth || 0;
			}
	  , inviewport : function inviewport (element) {
				var rect = element.getBoundingClientRect();
				var html = document.documentElement;

				return (
					rect.top >= 0 &&
					rect.left >= 0 &&
					rect.bottom <= (window.innerHeight || html.clientHeight) &&
					rect.right <= (window.innerWidth || html.clientWidth)
				);
			}
		, isEmpty: function isEmpty (obj) {
				for(var prop in obj) {
					if(obj.hasOwnProperty(prop))
						return false;
				}

				return true;
			}
	  , orientationEvent : function orientationEvent () {
				return api.supportsOrientationChange()
					? 'orientationchange'
					: 'resize';
			}
	  , removeClass : function removeClass (el, remove) {
				var newClassName = ''
					, i
					, classes = el.className.split(' ');

				for(i = 0; i < classes.length; i++) {
					if (classes[i] !== remove) {
						newClassName += classes[i] +  ' ';
					}
				}
				el.className = newClassName;
			}
	  , removeEvent : function removeEvent (evnt, el, func) {
				if (el.removeEventListener) { // W3C DOM
					el.removeEventListener(evnt,func,false);
				} else if (el.detachEvent) { // IE DOM
					el.detachEvent('on' + evnt, func);
				} else { // No much to do
					el.splice(evnt, 1);
				}
			}
	  , setBreakpoint : function setBreakpoint (el, breakpoint) {
				if (breakpoint == 'hide') {
					el.className = el.className + ' srcbox-hidden';

					if (el.nodeName.toLowerCase() != 'img') {
						el.style.backgroundImage = '';
						el.style.backgroundRepeat = '';
					} 
					return;
				} else if (el.className.indexOf('srcbox-hidden') >= 0) {
					el.className = el.className.replace( /(?:^|\s)srcbox-hidden(?!\S)/g , '' )
				}

				var dataBreakpoint = el.getAttribute('data-breakpoint')
					, dataImg = el.getAttribute('data-img')
					, src;
				
				if (!dataBreakpoint || !dataImg) throw new Error('srcBox.js [function setBreakpoint]: The provided elements are missing a data-breakpoint or data-img attribute: <img data-breakpoint="/path/to/folder/{breakpoint}" data-img="some-img.jpg" />');

				src = (dataBreakpoint + dataImg)
					.replace('{folder}', breakpoint);

				api.setSrc(el, src);
			}
	  , setImage : function setImage (el, settings) {
				var dataOffsetWidth = el.getAttribute('data-breakpointwidth') // todo documentation
					, offsetWidth = dataOffsetWidth !== null
						? dataOffsetWidth
						: settings.parentOffset
							? el.parentNode.offsetWidth
							: api.getViewportWidthInCssPixels()
					, elBreakpoint = api.getBreakpoint(settings.breakpoints, offsetWidth)
					, elBreakpointVal;

				elBreakpointVal = !api.isEmpty(elBreakpoint)
					? elBreakpoint.folder
					: elBreakpointVal = settings.defaultBreakpoint.folder;

				api.setBreakpoint(el, elBreakpointVal);
			}
	  , setImages : function setImages (nodes, selector) {
				viewPortWidth = api.getViewportWidthInCssPixels();
				breakpoint = api.getBreakpoint(srcBox.settings[selector].breakpoints, viewPortWidth);

				breakpointVal = !api.isEmpty(breakpoint)
					? breakpoint.maxWidth || breakpoint.minWidth
					: srcBox.settings[selector].defaultBreakpoint.folder;
					
				if (api.currentBreakpoint != breakpointVal) {
					if (selector == api.selector[Object.size(api.selector) - 1]) {
						api.currentBreakpoint = breakpointVal;
					}

					api.forEach(nodes, function(value, prop) {
						api.setImage(nodes[prop], srcBox.settings[selector]);
					});

					api.addEvent('scroll', window, api.setLazySrc);
				}
			}
	  , setLazySrc : function setLazySrc () {
				var lazyElemsLength = api.lazyElems.length;

				while (lazyElemsLength--) {
					if (api.inviewport(api.lazyElems[lazyElemsLength])) {
						api.lazyElems[lazyElemsLength].src = api.lazyElems[lazyElemsLength].getAttribute('data-lag-src');
						api.lazyElems[lazyElemsLength].removeAttribute('height'); // IE(9) fix
						api.lazyElems.splice(lazyElemsLength, 1);
					}
				}
			}
	  , setSrc : function setSrc (el, src) {
				if (new RegExp("(^|\\s)lag(\\s|$)").test(el.className)) {
					el.setAttribute('data-lag-src', src);
					api.lazyElems.push(el);
				} else {
					if (el.nodeName.toLowerCase() === 'img') {
						el.src = src;
						el.removeAttribute('height'); // IE(9) fix
					} else {
						el.style.backgroundImage = 'url(' + src + ')';
					}
				}
			}
	  , supportsOrientationChange : function supportsOrientationChange () {
				return 'ontouchstart' in window;
			}
	}
  , srcBox = {
		//
		// Variables
		//
		settings : []
		//
		// Methods
		//
	  , init : function (selector, options, context) {
				// reset on multiple calls on different querySelectors
				api.currentBreakpoint = 0;

				// ie8 Fix
				if (document.all && !document.addEventListener) {
					var _slice = Array.prototype.slice;
					Array.prototype.slice = function() {
						if (this instanceof Array) {
							return _slice.apply(this, arguments);
						} else {
							var result = []
								, start = (arguments.length >= 1) ? arguments[0] : 0
								, end = (arguments.length >= 2) ? arguments[1] : this.length;

							for (var i = start; i < end; i++) {
								result.push(this[i]);
							}
							return result;
						}
					};
				}

				//
				// Variables
				//
				var context = context || document
          , options = options || []
          , imgCollection = Array.prototype.slice.call(context.querySelectorAll(selector)) || []
					// Default settings
					, defaults = {
							breakpoints: [
									// desktop
									{folder: '480', maxWidth: 480}
								, {folder: '640', minWidth: 481, maxWidth: 767}
								, {folder: '900', minWidth: 768, maxWidth: 900}
								, {folder: '1170', minWidth: 992}
									// tablet
								, {folder: '900', minWidth: 748, maxWidth: 1024}
									// Retina
								, {folder: '640', maxWidth: 320, minDevicePixelRatio: 2} // iPhone 4 Retina display
								, {folder: '900', minWidth: 320, maxWidth: 667, minDevicePixelRatio: 2} // iPhone 5 /6 Retina display
								, {folder: '2048', minWidth: 414, maxWidth: 736, minDevicePixelRatio: 3} // iPhone 6 PLUS Retina display
								, {folder: '2048', minWidth: 748, maxWidth: 1024, minDevicePixelRatio: 2} // tablet Retina display
							]
            , debug : false
            , parentOffset : true
					}
					, settings = typeof options === 'object' && 'breakpoints' in options
							? 'extend' in options && options.extend === true
								? api.extend(defaults, options)
								: options
							: api.extend(defaults, options)
					, numberOfRemainingImages
					, onComplete = function onComplete () {
							numberOfRemainingImages--;

							if (!numberOfRemainingImages) {
								srcBox.settings[selector].onComplete();
							}
						};

				settings.defaultBreakpoint = 'defaultBreakpoint' in options
					? options.defaultBreakpoint
					: {folder: '1170'}; // todo documentation

				srcBox.settings[selector] = settings;
				//
				// Initialize
				//
				api.selector[Object.size(api.selector)] = selector;
				api.mergedElements[selector] = imgCollection;
				api.setImages(imgCollection, selector);
				api.setLazySrc();

				//
				// Events
				//
        if (api.lazyElems.length) {
          api.addEvent('scroll', window, api.setLazySrc);
        }

        if (srcBox.settings[selector].debug) {
          api.addEvent(api.orientationEvent(), window, api.debounce(function () {
            api.forEach(api.selector, function (value, prop) {
              api.setImages(api.mergedElements[api.selector[prop]], api.selector[prop]);
            });
          }, 250));
        }

				if ('onComplete' in srcBox.settings[selector]) {
					numberOfRemainingImages = imgCollection.length;

					if (numberOfRemainingImages) {
						api.forEach(imgCollection, function(value, prop) {
							if (!new RegExp('[\w\s]*(lag)+[\w\s]*').test(imgCollection[prop].className)) {
								imgCollection[prop].onload = onComplete;
								if (imgCollection[prop].readyState == 'complete') {
									imgCollection[prop].onload();
								} else if (imgCollection[prop].readyState) {
									// Sometimes IE doesn't fire the readystatechange, even though the readystate has been changed to complete. AARRGHH!! I HATE IE, I HATE IT, I HATE IE!
									imgCollection[prop].src = imgCollection[prop].src; // Do not ask me why this works, ask the IE team!
								}
								/*
								 * End ugly working IE fix.
								 */
								else if (imgCollection[prop].complete) {
									imgCollection[prop].onload();
								}
								else if (imgCollection[prop].complete === undefined) {
									var src = imgCollection[prop].src;
									// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
									// data uri bypasses webkit log warning (thx doug jones)
									imgCollection[prop].src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
									imgCollection[prop].src = src;
								}
							} else {
								numberOfRemainingImages--;
								if (!numberOfRemainingImages) srcBox.settings[selector].onComplete();
							}

							api.setImage(imgCollection[prop], srcBox.settings[selector]);
						});
					}
				}
			}
	  , reset : function reset (selector) {
				api.currentBreakpoint = 0;

				// only init srcBox for new elements, temporary remove the class name
				var tmp = api.mergedElements[selector];
				api.forEach(api.mergedElements[selector], function (value, prop) {
					api.removeClass(api.mergedElements[selector][prop], selector.substring(1));
				});

				srcBox.init(selector, srcBox.settings[selector]);
				api.forEach(tmp, function (value, prop) {
					tmp[prop].className += selector.substring(1);
				});
			}
	};

	return srcBox;
});