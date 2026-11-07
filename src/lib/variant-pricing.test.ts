import assert from 'node:assert/strict';
import test from 'node:test';
import { withVariantUnit, computeLineTotal, usesGramQuantity, getInventoryPriceUnitSuffix, parseQuantityInput } from './gram-quantity';
import { buildVariantMutation } from './catalog-variants';

import { calculateProductPrices, calculateModificationPrices } from './price-calculator';
import { resolveLineUnitPrice } from './year-discount';
import { formatCatalogPrice } from './ruble-price';

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

test('manual and calculated contact rates keep kopecks for new and used products', () => {
  const rates = { gold: 1, silver: 0, platinum: 0, palladium: 0 };
  const product = {
    unitType: 'CONTACT' as const, isNewAvailable: true, isUsedAvailable: true,
    contentGold: 2.724, contentGoldUsed: 2.725, contentSilver: 0, contentSilverUsed: 0,
    contentPlatinum: 0, contentPlatinumUsed: 0, contentPalladium: 0, contentPalladiumUsed: 0,
    priceMarkup: 2, priceMarkupUsed: 2,
  };
  const automatic = calculateProductPrices(product, rates);
  assert.equal(automatic.priceNew, 5.45);
  assert.equal(automatic.priceUsed, 5.45);
  const manual = calculateProductPrices({ ...product, manualPriceNew: 5.4, manualPriceUsed: 5.5 }, rates);
  assert.equal(manual.priceNew, 5.4);
  assert.equal(manual.priceUsed, 5.5);
  assert.equal(formatCatalogPrice(manual.priceNew!, 'CONTACT').replace(/\s/g, ''), '5,40₽');
  assert.equal(formatCatalogPrice(6, 'CONTACT').replace(/\s/g, ''), '6,00₽');
});

test('a row can inherit or override contact pricing throughout the inventory calculation', () => {
  const content = { contentAu: 2.724, contentAuUsed: 2.725, contentAg: 0, contentAgUsed: 0,
    contentPt: 0, contentPtUsed: 0, contentPd: 0, contentPdUsed: 0 };
  const rates = { gold: 1, silver: 0, platinum: 0, palladium: 0 };
  const perContact = calculateModificationPrices({ ...content, unitType: 'CONTACT' }, rates, null, 2, 2);
  assert.deepEqual(perContact, { priceNew: 5.45, priceUsed: 5.45 });
  const product = { unitType: 'PIECE' as const, hasModifications: true, isSingleType: false,
    priceNew: 6, priceUsed: 4, isPriceOnRequest: false,
    modifications: [{ id: 'c', unitType: 'CONTACT' as const, ...perContact }] };
  const rate = resolveLineUnitPrice(product, 'c', 'new', 0, 'until1990', false, false);
  assert.equal(rate, 5.45);
  assert.equal(computeLineTotal(rate, 135, withVariantUnit(product, 'c')), 735.75);
  const inherited = { ...product, unitType: 'CONTACT' as const, modifications: [{ id: 'i', ...perContact }] };
  assert.equal(resolveLineUnitPrice(inherited, 'i', 'used', 10, 'until1990', false, true), 4.91);
  const perPiece = calculateModificationPrices({ ...content, unitType: 'PIECE' }, rates, null, 2, 2);
  assert.deepEqual(perPiece, { priceNew: 5, priceUsed: 5 });
  const override = { ...inherited, modifications: [{ id: 'p', unitType: 'PIECE' as const, ...perPiece }] };
  assert.equal(resolveLineUnitPrice(override, 'p', 'new', 10, 'until1990', false, true), 4);
});
