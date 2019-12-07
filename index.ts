import * as gen from 'io-ts-codegen';

export type StringSchema = { type: 'string', enum?: string[] }

export interface NumberSchema {
    type: 'number' | 'integer'
}

export interface BooleanSchema {
    type: 'boolean'
}

export interface ObjectSchema {
    type: 'object'
    properties: {
        [key: string]: JSONSchema
    }
    required?: Array<string>
}

export type JSONSchema = StringSchema | NumberSchema | BooleanSchema | ObjectSchema

function getRequiredProperties(schema: ObjectSchema): { [key: string]: true } {
    const required: { [key: string]: true } = {}
    if (schema.required) {
        schema.required.forEach(function (k) {
            required[k] = true
        })
    }
    return required
}

function toInterfaceCombinator(schema: ObjectSchema): gen.InterfaceCombinator {
    const required = getRequiredProperties(schema)
    return gen.interfaceCombinator(
        Object.keys(schema.properties).map(key =>
            gen.property(key, to(schema.properties[key]), !required.hasOwnProperty(key))
        )
    )
}

export function to(schema: JSONSchema): gen.TypeReference {
    switch (schema.type) {
        case 'string':
            if (!schema.enum) {
                return gen.stringType;
            }
            else if (schema.enum) {
                return gen.unionCombinator(schema.enum.map(e => gen.literalCombinator(e)));
            }
        case 'number':
        case 'integer':
            return gen.numberType
        case 'boolean':
            return gen.booleanType
        case 'object':
            return toInterfaceCombinator(schema)
    }
}

const schema: JSONSchema = {
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
}

const RuntimeType = gen.printRuntime(to(schema));
const StaticType = gen.printStatic(to(schema));

console.log({
    RuntimeType,
    StaticType,
});
