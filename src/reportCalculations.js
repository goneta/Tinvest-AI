export function calcReport(r){
  const totalRevenue=r.activities.reduce((s,a)=>s+(a.revenue||0),0);
  const totalInvested=r.activities.reduce((s,a)=>s+(a.invested||0),0);
  const actExp=r.activities.reduce((s,a)=>s+(a.expenses||0),0);
  const addExp=r.additionalExpenses.reduce((s,e)=>s+(e.amount||0),0);
  const totalExpenses=actExp+addExp;
  const netProfit=totalRevenue-totalInvested-totalExpenses;
  const newInvestment=r.openingInvestment+netProfit;
  return{totalRevenue,totalInvested,actExp,addExp,totalExpenses,netProfit,newInvestment};
}
export function getNextOpeningInvestment(reports,investorId){
  const previous=reports.findLast(r=>r.investorId===investorId);
  return previous?calcReport(previous).newInvestment:0;
}
// Reports are appended in period order; labels and activity dates are editable.
// Keep each investor's first opening capital as the historical starting point.
export function reconcileReportCapital(data){
  const closingByInvestor=new Map();
  let changed=false;
  const reports=data.reports.map(report=>{
    const investorId=report.investorId;
    const opening=closingByInvestor.has(investorId)
      ?closingByInvestor.get(investorId):report.openingInvestment;
    const reconciled=Object.is(opening,report.openingInvestment)
      ?report:{...report,openingInvestment:opening};
    if(reconciled!==report)changed=true;
    closingByInvestor.set(investorId,calcReport(reconciled).newInvestment);
    return reconciled;
  });
  return changed?{...data,reports}:data;
}
