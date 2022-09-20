'use strict';

var postcss = require('postcss');
var objectAssign = require('object-assign');
var { createPropListMatcher } = require('./src/prop-list-matcher');
var { getUnitRegexp } = require('./src/pixel-unit-regexp');

var defaults = {
  unitToConvert: 'px',
  viewportWidth: 1920,
  viewportWidthSM: 640,
  viewportWidthMD: 750,
  viewportWidthLG: 1024,
  viewportWidthXL: 1280,
  viewportWidthSL: 1440,
  viewportHeight: 568, // not now used; TODO: need for different units and math for different properties
  unitPrecision: 5,
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',  // vmin is more suitable.
  selectorBlackList: [],
  propList: ['*'],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 568
};

module.exports = postcss.plugin('star-px-to-viewport', function (options) {
  
  var opts = objectAssign({}, defaults, options);

  var pxRegex = getUnitRegexp(opts.unitToConvert);
  var satisfyPropList = createPropListMatcher(opts.propList);
  var landscapeRules = [];
  
  return function (css) {
    css.walkRules(function (rule) {
      // Add exclude option to ignore some files like 'node_modules'
      var file = rule.source && rule.source.input.file;

      if (opts.exclude && file) {
        if (Object.prototype.toString.call(opts.exclude) === '[object RegExp]') {
          if (isExclude(opts.exclude, file)) return;
        } else if (Object.prototype.toString.call(opts.exclude) === '[object Array]') {
          for (let i = 0; i < opts.exclude.length; i++) {
            if (isExclude(opts.exclude[i], file)) return;
          }
        } else {
          throw new Error('options.exclude should be RegExp or Array.');
        }
      }
      
      if (blacklistedSelector(opts.selectorBlackList, rule.selector)) return;

      if (opts.landscape && !rule.parent.params) {
        var landscapeRule = rule.clone().removeAll();

        rule.walkDecls(function(decl) {
          if (decl.value.indexOf(opts.unitToConvert) === -1) return;
          if (!satisfyPropList(decl.prop)) return;
          landscapeRule.append(decl.clone({
            value: decl.value.replace(pxRegex, createPxReplace(opts, opts.landscapeUnit, opts.landscapeWidth))
          }));
        });
        
        if (landscapeRule.nodes.length > 0) {
          landscapeRules.push(landscapeRule); 
        }
      }

      if (!validateParams(rule.parent.params, opts.mediaQuery)) return;
      
      rule.walkDecls(function(decl, i) {
        if (decl.value.indexOf(opts.unitToConvert) === -1) return;
        if (!satisfyPropList(decl.prop)) return;

        var unit;
        var size;
        var params = rule.parent.params;
        
        if (opts.landscape && params && params.indexOf('landscape') !== -1) {
          unit = opts.landscapeUnit;
          size = opts.landscapeWidth;
        } else {
          unit = getUnit(decl.prop, opts);
          size = decl.parent.selector.search('.sm') !== -1 ? opts.viewportWidthSM : decl.parent.selector.search('.md') !== -1 ? opts.viewportWidthMD : decl.parent.selector.search('.lg') !== -1 ? opts.viewportWidthLG : decl.parent.selector.search('.xl') !== -1 ? opts.viewportWidthXL : decl.parent.selector.search('.sl') !== -1 ? opts.viewportWidthSL : opts.viewportWidth;
        }
        var value = decl.value.replace(pxRegex, createPxReplace(opts, unit, size));
        
        if (declarationExists(decl.parent, decl.prop, value)) return;
        
        if (opts.replace) {
          decl.value = value;
        } else {
          decl.parent.insertAfter(i, decl.clone({ value: value }));
        }
      });
    });
    
    if (landscapeRules.length > 0) {
      var landscapeRoot = new postcss.AtRule({ params: '(orientation: landscape)', name: 'media' });
      
      landscapeRules.forEach(function(rule) {
        landscapeRoot.append(rule);
      });
      css.append(landscapeRoot);
    }
  };
});

function getUnit(prop, opts) {
  return prop.indexOf('font') === -1 ? opts.viewportUnit : opts.fontViewportUnit;
}

function createPxReplace(opts, viewportUnit, viewportSize) {
  return function (m, $1) {
    if (!$1) return m;
    var pixels = parseFloat($1);
    if (pixels <= opts.minPixelValue) return m;
    var parsedVal = toFixed((pixels / viewportSize * 100), opts.unitPrecision);
    return parsedVal === 0 ? '0' : parsedVal + viewportUnit;
  };
}

function toFixed(number, precision) {
  var multiplier = Math.pow(10, precision + 1),
    wholeNumber = Math.floor(number * multiplier);
  return Math.round(wholeNumber / 10) * 10 / multiplier;
}

function blacklistedSelector(blacklist, selector) {
  if (typeof selector !== 'string') return;
  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
    return selector.match(regex);
  });
}

function isExclude(reg, file) {
  if (Object.prototype.toString.call(reg) !== '[object RegExp]') {
    throw new Error('options.exclude should be RegExp.');
  }
  return file.match(reg) !== null;
}

function declarationExists(decls, prop, value) {
  return decls.some(function (decl) {
      return (decl.prop === prop && decl.value === value);
  });
}

function validateParams(params, mediaQuery) {
  return !params || (params && mediaQuery);
}
