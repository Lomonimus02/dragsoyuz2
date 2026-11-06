import assert from 'node:assert/strict';
import test from 'node:test';
import { withVariantUnit, computeLineTotal, usesGramQuantity, getInventoryPriceUnitSuffix, parseQuantityInput } from './gram-quantity';
import { buildVariantMutation } from './catalog-variants';

test('a mixed table inherits the base unit and counts contacts independently of weight', () => {
  const product = { unitType: 'KG' as const, modifications: [{id:'a', unitType:null}, {id:'b',unitType:'CONTACT' as const}] };
  const weight = withVariantUnit(product,'a');
  const contacts = withVariantUnit(product,'b');
  assert.equal(computeLineTotal(400,250,weight),100);
  assert.equal(computeLineTotal(3,60,contacts),180);
  assert.equal(getInventoryPriceUnitSuffix(contacts.unitType, usesGramQuantity(contacts)), '/контакт');
  assert.equal(parseQuantityInput('1,5',usesGramQuantity(contacts)),null);
  assert.equal(product.unitType,'KG');
  assert.equal(usesGramQuantity({unitType:'CONTACT',categorySlug:'kondensatory'}),false);
});

test('reject duplicated variant IDs without preparing a destructive update', () => {
  assert.throws(() => buildVariantMutation([{rowId:'x',name:'A'}, {rowId:'x',name:'B'}]));
});
