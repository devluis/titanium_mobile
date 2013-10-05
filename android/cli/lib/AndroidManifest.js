/**
 * Titanium SDK Library for Node.js
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var appc = require('node-appc'),
	DOMParser = require('xmldom').DOMParser,
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	xml = appc.xml,

	androidAttrPrefixRegExp = /^android\:/,
	defaultDOMParserArgs = { errorHandler: function(){} };

module.exports = AndroidManifest;

/*
function toXml(dom, parent, name, value) {
	// properties is a super special case
	if (name == 'properties') {
		Object.keys(value).forEach(function (v) {
			dom.create('property', {
				name: v,
				type: value[v].type || 'string',
				nodeValue: value[v].value
			}, parent);
		});
		return;
	}

	var node = dom.create(name, null, parent);

	switch (name) {
		case 'deployment-targets':
			Object.keys(value).forEach(function (v) {
				dom.create('target', {
					device: v,
					nodeValue: value[v]
				}, node);
			});
			break;

		case 'android':
			node.setAttribute('xmlns:android', 'http://schemas.android.com/apk/res/android');

			if (value.manifest) {
				node.appendChild(dom.createTextNode('\r\n' + new Array(3).join('\t')));
				node.appendChild(new DOMParser(defaultDOMParserArgs).parseFromString(value.manifest))
			}

			if (value.hasOwnProperty('tool-api-level')) {
				dom.create('tool-api-level', { nodeValue: value['tool-api-level'] }, node);
			}

			if (value.hasOwnProperty('proguard')) {
				dom.create('proguard', { nodeValue: !!value.proguard }, node);
			}

			if (value.hasOwnProperty('abi')) {
				dom.create('abi', { nodeValue: value.abi }, node);
			}

			if (value.activities) {
				dom.create('activities', null, node, function (node) {
					Object.keys(value.activities).forEach(function (url) {
						var attrs = {};
						Object.keys(value.activities[url]).forEach(function (attr) {
							attr != 'classname' && (attrs[attr] = value.activities[url][attr]);
						});
						dom.create('activity', attrs, node);
					});
				});
			}

			if (value.services) {
				dom.create('services', null, node, function (node) {
					Object.keys(value.services).forEach(function (url) {
						var attrs = {};
						Object.keys(value.services[url]).forEach(function (attr) {
							attr != 'classname' && (attrs[attr] = value.services[url][attr]);
						});
						dom.create('service', attrs, node);
					});
				});
			}
			break;

		case 'mobileweb':
			Object.keys(value).forEach(function (prop) {
				switch (prop) {
					case 'build':
						dom.create('build', null, node, function (build) {
							Object.keys(value.build).forEach(function (name) {
								dom.create(name, null, build, function (deployment) {
									Object.keys(value.build[name]).forEach(function (d) {
										var val = value.build[name][d];
										switch (d) {
											case 'js':
											case 'css':
											case 'html':
												dom.create(d, null, deployment, function (type) {
													Object.keys(val).forEach(function (v) {
														dom.create(v, { nodeValue: val[v] }, type);
													});
												});
												break;

											default:
												dom.create(d, { nodeValue: val }, deployment);
										}
									});
								});
							});
						});
						break;

					case 'analytics':
					case 'filesystem':
					case 'map':
					case 'splash':
					case 'unsupported-platforms':
						dom.create(prop, null, node, function (section) {
							Object.keys(value[prop]).forEach(function (key) {
								dom.create(key, { nodeValue: value[prop][key] }, section);
							});
						});
						break;

					case 'precache':
						dom.create('precache', null, node, function (precache) {
							Object.keys(value[prop]).forEach(function (type) {
								value[prop][type].forEach(function (n) {
									dom.create(type, { nodeValue: n }, precache);
								});
							});
						});
						break;

					default:
						dom.create(prop, { nodeValue: value[prop] }, node);
				}
			});
			break;

		default:
			node.appendChild(dom.createTextNode(value));
			return;
	}

	node.appendChild(dom.createTextNode('\r\n' + new Array(2).join('\t')));
}
*/

function initAttr(node, obj) {
	xml.forEachAttr(node, function (attr) {
		obj.__attr__ || (obj.__attr__ = {});
		obj.__attr__[attr.name] = xml.parse(attr.value);
	});
	return obj;
}

function initObject(node, obj, fn) {
	var tmp = obj[node.tagName] = {};
	initAttr(node, tmp);
	fn && fn(tmp);
}

function initObjectByName(node, obj, fn) {
	var tmp = obj[node.tagName] || (obj[node.tagName] = {}),
		a = {};
	xml.forEachAttr(node, function (attr) {
		a[attr.name.replace(androidAttrPrefixRegExp, '')] = xml.parse(attr.value);
	});
	a.name && (tmp[a.name] = a);
	fn && fn(tmp);
}

function initArray(node, obj, fn) {
	var tmp = obj[node.tagName] || (obj[node.tagName] = []);
	initAttr(node, tmp);
	fn(tmp);
}

function toJS(obj, doc) {
	initAttr(doc, obj);

	xml.forEachElement(doc, function (node) {
		switch (node.tagName) {
			case 'application':
				initObject(node, obj, function (obj) {
					//
				});
				break;

			case 'compatible-screens':
				initArray(node, obj, function (compatibleScreens) {
					xml.forEachElement(node, function (node) {
						if (node.tagName == 'screen') {
							var a = {};
							xml.forEachAttr(node, function (attr) {
								a[attr.name.replace(androidAttrPrefixRegExp, '')] = xml.parse(attr.value);
							});
							compatibleScreens.push(a);
						}
					});
				});
				break;

			case 'instrumentation':
			case 'permission':
			case 'permission-group':
			case 'permission-tree':
				initObjectByName(node, obj);
				break;

			case 'supports-gl-texture':
				initObject(node, obj, function (obj) {
					//
				});
				break;

			case 'supports-screens':
				initObject(node, obj, function (obj) {
					//
				});
				break;

			case 'uses-configuration':
				initObject(node, obj, function (obj) {
					//
				});
				break;

			case 'uses-feature':
				initObject(node, obj, function (obj) {
					//
				});
				break;

			case 'uses-permission':
				initObject(node, obj, function (obj) {
					//
				});
				break;

			case 'uses-sdk':
				initObject(node, obj, function (obj) {
					//
				});
				break;
		}
	});
/*	while (node) {
		if (node.nodeType == xml.ELEMENT_NODE) {
			switch (node.tagName) {
				case 'property':
					var name = xml.getAttr(node, 'name'),
						type = xml.getAttr(node, 'type') || 'string',
						value = xml.getValue(node);
					if (name) {
						obj.properties || (obj.properties = {});
						obj.properties[name] = {
							type: type,
							value: type == 'bool' ? !!value
								: type == 'int' ? (parseInt(value) || 0)
								: type == 'double' ? (parseFloat(value) || 0)
								: '' + value
						};
					}
					break;

				case 'deployment-targets':
					var targets = obj['deployment-targets'] = {};
					xml.forEachElement(node, function (elem) {
						var dev = xml.getAttr(elem, 'device');
						dev && (targets[dev] = xml.getValue(elem));
					});
					break;

				case 'code-processor':
					var codeProcessor = obj['code-processor'] = {};
					xml.forEachElement(node, function (elem) {
						switch (elem.tagName) {
							case 'plugins':
								codeProcessor.plugins = [];
								xml.forEachElement(elem, function (elem) {
									if (elem.tagName == 'plugin') {
										codeProcessor.plugins.push(xml.getValue(elem));
									}
								});
								break;
							case 'options':
								codeProcessor.options = {};
								xml.forEachElement(elem, function (elem) {
									codeProcessor.options[elem.tagName] = xml.getValue(elem);
								});
								break;
							default:
								codeProcessor[elem.tagName] = xml.getValue(elem);
						}
					});
					break;

				case 'android':
					var android = obj.android = {},
						formatUrl = function (url) {
							return appc.string.capitalize(url.replace(/^app\:\/\//, '').replace(/\.js$/, '').replace(/\//g, '_')).replace(/[\/ .$&@]/g, '_');
						};

					xml.forEachElement(node, function (elem) {
						switch (elem.tagName) {
							case 'manifest':
								// the <manifest> tag is an XML document and we're just gonna
								// defer the parsing to whoever wants its data
								android.manifest = elem.toString();
								break;

							case 'abi':
							case 'proguard':
							case 'tool-api-level':
								android[elem.tagName] = xml.getValue(elem);
								break;

							case 'activities':
								var activities = android.activities = {};
								xml.forEachElement(elem, function (elem) {
									if (elem.tagName == 'activity') {
										var url = xml.getAttr(elem, 'url') || xml.getValue(elem) || '';
										if (url) {
											var a = activities[url] = {};
											xml.forEachAttr(elem, function (attr) {
												a[attr.name] = xml.parse(attr.value);
											});
											a['classname'] = formatUrl(url) + 'Activity';
											a['url'] = url;
											xml.forEachElement(elem, function (elem) {
												a['__childnodes'] || (a['nodes'] = []);
												a['__childnodes'].push(elem);
											});
										}
									}
								});
								break;

							case 'services':
								var services = android.services = {};
								xml.forEachElement(elem, function (elem) {
									if (elem.tagName == 'service') {
										var url = xml.getAttr(elem, 'url') || xml.getValue(elem) || '';
										if (url) {
											var s = services[url] = {}
											xml.forEachAttr(elem, function (attr) {
												s[attr.name] = xml.parse(attr.value);
											});
											s['classname'] = formatUrl(url) + 'Service';
											s['type'] = xml.getAttr(elem, 'type') || 'standard';
											s['url'] = url;
											xml.forEachElement(elem, function (elem) {
												s['__childnodes'] || (s['nodes'] = []);
												s['__childnodes'].push(elem);
											});
										}
									}
								});
								break;
						}
					});
					break;

				case 'mobileweb':
					var mobileweb = obj.mobileweb = {};
					xml.forEachElement(node, function (elem) {
						switch (elem.tagName) {
							case 'build':
								var build = mobileweb.build = {};
								xml.forEachElement(elem, function (elem) {
									var profile = build[elem.tagName] = {};
									xml.forEachElement(elem, function (elem) {
										switch (elem.tagName) {
											case 'js':
											case 'css':
											case 'html':
												var filetype = profile[elem.tagName] = {};
												xml.forEachElement(elem, function (elem) {
													filetype[elem.tagName] = xml.getValue(elem);
												});
												break;

											default:
												profile[elem.tagName] = xml.getValue(elem);
										}
									});
								});
								break;

							case 'analytics':
							case 'filesystem':
							case 'map':
							case 'splash':
							case 'unsupported-platforms':
								mobileweb[elem.tagName] = {};
								xml.forEachElement(elem, function (subelem) {
									mobileweb[elem.tagName][subelem.tagName] = xml.getValue(subelem);
								});
								break;

							case 'precache':
								var precache = mobileweb.precache = {};
								xml.forEachElement(elem, function (elem) {
									precache[elem.tagName] || (precache[elem.tagName] = []);
									precache[elem.tagName].push(xml.getValue(elem));
								});
								break;

							default:
								mobileweb[elem.tagName] = xml.getValue(elem);
						}
					});
					break;

				case 'tizen':
					var tizen = obj.tizen = {
						appid : void 0,
						configXml : void 0
					};

					tizen.appid = xml.getAttr(node, 'appid');
					xml.forEachElement(node, function (elem) {
						tizen.configXml ? tizen.configXml = tizen.configXml + '\n' +elem.toString() : tizen.configXml = elem.toString();
					});
					break

				case 'version':
					obj[node.tagName] = node.firstChild && node.firstChild.data.replace(/\n/g, '').trim() || '';
					break;

				case 'name':
				case 'guid':
				case 'id':
				case 'icon':
					// need to strip out line returns which shouldn't be there in the first place
					obj[node.tagName] = '' + xml.getValue(node);
					if (typeof obj[node.tagName] == 'string') {
						obj[node.tagName] = obj[node.tagName].replace(/\n/g, '');
					}
					break;

				default:
					obj[node.tagName] = xml.getValue(node);
			}
		}
		node = node.nextSibling;
	}
	*/
}

function AndroidManifest(filename) {
	Object.defineProperty(this, 'load', {
		value: function (file) {
			if (!fs.existsSync(file)) {
				throw new Error('AndroidManifest.xml file does not exist');
			}
			toJS(this, (new DOMParser(defaultDOMParserArgs).parseFromString(fs.readFileSync(file).toString(), 'text/xml')).documentElement);
			return this;
		}
	});

	Object.defineProperty(this, 'parse', {
		value: function (str) {
			toJS(this, (new DOMParser(defaultDOMParserArgs).parseFromString(str, 'text/xml')).documentElement);
			return this;
		}
	});

	Object.defineProperty(this, 'toString', {
		value: function (fmt) {
			if (fmt == 'xml') {
				var dom = new DOMParser(defaultDOMParserArgs).parseFromString('<manifest>', 'text/xml');

				dom.create = function (tag, attrs, parent, callback) {
					var node = dom.createElement(tag),
						i = 0,
						p = parent;

					attrs && Object.keys(attrs).forEach(function (attr) {
						if (attr == 'nodeValue') {
							node.appendChild(dom.createTextNode(''+attrs[attr]));
						} else {
							attrs[attr] != void 0 && node.setAttribute(attr, ''+attrs[attr]);
						}
					});

					if (p) {
						while (p.parentNode) {
							i++;
							p = p.parentNode;
						}
						parent.appendChild(dom.createTextNode('\r\n' + new Array(i+1).join('\t')));
					}

					parent && parent.appendChild(node);
					if (callback) {
						callback(node);
						node.appendChild(dom.createTextNode('\r\n' + new Array(i+1).join('\t')));
					}
					return node;
				};

				Object.keys(this).forEach(function (key) {
					//toXml(dom, dom.documentElement, key, this[key]);
				}, this);

				dom.documentElement.appendChild(dom.createTextNode('\r\n'));

				return '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toString();
			} else if (fmt == 'pretty-json') {
				return JSON.stringify(this, null, '\t');
			} else if (fmt == 'json') {
				return JSON.stringify(this);
			}
			return Object.prototype.toString.call(this);
		}
	});

	Object.defineProperty(this, 'save', {
		value: function (file) {
			if (file) {
				wrench.mkdirSyncRecursive(path.dirname(file));
				fs.writeFileSync(file, this.toString('xml'));
			}
			return this;
		}
	});

	filename && this.load(filename);
}
