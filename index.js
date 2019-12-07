"use strict";
exports.__esModule = true;
var gen = require("io-ts-codegen");
function getRequiredProperties(schema) {
    var required = {};
    if (schema.required) {
        schema.required.forEach(function (k) {
            required[k] = true;
        });
    }
    return required;
}
function toInterfaceCombinator(schema) {
    var required = getRequiredProperties(schema);
    return gen.interfaceCombinator(Object.keys(schema.properties).map(function (key) {
        return gen.property(key, to(schema.properties[key]), !required.hasOwnProperty(key));
    }));
}
function to(schema) {
    switch (schema.type) {
        case 'string':
            if (!schema["enum"]) {
                return gen.stringType;
            }
            else if (schema["enum"]) {
                return gen.unionCombinator(schema["enum"].map(function (e) { return gen.literalCombinator(e); }));
            }
        case 'number':
        case 'integer':
            return gen.numberType;
        case 'boolean':
            return gen.booleanType;
        case 'object':
            return toInterfaceCombinator(schema);
    }
}
exports.to = to;
var schema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "integer"
        },
        "petId": {
            "type": "integer"
        },
        "quantity": {
            "type": "integer"
        },
        "shipDate": {
            "type": "string"
        },
        "status": {
            "type": "string",
            "enum": [
                "placed",
                "approved",
                "delivered"
            ]
        },
        "complete": {
            "type": "boolean"
        }
    },
    "required": [
        "id"
    ]
};
var RuntimeType = gen.printRuntime(to(schema));
var StaticType = gen.printStatic(to(schema));
console.log({
    RuntimeType: RuntimeType,
    StaticType: StaticType
});
