/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license ProtoBuf.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ProtoBuf.js for details
 */
(function(global) {
    
    function loadProtoBuf(ByteBuffer) {
        if (!ByteBuffer || !ByteBuffer.calculateUTF8String || !ByteBuffer.zigZagEncode32) {
            // Usually not neccessary, but to be sure...
            if (typeof dcodeIO != 'undefined' && dcodeIO.ByteBuffer) {
                ByteBuffer = dcodeIO.ByteBuffer;
            }
            if (!ByteBuffer && typeof require == 'function') {
                ByteBuffer = require("ByteBuffer");
            }
            if (!ByteBuffer) throw(new Error("ProtoBuf.js requires ByteBuffer.js >=1.1.0: Get it at https://github.com/dcodeIO/ByteBuffer.js"));
        }

        // Object.create polyfill
        // ref: https://developer.mozilla.org/de/docs/JavaScript/Reference/Global_Objects/Object/create
        if (!Object.create) {
            /** @expose */
            Object.create = function (o) {
                if (arguments.length > 1) {
                    throw new Error('Object.create implementation only accepts the first parameter.');
                }
                function F() {}
                F.prototype = o;
                return new F();
            };
        }

        /**
         * The ProtoBuf namespace.
         * @exports ProtoBuf
         * @namespace
         * @expose
         */
        var ProtoBuf = {};
        
        /**
         * ProtoBuf.js version.
         * @type {string}
         * @const
         * @expose
         */
        ProtoBuf.VERSION = // #put '"'+VERSION+'";'

        /**
         * Wire types.
         * @type {Object.<string,number>}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES = {};

        /**
         * Varint wire type.
         * @type {number}
         * @expose
         */
        ProtoBuf.WIRE_TYPES.VARINT = 0;

        /**
         * Fixed 64 bits wire type.
         * @type {number}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES.BITS64 = 1;

        /**
         * Length delimited wire type.
         * @type {number}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES.LDELIM = 2;

        /**
         * Start group wire type.
         * @type {number}
         * @const
         * @deprecated Not supported.
         * @expose
         */
        ProtoBuf.WIRE_TYPES.STARTGROUP = 3;

        /**
         * End group wire type.
         * @type {number}
         * @const
         * @deprecated Not supported.
         * @expose
         */
        ProtoBuf.WIRE_TYPES.ENDGROUP = 4;

        /**
         * Fixed 32 bits wire type.
         * @type {number}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES.BITS32 = 5;

        /**
         * Types.
         * @dict
         * @type {Object.<string,{name: string, wireType: number}>}
         * @const
         * @expose
         */
        ProtoBuf.TYPES = {
            // According to the protobuf spec.
            "int32": {
                name: "int32",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "uint32": {
                name: "uint32",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "sint32": {
                name: "sint32",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "bool": {
                name: "bool",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "double": {
                name: "double",
                wireType: ProtoBuf.WIRE_TYPES.BITS64
            },
            "string": {
                name: "string",
                wireType: ProtoBuf.WIRE_TYPES.LDELIM
            },
            "bytes": {
                name: "bytes",
                wireType: ProtoBuf.WIRE_TYPES.LDELIM
            },
            "fixed32": {
                name: "fixed32",
                wireType: ProtoBuf.WIRE_TYPES.BITS32
            },
            "sfixed32": {
                name: "sfixed32",
                wireType: ProtoBuf.WIRE_TYPES.BITS32
            },
            "float": {
                name: "float",
                wireType: ProtoBuf.WIRE_TYPES.BITS32
            },
            "enum": {
                name: "enum",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "message": {
                name: "message",
                wireType: ProtoBuf.WIRE_TYPES.LDELIM
            }
        };
        
        // #include "ProtoBuf/Lang.js"
        
        // #ifndef NOPARSE
        // #include "ProtoBuf/DotProto.js"
        
        // #include "ProtoBuf/DotProto/Tokenizer.js"
        
        // #include "ProtoBuf/DotProto/Parser.js"
        
        // #else
        // This build of ProtoBuf.js does not include DotProto support.
        
        // #endif
        // #include "ProtoBuf/Reflect.js"
        
        // #include "ProtoBuf/Builder.js"
        
        /**
         * Builds a .proto definition and returns the Builder.
         * @param {string} proto .proto file contents
         * @return {ProtoBuf.Builder} Builder to create new messages
         * @throws {Error} If the definition cannot be parsed or built
         * @expose
         */
        ProtoBuf.protoFromString = function(proto) {
            // #ifdef NOPARSE
            throw(new Error("This build of ProtoBuf.js does not include DotProto support. See: https://github.com/dcodeIO/ProtoBuf.js"));
            // #else
            var parser = new ProtoBuf.DotProto.Parser(proto+"");
            var parsed = parser.parse();
            var builder = new ProtoBuf.Builder();
            if (parsed['package'] !== null) {
                builder.define(parsed['package']); // Define the package
            }
            builder.create(parsed['messages']); // Create the messages
            builder.reset();
            builder.resolveAll();
            builder.build();
            return builder;
            // #endif
        };

        /**
         * Builds a .proto file and returns the Builder.
         * <p>Node.js: If no callback is specified, this will read the file synchronously using the "fs" module and
         * return the Builder. If a callback is specified, this will read the file asynchronously and call the callback
         * with the Builder as its first argument afterwards.</p>
         * <p>Browser: Will read the file asynchronously and call the callback with the Builder as its first argument
         * afterwards.</p>
         * @param {string} filename Path to proto filename
         * @param {function(ProtoBuf.Builder)=} callback Callback that will receive the Builder as its first argument
         * @return {ProtoBuf.Builder|undefined} The Builder if synchronous (no callback), else undefined
         * @throws {Error} If the file cannot be read or cannot be parsed
         * @expose
         */
        ProtoBuf.protoFromFile = function(filename, callback) {
            // #ifdef NOPARSE
            throw(new Error("This build of ProtoBuf.js does not include DotProto support. See: https://github.com/dcodeIO/ProtoBuf.js"));
            // #else
            if ((typeof window == 'undefined' || !window.window) && typeof require == 'function') { // Node.js
                var fs = require("fs");
                if (typeof callback == 'function') {
                    fs.readFile(filename, function(err, data) {
                        callback(ProtoBuf.protoFromString(data));
                    });
                } else {
                    return ProtoBuf.protoFromString(require("fs").readFileSync(filename));
                }
            } else { // Browser, no dependencies please, ref: http://www.quirksmode.org/js/xmlhttp.html
                if (typeof callback != 'function') {
                    throw(new Error("Cannot read '"+filename+"': ProtoBuf.protoFromFile requires a callback"));
                }
                var XMLHttpFactories = [
                    function () {return new XMLHttpRequest()},
                    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
                    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
                    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
                ];
                var xhr = false;
                for (var i=0;i<XMLHttpFactories.length;i++) {
                    try { xhr = XMLHttpFactories[i](); }
                    catch (e) { continue; }
                    break;
                }
                if (!xhr) throw(new Error("Cannot read '"+filename+"': Your browser does not support XMLHttpRequest"));
                xhr.open('GET', filename, true);
                xhr.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
                xhr.onreadystatechange = function() {
                    if (xhr.readyState != 4) return;
                    if (xhr.status != 200 && xhr.status != 304) {
                        throw(new Error("Failed to read '"+filename+"': Server returned status code "+xhr.status));
                    }
                    callback(ProtoBuf.protoFromString(xhr.responseText));
                };
                if (xhr.readyState == 4) return;
                xhr.send();
            }
            // #endif
        };

        /**
         * Constructs a new Builder with the specified package defined.
         * @param {string=} pkg Package name as fully qualified name, e.g. "My.Game". If no package is specified, the
         * builder will only contain a global namespace.
         * @return {ProtoBuf.Builder} New Builder
         * @expose
         */
        ProtoBuf.newBuilder = function(pkg) {
            var builder = new ProtoBuf.Builder();
            if (typeof pkg != 'undefined') {
                builder.define(pkg);
            }
            return builder;
        };

        return ProtoBuf;
    }

    // Enable module loading if available
    if (typeof module != 'undefined' && module["exports"]) { // CommonJS
        module["exports"] = loadProtoBuf(require("bytebuffer"));
    } else if (typeof define != 'undefined' && define["amd"]) { // AMD
        define("ProtoBuf", ["ByteBuffer"], loadProtoBuf);
    } else { // Shim
        if (!global["dcodeIO"]) {
            global["dcodeIO"] = {};
        }
        global["dcodeIO"]["ProtoBuf"] = loadProtoBuf(global["dcodeIO"]["ByteBuffer"]);
    }

})(this);