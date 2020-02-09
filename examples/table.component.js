import { parse, replaceValues } from '../src/expression.js'

class TableComponent extends HTMLTableElement {

  connectedCallback() {
    this._rowTemplate = this.querySelector('tbody').innerHTML;
    const component = this;
    this.expression = parse(this.getAttribute('value'));
    this.expression.observeValue(this, () => { component.render() });
    this.render();  
  }
  
  render() {
    const value = this.expression.getValue(this);
    let innerHTML = '';
    const component = this;
    const context = { parentNode: component };
    const key = this.getAttribute('var');
    value.forEach(function(item) {
      context[key] = item;
      innerHTML += replaceValues(context, component._rowTemplate);
    });
    this.querySelector('tbody').innerHTML = innerHTML;
  }
}

customElements.define('repeat-table', TableComponent, { extends: "table" });
