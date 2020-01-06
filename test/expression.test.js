import { expect } from "chai"
import { parse, Expression } from '../src/expression'

const testContext = {
        "simpleProperty": "simpleValue",
        "nestedProperty": {
            "value": "nestedValue",
            "parentNode": {
                "simpleNestedParentProperty": "simpleNestedParentValue",
                "doubleNestedParentProperty": {
                    "doubleNestedParentPropertyValue": "doubleNestedParentValue"
                }
            }
        },
        "parentNode": {
            "simpleParentProperty": "simpleParentValue",
            "nestedParentProperty": {
                "value": "nestedParentValue"
            }
        },
    };

describe('parse', () => {
    it('should parse correct expression', () => {
        expect(parse('#{property.value}')).to.have.deep.property('pathElements', ['property', 'value']);
    }),
    it('should parse expression created with new String', () => {
        expect(parse(new String('#{property.value}'))).to.have.deep.property('pathElements', ['property', 'value']);
    }),
    it('should parse expression from within string', () => {
        expect(parse('this property has value #{property.value} and nothing else')).to.have.deep.property('pathElements', ['property', 'value']);
    }),
    it('should not parse non-string parameter', () => {
        expect(() => {parse({"property": {"value": "v"}})}).to.throw('string');
    }),
    it('should not parse parameter with wrong start sequence', () => {
        expect(() => {parse('${property.value}')}).to.throw('#{');
        expect(() => {parse('#(property.value}')}).to.throw('#{');
    }),
    it('should not parse parameter with wrong or missing closing braces', () => {
        expect(() => {parse('#{property.value)')}).to.throw('}');
    }),
    it('should not parse parameter with wrongly located braces', () => {
        expect(() => {parse('property}.#{value')}).to.throw('}');
    })
});

describe('constructor', () => {
    it('should create expression for array parameter', () => {
        expect(new Expression(['property', 'value'])).to.have.deep.property('pathElements', ['property', 'value']);
    }),
    it('should not create expression for non array parameter', () => {
        expect(() => {new Expression('property')}).to.throw();
    })
});

describe('getter', () => {
    it('should get simple value', () => {
        const result = parse('#{simpleProperty}').getValue(testContext);
        expect(result).to.equal('simpleValue');
    }),
    it('should get nested value', () => {
        const result = parse('#{nestedProperty.value}').getValue(testContext);
        expect(result).to.equal('nestedValue');
    }),
    it('should return "undefined" for missing simple value', () => {
        const result = parse('#{missingSimpleProperty}').getValue(testContext);
        expect(result).to.be.undefined;
    }),
    it('should return "undefined" for undefined base', () => {
        const result = parse('#{missingNestedProperty.value}').getValue(testContext);
        expect(result).to.be.undefined;
    }),
    it('should return "undefined" for missing nested value', () => {
        const result = parse('#{nestedProperty.missingValue}').getValue(testContext);
        expect(result).to.be.undefined;
    }),
    it('should get simple value from parent', () => {
        const result = parse('#{simpleParentProperty}').getValue(testContext);
        expect(result).to.equal('simpleParentValue');
    }),
    it('should get nested value from parent', () => {
        const result = parse('#{nestedParentProperty.value}').getValue(testContext);
        expect(result).to.equal('nestedParentValue');
    }),
    it('should get simple value from nested parent', () => {
        const result = parse('#{nestedProperty.simpleNestedParentProperty}').getValue(testContext);
        expect(result).to.equal('simpleNestedParentValue');
    }),
    it('should get nested value from nested parent', () => {
        const result = parse('#{nestedProperty.doubleNestedParentProperty.doubleNestedParentPropertyValue}').getValue(testContext);
        expect(result).to.equal('doubleNestedParentValue');
    }),
    it('should return "undefined" for missing simple value with nested parent', () => {
        const result = parse('#{nestedParentProperty.missingValue}').getValue(testContext);
        expect(result).to.be.undefined;
    }),
    it('should return "undefined" for missing nested value with parent', () => {
        const result = parse('#{nestedParentProperty.missingProperty.value}').getValue(testContext);
        expect(result).to.be.undefined;
    })
}); 

describe('setter', () => {
    it('should set simple value', () => {
        const context = Object.assign({}, testContext);
        parse('#{simpleProperty}').setValue(context, 'newValue');
        expect(context.simpleProperty).to.equal('newValue');
    }),
    it('should set nested value', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        parse('#{nestedProperty.value}').setValue(context, 'newValue');
        expect(context.nestedProperty.value).to.equal('newValue');
    }),
    it('should set value to missing property', () => {
        const context = Object.assign({}, testContext);
        parse('#{missingSimpleProperty}').setValue(context, 'newValue');
        expect(context.missingSimpleProperty).to.equal('newValue');
    }),
    it('should ignore setting for undefined base', () => {
        const context = Object.assign({}, testContext);
        parse('#{missingNestedProperty.value}').setValue(context, 'newValue');
        expect(context).to.deep.equal(testContext);
    }),
    it('should set value to missing nested property', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        parse('#{nestedProperty.missingValue}').setValue(context, 'newValue');
        expect(context.nestedProperty.missingValue).to.equal('newValue');
    }),
    it('should set simple value to parent', () => {
        const context = Object.assign({}, testContext);
        context.parentNode = Object.assign({}, context.parentNode);
        parse('#{simpleParentProperty}').setValue(context, 'newValue');
        expect(context.parentNode.simpleParentProperty).to.equal('newValue');
    }),
    it('should set nested value to parent', () => {
        const context = Object.assign({}, testContext);
        context.parentNode = Object.assign({}, context.parentNode);
        context.parentNode.nestedParentProperty = Object.assign({}, context.parentNode.nestedParentProperty);
        parse('#{nestedParentProperty.value}').setValue(context, 'newValue');
        expect(context.parentNode.nestedParentProperty.value).to.equal('newValue');
    }),
    it('should set simple value to nested parent', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        context.nestedProperty.parentNode = Object.assign({}, context.nestedProperty.parentNode);
        parse('#{nestedProperty.simpleNestedParentProperty}').setValue(context, 'newValue');
        expect(context.nestedProperty.parentNode.simpleNestedParentProperty).to.equal('newValue');
    }),
    it('should set nested value from nested parent', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        context.nestedProperty.parentNode = Object.assign({}, context.nestedProperty.parentNode);
        context.nestedProperty.parentNode.doubleNestedParentProperty = Object.assign({}, context.nestedProperty.parentNode.doubleNestedParentProperty);
        parse('#{nestedProperty.doubleNestedParentProperty.doubleNestedParentPropertyValue}').setValue(context, 'newValue');
        expect(context.nestedProperty.parentNode.doubleNestedParentProperty.doubleNestedParentPropertyValue).to.equal('newValue');
    }),
    it('should set value to missing simple property with nested parent', () => {
        const context = Object.assign({}, testContext);
        context.parentNode = Object.assign({}, context.parentNode);
        context.parentNode.nestedParentProperty = Object.assign({}, context.parentNode.nestedParentProperty);
        parse('#{nestedParentProperty.missingValue}').setValue(context, 'newValue');
        expect(context.parentNode.nestedParentProperty.missingValue).to.equal('newValue');
    }),
    it('should ignore setting to missing nested value with parent', () => {
        const context = Object.assign({}, testContext);
        parse('#{nestedParentProperty.missingProperty.value}').setValue(context, 'newValue');
        expect(context).to.deep.equal(testContext);
    })
}); 

describe('observe', () => {
    it('should observe setting of simple value', () => {
        const context = Object.assign({}, testContext);
        let observed = false;

        parse('#{simpleProperty}').observeValue(context, () => observed = true);
        
        context.simpleProperty = 'newValue';
        expect(observed, 'observed').to.be.true;
        expect(context.simpleProperty).to.equal('newValue');

        observed = false;

        context.simpleProperty = 'brandNewValue';
        expect(observed, 'observed').to.be.true;
        expect(context.simpleProperty).to.equal('brandNewValue');
    }),
    it('should observe setting of nested value', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        let observed = false;

        parse('#{nestedProperty.value}').observeValue(context, () => observed = true);
        
        context.nestedProperty.value = 'newValue';
        expect(observed, 'observed').to.be.true;
        expect(context.nestedProperty.value).to.equal('newValue');

        observed = false;
        
        context.nestedProperty.value = 'brandNewValue';
        expect(observed, 'observed').to.be.true;
        expect(context.nestedProperty.value).to.equal('brandNewValue');
    }),
    it('should throw error when trying to observe missing property', () => {
        expect(() => {parse('#{missingSimpleProperty}').observeValue(testContext, () => {})}).to.throw();
    }),
    it('should throw error when trying to observe undefined base', () => {
        expect(() => {parse('#{missingNestedProperty.value}').observeValue(testContext, () => {})}).to.throw();
    }),
    it('should throw error when trying to observe missing nested value', () => {
        expect(() => {parse('#{nestedProperty.missingValue}').observeValue(testContext, () => {})}).to.throw();
    }),
    it('should observe setting simple value to parent', () => {
        const context = Object.assign({}, testContext);
        context.parentNode = Object.assign({}, context.parentNode);
        let observed = false;
        parse('#{simpleParentProperty}').observeValue(context, () => observed = true);
        context.parentNode.simpleParentProperty = 'newValue';
        expect(observed, 'observed').to.be.true;
        expect(context.parentNode.simpleParentProperty).to.equal('newValue');
    }),
    it('should observe setting nested value to parent', () => {
        const context = Object.assign({}, testContext);
        context.parentNode = Object.assign({}, context.parentNode);
        context.parentNode.nestedParentProperty = Object.assign({}, context.parentNode.nestedParentProperty);
        let observed = false;
        parse('#{nestedParentProperty.value}').observeValue(context, () => observed = true);
        context.parentNode.nestedParentProperty.value = 'newValue';
        expect(observed, 'observed').to.be.true;
        expect(context.parentNode.nestedParentProperty.value).to.equal('newValue');
    }),
    it('should observe setting simple value to nested parent', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        context.nestedProperty.parentNode = Object.assign({}, context.nestedProperty.parentNode);
        let observed = false;
        parse('#{nestedProperty.simpleNestedParentProperty}').observeValue(context, () => observed = true);
        context.nestedProperty.parentNode.simpleNestedParentProperty = 'newValue';
        expect(observed, 'observed').to.be.true;
        expect(context.nestedProperty.parentNode.simpleNestedParentProperty).to.equal('newValue');
    }),
    it('should observe setting nested value to nested parent', () => {
        const context = Object.assign({}, testContext);
        context.nestedProperty = Object.assign({}, context.nestedProperty);
        context.nestedProperty.parentNode = Object.assign({}, context.nestedProperty.parentNode);
        context.nestedProperty.parentNode.doubleNestedParentProperty = Object.assign({}, context.nestedProperty.parentNode.doubleNestedParentProperty);
        let observed = false;
        parse('#{nestedProperty.doubleNestedParentProperty.doubleNestedParentPropertyValue}').observeValue(context, () => observed = true);
        context.nestedProperty.parentNode.doubleNestedParentProperty.doubleNestedParentPropertyValue = 'newValue';
        expect(observed, 'observed').to.be.true;
        expect(context.nestedProperty.parentNode.doubleNestedParentProperty.doubleNestedParentPropertyValue).to.equal('newValue');
    }),
    it('should throw error when trying to observe setting value to missing simple property with nested parent', () => {
        expect(() => {parse('#{nestedParentProperty.missingValue}').observeValue(testContext, () => {})}).to.throw();
    }),
    it('should throw error when trying to observe setting to missing nested value with parent', () => {
        expect(() => {parse('#{nestedParentProperty.missingProperty.value}').observeValue(testContext, () => {})}).to.throw();
    })
    it('should throw error when trying to observe simple property for undefined parent', () => {
        expect(() => {parse('#{simpleProperty}').observeValue(undefined, () => {})}).to.throw();
    }),
    it('should throw error when trying to observe nested property for undefined parent', () => {
        expect(() => {parse('#{nestedProperty.value}').observeValue(undefined, () => {})}).to.throw();
    })
    it('should reregister observation after changing base of nested value', () => {
        // not implemented
    })
    it('should unregister old observation after changing base of nested value', () => {
        // not implemented
    })
});