export function parse(expression) {
    /* develblock:start */
    if (typeof expression != 'string' && !(expression instanceof String)) {
        throw Error('argument must be of type string');
    }
    /* develblock:end */
    const start = expression.indexOf('#{');
    const end = expression.lastIndexOf('}');
    /* develblock:start */
    if (start == -1 || end == -1 || end < start) {
        throw Error('argument must be encapsulated by "#{" and "}"');
    }
    /* develblock:end */
    return new Expression(expression.substring(start + 2, end).split('.'));
}

export function replaceValues(context, template) {
    let iterator = template[Symbol.iterator]();
    let currentChar = iterator.next();
    let result = '';
    let expression = '';
    while (!currentChar.done) {
        if (expression.length == 0) {
            if (currentChar.value === '#') {
                expression = '#';
            } else {
                result = result.concat(currentChar.value);
            }
        } else if (expression.length == 1) {
            if (currentChar.value === '#') {
                result = result.concat(expression);
                expression = '#';
            } else if (currentChar.value === '{') {
                expression = expression.concat(currentChar.value);
            } else {
                result = result.concat(expression).concat(currentChar.value);
                expression = '';
            }
        } else {
            expression = expression.concat(currentChar.value);
            if (currentChar.value === '}') {
                const value = parse(expression).getValue(context)
                result = result.concat(value);
                expression = '';
            }
        }
        currentChar = iterator.next();
    }
    return result;
}

export class Expression {
    constructor(pathElements) {
        /* develblock:start */
        if (!Array.isArray(pathElements)) {
            throw new Error('parameter must be array');
        }
        /* develblock:end */
        this.pathElements = pathElements;
    }

    getValue(base, index = 0, lastIndex = this.pathElements.length) {
        if (base === null) {
            return undefined;
        }
        if (index === lastIndex) {
            return base;
        }
        const pathElement = this.pathElements[index];
        if (!(pathElement in base)) {
            if (!('parentNode' in base)) {
                return undefined;
            }
            return this.getValue(base.parentNode, index, lastIndex);
        }
        return this.getValue(base[pathElement], index + 1, lastIndex);
    }

    setValue(context, value, index = 0, lastIndex = this.pathElements.length) {
        const base = this.getBase(context, index, lastIndex);
        if (!isUndefined(base)) {
            base[this.pathElements[lastIndex - 1]] = value;
        }
    }
    
    getBase(context, index = 0, lastIndex = this.pathElements.length) {
        const object = this.getValue(context, index, lastIndex - 1);
        if (isUndefined(object)) {
            return undefined;
        }
        const pathElement = this.pathElements[lastIndex - 1];
        let parent = object;
        while (!isUndefined(parent) && parent !== null && !(pathElement in parent)) {
            parent = parent.parentNode;
        }
        if (isUndefined(parent) || parent === null) {
            parent = object;
        }
        return parent;
    }

    observeValue(context, callback, index = 0, lastIndex = this.pathElements.length) {
        const base = this.getBase(context, index, lastIndex);
        const property = this.pathElements[lastIndex - 1];
        const propertyDescriptor = Object.getOwnPropertyDescriptor(base, property);
        /* develblock:start */
        if (isUndefined(propertyDescriptor)) {
            throw new Error('property ' + property + ' not found');
        }
        /* develblock:end */
        const oldSetter = propertyDescriptor.set;
        const expression = this;
        propertyDescriptor.valueHolder = {
            'value': propertyDescriptor.value
        };
        if (propertyDescriptor.hasOwnProperty('value')) {
            delete propertyDescriptor.value;
            delete propertyDescriptor.writable;
            propertyDescriptor.get = () => propertyDescriptor.valueHolder.value;
        }
        propertyDescriptor.set = function (value, v) {
            if (!isUndefined(oldSetter)) {
                oldSetter.call(value);
            } else {
                propertyDescriptor.valueHolder.value = value;
            }
            callback.call();
            if (!isUndefined(oldSetter)) {
                propertyDescriptor.set = oldSetter;
            } else {
                propertyDescriptor.value = propertyDescriptor.valueHolder.value;
                propertyDescriptor.writable = true;
                delete propertyDescriptor.get;
                delete propertyDescriptor.set;
            }                
            Object.defineProperty(base, property, propertyDescriptor);
            expression.observeValue(context, callback);
        };
        Object.defineProperty(base, property, propertyDescriptor);
    }
}

function isUndefined(object) {
    return typeof object === 'undefined';
}
