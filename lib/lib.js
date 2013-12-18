function hasOwnProp(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}

// return a parameter accessor
function getParamAccessor(id, params) {
	// easy access
	var paramGet = function (prop, alt, required) {
		if (arguments.length < 1) {
			throw (new Error('expected at least 1 argument'));
		}
		if (arguments.length < 2) {
			required = true;
		}
		if (params && hasOwnProp(params, prop)) {
			return params[prop];
		}
		if (required) {
			if (!params) {
				throw (new Error('no params supplied for: ' + id));
			}
			throw (new Error('missing param property: ' + prop + ' in: ' + id));
		}
		return alt;
	};
	paramGet.raw = params;
	return paramGet;
}

function isArguments(item) {
	return Object.prototype.toString.call(item) === '[object Arguments]';
}

/*jshint -W098 */

// split strings to array
var csvSplit = /[ \t]*[,;][ \t]*/g;
var separator = /[ \t]*[:][ \t]*/g;
function splitifyValueInto(value, ret) {
	ret = ret || [];
	var i;
	if (typeof value === 'string') {
		value = value.split(csvSplit);
		for (i = 0; i < value.length; i++) {
			if (value[i] !== '') {
				ret.push(value[i].replace(separator, ':'));
			}
		}
	}
	else if (Array.isArray(value) || isArguments(value)) {
		for (i = 0; i < value.length; i++) {
			splitifyValueInto(value[i], ret);
		}
	}
	else if (typeof value !== 'undefined') {
		ret.push(value);
	}
	return ret;
}
function splitify() {
	var ret = [];
	splitifyValueInto(arguments, ret);
	return ret;
}

function randomPadded(len) {
	return Math.floor(Math.random() * Math.pow(10, len));
}
function padNumStr(str, len) {
	str = '' + str;
	while (str.length < len) {
		str = '0' + str;
	}
	return str;
}
// get random ids
var uidCounterA = 0;
function getUID() {
	uidCounterA++;
	return padNumStr(uidCounterA, Math.max(3, uidCounterA.toString().length));
}
function getNameUID(prefix, postfix) {
	prefix = prefix ? prefix + '-' : '';
	postfix = postfix ? '-' + postfix : '';
	return '<' + prefix + getUID() + postfix + '>';
}

// util
function pushUnique(arr, value) {
	if (arr.indexOf(value) < 0) {
		arr.push(value);
	}
}
function pushHash(hash, name, value) {
	if (!hasOwnProp(hash, name)) {
		hash[name] = [value];
	}
	else {
		pushUnique(hash[name], value);
	}
}

function copyTo(target, source) {
	target = target ? target : (Array.isArray(source) ? [] : {});
	var name;
	var value;
	if (source) {
		for (name in source) {
			if (source.hasOwnProperty(name)) {
				value = source[name];
				if (typeof value === 'object' && value) {
					target[name] = copyTo(target[name], value);
				}
				else {
					target[name] = value;
				}
			}
		}
	}
	return target;
}

function clone(source) {
	var ret = Array.isArray(source) ? [] : {};
	for (var i = 0, ii = arguments.length; i < ii; i++) {
		copyTo(ret, arguments[i]);
	}
	return ret;
}

module.exports = {
	isArguments: isArguments,
	hasOwnProp: hasOwnProp,
	pushHash: pushHash,
	pushUnique: pushUnique,
	getParamAccessor: getParamAccessor,
	splitify: splitify,
	splitifyValueInto: splitifyValueInto,
	randomPadded: randomPadded,
	padNumStr: padNumStr,
	getUID: getUID,
	getNameUID: getNameUID,
	copyTo: copyTo,
	clone: clone
};
