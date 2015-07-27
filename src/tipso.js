/*!
 * tipso - A Lightweight Responsive jQuery Tooltip Plugin v1.0.4
 * Copyright (c) 2014-2015 Bojan Petkovski
 * http://tipso.object505.com
 * Licensed under the MIT license
 * http://object505.mit-license.org/
 */
; // CommonJS, AMD or browser globals
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {
  var pluginName = "tipso",
    defaults = {
      speed           : 400,
      background      : '#55b555',
      color           : '#ffffff',
      position        : 'top',
      width           : 200,
	  maxWidth        : '',
      delay           : 200,
      animationIn     : '',
      animationOut    : '',
      toggleAnimation : false,
      offsetX         : 0,
      offsetY         : 0,
      content         : null,
      ajaxContentUrl  : null,
      useTitle        : true,
      tooltipHover    : true,
      onBeforeShow    : null,
      onShow          : null,
      onHide          : null
    };

  function Plugin(element, options) {
    this.element = $(element);
	this.doc = $(document);
    this.win = $(window);
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this._title = this.element.attr('title');
    this.mode = 'hide';
    this.ieFade = !supportsTransitions;
	this.uid = tipCounter++;
    this.init();
  }
  $.extend(Plugin.prototype, {
    init: function() {
      var obj = this,
       $e = this.element,
       $doc = this.doc;
      $e.addClass('tipso_style').removeAttr('title');
      if (isTouchSupported()) {
        $e.on('click' + '.' + pluginName, function(e) {
          obj.mode == 'hide' ? obj.show() : obj.hide();
          e.stopPropagation();
        });
        $doc.on('click', function closeTipso () {
          if (obj.mode == 'show') {
            obj.hide();
          }
        });
      } else {
        $e.on('mouseover' + '.' + pluginName, function() {
          obj.show(obj.settings.delay);
        });
        $e.on('mouseout' + '.' + pluginName, function() {
          obj.hide(obj.settings.delay);
        });
      }
    },
    tooltip: function() {
      if (!this.tipso_bubble) {
        this.tipso_bubble = $(
          '<div class="tipso_bubble"><div class="tipso_content"></div><div class="tipso_arrow"></div></div>'
        );
		this.tipso_bubble.find('.tipso_content').html(this.content());
		$(window).resize(function tipsoResizeHandler () {
			if (this.mode == 'show') {
				reposition(this);
			}
		});
      }
      return this.tipso_bubble;
    },
    show: function() {
		var tipso_bubble = this.tooltip(),
		obj = this;
		
		if (obj.mode == 'show') {
			$.doTimeout(String(obj.uid));
			return;
		}
		
		if ($.isFunction(obj.settings.onBeforeShow)) {
			obj.settings.onBeforeShow($(this));
		}
		prepareTooltip(this);
		$.doTimeout(String(obj.uid), obj.settings.delay, function(){ animateShow(obj) });
    },
    hide: function() {
		hideIfNotHidden(this);
    },
    destroy: function() {
      var $e = this.element,
        $win = this.win,
        $doc = this.doc;
      $e.off('.' + pluginName);
      $win.off('resize', null, 'tipsoResizeHandler');
      if (isTouchSupported()) {
        $doc.off('click', null, 'closeTipso' );
      }
      $e.removeData(pluginName);
      $e.removeClass('tipso_style').attr('title', this._title);
    },
    content: function() {
      var content,
        $e = this.element,
        obj = this,
        title = this._title;
      if (obj.settings.ajaxContentUrl) {
        content = $.ajax({
          type: "GET",
          url: obj.settings.ajaxContentUrl,
          async: false
        }).responseText;
      } else if (obj.settings.content) {
        content = obj.settings.content;
      } else {
        if (obj.settings.useTitle === true) {
          content = title;
        } else {
          content = $e.data('tipso');
        }
      }
      return content;
    },
    update: function(key, value) {
      var obj = this;
      if (value) {
        obj.settings[key] = value;
      } else {
        return obj.settings[key];
      }
    }
  });

   var tipCounter = 0;
   var showing = null;

  function prepareTooltip(obj) {
	    the_width = obj.settings.width;
		if (obj.settings.maxWidth) {
			the_width = obj.settings.maxWidth;
		}
		tipso_bubble = obj.tooltip();
		tipso_bubble.css({
			background: '#BDB76B', // fall back to dark khaki. TO DO: method to convert rgba, hsl etc. to hex. Do in init!
			background: obj.settings.background,
			color: obj.settings.color,
			width: the_width,
			display: 'none'
		});
		reposition(obj);
	}

	function interact(obj, tipso_bubble) {
		if (obj.settings.tooltipHover) {
			tipso_bubble.hover( function () {
				// cancel any scheduled hiding.
				$.doTimeout(String(obj.uid));
				// if already animating - attempt to toggle the animation
				if ($(this).is(':animated')) {
					// TO DO: how do i make this work when animation isn't default?
					// this still causes strange event-firing sequences with non-default animation.
					animateShow(obj);
				}
			}, function () {
				hideIfNotHidden(obj);
			});
		}
	}
	
	function defaultAnimation(obj) {
		return obj.ieFade || obj.settings.animationIn === '' || obj.settings.animationOut === '';
	}

	function animateShow(obj) {
		setShowing(obj);
		tipso_bubble = obj.tooltip();
		objProto = $(obj);
		var jumpToEnd = !obj.settings.toggleAnimation;
		if (defaultAnimation(obj)){
			tipso_bubble.appendTo('body').stop(true, jumpToEnd).fadeIn(obj.settings.speed, tooltipShowing(obj, tipso_bubble));
		} else {
			tipso_bubble.remove().appendTo('body')
			.stop(true, jumpToEnd)
			.removeClass('animated ' + obj.settings.animationOut)
			  .addClass('noAnimation')
			  .removeClass('noAnimation')
			  .addClass('animated ' + obj.settings.animationIn).fadeIn(obj.settings.speed, function() {
					objProto.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
					objProto.removeClass('animated ' + obj.settings.animationIn);
				});
				tooltipShowing(obj, tipso_bubble);
			});
		}
	}

	function tooltipShowing(obj, tipso_bubble) {
		obj.mode = 'show';
		interact(obj, tipso_bubble);
		if ($.isFunction(obj.settings.onShow)) {
			obj.settings.onShow($(obj));
		}
	}
	
	function hideIfNotHidden(obj) {
		if (obj.mode == 'hide') {
			$.doTimeout(String(obj.uid));
			return;
		}
		$.doTimeout(String(obj.uid), obj.settings.delay, function(){ animateHide(obj) });
	}
	
	function animateHide(obj) {
		tipso_bubble = obj.tooltip();
		var jumpToEnd = !obj.settings.toggleAnimation;
		if (defaultAnimation(obj)){
			tipso_bubble.stop(true, jumpToEnd).fadeOut(obj.settings.speed, tooltipHidden(obj));
		} else {
			tipso_bubble.stop(true, jumpToEnd)
			.removeClass('animated ' + obj.settings.animationIn)
			.addClass('noAnimation').removeClass('noAnimation')
			.addClass('animated ' + obj.settings.animationOut)
			.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){          
			  $(this).removeClass('animated ' + obj.settings.animationOut);          
			  tooltipHidden(obj);
			});
		}
	}
	
	function tooltipHidden(obj) {
		tipso_bubble = obj.tooltip();
		tipso_bubble.remove();
		if ($.isFunction(obj.settings.onHide) && obj.mode == 'show') {
			obj.settings.onHide(tipso_bubble);
		}
		obj.mode = 'hide';
		if (showing === obj) {
			showing = null;
		} else if (showing) {
			console.log('WARNING: showing tooltip ' + showing.uid + ' is not the currently hiding one (' + obj.uid + ')');
		}
	}
	
	function setShowing(obj) {
		if (showing) {
			showing.hide();
			tooltipHidden(showing);
		}
		showing = obj;
	}
	
	function isTouchSupported() {
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
    var generalTouchEnabled = "ontouchstart" in document.createElement(
      "div");
    if (msTouchEnabled || generalTouchEnabled) {
      return true;
    }
    return false;
  }

  function realHeight(obj) {
    var clone = obj.clone();
    clone.css("visibility", "hidden");
    $('body').append(clone);
    var height = clone.outerHeight();
    var width = clone.outerWidth();
    clone.remove();
    return {
      'width' : width,
      'height' : height
    };
  }

  var supportsTransitions = (function() {
    var s = document.createElement('p').style, 
        v = ['ms','O','Moz','Webkit'];
    if( s['transition'] == '' ) return true; 
    while( v.length ) 
        if( v.pop() + 'Transition' in s )
            return true;
    return false;
  })();

  function reposition(thisthat) {
    var tipso_bubble = thisthat.tooltip(),
      $e = thisthat.element,
      obj = thisthat,
      $win = $(window),
      arrow = 10,
      pos_top, pos_left, diff;

      if ( $e.parent().outerWidth() > $win.outerWidth() ){
        $win = $e.parent();
      }
    switch (obj.settings.position) {
      case 'top':
        pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
        pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -8,
          marginTop: ''
        });
        if (pos_top < $win.scrollTop()) {
          pos_top = $e.offset().top + $e.outerHeight() + arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': obj.settings.background,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('bottom');
        } else {
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': obj.settings.background,
            'border-bottom-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('top');
        }
        break;
      case 'bottom':
        pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -8,
          marginTop: ''
        });
        if (pos_top + realHeight(tipso_bubble).height > $win.scrollTop() + $win.outerHeight()) {
          pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-top-color': obj.settings.background,
            'border-bottom-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('top');
        } else {
          tipso_bubble.find('.tipso_arrow').css({
            'border-bottom-color': obj.settings.background,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass(obj.settings.position);
        }
        break;
      case 'left':
        pos_left = $e.offset().left - realHeight(tipso_bubble).width - arrow;
        pos_top = $e.offset().top + ($e.outerHeight() / 2) - (realHeight(tipso_bubble).height / 2);
        tipso_bubble.find('.tipso_arrow').css({
          marginTop: -8,
          marginLeft: ''
        });
        if (pos_left < $win.scrollLeft()) {
          pos_left = $e.offset().left + $e.outerWidth() + arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': obj.settings.background,
            'border-left-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('right');
        } else {
          tipso_bubble.find('.tipso_arrow').css({
            'border-left-color': obj.settings.background,
            'border-right-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass(obj.settings.position);
        }
        break;
      case 'right':
        pos_left = $e.offset().left + $e.outerWidth() + arrow;
        pos_top = $e.offset().top + ($e.outerHeight() / 2) - (realHeight(tipso_bubble).height / 2);
        tipso_bubble.find('.tipso_arrow').css({
          marginTop: -8,
          marginLeft: ''
        });
        if (pos_left + arrow + obj.settings.width > $win.scrollLeft() +
          $win.outerWidth()) {
          pos_left = $e.offset().left - realHeight(tipso_bubble).width - arrow;
          tipso_bubble.find('.tipso_arrow').css({
            'border-left-color': obj.settings.background,
            'border-right-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass('left');
        } else {
          tipso_bubble.find('.tipso_arrow').css({
            'border-right-color': obj.settings.background,
            'border-left-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          });
          tipso_bubble.removeClass('top bottom left right');
          tipso_bubble.addClass(obj.settings.position);
        }
        break;
    }
    if (pos_left < $win.scrollLeft() && (obj.settings.position == 'bottom' ||
      obj.settings.position == 'top')) {
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: pos_left - 8
      });
      pos_left = 0;
    }
    if (pos_left + obj.settings.width > $win.outerWidth() && (obj.settings.position ==
      'bottom' || obj.settings.position == 'top')) {
      diff = $win.outerWidth() - (pos_left + obj.settings.width);
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: -diff - 8,
        marginTop: ''
      });
      pos_left = pos_left + diff;
    }
    if (pos_left < $win.scrollLeft() && (obj.settings.position == 'left' ||
      obj.settings.position == 'right')) {
      pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: -8,
        marginTop: ''
      });
      pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
      if (pos_top < $win.scrollTop()) {
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          'border-bottom-color': obj.settings.background,
          'border-top-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });
        tipso_bubble.removeClass('top bottom left right');
        tipso_bubble.addClass('bottom');
      } else {
        tipso_bubble.find('.tipso_arrow').css({
          'border-top-color': obj.settings.background,
          'border-bottom-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });
        tipso_bubble.removeClass('top bottom left right');
        tipso_bubble.addClass('top');
      }
      if (pos_left + obj.settings.width > $win.outerWidth()) {
        diff = $win.outerWidth() - (pos_left + obj.settings.width);
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -diff - 8,
          marginTop: ''
        });
        pos_left = pos_left + diff;
      }
      if (pos_left < $win.scrollLeft()) {
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: pos_left - 8
        });
        pos_left = 0;
      }
    }
    if (pos_left + obj.settings.width > $win.outerWidth() && (obj.settings.position == 'left' || obj.settings.position == 'right')) {
      pos_left = $e.offset().left + ($e.outerWidth() / 2) - (realHeight(tipso_bubble).width / 2);
      tipso_bubble.find('.tipso_arrow').css({
        marginLeft: -8,
        marginTop: ''
      });
      pos_top = $e.offset().top - realHeight(tipso_bubble).height - arrow;
      if (pos_top < $win.scrollTop()) {
        pos_top = $e.offset().top + $e.outerHeight() + arrow;
        tipso_bubble.find('.tipso_arrow').css({
          'border-bottom-color': obj.settings.background,
          'border-top-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });
        tipso_bubble.removeClass('top bottom left right');
        tipso_bubble.addClass('bottom');
      } else {
        tipso_bubble.find('.tipso_arrow').css({
          'border-top-color': obj.settings.background,
          'border-bottom-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        });
        tipso_bubble.removeClass('top bottom left right');
        tipso_bubble.addClass('top');
      }
      if (pos_left + obj.settings.width > $win.outerWidth()) {
        diff = $win.outerWidth() - (pos_left + obj.settings.width);
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: -diff - 8,
          marginTop: ''
        });
        pos_left = pos_left + diff;
      }
      if (pos_left < $win.scrollLeft()) {
        tipso_bubble.find('.tipso_arrow').css({
          marginLeft: pos_left - 8
        });
        pos_left = 0;
      }
    }
    tipso_bubble.css({
      left: pos_left + obj.settings.offsetX,
      top: pos_top + obj.settings.offsetY
    });
  }
  $[pluginName] = $.fn[pluginName] = function(options) {
    var args = arguments;
    if (options === undefined || typeof options === 'object') {
      if (!(this instanceof $)) {
        $.extend(defaults, options);
      }
      return this.each(function() {
        if (!$.data(this, 'plugin_' + pluginName)) {
          $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
        }
      });
    } else if (typeof options === 'string' && options[0] !== '_' && options !==
      'init') {
      var returns;
      this.each(function() {
        var instance = $.data(this, 'plugin_' + pluginName);
        if (!instance) {
          instance = $.data(this, 'plugin_' + pluginName, new Plugin(
            this, options));
        }
        if (instance instanceof Plugin && typeof instance[options] ===
          'function') {
          returns = instance[options].apply(instance, Array.prototype.slice
            .call(args, 1));
        }
        if (options === 'destroy') {
          $.data(this, 'plugin_' + pluginName, null);
        }
      });
      return returns !== undefined ? returns : this;
    }
  };
}));
