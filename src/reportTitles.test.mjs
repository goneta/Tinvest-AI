import test from 'node:test';
import assert from 'node:assert/strict';
import {translateReportTitle as translate} from './reportTitles.js';

test('report titles translate known months and descriptions in both directions',()=>{
  assert.equal(translate('Juin 2026','en'),'June 2026');
  assert.equal(translate('July 2026','fr'),'Juillet 2026');
  assert.equal(translate('Janvier 2026 (Engrais + Tuiles)','en'),'January 2026 (Fertilizer + Tiles)');
  assert.equal(translate('Oct–Nov 2025 (Caoutchouc)','en'),'Oct–Nov 2025 (Rubber)');
});
test('unknown wording and proper names retain the entire original title',()=>{
  assert.equal(translate('Juin projet spécial','en'),'Juin projet spécial');
  assert.equal(translate('Marchandise','en'),'Marchandise');
  assert.equal(translate('Client ABC 2026','fr'),'Client ABC 2026');
});
