;(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(factory);
    } else if ( typeof exports === 'object' ) {
        module.exports = factory;
    } else {
        root.srcBox = factory(root);
    }
})(this, function (root) {
	var api = {
		newItems : []
	  , devicePixelRatio : function () {
			return 'devicePixelRatio' in window
				? window.devicePixelRatio
				: 1
		}
	  , lazyElems : []
	  , breakpoint : 0
	  , currentBreakpoint : 0
	  , breakpointVal : 0
	  , viewPortWidth : 0
	  //
	  // Methods
	  //
	  , forEach : function (collection, callback, scope) {
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
	  , extend : function ( defaults, options ) {
			var extended = {};

			api.forEach(defaults, function (value, prop) {
				extended[prop] = defaults[prop];
			});

			api.forEach(options, function (value, prop) {
				extended[prop] = options[prop];
			});

			return extended;
		}
	  , getViewportWidthInCssPixels : function getViewportWidthInCssPixels() {
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
	  , getBreakpoint : function getBreakpoint(breakpoints, vWidth) {
			var _vWidth = vWidth
			  , i = 0
			  , breakpoint = {}
			  , _breakpoint
			  , maxWidth
			  , minDpr
			  , minWidth;

			while (_breakpoint = breakpoints[i]) {
				minWidth = _breakpoint['minWidth'];
				maxWidth = _breakpoint['maxWidth'];
				minDpr   = 'minDevicePixelRatio' in _breakpoint ? _breakpoint['minDevicePixelRatio'] : 0;

				// Viewport width found
				if (vWidth > 0) {
					if (minWidth && maxWidth  && vWidth >= minWidth && vWidth <= maxWidth ||
						minWidth && !maxWidth && vWidth >= minWidth ||
						maxWidth && !minWidth && vWidth <= maxWidth) {
						if (!minDpr || minDpr && api.devicePixelRatio() >= minDpr) {
							breakpoint = _breakpoint;
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
	  , setBreakpoint : function setBreakpoint(el, breakpoint) {
			var dataBreakpoint = el.getAttribute('data-breakpoint')
				, dataImg = el.getAttribute('data-img')
				, isLazy
				, src;

			if (!dataBreakpoint || !dataImg) throw new Error('srcBox.js [function setBreakpoint]: The provided elements are missing a data-breakpoint or data-img attribute: <img data-breakpoint="/path/to/folder/{breakpoint}" data-img="some-img.jpg" />');

			src = dataBreakpoint
					.replace('{folder}', breakpoint)
				+ el.getAttribute('data-img');
			isLazy = new RegExp("(^|\\s)lag(\\s|$)").test(el.className);

			if (isLazy) {
				el.setAttribute('data-lag-src', src);
				api.lazyElems.push(el);
			} else {
				el.src = src;
				el.removeAttribute('height'); // IE(9) fix
			}
		}
	  , addEvent : function addEvent (evnt, el, func) {
			if (el.addEventListener) { // W3C DOM
				el.addEventListener(evnt,func,false);
			} else if (el.attachEvent) { // IE DOM
				el.attachEvent('on' + evnt, func);
			} else { // No much to do
				el[evnt] = func;
			}
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
	  , scrollPos : function scrollPos () {
			var scrollTop = (window.pageYOffset !== undefined)
				? window.pageYOffset
				: (document.documentElement || document.body.parentNode || document.body).scrollTop
			  , scrollLeft = (window.pageXOffset !== undefined)
					? window.pageXOffset
					: (document.documentElement || document.body.parentNode || document.body).scrollLeft;

			return [scrollTop, scrollLeft];
		}
	  , offset : function offset (rect, position) {
			rect = rect.getBoundingClientRect();

			switch (position) {
				case 'left':
					return rect.left; // x position of rect relative to viewport
				case 'top':
					return rect.top; // y position of rect relative to viewport
				default:
					return 0;
			}
			/*
			rect.left // x position of element relative to viewport
			rect.top // y position of element relative to viewport
			rect.width // width of element, including padding and borders
			rect.height // height of element, including padding and borders
			rect.offsetWidth // width of element - IE8 and below
			rect.offsetHeight // height of element - IE8 and below
			*/
		}
	  , belowthefold : function belowthefold (element) {
			var fold = (window.innerHeight
					? window.innerHeight
					: Math.max(document.documentElement.clientHeight, document.body.clientHeight)
				) + api.scrollPos()[0];

			return fold <= api.offset(element, 'top');
		}
	  , rightoffold : function rightoffold (element) {
			var fold = (window.innerWidth
					? window.innerWidth
					: Math.max(document.documentElement.clientWidth, document.body.clientWidth)
				) + api.scrollPos()[1];

			return fold <= api.offset(element, 'left');
		}
	  , abovethetop : function abovethetop (element) {
			return api.scrollPos()[0] >= api.offset(element, 'top') + element.height;
		}
	  , leftofbegin : function leftofbegin (element) {
			return api.scrollPos()[1] >= api.offset(element, 'left') + element.width;
		}
	  , inviewport : function inviewport (element) {
			return !api.rightoffold(element) && !api.leftofbegin(element) &&
				!api.belowthefold(element) && !api.abovethetop(element);
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
			if (!api.lazyElems.length) {
				api.removeEvent('scroll', window, api.setLazySrc);
			}
		}
		// underscore debounce function
	  , debounce : function debounce(func, wait, immediate) {
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
	  , setImage : function setImage(el, settings) {
			if (el.nodeName === 'IMG') {
				var elBreakpoint = api.getBreakpoint(settings.breakpoints, el.parentNode.offsetWidth)
				  , elBreakpointVal = 'minDevicePixelRatio' in elBreakpoint
						? elBreakpoint.maxWidth
						: elBreakpoint.folder;
				api.setBreakpoint(el, elBreakpointVal);
			}
		}
	  , setImages : function setImages (nodes, settings) {
			viewPortWidth = api.getViewportWidthInCssPixels();
			breakpoint = api.getBreakpoint(settings.breakpoints, viewPortWidth);
			breakpointVal = 'minDevicePixelRatio' in breakpoint
				? breakpoint.maxWidth
				: (breakpoint.folder - 0);

			if (api.currentBreakpoint !== breakpointVal) {
				api.currentBreakpoint = breakpointVal;

				api.forEach(nodes, function(value, prop) {
					api.setImage(nodes[prop], settings);
				});

				api.addEvent('scroll', window, api.setLazySrc);
			}
		}
	  , waitForNew : function waitForNew (e) {
			// cancel bubbling up for performance
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			
			var target;

			if (e.target.nodeName === 'IMG') {
				target = e.target;
				api.newItems.push(target);
			} else if (e.target.querySelector) {
				target = e.target.querySelectorAll('img');
				api.forEach(target, function (value, prop) {
					api.newItems.push(target[prop]);
				});
			} else {
				return;
			}
		}
	  , supportsOrientationChange : function () {
			return 'ontouchstart' in window;
		}
	  , orientationEvent : function () {
			return supportsOrientationChange
				? 'orientationchange'
				: 'resize';
		}
	}
  , srcBox = function (selector, options) {
		//
		// Variables
		//
		var elements = document.querySelectorAll(selector)
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
			}
		  
		  , settings = typeof options === 'object' && 'breakpoints' in options
				? 'extend' in options && options.extend === true
					? api.extend(defaults, options)
					: options
				: defaults
		  , numberOfRemainingImages
		  , onNewNode = function onNewNode () {
				numberOfRemainingImages--;
				if (!numberOfRemainingImages) {
					settings.onNewNode();
				}
				api.removeEvent('load', this, onNewNode);
			}
		  , onComplete = function onComplete () {
				numberOfRemainingImages--;
				if (!numberOfRemainingImages) {
					settings.onComplete();
				}
				api.removeEvent('load', this, onComplete);
			};
		
		//
		// Initialize
		//
		api.setImages(elements, settings);
		api.setLazySrc();

		//
		// Events
		//
		api.addEvent('scroll', window, api.setLazySrc);
		api.addEvent(api.orientationEvent, window, api.debounce(function () {
			api.setImages(elements, settings);
		}, 250));

		if ('onNewNode' in settings) {
			api.addEvent('load', window, function () {
				api.addEvent('DOMNodeInserted', document, api.debounce(function () {
					numberOfRemainingImages = api.newItems.length;

					if (api.newItems.length) {
						api.forEach(api.newItems, function(value, prop) {
							if (new RegExp('[\w\s]*(srcbox)+[\w\s]*').test(api.newItems[prop].className)) {
								api.setImage(api.newItems[prop], settings);

								api.addEvent('load', api.newItems[prop], onNewNode);
							}
						});

						api.newItems.splice(0, api.newItems.length);
					}
				}, 250));

				api.addEvent('DOMNodeInserted', document, api.waitForNew);
			});
		}
		
		if ('onComplete' in settings) {
			numberOfRemainingImages = elements.length;

			if (numberOfRemainingImages) {
				api.forEach(elements, function(value, prop) {
					api.setImage(elements[prop], settings);

					if (!new RegExp('[\w\s]*(lag)+[\w\s]*').test(elements[prop].className)) {
						api.addEvent('load', elements[prop], onComplete);
					} else {
						numberOfRemainingImages--;
						if (!numberOfRemainingImages) settings.onComplete();
					}
				});
			}
		}
	};

	return srcBox;
});