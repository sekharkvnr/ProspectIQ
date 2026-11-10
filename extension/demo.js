// Fictional example used solely to demonstrate layout. It is not a researched company.
window.PROSPECTIQ_DEMO_BRIEF = {
  meta: { company: "Example Logistics Ltd. (fictional)", person: "A. Kumar", role: "Head of Operations", objective: "discovery", generatedAt: "2026-11-10T09:00:00Z", mode: "demo" },
  overview: { headline: "Prepare a conversation about operations visibility", summary: "Example Logistics Ltd. is a fictional company created to demonstrate a meeting-preparation workflow. No external research was performed. All business context below is illustrative.", whyNow: "No verified recent buying trigger is available in demo mode." },
  facts: [
    { label:"Prospect role", value:"Head of Operations", evidence:"user", sourceUrl:"" },
    { label:"Business type", value:"Logistics services (fictional example)", evidence:"unverified", sourceUrl:"" },
    { label:"Company turnover", value:"Not verified", evidence:"unverified", sourceUrl:"" },
    { label:"Recent announcements", value:"No live research performed", evidence:"unverified", sourceUrl:"" }
  ],
  signals:[],
  opportunities:[
    { title:"Shipment exception visibility", rationale:"Operations leaders may want to see and resolve delivery exceptions faster; validate in the meeting.", sellerAngle:"Show an exception-alerting workflow if the buyer confirms this problem.", evidence:"hypothesis" },
    { title:"Manual reporting effort", rationale:"Teams may be preparing repeated status reports manually; ask before asserting.", sellerAngle:"Offer a demonstration of automated status dashboards if relevant.", evidence:"hypothesis" }
  ],
  questions:[
    {question:"How are shipment exceptions detected and escalated today?",why:"Identifies whether visibility is an actual problem."},
    {question:"Which operations KPIs are most important this quarter?",why:"Maps the discussion to measurable outcomes."},
    {question:"Where do teams still rely on spreadsheet updates?",why:"Identifies potential workflow automation opportunities."},
    {question:"Which systems would a new solution need to integrate with?",why:"Tests technical fit early."},
    {question:"What would make this project a priority now?",why:"Tests timing and decision process."}
  ],
  objections:[
    {objection:"We already have a transport management system.",response:"Ask what the existing platform covers well and whether any visibility or reporting gaps remain. Avoid assuming it lacks capabilities."},
    {objection:"We are not planning a software change.",response:"Explore whether a narrowly scoped improvement or integration could be useful; respect the stated timing."}
  ],
  talkTrack:{opener:"I'd like to understand your current operating priorities and how your team monitors exceptions across shipments.",positioning:"Our logistics automation tools may help with visibility and exception workflows, depending on your current systems.",close:"If there is a relevant workflow gap, could we agree on a short follow-up to map the current process?"},
  nextSteps:["Confirm the prospect's top two operations priorities.","Document current systems and desired KPIs.","Propose a focused next meeting only if a need is established."],
  sources:[]
};
