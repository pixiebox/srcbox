;(function () {
	var srcBox = {
		newItems : []
	  , devicePixelRatio : function () {
			return window.devicePixelRatio || 1
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

			srcBox.forEach(defaults, function (value, prop) {
				extended[prop] = defaults[prop];
			});

			srcBox.forEach(options, function (value, prop) {
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
						if (!minDpr || minDpr && devicePixelRatio >= minDpr) {
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
					.replace('{breakpoint-name}', breakpoint)
				+ el.getAttribute('data-img');
			isLazy = new RegExp("(^|\\s)lag(\\s|$)").test(el.className);

			if (isLazy) {
				el.setAttribute('data-lag-src', src);
				srcBox.lazyElems.push(el);
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
				) + scrollPos()[0];

			return fold <= offset(element, 'top');
		}
	  , rightoffold : function rightoffold (element) {
			var fold = (window.innerWidth
					? window.innerWidth
					: Math.max(document.documentElement.clientWidth, document.body.clientWidth)
				) + srcBox.scrollPos()[1];

			return fold <= srcBox.offset(element, 'left');
		}
	  , abovethetop : function abovethetop (element) {
			return srcBox.scrollPos()[0] >= srcBox.offset(element, 'top') + element.height;
		}
	  , leftofbegin : function leftofbegin (element) {
			return srcBox.scrollPos()[1] >= srcBox.offset(element, 'left') + element.width;
		}
	  , inviewport : function inviewport (element) {
			return !srcBox.rightoffold(element) && !srcBox.leftofbegin(element) &&
				!srcBox.belowthefold(element) && !srcBox.abovethetop(element);
		}
	  , setLazySrc : function setLazySrc () {
			var lazyElemsLength = srcBox.lazyElems.length;

			while (lazyElemsLength--) {
				if (srcBox.inviewport(srcBox.lazyElems[lazyElemsLength])) {
					srcBox.lazyElems[lazyElemsLength].src = srcBox.lazyElems[lazyElemsLength].getAttribute('data-lag-src');
					srcBox.lazyElems[lazyElemsLength].removeAttribute('height'); // IE(9) fix
					srcBox.lazyElems.splice(lazyElemsLength, 1);
				}
			}
			if (!srcBox.lazyElems.length) {
				srcBox.removeEvent('scroll', window, srcBox.setLazySrc);
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
				var elBreakpoint = srcBox.getBreakpoint(settings.breakpoints, el.parentNode.offsetWidth)
				  , elBreakpointVal = 'minDevicePixelRatio' in elBreakpoint
						? elBreakpoint.maxWidth
						: (elBreakpoint.folder - 0);
				srcBox.setBreakpoint(el, elBreakpointVal);
			}
		}
	  , setImages : function setImages (nodes, settings) {
			viewPortWidth = srcBox.getViewportWidthInCssPixels();
			breakpoint = srcBox.getBreakpoint(settings.breakpoints, viewPortWidth);
			breakpointVal = 'minDevicePixelRatio' in breakpoint
				? breakpoint.maxWidth
				: (breakpoint.folder - 0);

			if (srcBox.currentBreakpoint !== breakpointVal) {
				srcBox.currentBreakpoint = breakpointVal;

				if (nodes.constructor === NodeList) {
					srcBox.forEach(nodes, function(value, prop) {
						srcBox.setImage(nodes[prop], settings);
					});
				} else {
					srcBox.setImage(nodes,settings);
				}
				srcBox.addEvent('scroll', window, srcBox.setLazySrc);
			}
		}
	  , waitForNew : function waitForNew (e) {
			// cancel bubbling up for performance
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			
			var target;

			if (e.target.nodeName === 'IMG') {
				target = e.target;
				srcBox.newItems.push(target);
			} else if (e.target.querySelector) {
				target = e.target.querySelectorAll('img');
				srcBox.forEach(target, function (value, prop) {
					srcBox.newItems.push(target[prop]);
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
	};

	Object.defineProperty(Object.prototype, "srcBox", { 
		value: function (options) {
			//
			// Variables
			//
			var self = this
			  , settings = {}
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
			  
			  , settings = typeof options === 'object'
					? srcBox.extend(defaults, options)
					: defaults
			  , numberOfRemainingImages
			  , onNewNode = function onNewNode() {
					numberOfRemainingImages--;
					if (!numberOfRemainingImages) {
						settings.onNewNode();
					}
					srcBox.removeEvent('load', this, onNewNode);
			};
			
			//
			// Initialize
			//
			srcBox.setImages(this, settings);
			srcBox.setLazySrc();

			//
			// Events
			//
			srcBox.addEvent('scroll', window, srcBox.setLazySrc);
			srcBox.addEvent(srcBox.orientationEvent, window, srcBox.debounce(function () {
				srcBox.setImages(self, settings);
			}, 250));

			if ('onNewNode' in settings) {
				srcBox.addEvent('load', window, function () {
					srcBox.addEvent('DOMNodeInserted', document, srcBox.debounce(function () {
						numberOfRemainingImages = srcBox.newItems.length;

						if (srcBox.newItems.length) {
							srcBox.forEach(srcBox.newItems, function(value, prop) {
								if (new RegExp('[\w\s]*(srcbox)+[\w\s]*').test(srcBox.newItems[prop].className)) {
									srcBox.setImage(srcBox.newItems[prop], settings);

									srcBox.addEvent('load', srcBox.newItems[prop], onNewNode);
								}
							});

							srcBox.newItems.splice(0, srcBox.newItems.length);
						}
					}, 250));

					srcBox.addEvent('DOMNodeInserted', document, srcBox.waitForNew);
				});
			}
		}
	  , enumerable : false
	});
})();