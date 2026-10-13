import test from 'node:test';
import assert from 'node:assert/strict';
import { calcReport, getNextOpeningInvestment, reconcileReportCapital } from './reportCalculations.js';

const report=(id,openingInvestment,netProfit=0,investorId=1)=>({
  id,investorId,openingInvestment,activities:[{revenue:netProfit,invested:0,expenses:0}],
  additionalExpenses:[],status:'closed',signatures:[],
});

test('repairs existing June/July discrepancy and propagates through August',()=>{
  const june=report('june',18993340,-1050000);
  const july=report('july',18993340,200000);
  const august=report('august',19193340);
  const original={reports:[june,july,august]};
  const fixed=reconcileReportCapital(original);
  assert.equal(fixed.reports[1].openingInvestment,17943340);
  assert.equal(fixed.reports[2].openingInvestment,18143340);
  assert.equal(original.reports[1].openingInvestment,18993340);
  assert.equal(fixed.reports[0],june);
  assert.equal(fixed.reports[1].activities,july.activities);
  assert.equal(fixed.reports[1].status,'closed');
});

test('activity and expense additions, edits and deletions propagate',()=>{
  const initial=reconcileReportCapital({reports:[report('june',1000,200),report('july',1200,50),report('august',1250)]});
  for(const [activities,additionalExpenses,expected] of [
    [[{revenue:300,invested:50,expenses:20}],[],1230],
    [[{revenue:200}],[{amount:100}],1100],
    [[],[],1000],
    [[{revenue:200}],[{amount:2000}],-800],
    [[{revenue:200}],[{amount:1200}],0],
  ]){
    const result=reconcileReportCapital({...initial,reports:initial.reports.map((r,i)=>i===0?{...r,activities,additionalExpenses}:r)});
    assert.equal(result.reports[1].openingInvestment,expected);
    assert.equal(result.reports[2].openingInvestment,expected+50);
  }
});

test('keeps investors separate and preserves each initial capital',()=>{
  const result=reconcileReportCapital({reports:[report('a1',1000,200,1),report('b1',5000,300,2),report('a2',9999,10,1),report('b2',9999,20,2)]});
  assert.deepEqual(result.reports.map(r=>r.openingInvestment),[1000,5000,1200,5300]);
  assert.equal(getNextOpeningInvestment(result.reports,1),1210);
  assert.equal(getNextOpeningInvestment(result.reports,2),5320);
});

test('editing a middle month leaves earlier reports untouched',()=>{
  const first=report('june',1000,200);
  const result=reconcileReportCapital({reports:[first,report('july',1200,-300),report('august',9999)]});
  assert.equal(result.reports[0],first);
  assert.equal(result.reports[2].openingInvestment,900);
});

test('reconciliation is idempotent and handles empty history',()=>{
  for(const data of [{reports:[]},{reports:[report('first',1000)]},{reports:[report('first',1000,200),report('second',1200)]}]){
    assert.equal(reconcileReportCapital(data),data);
  }
  const fixed=reconcileReportCapital({reports:[report('first',1000),report('second',9999)]});
  assert.equal(reconcileReportCapital(fixed),fixed);
  assert.equal(calcReport(fixed.reports[1]).newInvestment,1000);
});
