import { useState, useEffect, useRef, useCallback } from "react";

// ── THEME SYSTEM ────────────────────────────────────────────────────────────────
const DARK = {
  blue:"#4285F4",red:"#EA4335",yellow:"#FBBC05",green:"#34A853",purple:"#9C27B0",teal:"#14B8A6",
  bg:"#0e0f14",surface:"#161820",card:"#1c1e26",border:"#252733",border2:"#2e3142",
  text:"#e8eaf0",muted:"#6b7280",dim:"#9ca3af",overlay:"rgba(0,0,0,0.85)",
};
const LIGHT = {
  blue:"#1a73e8",red:"#d93025",yellow:"#f9ab00",green:"#1e8e3e",purple:"#7b1fa2",teal:"#00897b",
  bg:"#f1f3f8",surface:"#ffffff",card:"#ffffff",border:"#e2e8f0",border2:"#cbd5e1",
  text:"#1a1a2e",muted:"#64748b",dim:"#475569",overlay:"rgba(0,0,0,0.5)",
};
let _C = DARK;
let _lang = "fr";

// ── CURRENCIES ─────────────────────────────────────────────────────────────────
const ALL_CURRENCIES=[
  {code:"GBP",sym:"£",name:"Livre Sterling",color:"#4285F4"},
  {code:"EUR",sym:"€",name:"Euro",color:"#34A853"},
  {code:"USD",sym:"$",name:"Dollar US",color:"#FBBC05"},
  {code:"RUB",sym:"₽",name:"Rouble",color:"#e57373"},
  {code:"CNY",sym:"¥",name:"Yuan",color:"#ff9800"},
];
const DEFAULT_RATES={GBP:752.28,EUR:655.96,USD:610.00,RUB:6.80,CNY:84.00};

// ── ROLES & PERMISSIONS ─────────────────────────────────────────────────────────
const ROLES={
  admin:{label:"Administrateur",labelEn:"Administrator",color:"#EA4335",icon:"🔴"},
  manager:{label:"Gestionnaire",labelEn:"Manager",color:"#4285F4",icon:"🔵"},
  investor:{label:"Investisseur",labelEn:"Investor",color:"#34A853",icon:"🟢"},
};
const PERMISSIONS={
  admin:["view_all","add_activity","edit_activity","delete_activity","add_expense","edit_expense","delete_expense","edit_investor","delete_investor","manage_users","edit_settings","close_report","create_report","print","download","view_audit","manage_forecast"],
  manager:["view_all","add_activity","edit_activity","add_expense","edit_expense","view_investor","print","download","create_report","close_report"],
  investor:["view_own","print","download","view_forecast"],
};
function can(session,action){return session?(PERMISSIONS[session.role]||[]).includes(action):false;}

// ── INITIAL DATA ────────────────────────────────────────────────────────────────
const INIT_USERS=[
  {id:1,username:"admin",password:"admin123",role:"admin",name:"Super Admin",email:"admin@thunderfam.com",active:true,approved:true,investorId:null},
  {id:2,username:"manager",password:"manager123",role:"manager",name:"Gestionnaire Principal",email:"manager@thunderfam.com",active:true,approved:true,investorId:null},
  {id:3,username:"investor1",password:"invest123",role:"investor",name:"Investisseur Principal",email:"investisseur@thunderfam.com",active:true,approved:true,investorId:1},
];
const PERMANENT_CATEGORIES=[
  "Transport de marchandise",
  "Achat de marchandise",
  "Vente de marchandise",
  "Expertise en informatique : conseil, installation, entretien, maintenance, confection de logiciels et applications",
  "Import-Export de biens et produits divers",
  "Services de transfert d'argent mobile money (Orange, MTN, Moov, etc.)",
  "Achat et vente de terrain et maison, gestion foncière et immobilière",
  "Tous travaux de bâtiment et travaux publics (BTP) : construction, aménagement et entretien",
  "Secteur d'agroalimentaire et hôtellerie, restauration",
  "Éducation et formation dans divers domaines",
  "Exploitation d'une ferme agro-pisciculture",
  "Transport routier",
  "L'acquisition, la location et la vente de tous biens meubles et immeubles",
  "L'emprunt de toutes sommes auprès de tous établissements financiers avec possibilité de donner en garantie tout ou partie des biens sociaux",
  "Toutes opérations financières, commerciales, industrielles, mobilières et immobilières, se rapportant directement ou indirectement à l'objet social ou pouvant en faciliter l'extension ou le développement",
];
const DEFAULT_CATEGORIES=[...PERMANENT_CATEGORIES];
const INIT={
  settings:{rates:{...DEFAULT_RATES},selectedCurrencies:["GBP"],adminPwd:"admin123",language:"fr",theme:"dark",ratesLastUpdated:null,dashboardWidgets:["capital","profit","monthly","investors","chart_line","chart_pie"],categories:[...DEFAULT_CATEGORIES]},
  users:[...INIT_USERS],pendingUsers:[],
  projections:[],
  notifications:[
    {id:1,type:"info",msg:"Rapport Février 2026 disponible",date:"2026-02-14",read:false},
    {id:2,type:"success",msg:"Nouveau profit enregistré : +1 650 000 F CFA",date:"2026-02-14",read:false},
    {id:3,type:"warning",msg:"Taux de change non mis à jour depuis 7 jours",date:"2026-02-13",read:true},
  ],
  auditLog:[
    {id:1,user:"admin",action:"Rapport créé",target:"Octobre 2025",date:"2025-10-01 09:00",type:"create"},
    {id:2,user:"admin",action:"Activité ajoutée",target:"Transport Caoutchouc",date:"2025-10-01 09:15",type:"create"},
    {id:3,user:"admin",action:"Rapport fermé",target:"Octobre 2025",date:"2025-11-01 18:00",type:"lock"},
    {id:4,user:"admin",action:"Rapport créé",target:"Décembre 2025",date:"2025-12-01 08:30",type:"create"},
    {id:5,user:"manager",action:"Activité ajoutée",target:"Camion Ghana Engrais",date:"2025-12-05 10:00",type:"create"},
    {id:6,user:"admin",action:"Rapport fermé",target:"Décembre 2025",date:"2026-01-02 17:00",type:"lock"},
    {id:7,user:"admin",action:"Rapport Février 2026 ouvert",target:"Février 2026",date:"2026-02-01 09:00",type:"create"},
  ],
  investors:[{id:1,name:"Investisseur Principal",initialInvestment:11470000,currentInvestment:16265340,cumulativeProfit:4795340,address:"Abidjan, Plateau, Bvd de la République",phone:"+225 07 00 00 00 00",representative:"John Doe",email:"investisseur@thunderfam.com",country:"Côte d'Ivoire",goal:8000000,goalLabel:"Profit cible 2026",sharedTokens:[],logo:null,preferredCurrency:"GBP",investmentCategories:[{category:"Transport de marchandise",amount:8000000},{category:"Achat de marchandise",amount:3470000}]}],
  reports:[
    {id:"2025-10",label:"Oct–Nov 2025 (Caoutchouc)",investorId:1,openingInvestment:11470000,activities:[{id:1,date:"2025-10-01",category:"Transport de marchandise",description:"Rubber — Caoutchouc",invested:11470000,revenue:11835340,expenses:0,profit:365340,attachments:[]}],additionalExpenses:[],status:"closed",signatures:[],shareToken:null},
    {id:"2025-12",label:"Décembre 2025 (Engrais)",investorId:1,openingInvestment:11835340,activities:[{id:2,date:"2025-12-05",category:"Transport de marchandise",description:"1er Camion GHANA (Engrais)",invested:2500000,revenue:3500000,expenses:0,profit:1000000,attachments:[]},{id:3,date:"2025-12-10",category:"Transport de marchandise",description:"2e Camion GHANA (Engrais)",invested:2500000,revenue:3500000,expenses:0,profit:1000000,attachments:[]}],additionalExpenses:[],status:"closed",signatures:[],shareToken:null},
    {id:"2026-01",label:"Janvier 2026 (Engrais + Tuiles)",investorId:1,openingInvestment:13835340,activities:[{id:4,date:"2026-01-03",category:"Transport de marchandise",description:"1er Camion GHANA (Engrais)",invested:2500000,revenue:3500000,expenses:0,profit:1000000,attachments:[]},{id:5,date:"2026-01-07",category:"Transport de marchandise",description:"2e Camion GHANA (Engrais)",invested:2500000,revenue:3500000,expenses:0,profit:1000000,attachments:[]},{id:6,date:"2026-01-12",category:"Transport de marchandise",description:"Transport Tuiles (ALEPE-YAKASSE)",invested:50000,revenue:250000,expenses:0,profit:200000,attachments:[]}],additionalExpenses:[],status:"closed",signatures:[],shareToken:null},
    {id:"2026-02",label:"Février 2026 (Engrais + Tuiles)",investorId:1,openingInvestment:16035340,activities:[{id:7,date:"2026-02-02",category:"Transport de marchandise",description:"Camion GHANA (Engrais)",invested:2500000,revenue:3500000,expenses:0,profit:1000000,attachments:[]},{id:8,date:"2026-02-08",category:"Transport de marchandise",description:"Transport Tuiles (ALEPE–SAN PEDRO)",invested:150000,revenue:550000,expenses:0,profit:400000,attachments:[]},{id:9,date:"2026-02-14",category:"Transport de marchandise",description:"Transport Tuiles (ALEPE–LAKOTA)",invested:100000,revenue:350000,expenses:0,profit:250000,attachments:[]}],additionalExpenses:[{id:1,label:"Impôt / Tax",amount:400000},{id:2,label:"Hôtel (120 000F × 3 nuits × 2 pers.)",amount:720000},{id:3,label:"Location voiture (100 000F × 3 jours)",amount:300000}],status:"closed",signatures:[{user:"investor1",name:"Investisseur Principal",date:"2026-02-15 10:30",approved:true}],shareToken:null},
  ]
};

// ── TRANSLATIONS ────────────────────────────────────────────────────────────────
const T={
  fr:{
    nav:{dashboard:"Tableau de Bord",reports:"Rapports",analytics:"Analyses",investors:"Investisseurs",users:"Utilisateurs",audit:"Journal d'Audit",categories:"Catégories",forecast:"Projections",settings:"Paramètres"},
    login:{title:"Connexion",username:"Utilisateur",password:"Mot de passe",btn:"Se connecter",error:"Identifiants incorrects.",register:"Inscription Investisseur",logout:"Déconnexion"},
    register:{title:"Inscription",name:"Nom complet",username:"Identifiant",email:"Email",password:"Mot de passe",phone:"Téléphone",country:"Pays",address:"Adresse",representative:"Représentant",initialInv:"Investissement initial (F CFA)",btn:"Soumettre",success:"Demande envoyée ! En attente de validation Admin.",backLogin:"Retour connexion"},
    dashboard:{overviewSub:"Vue d'ensemble — Thunderfam Investment",capitalEvolution:"Évolution Capital",profitsByReport:"Profits par Rapport",totalInvested:"Capital Total",netProfit:"Profit Net Cumulé",monthlyProfit:"Profit du Mois",activeInvestors:"Investisseurs Actifs",evolution:"Évolution",recentActivity:"Activités Récentes",roi:"ROI Annualisé",avgGrowth:"Croissance Moy.",bestMonth:"Meilleur Mois",goal:"Objectif Profit",returnRate:"Rendement",overview:"Vue d'ensemble",perReport:"/ rapport",actives:"Actifs",currentCapital:"Capital Actuel",cumulativeProfit:"Profit Cumulé",monthProfit:"Profit du Mois",roiTotal:"ROI Total"},
    report:{title:"Rapports",investment:"Capital d'Ouverture",addExpense:"+ Dépense",closeReport:"Fermer",unlock:"Déverrouiller",openReport:"+ Rapport",additionalExpenses:"Dépenses Add.",newInvestment:"Nouvel Invest.",totalRevenue:"Total Revenus",totalExpenses:"Total Dépenses",printReport:"Imprimer",downloadPDF:"PDF",myCerts:"Certificat",signReport:"Approuver",unsignReport:"Retirer signature",signed:"Approuvé",myReports:"Mes Rapports",addAttachment:"Joindre",netProfit:"Profit Net",noReports:"Aucun rapport disponible.",personalReports:"Vos rapports financiers",historyTitle:"Historique des rapports",activities:"Activités",autoProfit:"Profit auto :",approvedBy:"Approuvé par",signatureBlock:"Signatures Électroniques",summary:"Résumé Final",openingCapital:"Capital d'ouverture",totalInvestment:"Nouvel Investissement",newLabel:"Titre du rapport",shareInfo:"Partagez ce code avec le destinataire.",timeline:"Frise chronologique"},
    activity:{add:"+ Activité",date:"Date",category:"Catégorie",description:"Description",invested:"Investi",revenue:"Revenu",expenses:"Dépenses",profit:"Profit",save:"Sauvegarder",cancel:"Annuler",expLabel:"Libellé",expAmount:"Montant"},
    investor:{add:"Ajouter",logoLabel:"Logo de l'Investisseur",uploadLogo:"Charger un logo (PNG, JPG, SVG)",removeLogo:"Supprimer",currencyDesc:"Devise préférée (rapports & contrat)",catsLabel:"Catégories d'investissement & montants",amountLabel:"Montant (F CFA)",noCats:"Aucune catégorie — cliquez sur Ajouter",goalAmountLabel:"Montant objectif (F CFA)",goalLabelField:"Libellé de l'objectif",goalHint:"Ex: Profit cible 2026",name:"Nom",initial:"Invest. Initial",current:"Capital Actuel",profit:"Profit Cumulé",history:"Historique",address:"Adresse",phone:"Téléphone",representative:"Représentant",email:"Email",country:"Pays",editInfo:"Modifier",setGoal:"Fixer objectif",timeline:"Frise chronologique",consolidatedView:"Vue Consolidée",consolidatedCapital:"Capital Total Consolidé",consolidatedProfit:"Profit Total Cumulé",investorCount:"Nombre Investisseurs",activePortfolios:"Portefeuilles actifs",ranking:"Classement par Profit",subtitle:"Portefeuilles & objectifs",profitEvolution:"Évolution profits",goalDefault:"Objectif",linkedInvestor:"Investisseur lié",totalGrowth:"croissance total",investCalc:"Investissement Initial (calculé)",preferredCurrency:"Devise préférée",fcfaOnly:"F CFA seulement",rateLabel:"Taux actuel :"},
    users:{title:"Utilisateurs",emailCol:"Email",actions:"Actions",pending:"En attente",approve:"Approuver",reject:"Rejeter",disable:"Désactiver",enable:"Activer",resetPwd:"MDP",newUser:"+ Utilisateur",role:"Rôle",status:"Statut",editUser:"Modifier",userCol:"Utilisateur",linkedInvestor:"Investisseur lié",newPwd:"Nouveau mot de passe",you:"Vous",subtitle:"RBAC — Contrôle d'accès",nameField:"Nom *",usernameField:"Identifiant *",pwdField:"Mot de passe *",nameLabel:"Nom",noneOpt:"— Aucun —"},
    analytics:{title:"Analyses & Graphiques",overviewSub:"Visualisations & outils de projection",capitalEvolution:"Évolution du Capital",noExpenses:"Aucune dépense enregistrée",avgRateLabel:"Taux moyen constaté :",perMonth:"/ mois",projResults:"Résultats estimés sur 6 mois",baseInv:"Base d'investissement",netProfitEvol:"Évolution du profit net",copied:"Copié !",preview:"Prévisualiser",emailDesc:"Générez un email HTML des 3 derniers rapports.",projection:"Simulateur de Rendement",compare:"Comparaison Périodes",charts:"Graphiques Interactifs",profitCurve:"Courbe de Profit",revenueVsExp:"Revenus vs Dépenses",expByCategory:"Dépenses par Catégorie",period1:"Période 1",period2:"Période 2",investExtra:"Investissement supplémentaire",estimatedProfit:"Profit estimé (6 mois)",projectionResult:"Résultat projection",baseRate:"Taux de rendement moyen",emailSummary:"Résumé Email",copyHTML:"Copier HTML"},
    audit:{title:"Journal d'Audit",action:"Action",user:"Utilisateur",target:"Cible",date:"Date",type:"Type",all:"Tous",filter:"Filtrer",noEntries:"Aucune entrée.",subtitle:"Traçabilité complète"},
    settings:{title:"Paramètres",preview:"Aperçu",lastUpdate:"MAJ :",toLightMode:"Mode clair",toDarkMode:"Mode sombre",categoriesDesc:"Catégories utilisées dans les activités et les contrats.",currenciesDesc:"F CFA toujours affiché. Sélectionnez les devises supplémentaires.",currencies:"Devises",allCurrencies:"Toutes",noCurrencies:"F CFA uniquement",rates:"Taux de Change",adminPwd:"Mot de passe Admin",language:"Langue",save:"Sauvegarder",autoRates:"Actualiser",ratesUpdated:"Taux mis à jour ✓",ratesFailed:"Erreur",theme:"Thème",dark:"Sombre",light:"Clair",dashWidgets:"Widgets",categoriesMgmt:"Gestion des Catégories",addCategory:"+ Catégorie",deleteCategory:"Supprimer",security:"Sécurité Admin",subtitle:"Configuration système",adminOnly:"Seul un Administrateur peut modifier les paramètres.",savedOk:"✓ Sauvegardé",newCatDefault:"Nouvelle catégorie"},
    contract:{title:"Contrat d'Investissement",generate:"Générer Contrat",download:"Télécharger Contrat",print:"Imprimer Contrat",selectCats:"Catégories d'investissement",amountPerCat:"Montant par catégorie (F CFA)",displayCurrency:"Devise du contrat",investorLogo:"Logo Investisseur",uploadLogo:"Chargez un logo",removeLogo:"Supprimer logo",between:"Entre",and:"et",signedAt:"Fait à Abidjan, le",article1:"OBJET DU CONTRAT",article2:"MONTANTS D'INVESTISSEMENT",article3:"DURÉE ET CONDITIONS",article4:"CONFIDENTIALITÉ",article5:"SIGNATURES",contractBody1:"Le présent contrat définit les termes de l'investissement réalisé par l'Investisseur auprès de Thunderfam Investment.",contractBody2:"L'investissement est soumis aux conditions du marché. Toute modification doit faire l'objet d'un avenant signé.",contractBody3:"Toutes les informations échangées sont strictement confidentielles.",partyA:"Partie A — Gestionnaire",partyB:"Partie B — Investisseur",dirGen:"Direction Générale",compliance:"Compliance Officer",noCategories:"Aucune catégorie définie.",refCurrency:"Devise de référence :",fcfaRef:"Devise de référence : F CFA uniquement",totalLabel:"Total Investissement Initial",categoryCol:"Catégorie d'Activité",amountCol:"Montant Investi",confidential:"Confidentiel",generatedOn:"Document généré le"},
    categories:[...PERMANENT_CATEGORIES],
    lock:{title:"Rapport Verrouillé",msg:"Entrez le mot de passe pour modifier.",password:"Mot de passe",confirm:"Confirmer",cancel:"Annuler",wrong:"Mot de passe incorrect."},
    confirm:"Confirmer",total:"Total",save:"Sauvegarder",cancel:"Annuler",accessDenied:"Accès refusé",readOnly:"Lecture seule",notifications:"Notifications",markAllRead:"Tout lire",share:"Partager",shareLink:"Lien de partage",copyLink:"Copier le lien",linkExpires:"Expire dans 7 jours",active:"● Actif",inactive:"● Inactif",statusClosed:"Fermé",statusOpen:"Ouvert",noNotifications:"Aucune notification",popupBlocked:"Autorisez les popups pour continuer.",demoAccounts:"Comptes démo",adminPending:"Un administrateur validera votre demande.",
    print:{reportTitle:"RAPPORT FINANCIER MENSUEL",investorLabel:"Investisseur",representativeLabel:"Représentant",phoneLabel:"Téléphone",addressLabel:"Adresse",countryLabel:"Pays",totalAddExp:"TOTAL DÉPENSES ADD.",openingCapital:"Capital d'Ouverture",totalRevenue:"Total des Revenus",totalExpenses:"Total des Dépenses",netProfit:"Profit Net",newCapital:"Nouveau Capital",activities:"Activités",addExpenses:"Dépenses Additionnelles",summary:"Résumé Final",signatures:"Signatures Électroniques",date:"Date",category:"Catégorie",description:"Description",invested:"Investi",revenue:"Revenu",expenses:"Dépenses",profit:"Profit",label:"Libellé",amount:"Montant",approvedBy:"Approuvé par",generatedOn:"Généré le",confidential:"Document Confidentiel",total:"TOTAL",certTitle:"CERTIFICAT D'INVESTISSEMENT",certSub:"Thunderfam Group Limited — Côte d'Ivoire",initInvestment:"Investissement Initial",currentCapital:"Capital Actuel",cumulativeProfit:"Profit Cumulé",totalROI:"ROI Total",reportCount:"Nombre de Rapports",issueDate:"Date d'Émission",direction:"Direction Générale",investorTitle:"Investisseur",certAwardedTo:"Ce certificat est délivré à",certSince:"En reconnaissance de son investissement actif auprès de Thunderfam Investment."},
  },
  en:{
    nav:{dashboard:"Dashboard",reports:"Reports",analytics:"Analytics",investors:"Investors",users:"Users",audit:"Audit Log",categories:"Categories",forecast:"Forecast",settings:"Settings"},
    login:{title:"Login",username:"Username",password:"Password",btn:"Sign In",error:"Invalid credentials.",register:"Investor Registration",logout:"Logout"},
    register:{title:"Register",name:"Full Name",username:"Username",email:"Email",password:"Password",phone:"Phone",country:"Country",address:"Address",representative:"Representative",initialInv:"Initial Investment (F CFA)",btn:"Submit",success:"Request sent! Waiting for Admin approval.",backLogin:"Back to login"},
    dashboard:{overviewSub:"Overview — Thunderfam Investment",capitalEvolution:"Capital Evolution",profitsByReport:"Profit by Report",totalInvested:"Total Capital",netProfit:"Cumulative Net Profit",monthlyProfit:"Monthly Profit",activeInvestors:"Active Investors",evolution:"Evolution",recentActivity:"Recent Activities",roi:"Annualized ROI",avgGrowth:"Avg Growth",bestMonth:"Best Month",goal:"Profit Goal",returnRate:"Return",overview:"Overview",perReport:"/ report",actives:"Active",currentCapital:"Current Capital",cumulativeProfit:"Cumulative Profit",monthProfit:"Monthly Profit",roiTotal:"Total ROI"},
    report:{title:"Reports",investment:"Opening Capital",addExpense:"+ Expense",closeReport:"Close",unlock:"Unlock",openReport:"+ Report",additionalExpenses:"Add. Expenses",newInvestment:"New Investment",totalRevenue:"Total Revenue",totalExpenses:"Total Expenses",printReport:"Print",downloadPDF:"PDF",myCerts:"Certificate",signReport:"Approve",unsignReport:"Remove signature",signed:"Approved",myReports:"My Reports",addAttachment:"Attach",netProfit:"Net Profit",noReports:"No reports available.",personalReports:"Your personal financial reports",historyTitle:"Financial reports history",activities:"Activities",autoProfit:"Auto profit:",approvedBy:"Approved by",signatureBlock:"Electronic Signatures",summary:"Final Summary",openingCapital:"Opening Capital",totalInvestment:"New Investment",newLabel:"Report title",shareInfo:"Share this code with the recipient.",timeline:"Timeline"},
    activity:{add:"+ Activity",date:"Date",category:"Category",description:"Description",invested:"Invested",revenue:"Revenue",expenses:"Expenses",profit:"Profit",save:"Save",cancel:"Cancel",expLabel:"Label",expAmount:"Amount"},
    investor:{add:"Add",logoLabel:"Investor Logo",uploadLogo:"Upload logo (PNG, JPG, SVG)",removeLogo:"Remove",currencyDesc:"Preferred currency (reports & contract)",catsLabel:"Investment categories & amounts",amountLabel:"Amount (F CFA)",noCats:"No categories — click Add",goalAmountLabel:"Goal amount (F CFA)",goalLabelField:"Goal label",goalHint:"E.g.: Profit target 2026",name:"Name",initial:"Init. Investment",current:"Current Capital",profit:"Cumulative Profit",history:"History",address:"Address",phone:"Phone",representative:"Representative",email:"Email",country:"Country",editInfo:"Edit",setGoal:"Set Goal",timeline:"Timeline",consolidatedView:"Consolidated View",consolidatedCapital:"Total Consolidated Capital",consolidatedProfit:"Total Cumulative Profit",investorCount:"Number of Investors",activePortfolios:"Active portfolios",ranking:"Ranking by Profit",subtitle:"Portfolios & goals",profitEvolution:"Profit evolution",goalDefault:"Goal",linkedInvestor:"Linked Investor",totalGrowth:"total growth",investCalc:"Initial Investment (calculated)",preferredCurrency:"Preferred currency",fcfaOnly:"F CFA only",rateLabel:"Current rate:"},
    users:{title:"Users",emailCol:"Email",actions:"Actions",pending:"Pending",approve:"Approve",reject:"Reject",disable:"Disable",enable:"Enable",resetPwd:"PWD",newUser:"+ User",role:"Role",status:"Status",editUser:"Edit User",userCol:"User",linkedInvestor:"Linked Investor",newPwd:"New password",you:"You",subtitle:"RBAC — Role-Based Access Control",nameField:"Name *",usernameField:"Username *",pwdField:"Password *",nameLabel:"Name",noneOpt:"— None —"},
    analytics:{title:"Analytics & Charts",overviewSub:"Visualizations & projection tools",capitalEvolution:"Capital Evolution",noExpenses:"No expenses recorded",avgRateLabel:"Average rate observed:",perMonth:"/ month",projResults:"Estimated results over 6 months",baseInv:"Investment base",netProfitEvol:"Net profit evolution",copied:"Copied!",preview:"Preview",emailDesc:"Generate an HTML email summary of the 3 latest reports.",projection:"Yield Simulator",compare:"Period Comparison",charts:"Interactive Charts",profitCurve:"Profit Curve",revenueVsExp:"Revenue vs Expenses",expByCategory:"Expenses by Category",period1:"Period 1",period2:"Period 2",investExtra:"Extra Investment",estimatedProfit:"Estimated profit (6 months)",projectionResult:"Projection Result",baseRate:"Average yield rate",emailSummary:"Email Summary",copyHTML:"Copy HTML"},
    audit:{title:"Audit Log",action:"Action",user:"User",target:"Target",date:"Date",type:"Type",all:"All",filter:"Filter",noEntries:"No entries.",subtitle:"Complete traceability"},
    settings:{title:"Settings",preview:"Preview",lastUpdate:"Updated:",toLightMode:"Light mode",toDarkMode:"Dark mode",categoriesDesc:"Categories used in activities and contracts.",currenciesDesc:"F CFA always shown. Select additional currencies.",currencies:"Currencies",allCurrencies:"All",noCurrencies:"F CFA only",rates:"Exchange Rates",adminPwd:"Admin Password",language:"Language",save:"Save",autoRates:"Refresh",ratesUpdated:"Rates updated ✓",ratesFailed:"Failed",theme:"Theme",dark:"Dark",light:"Light",dashWidgets:"Widgets",categoriesMgmt:"Category Management",addCategory:"+ Category",deleteCategory:"Delete",security:"Admin Security",subtitle:"System Configuration",adminOnly:"Only an Administrator can modify settings.",savedOk:"✓ Saved",newCatDefault:"New category"},
    contract:{title:"Investment Contract",generate:"Generate Contract",download:"Download Contract",print:"Print Contract",selectCats:"Investment Categories",amountPerCat:"Amount per category (F CFA)",displayCurrency:"Contract currency",investorLogo:"Investor Logo",uploadLogo:"Upload a logo",removeLogo:"Remove logo",between:"Between",and:"and",signedAt:"Signed in Abidjan, on",article1:"CONTRACT PURPOSE",article2:"INVESTMENT AMOUNTS",article3:"DURATION & CONDITIONS",article4:"CONFIDENTIALITY",article5:"SIGNATURES",contractBody1:"This contract defines the terms of the investment made by the Investor with Thunderfam Investment.",contractBody2:"The investment is subject to market conditions. Any modification must be covered by an amendment signed by both parties.",contractBody3:"All information exchanged is strictly confidential.",partyA:"Party A — Manager",partyB:"Party B — Investor",dirGen:"General Management",compliance:"Compliance Officer",noCategories:"No investment categories defined.",refCurrency:"Secondary reference currency:",fcfaRef:"Reference currency: F CFA only",totalLabel:"Total Initial Investment",categoryCol:"Activity Category",amountCol:"Amount Invested",confidential:"Confidential",generatedOn:"Generated on"},
    categories:[...PERMANENT_CATEGORIES],
    lock:{title:"Locked Report",msg:"Enter password to modify.",password:"Password",confirm:"Confirm",cancel:"Cancel",wrong:"Incorrect password."},
    confirm:"Confirm",total:"Total",save:"Save",cancel:"Cancel",accessDenied:"Access Denied",readOnly:"Read-only",notifications:"Notifications",markAllRead:"Mark all read",share:"Share",shareLink:"Share Link",copyLink:"Copy link",linkExpires:"Expires in 7 days",active:"● Active",inactive:"● Inactive",statusClosed:"Closed",statusOpen:"Open",noNotifications:"No notifications",popupBlocked:"Please allow popups to continue.",demoAccounts:"Demo accounts",adminPending:"An administrator will validate your request.",
    print:{reportTitle:"MONTHLY FINANCIAL REPORT",investorLabel:"Investor",representativeLabel:"Representative",phoneLabel:"Phone",addressLabel:"Address",countryLabel:"Country",totalAddExp:"TOTAL ADD. EXPENSES",openingCapital:"Opening Capital",totalRevenue:"Total Revenue",totalExpenses:"Total Expenses",netProfit:"Net Profit",newCapital:"New Capital",activities:"Activities",addExpenses:"Additional Expenses",summary:"Final Summary",signatures:"Electronic Signatures",date:"Date",category:"Category",description:"Description",invested:"Invested",revenue:"Revenue",expenses:"Expenses",profit:"Profit",label:"Label",amount:"Amount",approvedBy:"Approved by",generatedOn:"Generated on",confidential:"Confidential Document",total:"TOTAL",certTitle:"INVESTMENT CERTIFICATE",certSub:"Thunderfam Group Limited — Côte d'Ivoire",initInvestment:"Initial Investment",currentCapital:"Current Capital",cumulativeProfit:"Cumulative Profit",totalROI:"Total ROI",reportCount:"Number of Reports",issueDate:"Issue Date",direction:"General Management",investorTitle:"Investor",certAwardedTo:"This certificate is awarded to",certSince:"In recognition of their active investment with Thunderfam Investment."},
  }
};

// ── UTILS ───────────────────────────────────────────────────────────────────────
const fmtNum=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate=(d=new Date())=>{const dt=d instanceof Date?d:new Date(d);return`${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;};
const fmtDateTime=(d=new Date())=>{const dt=d instanceof Date?d:new Date(d);return`${fmtDate(dt)} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;};
const cvt=(n,rate,sym)=>sym+(n/rate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",");
function calcReport(r){
  const totalRevenue=r.activities.reduce((s,a)=>s+(a.revenue||0),0);
  const totalInvested=r.activities.reduce((s,a)=>s+(a.invested||0),0);
  const actExp=r.activities.reduce((s,a)=>s+(a.expenses||0),0);
  const addExp=r.additionalExpenses.reduce((s,e)=>s+(e.amount||0),0);
  const totalExpenses=actExp+addExp;
  const netProfit=totalRevenue-totalInvested-totalExpenses;
  const newInvestment=r.openingInvestment+netProfit;
  return{totalRevenue,totalInvested,actExp,addExp,totalExpenses,netProfit,newInvestment};
}
function getCurrencyLines(n,settings){
  return ALL_CURRENCIES
    .filter(c=>(settings.selectedCurrencies||[]).includes(c.code))
    .map(c=>({sym:c.sym,code:c.code,color:c.color,value:cvt(n,(settings.rates||{})[c.code]||DEFAULT_RATES[c.code]||1,c.sym)}));
}
async function fetchLiveRates(){
  try{const r=await(await fetch("https://open.er-api.com/v6/latest/XOF")).json();if(r.result!=="success")throw 0;const ra=r.rates;return{GBP:+(1/ra.GBP).toFixed(4),EUR:+(1/ra.EUR).toFixed(4),USD:+(1/ra.USD).toFixed(4),RUB:+(1/ra.RUB).toFixed(4),CNY:+(1/ra.CNY).toFixed(4)};}catch{return null;}
}
function addAudit(setData,user,action,target,type="update"){
  setData(d=>({...d,auditLog:[{id:Date.now(),user:user?.username||"system",action,target,date:fmtDateTime(),type},...d.auditLog].slice(0,200)}));
}
function addNotification(setData,msg,type="info"){
  setData(d=>({...d,notifications:[{id:Date.now(),type,msg,date:fmtDate(),read:false},...d.notifications].slice(0,50)}));
}

// ── ICON SYSTEM ─────────────────────────────────────────────────────────────────
const Icon=({name,size=18,color})=>{
  const C=_C;const col=color||C.muted;
  const p={
    dashboard:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    reports:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    investors:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    users:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></>,
    analytics:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    audit:<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>,
    lock:<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    unlock:<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>,
    trend:<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    wallet:<><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>,
    activity:<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    forecast:<><polyline points="22 7 13.5 15.5 8.5 10.5 1 18"/><polyline points="16 7 22 7 22 13"/></>,
    arrow:<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    globe:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    save:<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    close:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:<><polyline points="20 6 9 17 4 12"/></>,
    warning:<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    money:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    print:<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    download:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    phone:<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    mail:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    map:<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    user:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    flag:<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
    refresh:<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    key:<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    eye:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    shield:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    bell:<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    sun:<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon:<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    certificate:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="3"/><line x1="9" y1="20" x2="9" y2="17.5"/><line x1="15" y1="20" x2="15" y2="17.5"/></>,
    paperclip:<><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>,
    pen:<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    share:<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    link:<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    target:<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    zap:<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    copy:<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  };
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}>{p[name]}</svg>);
};

const TFLogo=({size=36})=>(
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flexShrink:0}}>
    <circle cx="50" cy="50" r="48" fill="#1c1e26"/>
    <path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="#4285F4" opacity="0.92"/>
    <path d="M98 50 A48 48 0 0 1 50 98 L50 50 Z" fill="#34A853" opacity="0.92"/>
    <path d="M50 98 A48 48 0 0 1 2 50 L50 50 Z" fill="#FBBC05" opacity="0.92"/>
    <path d="M2 50 A48 48 0 0 1 50 2 L50 50 Z" fill="#EA4335" opacity="0.92"/>
    <path d="M55 16 L36 52 L50 52 L44 84 L64 46 L50 46 Z" fill="white"/>
  </svg>
);

// ── SVG CHARTS ──────────────────────────────────────────────────────────────────
function LineChart({data,width=500,height=160,C}){
  if(!data||data.length<2)return<div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:12}}>Données insuffisantes</div>;
  const pad={t:20,r:20,b:40,l:60};
  const W=width-pad.l-pad.r,H=height-pad.t-pad.b;
  const vals=data.map(d=>d.value);
  const min=Math.min(...vals)*0.9,max=Math.max(...vals)*1.05;
  const range=max-min||1;
  const px=(i)=>pad.l+i*(W/(data.length-1));
  const py=(v)=>pad.t+H-(((v-min)/range)*H);
  const points=data.map((d,i)=>`${px(i)},${py(d.value)}`).join(" ");
  const fillPoints=`${px(0)},${pad.t+H} ${points} ${px(data.length-1)},${pad.t+H}`;
  return(
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto"}}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity="0.3"/><stop offset="100%" stopColor={C.green} stopOpacity="0.02"/></linearGradient></defs>
      {[0,0.25,0.5,0.75,1].map((t,i)=>{const y=pad.t+H*t;const v=max-(range*t);return(<g key={i}><line x1={pad.l} y1={y} x2={pad.l+W} y2={y} stroke={C.border} strokeWidth="1"/><text x={pad.l-6} y={y+4} fontSize="9" fill={C.muted} textAnchor="end">{fmtNum(v)}</text></g>);})}
      <polygon points={fillPoints} fill="url(#lg)"/>
      <polyline points={points} fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i)=>(
        <g key={i}>
          <circle cx={px(i)} cy={py(d.value)} r="4" fill={C.green} stroke={C.card} strokeWidth="2"/>
          <text x={px(i)} y={pad.t+H+18} fontSize="9" fill={C.muted} textAnchor="middle">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

function BarChart({data,width=500,height=160,C}){
  if(!data||!data.length)return null;
  const pad={t:16,r:16,b:40,l:60};
  const W=width-pad.l-pad.r,H=height-pad.t-pad.b;
  const n=data.length;const barW=Math.max(8,(W/(n*3))*2);const gapW=W/n;
  const allVals=data.flatMap(d=>[d.rev,d.exp]);
  const maxV=Math.max(...allVals)*1.1||1;
  const bh=v=>((v/maxV)*H);
  return(
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto"}}>
      {[0,0.25,0.5,0.75,1].map((t,i)=>{const y=pad.t+H*t;return(<g key={i}><line x1={pad.l} y1={y} x2={pad.l+W} y2={y} stroke={C.border} strokeWidth="1"/><text x={pad.l-6} y={y+4} fontSize="9" fill={C.muted} textAnchor="end">{fmtNum(maxV*(1-t))}</text></g>);})}
      {data.map((d,i)=>{
        const cx=pad.l+gapW*i+gapW/2;
        const rh=bh(d.rev),eh=bh(d.exp);
        return(<g key={i}>
          <rect x={cx-barW-2} y={pad.t+H-rh} width={barW} height={rh} fill={C.blue} rx="2" opacity="0.85"/>
          <rect x={cx+2}      y={pad.t+H-eh} width={barW} height={eh} fill={C.red}  rx="2" opacity="0.85"/>
          <text x={cx} y={pad.t+H+16} fontSize="9" fill={C.muted} textAnchor="middle">{d.label}</text>
        </g>);
      })}
      <g transform={`translate(${pad.l+W-80},${pad.t+4})`}>
        <rect width="8" height="8" fill={C.blue} rx="1"/><text x="12" y="8" fontSize="9" fill={C.muted}>{T[_lang].activity.revenue}</text>
        <rect x="60" width="8" height="8" fill={C.red} rx="1"/><text x="72" y="8" fontSize="9" fill={C.muted}>{T[_lang].activity.expenses.substring(0,4)}</text>
      </g>
    </svg>
  );
}

function PieChart({data,size=140,C}){
  if(!data||!data.length)return null;
  const total=data.reduce((s,d)=>s+d.value,0);
  if(!total)return null;
  let angle=-Math.PI/2;const r=60,cx=size/2,cy=size/2;
  const slices=data.map(d=>{
    const sweep=(d.value/total)*2*Math.PI;
    const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    angle+=sweep;
    const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
    const large=sweep>Math.PI?1:0;
    return{...d,path:`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`,pct:((d.value/total)*100).toFixed(1)};
  });
  return(
    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{width:size,height:size,flexShrink:0}}>
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity="0.9" stroke={_C.card} strokeWidth="1.5"/>)}
        <circle cx={cx} cy={cy} r={r*0.5} fill={_C.card}/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize="10" fill={_C.muted}>Total</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize="9" fontWeight="700" fill={_C.text}>{fmtNum(total)}</text>
      </svg>
      <div>{slices.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <div style={{width:10,height:10,borderRadius:2,background:s.color,flexShrink:0}}/>
          <div>
            <div style={{color:_C.dim,fontSize:10,lineHeight:1.1}}>{s.label}</div>
            <div style={{color:s.color,fontSize:10,fontWeight:700}}>{fmtNum(s.value)} F ({s.pct}%)</div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}

function MiniSparkline({values,color,width=80,height=30}){
  if(!values||values.length<2)return null;
  const max=Math.max(...values)||1,min=Math.min(...values);
  const range=max-min||1;
  const pts=values.map((v,i)=>`${(i/(values.length-1))*width},${height-((v-min)/range)*(height-4)-2}`).join(" ");
  return(<svg viewBox={`0 0 ${width} ${height}`} style={{width,height}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>);
}

// ── UI PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({children,style={},accent,onClick}){
  const C=_C;
  return(<div onClick={onClick} style={{background:C.card,border:`1px solid ${accent?accent+"33":C.border}`,borderTop:accent?`3px solid ${accent}`:undefined,borderRadius:10,cursor:onClick?"pointer":undefined,...style}}>{children}</div>);
}
function Modal({title,icon,iconColor,children,onClose,wide,extraWide}){
  const C=_C;
  return(<div style={{position:"fixed",inset:0,background:C.overlay,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
    <Card style={{padding:24,width:extraWide?920:wide?720:500,maxWidth:"96vw",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.8)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {icon&&<div style={{width:28,height:28,borderRadius:8,background:(iconColor||C.blue)+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={icon} size={14} color={iconColor||C.blue}/></div>}
          <span style={{color:C.text,fontSize:15,fontWeight:700}}>{title}</span>
        </div>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}44`,color:C.muted,cursor:"pointer",borderRadius:7,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="close" size={11} color={C.muted}/></button>
      </div>{children}
    </Card>
  </div>);
}
function Field({label,value,onChange,type="text",readOnly=false,hint,style={}}){
  const C=_C;
  return(<div style={{marginBottom:12}}>
    {label&&<div style={{color:C.muted,fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{label}</div>}
    <input type={type} value={value??""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly}
      style={{width:"100%",background:readOnly?C.bg:C.surface,border:`1px solid ${C.border2}`,borderRadius:7,padding:"8px 12px",color:readOnly?C.muted:C.text,fontSize:13,outline:"none",...style}}/>
    {hint&&<div style={{color:C.muted,fontSize:10,marginTop:3}}>{hint}</div>}
  </div>);
}
function DDrop({label,value,onChange,options}){
  const C=_C;
  return(<div style={{marginBottom:12}}>
    {label&&<div style={{color:C.muted,fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{label}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.surface,border:`1px solid ${C.border2}`,borderRadius:7,padding:"8px 12px",color:C.text,fontSize:13,outline:"none"}}>
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  </div>);
}
function Btn({children,onClick,variant="primary",icon,style={},small,disabled}){
  const C=_C;
  const sz=small?{padding:"5px 10px",fontSize:11}:{padding:"8px 16px",fontSize:13};
  const isz=small?11:14;
  const vars={
    primary:{background:C.blue,color:"#fff",border:"none"},
    green:{background:C.green,color:"#fff",border:"none"},
    yellow:{background:C.yellow,color:"#111",border:"none"},
    red:{background:"rgba(127,29,29,0.35)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.35)"},
    secondary:{background:"transparent",color:C.blue,border:`1px solid ${C.blue}55`},
    ghost:{background:"transparent",color:C.dim,border:`1px solid ${C.border}44`},
    orange:{background:"rgba(251,191,36,0.15)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.35)"},
    teal:{background:"rgba(20,184,166,0.15)",color:"#2dd4bf",border:"1px solid rgba(20,184,166,0.35)"},
    purple:{background:"rgba(156,39,176,0.2)",color:"#ce93d8",border:"1px solid rgba(156,39,176,0.4)"},
  };
  return(<button onClick={onClick} disabled={disabled} style={{...sz,...vars[variant],borderRadius:7,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5,opacity:disabled?0.5:1,transition:"all .15s",...style}}>
    {icon&&<Icon name={icon} size={isz} color={vars[variant].color}/>}{children}
  </button>);
}
function Badge({closed}){
  const C=_C;
  return(<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:closed?"rgba(127,29,29,0.3)":"rgba(20,83,45,0.3)",color:closed?"#fca5a5":"#86efac",border:`1px solid ${closed?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)"}`,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>
    <Icon name={closed?"lock":"unlock"} size={10} color={closed?"#fca5a5":"#86efac"}/>{closed?T[_lang]?.statusClosed||"Fermé":T[_lang]?.statusOpen||"Ouvert"}
  </span>);
}
function ConfirmModal({open,title,message,itemName,itemType,onConfirm,onCancel,lang="fr"}){
  const C=_C;
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)"}} onClick={onCancel}>
      <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:16,padding:"28px 32px",maxWidth:440,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:52,height:52,borderRadius:13,background:`${C.red}18`,border:`1px solid ${C.red}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 18px"}}>&#128465;</div>
        <div style={{color:C.text,fontWeight:800,fontSize:17,textAlign:"center",marginBottom:8}}>{title}</div>
        <div style={{color:C.muted,fontSize:13,textAlign:"center",marginBottom:16,lineHeight:1.5}}>{message}</div>
        {itemName&&(
          <div style={{background:C.surface,border:`1px solid ${C.red}33`,borderRadius:10,padding:"12px 16px",marginBottom:20,textAlign:"center"}}>
            <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{itemType}</div>
            <div style={{color:C.red,fontWeight:800,fontSize:14,lineHeight:1.4}}>{itemName}</div>
          </div>
        )}
        <div style={{color:"#fca5a5",fontSize:11,textAlign:"center",marginBottom:20,background:"rgba(239,68,68,0.08)",borderRadius:8,padding:"8px 12px",border:"1px solid rgba(239,68,68,0.2)"}}>
          {lang==="fr"?"Attention : cette action est irreversible.":"Warning: this action cannot be undone."}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}44`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>{lang==="fr"?"Annuler":"Cancel"}</button>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:C.red,color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Icon name="trash" size={13} color="#fff"/>{lang==="fr"?"Supprimer":"Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
function RoleBadge({role,lang="fr"}){
  const r=ROLES[role];if(!r)return null;
  return(<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,background:r.color+"22",color:r.color,border:`1px solid ${r.color}44`,fontSize:10,fontWeight:700}}>{r.icon} {lang==="fr"?r.label:r.labelEn}</span>);
}
function StatCard({label,value,lines=[],accent,icon,sparkValues,trend}){
  const C=_C;const ac=accent||C.yellow;
  return(<Card accent={ac} style={{padding:"14px 16px",flex:1,minWidth:140}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
      <span style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,lineHeight:1.3,flex:1}}>{label}</span>
      {icon&&<div style={{width:22,height:22,borderRadius:6,background:ac+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={icon} size={11} color={ac}/></div>}
    </div>
    <div style={{color:ac,fontSize:14,fontWeight:800,lineHeight:1.3}}>{value}</div>
    {lines.map((l,i)=><div key={i} style={{color:ac,fontSize:12,fontWeight:700,lineHeight:1.3}}>{l}</div>)}
    {trend!==undefined&&<div style={{color:trend>=0?C.green:C.red,fontSize:10,fontWeight:700,marginTop:4}}>{trend>=0?"↑":"↓"} {Math.abs(trend).toFixed(1)}%</div>}
    {sparkValues&&sparkValues.length>1&&<div style={{marginTop:6}}><MiniSparkline values={sparkValues} color={ac}/></div>}
  </Card>);
}
function Amt({n,settings,color,size=12,right=true}){
  const C=_C;const col=color||C.text;
  const lines=getCurrencyLines(n,settings);
  return(<div style={{textAlign:right?"right":"left"}}>
    <div style={{color:col,fontSize:size,fontWeight:700,whiteSpace:"nowrap",lineHeight:1.45}}>{fmtNum(n)} F</div>
    {lines.map(l=><div key={l.code} style={{color:col,fontSize:size,fontWeight:700,whiteSpace:"nowrap",lineHeight:1.45}}>{l.value}</div>)}
  </div>);
}
function EditCell({value,onChange,type="text",options,optionLabels,style={}}){
  const C=_C;
  if(options)return(<select value={value} onChange={e=>onChange(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:5,padding:"3px 6px",color:C.text,fontSize:11,width:"100%",...style}}>{options.map((o,i)=><option key={o} value={o}>{optionLabels?optionLabels[i]||o:o}</option>)}</select>);
  return(<input type={type} value={value??""} onChange={e=>onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)} style={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:5,padding:"3px 6px",color:C.text,fontSize:11,width:"100%",textAlign:type==="number"?"right":"left",...style}}/>);
}

// ── PROGRESS BAR ────────────────────────────────────────────────────────────────
function ProgressBar({value,max,color,label,showPct=true}){
  const C=_C;const pct=Math.min(100,(value/max)*100);
  return(<div>
    {label&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.dim,fontSize:11}}>{label}</span>{showPct&&<span style={{color:color||C.blue,fontSize:11,fontWeight:700}}>{pct.toFixed(1)}%</span>}</div>}
    <div style={{height:6,background:C.border2,borderRadius:3,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color||C.blue,borderRadius:3,transition:"width 0.5s ease"}}/>
    </div>
  </div>);
}

// ── PRINT / PDF / CERTIFICATE ───────────────────────────────────────────────────
// ── Shared print header builder ──────────────────────────────────────────────────
function buildPrintHeader(catLine1="",catLine2="",dateStr=""){
  const d=dateStr||new Date().toLocaleDateString("fr-FR",{year:"numeric",month:"long",day:"numeric"});
  return`<div style="background:#1a1a2e;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;width:100%;box-sizing:border-box;">
    <div style="display:flex;align-items:center;gap:14px;">
      <svg width="46" height="46" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
        <circle cx="50" cy="50" r="48" fill="#1c1e26"/>
        <path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="#4285F4"/>
        <path d="M98 50 A48 48 0 0 1 50 98 L50 50 Z" fill="#34A853"/>
        <path d="M50 98 A48 48 0 0 1 2 50 L50 50 Z" fill="#FBBC05"/>
        <path d="M2 50 A48 48 0 0 1 50 2 L50 50 Z" fill="#EA4335"/>
        <path d="M55 16 L36 52 L50 52 L44 84 L64 46 L50 46 Z" fill="white"/>
      </svg>
      <div>
        <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;line-height:1.1;font-family:'Segoe UI',Arial,sans-serif;">
          <span style="color:#4285F4;font-weight:900">T</span><span style="color:#4285F4;font-weight:900">h</span><span style="color:#EA4335;font-weight:900">u</span><span style="color:#EA4335;font-weight:900">n</span><span style="color:#FBBC05;font-weight:900">d</span><span style="color:#FBBC05;font-weight:900">e</span><span style="color:#FBBC05;font-weight:900">r</span><span style="color:#34A853;font-weight:900">f</span><span style="color:#34A853;font-weight:900">a</span><span style="color:#34A853;font-weight:900">m</span> <span style="color:#ffffff;font-weight:700">Investment</span>
        </div>
        <div style="color:rgba(255,255,255,0.45);font-size:9px;letter-spacing:.14em;text-transform:uppercase;margin-top:4px;font-family:'Segoe UI',Arial,sans-serif;">IN — CÔTE D'IVOIRE</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:12px 18px;text-align:right;font-family:'Segoe UI',Arial,sans-serif;">
      ${catLine1?`<div style="color:#ffffff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">${catLine1}</div>`:""}
      ${catLine2?`<div style="color:rgba(255,255,255,0.75);font-size:11px;margin-bottom:4px;">${catLine2}</div>`:""}
      <div style="color:rgba(255,255,255,0.5);font-size:10px;">Généré le ${d}</div>
    </div>
  </div>`;
}
const TF_HEADER_CSS=``;

function buildReportHTML(report,calc,investors,settings,lang="fr"){
  const tp=T[lang].print;const tl=T[lang].investor;const locale=lang==="fr"?"fr-FR":"en-GB";
  const C=_C;const inv=investors.find(i=>i.id===report.investorId)||{};
  const cellHTML=(n,cls="")=>{const rows=[`<div class="amt ${cls}">${fmtNum(n)} F CFA</div>`];getCurrencyLines(n,settings).forEach(l=>rows.push(`<div class="amt ${cls}">${l.value}</div>`));return rows.join("");};
  const actRows=report.activities.map(a=>`<tr><td>${a.date}</td><td class="cat">${a.category}</td><td>${a.description}</td><td class="num">${cellHTML(a.invested)}</td><td class="num">${cellHTML(a.revenue,"blue")}</td><td class="num">${cellHTML(a.expenses,"red")}</td><td class="num">${cellHTML(a.profit,"green")}</td></tr>`).join("");
  const expRows=report.additionalExpenses.map(e=>`<tr><td colspan="5">${e.label}</td><td class="num">${cellHTML(e.amount,"red")}</td><td></td></tr>`).join("");
  const sigBlock=report.signatures?.length?`<div style="margin-top:16px;padding:12px;background:#f0f4ff;border-radius:8px;border:1px solid #c7d7ff"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#555;margin-bottom:8px">${tp.signatures}</div>${report.signatures.map(s=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e2e8f0;font-size:10px"><span>✅ ${s.name}</span><span style="color:#888">${s.date}</span></div>`).join("")}</div>`:"";
  return`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${tp.reportTitle} — ${report.label}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2a;font-size:11px;background:#fff;padding:0 24px 20px;}.inv-box{background:#f8f9fa;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:11px;}.inv-box .lbl{font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#777;font-weight:700;display:block;margin-bottom:2px;}.kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;}.kpi-card{border-radius:7px;padding:9px;}.kpi-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:#888;margin-bottom:4px;font-weight:700;}.amt{font-size:10px;font-weight:700;line-height:1.4;}.blue{color:#4285F4;}.green{color:#34A853;}.red{color:#EA4335;}.k1{background:#e8f0fe;border-top:3px solid #4285F4;}.k1 .amt{color:#4285F4;}.k2{background:#e6f4ea;border-top:3px solid #34A853;}.k2 .amt{color:#34A853;}.k3{background:#fce8e6;border-top:3px solid #EA4335;}.k3 .amt{color:#EA4335;}.k4{background:#fef7e0;border-top:3px solid #FBBC05;}.k4 .amt{color:#c17b00;}.k5{background:#eff6ff;border-top:3px solid #4285F4;}.k5 .amt{color:#4285F4;}table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10px;}th{background:#f0f4ff;color:#333;font-weight:700;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;border-bottom:2px solid #4285F4;}td{padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top;}.num{text-align:right;}.cat{font-size:9px;color:#666;}.tot-row{background:#f0f4ff;font-weight:800;}.sec-title{font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:800;margin:12px 0 6px;}.sum-box{background:#f8f9fa;border:1px solid #e2e8f0;border-radius:8px;padding:14px;}.sum-title{font-size:10px;font-weight:800;color:#4285F4;margin-bottom:8px;text-transform:uppercase;}.sum-row{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px solid #eee;}.sum-row:last-child{border:none;}.sum-lbl{color:#555;font-size:11px;}.sum-val{text-align:right;}footer{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8px;color:#aaa;}@media print{@page{margin:1cm;}}</style></head><body>
${buildPrintHeader(lang==="fr"?"Rapport Financier Mensuel":"Monthly Financial Report",report.label)}
<div class="inv-box"><div><span class="lbl">${tp.investorLabel}</span>${inv.name||"—"}</div><div><span class="lbl">${tp.representativeLabel}</span>${inv.representative||"—"}</div><div><span class="lbl">Email</span>${inv.email||"—"}</div><div><span class="lbl">${tp.phoneLabel}</span>${inv.phone||"—"}</div><div><span class="lbl">${tp.addressLabel}</span>${inv.address||"—"}</div><div><span class="lbl">${tp.countryLabel}</span>${inv.country||"—"}</div></div>
<div class="kpi"><div class="kpi-card k1"><div class="kpi-lbl">${tp.openingCapital}</div>${cellHTML(report.openingInvestment)}</div><div class="kpi-card k2"><div class="kpi-lbl">${tp.totalRevenue}</div>${cellHTML(calc.totalRevenue,"blue")}</div><div class="kpi-card k3"><div class="kpi-lbl">${tp.totalExpenses}</div>${cellHTML(calc.totalExpenses,"red")}</div><div class="kpi-card k4"><div class="kpi-lbl">${tp.netProfit}</div>${cellHTML(calc.netProfit,"green")}</div><div class="kpi-card k5"><div class="kpi-lbl">${tp.newCapital}</div>${cellHTML(calc.newInvestment)}</div></div>
<div class="sec-title" style="color:#4285F4">${tp.activities}</div>
<table><thead><tr><th>${tp.date}</th><th>${tp.category}</th><th>${tp.description}</th><th class="num">${tp.invested}</th><th class="num">${tp.revenue}</th><th class="num">${tp.expenses}</th><th class="num">${tp.profit}</th></tr></thead><tbody>${actRows}<tr class="tot-row"><td colspan="3">${tp.total.toUpperCase()}</td><td class="num">${cellHTML(calc.totalInvested)}</td><td class="num">${cellHTML(calc.totalRevenue,"blue")}</td><td class="num">${cellHTML(calc.actExp,"red")}</td><td class="num">${cellHTML(report.activities.reduce((s,a)=>s+a.profit,0),"green")}</td></tr></tbody></table>
${report.additionalExpenses.length?`<div class="sec-title" style="color:#EA4335">${tp.addExpenses}</div><table><thead><tr><th colspan="5">${tp.label}</th><th class="num">${tp.amount}</th><th></th></tr></thead><tbody>${expRows}<tr class="tot-row"><td colspan="5">${tp.totalAddExp}</td><td class="num">${cellHTML(calc.addExp,"red")}</td><td></td></tr></tbody></table>`:""}
<div class="sum-box"><div class="sum-title">${tp.summary}</div>${[[tp.openingCapital,report.openingInvestment,"blue"],[tp.totalRevenue,calc.totalRevenue,"green"],[tp.totalExpenses,calc.totalExpenses,"red"],[tp.netProfit,calc.netProfit,"green"],[tp.newCapital,calc.newInvestment,"blue"]].map(([l,v,cls])=>`<div class="sum-row"><span class="sum-lbl">${l}</span><div class="sum-val ${cls}">${cellHTML(Math.abs(v))}</div></div>`).join("")}</div>
${sigBlock}
<footer><span>© 2026 Thunderfam Investment — Côte d'Ivoire</span><span>${tp.generatedOn} ${fmtDateTime()}</span></footer></body></html>`;
}

function buildCertificateHTML(investor,reports,settings,lang="fr"){
  const tp=T[lang].print;const locale=lang==="fr"?"fr-FR":"en-GB";
  const totalProfit=reports.reduce((s,r)=>s+calcReport(r).netProfit,0);
  const last=reports[reports.length-1];const lc=last?calcReport(last):null;
  const roi=investor.initialInvestment>0?((totalProfit/investor.initialInvestment)*100).toFixed(2):0;
  return`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Certificat — ${investor.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Lato',sans-serif;background:#0a0a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}.cert-header-band{background:#1a1a2e;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;border-radius:0;margin:-60px -60px 40px -60px;}.cert-brand-txt{font-size:22px;font-weight:900;letter-spacing:-0.5px;}.cert-brand-txt .b{color:#4285F4;}.cert-brand-txt .r{color:#EA4335;}.cert-brand-txt .y{color:#FBBC05;}.cert-brand-txt .g{color:#34A853;}.cert-brand-sub{color:rgba(255,255,255,0.5);font-size:8px;letter-spacing:.12em;text-transform:uppercase;margin-top:3px;}.cert-badge{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:6px 12px;color:rgba(255,255,255,0.7);font-size:9px;letter-spacing:.08em;text-align:right;}.cert{background:white;width:800px;max-width:100%;padding:60px;border:12px solid #1a1a2e;position:relative;}.cert::before{content:'';position:absolute;inset:16px;border:2px solid #c9a84c;pointer-events:none;}.gold{color:#c9a84c;}.header{text-align:center;margin-bottom:40px;border-bottom:2px solid #c9a84c;padding-bottom:30px;}.logo-row{display:flex;justify-content:center;gap:12px;align-items:center;margin-bottom:16px;}.brand{font-size:28px;font-weight:900;}.brand .b{color:#4285F4;}.brand .r{color:#EA4335;}.brand .y{color:#FBBC05;}.brand .g{color:#34A853;}.certif-title{font-family:'Playfair Display',serif;font-size:36px;color:#1a1a2e;letter-spacing:2px;margin-bottom:8px;}.certif-sub{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#888;}.presented{text-align:center;margin:30px 0;}.presented p{font-size:14px;color:#555;margin-bottom:8px;}.investor-name{font-family:'Playfair Display',serif;font-size:42px;color:#1a1a2e;border-bottom:2px solid #c9a84c;padding-bottom:8px;display:inline-block;}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0;}.kpi-box{text-align:center;padding:20px;background:#f8f8ff;border-radius:8px;border-top:4px solid #c9a84c;}.kpi-val{font-family:'Playfair Display',serif;font-size:20px;color:#1a1a2e;font-weight:700;margin-top:6px;}.kpi-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#888;}.footer-sigs{display:flex;justify-content:space-around;margin-top:40px;padding-top:30px;border-top:1px solid #ddd;}.sig-box{text-align:center;}.sig-line{border-top:1px solid #333;width:160px;margin:0 auto 8px;}.sig-name{font-size:11px;color:#333;font-weight:700;}.sig-title{font-size:9px;color:#888;letter-spacing:.08em;text-transform:uppercase;}.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;pointer-events:none;letter-spacing:8px;}@media print{body{background:white;}@page{margin:0.5cm;}}</style></head><body>
<div class="cert">
<div class="watermark">THUNDERFAM INVESTMENT</div>
<div class="cert-header-band"><div style="display:flex;align-items:center;gap:12px;"><svg width="44" height="44" viewBox="0 0 100 100" style="flex-shrink:0"><circle cx="50" cy="50" r="48" fill="#1c1e26"/><path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="#4285F4"/><path d="M98 50 A48 48 0 0 1 50 98 L50 50 Z" fill="#34A853"/><path d="M50 98 A48 48 0 0 1 2 50 L50 50 Z" fill="#FBBC05"/><path d="M2 50 A48 48 0 0 1 50 2 L50 50 Z" fill="#EA4335"/><path d="M55 16 L36 52 L50 52 L44 84 L64 46 L50 46 Z" fill="white"/></svg><div><div class="cert-brand-txt"><span class="b">Th</span><span class="r">un</span><span class="y">der</span><span class="g">fam</span> <span style="color:white;">Investment</span></div><div class="cert-brand-sub">IN — CÔTE D'IVOIRE</div></div></div><div class="cert-badge">TF-${investor.id}-${new Date().getFullYear()}<br/>${tp.certTitle}</div></div><div class="header"><div class="certif-title">${tp.certTitle}</div><div class="certif-sub">${tp.certSub}</div></div>
<div class="presented">
  <p>${tp.certAwardedTo}</p>
  <div class="investor-name gold">${investor.name}</div>
  <p style="margin-top:12px;font-size:13px;color:#666">${tp.certSince}</p>
</div>
<div class="kpis">
  <div class="kpi-box"><div class="kpi-lbl">${tp.initInvestment}</div><div class="kpi-val">${fmtNum(investor.initialInvestment)} F</div></div>
  <div class="kpi-box"><div class="kpi-lbl">${tp.currentCapital}</div><div class="kpi-val">${fmtNum(investor.currentInvestment)} F</div></div>
  <div class="kpi-box"><div class="kpi-lbl">${tp.cumulativeProfit}</div><div class="kpi-val gold">${fmtNum(totalProfit)} F</div></div>
  <div class="kpi-box"><div class="kpi-lbl">${tp.totalROI}</div><div class="kpi-val gold">${roi}%</div></div>
  <div class="kpi-box"><div class="kpi-lbl">${tp.reportCount}</div><div class="kpi-val">${reports.length}</div></div>
  <div class="kpi-box"><div class="kpi-lbl">${tp.issueDate}</div><div class="kpi-val" style="font-size:13px">${fmtDate()}</div></div>
</div>
<div class="footer-sigs">
  <div class="sig-box"><div class="sig-line"></div><div class="sig-name">Thunderfam Investment</div><div class="sig-title">${tp.direction}</div></div>
  <div class="sig-box"><div class="sig-line"></div><div class="sig-name">${investor.representative||investor.name}</div><div class="sig-title">${tp.investorTitle}</div></div>
  <div class="sig-box"><div class="sig-line"></div><div class="sig-name">Compliance Officer</div><div class="sig-title">Validation</div></div>
</div>
<p style="text-align:center;margin-top:20px;font-size:8px;color:#aaa">Réf: TF-${investor.id}-${new Date().getFullYear()} | Thunderfam Investment, Abidjan, Côte d'Ivoire | www.thunderfam.com</p>
</div></body></html>`;
}

function doPrint(report,calc,investors,settings,lang="fr"){const html=buildReportHTML(report,calc,investors,settings,lang);const w=window.open("","_blank","width=920,height=750");if(!w){alert(T[_lang].popupBlocked||"Allow popups to continue.");return;}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);}
function doDownloadPDF(report,calc,investors,settings,lang="fr"){const html=buildReportHTML(report,calc,investors,settings,lang);const blob=new Blob([html],{type:"text/html;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Rapport_${report.label.replace(/[^a-zA-Z0-9]/g,"_")}.html`;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),2000);}
function doCertificate(investor,reports,settings,lang="fr"){const html=buildCertificateHTML(investor,reports,settings,lang);const w=window.open("","_blank","width=900,height=700");if(!w){alert(T[_lang].popupBlocked||"Allow popups to continue.");return;}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);}

// ── CONTRACT BUILDER ──────────────────────────────────────────────────────────────
function buildContractHTML(investor,settings,lang="fr"){
  const t=T[lang].contract;
  const tc=T[lang];
  const today=fmtDate();
  const refNum=`TF-CONT-${investor.id}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const cats=investor.investmentCategories||[];
  const prefCur=investor.preferredCurrency;
  const curObj=ALL_CURRENCIES.find(c=>c.code===prefCur);
  const rate=(settings.rates||{})[prefCur]||DEFAULT_RATES[prefCur]||1;
  const fmtAmt=(n)=>{
    const fcfa=`<span style="font-weight:700">${fmtNum(n)} F CFA</span>`;
    if(curObj&&prefCur){const conv=cvt(n,rate,curObj.sym);return`${fcfa} <span style="color:#888;font-size:11px">(${conv})</span>`;}
    return fcfa;
  };
  const totalInv=cats.reduce((s,c)=>s+(c.amount||0),0);
  const logoBlock=investor.logo?`<img src="${investor.logo}" alt="Investor Logo" style="max-height:60px;max-width:140px;object-fit:contain;border:1px solid #eee;border-radius:4px;padding:4px;"/>`:`<div style="width:120px;height:50px;border:1px dashed #ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:9px;text-transform:uppercase;letter-spacing:.06em">${t.investorLogo}</div>`;
  const tfLogoSVG=`<svg width="52" height="52" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#1c1e26"/><path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="#4285F4"/><path d="M98 50 A48 48 0 0 1 50 98 L50 50 Z" fill="#34A853"/><path d="M50 98 A48 48 0 0 1 2 50 L50 50 Z" fill="#FBBC05"/><path d="M2 50 A48 48 0 0 1 50 2 L50 50 Z" fill="#EA4335"/><path d="M55 16 L36 52 L50 52 L44 84 L64 46 L50 46 Z" fill="white"/></svg>`;
  const catsRows=cats.map((c,i)=>`
    <tr>
      <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:12px;color:#1a1a2e;">${i+1}. ${c.category}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:right;font-size:12px;font-weight:700;color:#1a1a2e;">${fmtAmt(c.amount||0)}</td>
    </tr>`).join("");
  return`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"/>
  <title>Contrat — ${investor.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Lato',sans-serif;background:#f0f0f0;display:flex;justify-content:center;padding:30px 20px;}
    .page{background:white;width:800px;max-width:100%;padding:0;border:1px solid #ccc;box-shadow:0 8px 32px rgba(0,0,0,0.15);}
    .header-band{background:#1a1a2e;padding:24px 36px;display:flex;justify-content:space-between;align-items:center;}
    .brand-txt{font-size:22px;font-weight:900;letter-spacing:-0.5px;}
    .brand-txt .b{color:#4285F4;}.brand-txt .r{color:#EA4335;}.brand-txt .y{color:#FBBC05;}.brand-txt .g{color:#34A853;}
    .brand-sub{color:rgba(255,255,255,0.55);font-size:9px;letter-spacing:.12em;text-transform:uppercase;margin-top:3px;}
    .ref-badge{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:6px 12px;color:rgba(255,255,255,0.7);font-size:9px;letter-spacing:.1em;text-align:right;}
    .title-block{background:linear-gradient(135deg,#f8f6f0,#fff8e8);padding:28px 36px;text-align:center;border-bottom:3px solid #c9a84c;}
    .contract-title{font-family:'Playfair Display',serif;font-size:28px;color:#1a1a2e;letter-spacing:1.5px;margin-bottom:6px;}
    .contract-sub{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#999;}
    .parties-block{padding:24px 36px;background:#fafafa;border-bottom:1px solid #e5e5e5;}
    .parties-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center;}
    .party-box{background:white;border:1px solid #e5e5e5;border-radius:8px;padding:16px;border-top:3px solid #c9a84c;}
    .party-label{font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#999;font-weight:700;margin-bottom:6px;}
    .party-name{font-family:'Playfair Display',serif;font-size:16px;color:#1a1a2e;margin-bottom:4px;}
    .party-detail{font-size:10px;color:#777;line-height:1.6;}
    .connector{text-align:center;font-size:11px;color:#c9a84c;font-weight:700;letter-spacing:.1em;text-transform:uppercase;}
    .body{padding:28px 36px;}
    .article{margin-bottom:22px;}
    .article-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#c9a84c;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #f0e8d0;display:flex;align-items:center;gap:8px;}
    .article-num{background:#c9a84c;color:white;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
    .article-body{font-size:12px;color:#444;line-height:1.7;}
    .cat-table{width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin-top:10px;}
    .cat-table thead tr{background:#1a1a2e;}
    .cat-table th{padding:10px 12px;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;text-align:left;}
    .cat-table th:last-child{text-align:right;}
    .total-row{background:#f8f6f0;font-weight:700;}
    .total-row td{padding:10px 12px;font-size:13px;color:#1a1a2e;border-top:2px solid #c9a84c;}
    .total-row td:last-child{text-align:right;color:#c9a84c;}
    .sigs{padding:24px 36px;border-top:2px solid #e5e5e5;display:flex;justify-content:space-between;gap:30px;}
    .sig-col{flex:1;text-align:center;}
    .sig-line{border-top:1px solid #333;margin:50px auto 8px;width:90%;}
    .sig-name{font-weight:700;font-size:11px;color:#1a1a2e;}
    .sig-role{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}
    .logos-row{display:flex;justify-content:space-between;align-items:center;padding:12px 36px;border-top:1px solid #eee;background:#fafafa;}
    .footer-txt{padding:10px 36px;background:#1a1a2e;text-align:center;font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:.08em;}
    .gold{color:#c9a84c;}
    @media print{body{background:white;padding:0;}.page{box-shadow:none;border:none;}@page{margin:0.5cm;}}
  </style>
  </head><body>
  <div class="page">
    <!-- Header -->
    <div class="header-band">
      <div style="display:flex;align-items:center;gap:14px;">
        ${tfLogoSVG}
        <div>
          <div class="brand-txt"><span class="b">Th</span><span class="r">un</span><span class="y">der</span><span class="g">fam</span> <span style="color:white;">Investment</span></div>
          <div class="brand-sub">IN — Côte d'Ivoire</div>
        </div>
      </div>
      <div class="ref-badge">Ref: ${refNum}<br/>${t.confidential}</div>
    </div>

    <!-- Title -->
    <div class="title-block">
      <div class="contract-title">${t.title.toUpperCase()}</div>
      <div class="contract-sub">Investment Agreement • Accord d'Investissement</div>
    </div>

    <!-- Parties -->
    <div class="parties-block">
      <div class="parties-grid">
        <div class="party-box">
          <div class="party-label">${t.partyA}</div>
          <div class="party-name">Thunderfam Investment</div>
          <div class="party-detail">IN — Côte d'Ivoire<br/>Abidjan, Plateau<br/>contact@thunderfam.com</div>
        </div>
        <div class="connector">⟵ ${t.and} ⟶</div>
        <div class="party-box" style="border-top-color:#4285F4;">
          <div class="party-label">${t.partyB}</div>
          <div class="party-name">${investor.name}</div>
          <div class="party-detail">${investor.representative||""}<br/>${investor.address||""}<br/>${investor.email||""}</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">

      <!-- Art. 1 -->
      <div class="article">
        <div class="article-title"><span class="article-num">1</span>${t.article1}</div>
        <div class="article-body">${t.contractBody1}</div>
      </div>

      <!-- Art. 2 — Categories table -->
      <div class="article">
        <div class="article-title"><span class="article-num">2</span>${t.article2}</div>
        ${cats.length>0?`
        <table class="cat-table">
          <thead><tr><th>${t.categoryCol}</th><th style="text-align:right">${t.amountCol}</th></tr></thead>
          <tbody>${catsRows}</tbody>
          <tr class="total-row">
            <td>${t.totalLabel}</td>
            <td style="text-align:right">${fmtAmt(totalInv)}</td>
          </tr>
        </table>
        <div style="margin-top:10px;padding:10px 14px;background:#f8f6f0;border-radius:6px;border-left:3px solid #c9a84c;font-size:11px;color:#555;">
          ${curObj?`${t.refCurrency} <strong style="color:#c9a84c">${curObj.sym} ${curObj.name} (${curObj.code})</strong> — 1 ${curObj.sym} = ${fmtNum(rate)} F CFA`:t.fcfaRef}
        </div>
        `:`<p style="font-size:12px;color:#777;font-style:italic">${t.noCategories}</p>`}
      </div>

      <!-- Art. 3 -->
      <div class="article">
        <div class="article-title"><span class="article-num">3</span>${t.article3}</div>
        <div class="article-body">${t.contractBody2}</div>
      </div>

      <!-- Art. 4 -->
      <div class="article">
        <div class="article-title"><span class="article-num">4</span>${t.article4}</div>
        <div class="article-body">${t.contractBody3}</div>
      </div>

      <!-- Date -->
      <div style="text-align:center;margin:18px 0;font-size:12px;color:#666;">${t.signedAt} <strong>${today}</strong></div>
    </div>

    <!-- Logos row -->
    <div class="logos-row">
      <div style="display:flex;align-items:center;gap:10px;">
        ${tfLogoSVG}
        <div style="font-size:10px;color:#888;">Thunderfam Investment</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-direction:column;align-items:flex-end;">
        ${logoBlock}
        <div style="font-size:10px;color:#888;margin-top:4px;">${investor.name}</div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="sigs">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Thunderfam Investment</div>
        <div class="sig-role">${t.dirGen}</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">${investor.representative||investor.name}</div>
        <div class="sig-role">${t.partyB.split(' — ').pop()}</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Validation Juridique</div>
        <div class="sig-role">Compliance Officer</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-txt">
      ${refNum} — Thunderfam Investment, Abidjan, Côte d'Ivoire — ${t.generatedOn} ${fmtDateTime()} — ${t.confidential.toUpperCase()}
    </div>
  </div>
  </body></html>`;
}
function doContract(investor,settings,lang){
  const html=buildContractHTML(investor,settings,lang);
  const w=window.open("","_blank","width=900,height=750");
  if(!w){alert(T[_lang].popupBlocked||"Allow popups to continue.");return;}
  w.document.open();w.document.write(html);w.document.close();w.focus();
  setTimeout(()=>w.print(),800);
}
function downloadContract(investor,settings,lang){
  const html=buildContractHTML(investor,settings,lang);
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`Contrat_${investor.name.replace(/\s+/g,"_")}.html`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

// ── LOGIN SCREEN ────────────────────────────────────────────────────────────────
function LoginScreen({data,setData,onLogin,lang,setLang}){
  const C=_C;
  const [tab,setTab]=useState("login");
  const [un,setUn]=useState("");const [pw,setPw]=useState("");
  const [err,setErr]=useState("");const [showPw,setShowPw]=useState(false);
  const [winW,setWinW]=useState(()=>typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setWinW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const showPanel=winW>=860;
  const isMobile=winW<480;
  const [regDone,setRegDone]=useState(false);
  const [reg,setReg]=useState({name:"",username:"",email:"",password:"",phone:"",country:"Côte d'Ivoire",address:"",representative:"",initialInvestment:""});
  const [showRegPw,setShowRegPw]=useState(false);
  const [sending,setSending]=useState(false);
  const t=T[lang];

  // ── Password strength checks ─────────────────────────────────────
  const pwChecks={
    len: reg.password.length>=10,
    alpha: /[a-zA-Z]/.test(reg.password),
    num: /[0-9]/.test(reg.password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(reg.password),
  };
  const pwValid=pwChecks.len&&pwChecks.alpha&&pwChecks.num&&pwChecks.symbol;

  // ── Send email via formsubmit.co (no backend needed) ─────────────
  const sendEmail=async(formData)=>{
    const body=`
Nouvelle demande d'inscription — Thunderfam Investment

Nom complet       : ${formData.name}
Identifiant       : ${formData.username}
Email             : ${formData.email}
Téléphone         : ${formData.phone}
Pays              : ${formData.country}
Adresse           : ${formData.address}
Représentant      : ${formData.representative}
Investissement    : ${formData.initialInvestment} F CFA
Date demande      : ${fmtDateTime()}
    `.trim();
    const payload={name:formData.name,email:formData.email,_subject:`[Thunderfam] Nouvelle inscription — ${formData.name}`,message:body,_template:"box",_captcha:"false"};
    // Send to both addresses
    const sendTo=async(to)=>{
      try{
        await fetch(`https://formsubmit.co/ajax/${to}`,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
      }catch(e){console.warn("Email send failed:",e);}
    };
    await Promise.all([sendTo("kenny6c@gmail.com"),sendTo("info@thunderfam.com")]);
  };

  const doLogin=()=>{setErr("");const u=data.users.find(u=>u.username===un&&u.password===pw&&u.active&&u.approved);if(u)onLogin(u);else setErr(t.login.error);};
  const doRegister=async()=>{
    setErr("");
    if(!reg.name||!reg.username||!reg.email||!reg.password){setErr(lang==="fr"?"Champs * obligatoires.":"Required fields missing.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)){setErr(lang==="fr"?"Format email invalide (ex: nom@provider.com)":"Invalid email (eg: name@provider.com)");return;}
    if(reg.phone&&!/^\d+$/.test(reg.phone)){setErr(lang==="fr"?"Le téléphone doit contenir uniquement des chiffres.":"Phone must contain digits only.");return;}
    if(reg.initialInvestment&&!/^\d+$/.test(String(reg.initialInvestment))){setErr(lang==="fr"?"L'investissement doit être un nombre entier.":"Investment must be a whole number.");return;}
    if(!pwValid){setErr(lang==="fr"?"Mot de passe invalide. Vérifiez les critères ci-dessous.":"Invalid password. Check requirements below.");return;}
    if(data.users.find(u=>u.username===reg.username)||data.pendingUsers.find(u=>u.username===reg.username)){setErr(lang==="fr"?"Identifiant déjà utilisé.":"Username already taken.");return;}
    const ni={id:Date.now(),name:reg.name,initialInvestment:parseFloat(reg.initialInvestment)||0,currentInvestment:parseFloat(reg.initialInvestment)||0,cumulativeProfit:0,address:reg.address,phone:reg.phone,representative:reg.representative,email:reg.email,country:reg.country,goal:0,goalLabel:"",sharedTokens:[]};
    setData(d=>({...d,pendingUsers:[...d.pendingUsers,{id:Date.now()+1,username:reg.username,password:reg.password,name:reg.name,email:reg.email,role:"investor",active:false,approved:false,investorId:ni.id,investorData:ni}]}));
    setSending(true);
    await sendEmail(reg);
    setSending(false);
    setRegDone(true);setErr("");
  };
  const inp={width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"};
  const lbl={display:"block",color:C.muted,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4};
  return(
    <div style={{width:"100vw",height:"100vh",background:C.bg,display:"flex",flexDirection:"row",overflow:"hidden",position:"fixed",top:0,left:0}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input{color-scheme:${C===DARK?"dark":"light"};}
        input:focus{border-color:${C.blue}!important;box-shadow:0 0 0 3px ${C.blue}22!important;}
        button{transition:all .15s;}
        button:hover{filter:brightness(1.12);}
      `}</style>

      {/* ═══ LEFT PANEL — Form ═══ */}
      <div style={{
        width:showPanel?460:"100%",
        minWidth:showPanel?460:undefined,
        height:"100%",
        display:"flex",
        flexDirection:"column",
        justifyContent:"center",
        padding:isMobile?"20px 14px":"32px 28px",
        paddingTop:isMobile?"32px":"48px",
        paddingBottom:"32px",
        background:C.bg,
        flexShrink:0,
        overflowY:"auto",
        zIndex:1,
      }}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <TFLogo size={46}/>
          <div style={{marginTop:10,fontSize:22,fontWeight:900}}><span style={{color:C.blue}}>Th</span><span style={{color:C.red}}>un</span><span style={{color:C.yellow}}>der</span><span style={{color:C.green}}>fam</span><span style={{color:C.text}}> Investment</span></div>
          <div style={{color:C.muted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:3}}>IN — Côte d'Ivoire</div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:22,boxShadow:"0 24px 60px rgba(0,0,0,0.5)"}}>
          <div style={{display:"flex",gap:4,background:C.surface,borderRadius:9,padding:4,marginBottom:20}}>
            {[["login",t.login.title],["register",t.register.title]].map(([k,label])=>(
              <button key={k} onClick={()=>{setTab(k);setErr("");setRegDone(false);}} style={{flex:1,padding:"7px",borderRadius:7,border:"none",background:tab===k?C.blue:"transparent",color:tab===k?"#fff":C.muted,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12}}>{label}</button>
            ))}
          </div>

          {tab==="login"&&(<>
            <div style={{marginBottom:12}}><label style={lbl}>{t.login.username} *</label><input value={un} onChange={e=>setUn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} style={inp} autoFocus/></div>
            <div style={{marginBottom:16,position:"relative"}}><label style={lbl}>{t.login.password} *</label><input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} style={inp}/><button onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:10,bottom:8,background:"none",border:"none",cursor:"pointer"}}><Icon name="eye" size={15} color={C.muted}/></button></div>
            {err&&<div style={{background:"rgba(127,29,29,0.3)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:12}}>{err}</div>}
            <button onClick={doLogin} style={{width:"100%",padding:"11px",background:C.blue,color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14}}>🔓 {t.login.btn}</button>
            <div style={{marginTop:16,padding:10,background:C.surface,borderRadius:8,border:`1px solid ${C.border}44`}}>
              <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{t.demoAccounts}</div>
              {[["admin","admin123","admin",C.red],["manager","manager123","manager",C.blue],["investor1","invest123","investor",C.green]].map(([u,p,r,col])=>(
                <div key={u} onClick={()=>{setUn(u);setPw(p);}} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderRadius:6,cursor:"pointer",background:"rgba(255,255,255,0.03)",marginBottom:3,border:`1px solid ${C.border}44`}}>
                  <span style={{color:C.dim,fontSize:11}}><span style={{color:col,fontWeight:700}}>{u}</span> / {p}</span>
                  <RoleBadge role={r} lang={lang}/>
                </div>
              ))}
            </div>
          </>)}

          {tab==="register"&&(<>
            {regDone
              ?(<div style={{textAlign:"center",padding:16}}>
                  <div style={{fontSize:36,marginBottom:10}}>✅</div>
                  <div style={{color:C.green,fontWeight:700,marginBottom:6}}>{t.register.success}</div>
                  <div style={{color:C.muted,fontSize:11,marginBottom:6}}>{lang==="fr"?"Un email a été envoyé à l'équipe Thunderfam.":"A notification email has been sent to the Thunderfam team."}</div>
                  <div style={{color:C.muted,fontSize:11,marginBottom:16}}>{t.adminPending}</div>
                  <Btn onClick={()=>{setTab("login");setRegDone(false);}} variant="secondary">{t.register.backLogin}</Btn>
                </div>)
              :(<>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><label style={{...lbl,fontSize:9}}>{t.register.name} *</label><input value={reg.name} onChange={e=>setReg(r=>({...r,name:e.target.value}))} style={{...inp,padding:"8px 12px",fontSize:12}} placeholder="Jean Dupont"/></div>
                    <div><label style={{...lbl,fontSize:9}}>{t.register.username} *</label><input value={reg.username} onChange={e=>setReg(r=>({...r,username:e.target.value}))} style={{...inp,padding:"8px 12px",fontSize:12}} placeholder="jdupont"/></div>
                    <div>
                      <label style={{...lbl,fontSize:9}}>{t.register.email} *</label>
                      <input type="email" value={reg.email} onChange={e=>setReg(r=>({...r,email:e.target.value}))} style={{...inp,padding:"8px 12px",fontSize:12,borderColor:reg.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)?"#EA4335":"rgba(255,255,255,0.12)"}} placeholder="nom@provider.com"/>
                      {reg.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)&&<div style={{color:"#EA4335",fontSize:9,marginTop:3}}>⚠ {lang==="fr"?"Format invalide":"Invalid format"}</div>}
                    </div>
                    <div>
                      <label style={{...lbl,fontSize:9}}>{t.register.phone}</label>
                      <input value={reg.phone} onChange={e=>{const v=e.target.value.replace(/\D/g,"");setReg(r=>({...r,phone:v}));}} style={{...inp,padding:"8px 12px",fontSize:12}} placeholder="0700000000" inputMode="numeric"/>
                    </div>
                    <div><label style={{...lbl,fontSize:9}}>{t.register.country}</label><input value={reg.country} onChange={e=>setReg(r=>({...r,country:e.target.value}))} style={{...inp,padding:"8px 12px",fontSize:12}}/></div>
                    <div><label style={{...lbl,fontSize:9}}>{t.register.representative}</label><input value={reg.representative} onChange={e=>setReg(r=>({...r,representative:e.target.value}))} style={{...inp,padding:"8px 12px",fontSize:12}}/></div>
                    <div>
                      <label style={{...lbl,fontSize:9}}>{t.register.initialInv}</label>
                      <input value={reg.initialInvestment} onChange={e=>{const v=e.target.value.replace(/\D/g,"");setReg(r=>({...r,initialInvestment:v}));}} style={{...inp,padding:"8px 12px",fontSize:12}} placeholder="0" inputMode="numeric"/>
                    </div>
                  </div>
                  <div style={{marginTop:8}}><label style={{...lbl,fontSize:9}}>{t.register.address}</label><input value={reg.address} onChange={e=>setReg(r=>({...r,address:e.target.value}))} style={{...inp,padding:"8px 12px",fontSize:12}}/></div>
                  <div style={{marginTop:8,marginBottom:4}}>
                    <label style={{...lbl,fontSize:9}}>{t.register.password} *</label>
                    <div style={{position:"relative"}}>
                      <input type={showRegPw?"text":"password"} value={reg.password} onChange={e=>setReg(r=>({...r,password:e.target.value}))} style={{...inp,padding:"8px 36px 8px 12px",fontSize:12,borderColor:reg.password?(pwValid?"#34A853":"rgba(255,255,255,0.12)"):"rgba(255,255,255,0.12)"}}/>
                      <button type="button" onClick={()=>setShowRegPw(v=>!v)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2}}><Icon name="eye" size={14} color={C.muted}/></button>
                    </div>
                    {reg.password.length>0&&<div style={{marginTop:6,padding:"8px 10px",background:C.surface,borderRadius:7,border:`1px solid ${C.border}44`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 12px"}}>
                      {[[pwChecks.len,lang==="fr"?"≥ 10 caractères":"≥ 10 chars"],[pwChecks.alpha,lang==="fr"?"Lettre a-z":"Letter a-z"],[pwChecks.num,lang==="fr"?"Chiffre 0-9":"Digit 0-9"],[pwChecks.symbol,lang==="fr"?"Symbole !@#":"Symbol !@#"]].map(([ok,label],i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:10}}>
                          <span style={{color:ok?"#34A853":"#EA4335",fontSize:12}}>{ok?"✓":"✗"}</span>
                          <span style={{color:ok?"#34A853":C.muted}}>{label}</span>
                        </div>
                      ))}
                    </div>}
                  </div>
                  {err&&<div style={{color:"#fca5a5",fontSize:11,marginBottom:8,padding:"6px 10px",background:"rgba(127,29,29,0.3)",borderRadius:6,border:"1px solid rgba(239,68,68,0.3)"}}>{err}</div>}
                  <button onClick={doRegister} disabled={sending} style={{width:"100%",padding:"11px",background:sending?C.surface:C.green,color:sending?C.muted:"#fff",border:"none",borderRadius:9,cursor:sending?"wait":"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,marginTop:4,opacity:sending?0.7:1}}>
                    {sending?(lang==="fr"?"Envoi en cours…":"Sending…"):t.register.btn}
                  </button>
                </>)
            }
          </>)}
        </div>

        <div style={{textAlign:"center",marginTop:12,display:"flex",justifyContent:"center",gap:6}}>
          {["fr","en"].map(l=>(<button key={l} onClick={()=>setLang(l)} style={{background:lang===l?C.blue+"22":"transparent",border:`1px solid ${lang===l?C.blue:C.border}`,color:lang===l?C.blue:C.muted,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:lang===l?700:400}}>{l==="fr"?"🇫🇷 FR":"🇬🇧 EN"}</button>))}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Secteurs d'activité ═══ */}
      {showPanel&&(
        <div style={{
          flex:1,
          height:"100%",
          minHeight:0,
          display:"flex",
          flexDirection:"column",
          justifyContent:"flex-start",
          padding:"40px 28px 32px 28px",
          background:"linear-gradient(160deg,#0a1628 0%,#0d1f3c 40%,#091628 70%,#060e1c 100%)",
          overflowY:"auto",
          position:"relative",
        }}>

          {/* Subtle background pattern */}
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 70% 20%,rgba(66,133,244,0.08) 0%,transparent 60%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 30% 80%,rgba(52,168,83,0.06) 0%,transparent 60%)",pointerEvents:"none"}}/>

          {/* Title */}
          <div style={{marginBottom:28,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:4,height:36,background:"linear-gradient(180deg,#4285F4,#34A853,#FBBC05,#EA4335)",borderRadius:2,flexShrink:0}}/>
              <div>
                <div style={{color:"rgba(255,255,255,0.5)",fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:4}}>Thunderfam Investment</div>
                <div style={{color:"#fff",fontSize:16,fontWeight:800,lineHeight:1.3,letterSpacing:"-0.2px",textShadow:"0 2px 20px rgba(0,0,0,0.5)"}}>
                  Vous pouvez Investir dans<br/>ces secteurs d'activité
                </div>
              </div>
            </div>
            <div style={{height:1,background:"linear-gradient(to right,rgba(66,133,244,0.4),rgba(52,168,83,0.2),transparent)",marginLeft:14}}/>
          </div>

          {/* Activity cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,position:"relative"}}>
            {[
              {icon:"🌾",color:"#34A853",title:"Agro-pisciculture",sub:"Ferme · Élevage · Restauration",emojis:["🌽","🐟","🍅","🌿"],detail:"Agriculture & alimentation"},
              {icon:"🚛",color:"#FBBC05",title:"Transport Routier",sub:"Import-Export · Logistique",emojis:["🚛","📦","🛣️","🗺️"],detail:"Marchandises & livraisons"},
              {icon:"🏗️",color:"#EA4335",title:"BTP & Immobilier",sub:"Construction · Foncier",emojis:["🏗️","🧱","🏢","📐"],detail:"Bâtiment & travaux publics"},
              {icon:"💻",color:"#4285F4",title:"Expertise IT",sub:"Logiciels · Tech · Services",emojis:["💻","📱","🔧","🌐"],detail:"Informatique & innovation"},
            ].map((a,i)=>(
              <div key={i} style={{
                background:"rgba(12,20,38,0.75)",
                backdropFilter:"blur(16px)",
                WebkitBackdropFilter:"blur(16px)",
                borderRadius:14,
                padding:"18px 16px",
                border:`1px solid ${a.color}35`,
                boxShadow:`0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 ${a.color}18`,
                display:"flex",
                flexDirection:"column",
                gap:10,
              }}>
                {/* Icon + Title */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${a.color}22,${a.color}10)`,border:`1px solid ${a.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {a.icon}
                  </div>
                  <div>
                    <div style={{color:a.color,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.04em",lineHeight:1.2}}>{a.title}</div>
                    <div style={{color:"rgba(255,255,255,0.4)",fontSize:9,marginTop:2}}>{a.detail}</div>
                  </div>
                </div>
                {/* Emojis */}
                <div style={{display:"flex",gap:6,paddingLeft:2}}>
                  {a.emojis.map((e,j)=><span key={j} style={{fontSize:17}}>{e}</span>)}
                </div>
                {/* Sub label */}
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",lineHeight:1.4,paddingLeft:2}}>{a.sub}</div>
                {/* Color bar */}
                <div style={{height:2,borderRadius:1,background:`linear-gradient(to right,${a.color},${a.color}40,transparent)`}}/>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{marginTop:"auto",paddingTop:24,textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.18)",fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase"}}>
              Investir en Côte d'Ivoire · Abidjan · 2024
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── ANALYTICS PAGE ──────────────────────────────────────────────────────────────
function Analytics({data,session,t,lang}){
  const C=_C;const s=data.settings;
  const reports=session.role==="investor"?data.reports.filter(r=>r.investorId===session.investorId):data.reports;
  const calcs=reports.map(r=>({...r,...calcReport(r)}));
  const [extraInv,setExtraInv]=useState(0);
  const [cmpA,setCmpA]=useState(reports[reports.length-2]?.id||reports[0]?.id);
  const [cmpB,setCmpB]=useState(reports[reports.length-1]?.id);

  // Profit curve data
  const lineData=calcs.map(r=>({label:r.label.substring(0,8),value:r.newInvestment}));
  const profitLine=calcs.map(r=>({label:r.label.substring(0,8),value:r.netProfit}));
  // Revenue vs Expenses bar data
  const barData=calcs.map(r=>({label:r.label.substring(0,7),rev:r.totalRevenue,exp:r.totalExpenses}));
  // Expenses pie
  const expCats={};
  reports.forEach(r=>{r.activities.forEach(a=>{if(a.expenses>0){expCats[a.category]=(expCats[a.category]||0)+a.expenses;}});r.additionalExpenses.forEach(e=>{expCats[e.label.substring(0,15)]=(expCats[e.label.substring(0,15)]||0)+e.amount;});});
  const pieColors=["#4285F4","#EA4335","#FBBC05","#34A853","#9C27B0","#FF5722","#00BCD4"];
  const pieData=Object.entries(expCats).map(([label,value],i)=>({label,value,color:pieColors[i%pieColors.length]}));

  // Projection
  const avgRate=calcs.length?calcs.reduce((s,r)=>s+(r.netProfit/r.openingInvestment),0)/calcs.length:0.05;
  const baseInv=calcs.length?calcs[calcs.length-1].newInvestment:0;
  const projInv=baseInv+parseFloat(extraInv||0);
  const projProfit6=(projInv*avgRate*6).toFixed(0);

  // Period comparison
  const rA=data.reports.find(r=>r.id===cmpA);const rB=data.reports.find(r=>r.id===cmpB);
  const cA=rA?calcReport(rA):null;const cB=rB?calcReport(rB):null;
  const diffPct=cA&&cB&&cA.netProfit>0?((cB.netProfit-cA.netProfit)/cA.netProfit*100).toFixed(1):null;

  // Email summary HTML
  const emailHTML=`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Arial,sans-serif;color:#1a1a2e;background:#f4f6fb;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<div style="background:linear-gradient(135deg,#1a1a2e,#2d2d5a);padding:28px;text-align:center;">
  <h1 style="color:white;font-size:22px;margin:0"><span style="color:#4285F4">Th</span><span style="color:#EA4335">un</span><span style="color:#FBBC05">der</span><span style="color:#34A853">fam</span> Investment</h1>
  <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:12px">${t.analytics.emailSummary} — ${fmtDate()}</p>
</div>
<div style="padding:28px;">${calcs.slice(-3).map(r=>`
<div style="background:#f8f9ff;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid #4285F4;">
  <div style="font-weight:700;font-size:14px;color:#1a1a2e;margin-bottom:10px;">${r.label}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:11px;text-align:center;">
    <div><div style="color:#888;font-size:9px;text-transform:uppercase;margin-bottom:2px">${t.activity.revenue}</div><div style="color:#34A853;font-weight:700">${fmtNum(r.totalRevenue)} F</div></div>
    <div><div style="color:#888;font-size:9px;text-transform:uppercase;margin-bottom:2px">${t.activity.expenses}</div><div style="color:#EA4335;font-weight:700">${fmtNum(r.totalExpenses)} F</div></div>
    <div><div style="color:#888;font-size:9px;text-transform:uppercase;margin-bottom:2px">${t.report.netProfit}</div><div style="color:#FBBC05;font-weight:700">${fmtNum(r.netProfit)} F</div></div>
  </div>
</div>`).join("")}
</div>
<div style="background:#f0f4ff;padding:16px;text-align:center;font-size:10px;color:#888;">© 2026 Thunderfam Investment — Côte d'Ivoire</div>
</div></body></html>`;
  const [emailCopied,setEmailCopied]=useState(false);
  const copyEmail=()=>{navigator.clipboard?.writeText(emailHTML).then(()=>{setEmailCopied(true);setTimeout(()=>setEmailCopied(false),2000);});};

  const Section=({title,icon,color,children})=>(
    <Card style={{padding:18,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{width:28,height:28,borderRadius:8,background:(color||C.blue)+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={icon} size={14} color={color||C.blue}/></div>
        <span style={{color:C.text,fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span>
      </div>{children}
    </Card>
  );

  return(<div>
    <div style={{marginBottom:18}}><h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{t.analytics.title}</h2><div style={{color:C.muted,fontSize:12,marginTop:2}}>{t.analytics.overviewSub}</div></div>

    {/* Charts grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <Section title={t.analytics.profitCurve} icon="trend" color={C.green}>
        <LineChart data={profitLine} C={C}/>
      </Section>
      <Section title={t.analytics.capitalEvolution} icon="wallet" color={C.blue}>
        <LineChart data={lineData} C={C}/>
      </Section>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:12,marginBottom:12}}>
      <Section title={t.analytics.revenueVsExp} icon="analytics" color={C.blue}>
        <BarChart data={barData} C={C}/>
      </Section>
      <Section title={t.analytics.expByCategory} icon="money" color={C.red}>
        {pieData.length?<PieChart data={pieData} size={130} C={C}/>:<div style={{color:C.muted,fontSize:12,padding:20,textAlign:"center"}}>{t.analytics.noExpenses}</div>}
      </Section>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      {/* Projection simulator */}
      <Section title={t.analytics.projection} icon="zap" color={C.yellow}>
        <div style={{color:C.muted,fontSize:11,marginBottom:12}}>{t.analytics.avgRateLabel} <span style={{color:C.yellow,fontWeight:700}}>{(avgRate*100).toFixed(2)}% {t.analytics.perMonth}</span></div>
        <Field label={t.analytics.investExtra+" (F CFA)"} value={extraInv} onChange={setExtraInv} type="number"/>
        <div style={{background:C.surface,borderRadius:8,padding:14,border:`1px solid ${C.border2}`,marginTop:4}}>
          <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>{t.analytics.projResults}</div>
          <div style={{marginBottom:6}}>
            <div style={{color:C.dim,fontSize:11}}>{t.analytics.baseInv}</div>
            <div style={{color:C.text,fontWeight:700,fontSize:14}}>{fmtNum(projInv)} F CFA</div>
          </div>
          <div style={{background:`linear-gradient(135deg,${C.yellow}22,${C.green}22)`,borderRadius:8,padding:12,border:`1px solid ${C.yellow}44`,marginTop:8}}>
            <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{t.analytics.estimatedProfit}</div>
            <div style={{color:C.yellow,fontSize:20,fontWeight:800}}>+{fmtNum(projProfit6)} F CFA</div>
            {getCurrencyLines(parseFloat(projProfit6),s).map(l=><div key={l.code} style={{color:l.color,fontSize:13,fontWeight:700}}>{l.value}</div>)}
          </div>
          {extraInv>0&&<div style={{color:C.green,fontSize:11,marginTop:8,fontWeight:600}}>🚀 +{fmtNum(extraInv)} F → +{fmtNum((parseFloat(extraInv)*avgRate*6))} F</div>}
        </div>
      </Section>

      {/* Period comparison */}
      <Section title={t.analytics.compare} icon="analytics" color={C.purple}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <DDrop label={t.analytics.period1} value={cmpA} onChange={setCmpA} options={reports.map(r=>({value:r.id,label:r.label.substring(0,18)}))}/>
          <DDrop label={t.analytics.period2} value={cmpB} onChange={setCmpB} options={reports.map(r=>({value:r.id,label:r.label.substring(0,18)}))}/>
        </div>
        {cA&&cB&&(<>
          {diffPct!==null&&(
            <div style={{background:parseFloat(diffPct)>=0?`${C.green}22`:`${C.red}22`,border:`1px solid ${parseFloat(diffPct)>=0?C.green:C.red}44`,borderRadius:8,padding:12,marginBottom:12,textAlign:"center"}}>
              <div style={{color:parseFloat(diffPct)>=0?C.green:C.red,fontSize:24,fontWeight:800}}>{parseFloat(diffPct)>=0?"↑":"↓"} {Math.abs(parseFloat(diffPct))}%</div>
              <div style={{color:C.muted,fontSize:11}}>{t.analytics.netProfitEvol}</div>
            </div>
          )}
          {[[t.report.netProfit,cA.netProfit,cB.netProfit,C.yellow],[t.report.totalRevenue,cA.totalRevenue,cB.totalRevenue,C.blue],[t.report.totalExpenses,cA.totalExpenses,cB.totalExpenses,C.red],[t.analytics.capitalEvolution,cA.newInvestment,cB.newInvestment,C.green]].map(([label,vA,vB,col])=>(
            <div key={label} style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}44`,fontSize:11}}>
              <div style={{textAlign:"right",color:col,fontWeight:700}}>{fmtNum(vA)}</div>
              <div style={{textAlign:"center",color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</div>
              <div style={{textAlign:"left",color:col,fontWeight:700}}>{fmtNum(vB)}</div>
            </div>
          ))}
        </>)}
      </Section>
    </div>

    {/* Email summary */}
    <Section title={t.analytics.emailSummary} icon="mail" color={C.teal}>
      <div style={{color:C.muted,fontSize:11,marginBottom:12}}>{t.analytics.emailDesc}</div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <Btn onClick={copyEmail} variant="teal" icon={emailCopied?"check":"copy"}>{emailCopied?t.analytics.copied:t.analytics.copyHTML}</Btn>
        <Btn onClick={()=>{const w=window.open("","_blank","width=700,height=600");if(w){w.document.open();w.document.write(emailHTML);w.document.close();}}} variant="ghost" icon="eye">{t.analytics.preview}</Btn>
      </div>
      <div style={{background:C.surface,borderRadius:8,padding:12,border:`1px solid ${C.border2}`,fontSize:11,color:C.dim,fontFamily:"monospace",maxHeight:80,overflow:"hidden"}}>{emailHTML.substring(0,200)}...</div>
    </Section>
  </div>);
}

// ── DASHBOARD ───────────────────────────────────────────────────────────────────
function Dashboard({data,session,t}){
  const C=_C;const s=data.settings;
  const isInvestor=session.role==="investor";
  const myInvestor=isInvestor?data.investors.find(i=>i.id===session.investorId):data.investors[0];
  const inv=myInvestor||data.investors[0];
  const myReports=isInvestor?data.reports.filter(r=>r.investorId===session.investorId):data.reports;
  const last=myReports[myReports.length-1];
  const calc=last?calcReport(last):null;
  const tabColors=[C.blue,C.red,C.yellow,C.green];
  const allCalcs=myReports.map(r=>calcReport(r));
  const sparkProfit=allCalcs.map(c=>c.netProfit);
  const sparkCapital=allCalcs.map(c=>c.newInvestment);
  const roi=inv?.initialInvestment>0?((inv.cumulativeProfit/inv.initialInvestment)*100).toFixed(1):0;
  const avgGrowth=allCalcs.length?((allCalcs.reduce((s,c)=>s+c.netProfit,0)/allCalcs.reduce((s,c)=>s+c.openingInvestment||s+c.newInvestment,0))*100).toFixed(1):0;
  const bestMonth=allCalcs.reduce((m,c)=>c.netProfit>m?c.netProfit:m,0);
  const kpiLines=n=>getCurrencyLines(n,s).map(l=>l.value);
  const prevCalc=allCalcs.length>=2?allCalcs[allCalcs.length-2]:null;
  const trend=prevCalc&&prevCalc.netProfit>0?((calc?.netProfit-prevCalc.netProfit)/prevCalc.netProfit*100):undefined;
  // Goal progress
  const goalPct=inv?.goal>0?Math.min(100,(inv.cumulativeProfit/inv.goal)*100):0;
  const unread=data.notifications.filter(n=>!n.read).length;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
      <div>
        <h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{t.nav.dashboard}</h2>
        <div style={{color:C.muted,fontSize:12,marginTop:2}}>{t.dashboard.overviewSub}</div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {unread>0&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.35)",borderRadius:7,cursor:"pointer"}}>
          <Icon name="bell" size={13} color={C.yellow}/><span style={{color:C.yellow,fontSize:11,fontWeight:700}}>{unread}</span>
        </div>}
        <RoleBadge role={session.role} lang={s.language||"fr"}/>
      </div>
    </div>

    {/* KPI Row */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      <StatCard label={t.dashboard.currentCapital} value={fmtNum(inv?.currentInvestment||0)+" F"} lines={kpiLines(inv?.currentInvestment||0)} accent={C.blue} icon="wallet" sparkValues={sparkCapital}/>
      <StatCard label={t.dashboard.cumulativeProfit} value={fmtNum(inv?.cumulativeProfit||0)+" F"} lines={kpiLines(inv?.cumulativeProfit||0)} accent={C.green} icon="trend" sparkValues={sparkProfit}/>
      {calc&&<StatCard label={t.dashboard.monthProfit} value={fmtNum(calc.netProfit)+" F"} lines={kpiLines(calc.netProfit)} accent={C.yellow} icon="money" trend={trend}/>}
      <StatCard label={t.dashboard.roiTotal} value={roi+"%"} lines={[t.dashboard.returnRate]} accent={C.purple} icon="target"/>
      {!isInvestor&&<StatCard label={t.nav.investors} value={data.investors.length} lines={[t.dashboard.actives]} accent={C.red} icon="investors"/>}
    </div>

    {/* Second KPI row */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      <StatCard label={t.dashboard.avgGrowth} value={avgGrowth+"%"} lines={[t.dashboard.perReport]} accent={C.teal} icon="analytics"/>
      <StatCard label={t.dashboard.bestMonth} value={fmtNum(bestMonth)+" F"} lines={kpiLines(bestMonth)} accent={C.yellow} icon="zap"/>
      {inv?.goal>0&&(
        <Card accent={C.green} style={{padding:"14px 16px",flex:2,minWidth:200}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{inv.goalLabel||t.dashboard.goal}</span>
            <Icon name="target" size={14} color={C.green}/>
          </div>
          <div style={{color:C.green,fontSize:14,fontWeight:800,marginBottom:8}}>{fmtNum(inv.cumulativeProfit)} / {fmtNum(inv.goal)} F</div>
          <ProgressBar value={inv.cumulativeProfit} max={inv.goal} color={C.green}/>
        </Card>
      )}
    </div>

    {/* Charts row */}
    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:12,marginBottom:12}}>
      <Card style={{padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="trend" size={13} color={C.blue}/><span style={{color:C.text,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.dashboard.capitalEvolution}</span></div>
        <LineChart data={myReports.map(r=>{const c=calcReport(r);return{label:r.label.substring(0,8),value:c.newInvestment};})} C={C}/>
      </Card>
      <Card style={{padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="reports" size={13} color={C.green}/><span style={{color:C.text,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.dashboard.profitsByReport}</span></div>
        {myReports.map((r,i)=>{const c=calcReport(r);const col=tabColors[i%4];const maxP=Math.max(...myReports.map(r=>calcReport(r).netProfit));return(<div key={r.id} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{color:C.dim,fontSize:10,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:"60%"}}>{r.label.substring(0,16)}</span>
            <span style={{color:col,fontSize:10,fontWeight:700}}>+{fmtNum(c.netProfit)} F</span>
          </div>
          <ProgressBar value={c.netProfit} max={maxP} color={col} showPct={false}/>
        </div>);})}
      </Card>
    </div>

    {/* Recent activity */}
    <Card style={{padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="activity" size={13} color={C.yellow}/><span style={{color:C.text,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.dashboard.recentActivity}</span></div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr>{[t.activity.date,t.activity.description,t.activity.invested,t.activity.revenue,t.activity.profit].map((h,i)=><th key={i} style={{color:C.muted,fontWeight:700,padding:"6px 10px",textAlign:i>1?"right":"left",fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.border}44`}}>{h}</th>)}</tr></thead>
          <tbody>{myReports.flatMap(r=>r.activities).slice(-6).reverse().map(a=>(
            <tr key={a.id} style={{borderBottom:`1px solid ${C.border}44`}}>
              <td style={{padding:"7px 10px",color:C.muted,verticalAlign:"top"}}>{a.date}</td>
              <td style={{padding:"7px 10px",color:C.text,verticalAlign:"top"}}>{a.description}{a.attachments?.length>0&&<span style={{marginLeft:6,color:C.teal,fontSize:9}}>📎{a.attachments.length}</span>}</td>
              <td style={{padding:"7px 10px",verticalAlign:"top"}}><Amt n={a.invested} settings={s} color={C.muted} size={11}/></td>
              <td style={{padding:"7px 10px",verticalAlign:"top"}}><Amt n={a.revenue}  settings={s} color={C.blue}  size={11}/></td>
              <td style={{padding:"7px 10px",verticalAlign:"top"}}><Amt n={a.profit}   settings={s} color={C.green} size={11}/></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>

    {/* Notifications panel */}
    {data.notifications.filter(n=>!n.read).length>0&&(
      <Card accent={C.yellow} style={{padding:14,marginTop:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Icon name="bell" size={13} color={C.yellow}/><span style={{color:C.yellow,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.notifications}</span></div>
        {data.notifications.filter(n=>!n.read).slice(0,3).map(n=>(
          <div key={n.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:7,background:C.surface,marginBottom:6,border:`1px solid ${C.border}44`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:n.type==="success"?C.green:n.type==="warning"?C.yellow:C.blue,flexShrink:0}}/>
            <span style={{color:C.dim,fontSize:12,flex:1}}>{n.msg}</span>
            <span style={{color:C.muted,fontSize:10}}>{n.date}</span>
          </div>
        ))}
      </Card>
    )}
  </div>);
}

// ── REPORTS PAGE ─────────────────────────────────────────────────────────────────
function Reports({data,setData,session,t,lang}){
  const C=_C;const s=data.settings;
  const isInvestor=session.role==="investor";
  const visibleReports=isInvestor?data.reports.filter(r=>r.investorId===session.investorId):data.reports;
  const [selId,setSelId]=useState(visibleReports[visibleReports.length-1]?.id);
  const [lockModal,setLockModal]=useState(false);const [lockPwd,setLockPwd]=useState("");const [lockErr,setLockErr]=useState("");const [lockTarget,setLockTarget]=useState(null);
  const [addingRep,setAddingRep]=useState(false);const [newRepLabel,setNewRepLabel]=useState("");
  const [editActId,setEditActId]=useState(null);const [actDraft,setActDraft]=useState(null);
  const [editExpId,setEditExpId]=useState(null);const [expDraft,setExpDraft]=useState(null);
  const [shareModal,setShareModal]=useState(false);const [shareToken,setShareToken]=useState(null);
  const [showTimeline,setShowTimeline]=useState(false);
  const report=data.reports.find(r=>r.id===selId);
  const calc=report?calcReport(report):null;
  const locked=report?.status==="closed";
  const canEdit=can(session,"add_activity")&&!locked;

  const askLock=action=>{setLockTarget(action);setLockPwd("");setLockErr("");setLockModal(true);};
  const doLock=()=>{
    if(lockPwd===s.adminPwd){
      setLockModal(false);
      const newStatus=lockTarget==="close"?"closed":"open";
      setData(d=>({...d,reports:d.reports.map(r=>r.id===selId?{...r,status:newStatus}:r)}));
      addAudit(setData,session,lockTarget==="close"?"Rapport fermé":"Rapport réouvert",report.label,"lock");
    }else setLockErr(t.lock.wrong);
  };
  const startEditAct=a=>{setActDraft({...a});setEditActId(a.id);};
  const startAddAct=()=>{setActDraft({id:"new",date:"",category:(data.settings.categories||t.categories)[0],description:"",invested:0,revenue:0,expenses:0,profit:0,attachments:[]});setEditActId("new");};
  const saveAct=()=>{
    const profit=(actDraft.revenue||0)-(actDraft.invested||0)-(actDraft.expenses||0);
    setData(d=>({...d,reports:d.reports.map(r=>{if(r.id!==selId)return r;const acts=editActId==="new"?[...r.activities,{...actDraft,profit,id:Date.now()}]:r.activities.map(a=>a.id===editActId?{...actDraft,profit}:a);return{...r,activities:acts};})}));
    addAudit(setData,session,editActId==="new"?"Activité ajoutée":"Activité modifiée",actDraft.description,"create");
    setEditActId(null);setActDraft(null);
  };
  const delAct=id=>{if(!can(session,"delete_activity"))return;setData(d=>({...d,reports:d.reports.map(r=>r.id===selId?{...r,activities:r.activities.filter(a=>a.id!==id)}:r)}));addAudit(setData,session,"Activité supprimée","id:"+id,"delete");};
  const startAddExp=()=>{setExpDraft({id:"new",label:"",amount:0});setEditExpId("new");};
  const startEditExp=e=>{setExpDraft({...e});setEditExpId(e.id);};
  const saveExp=()=>{setData(d=>({...d,reports:d.reports.map(r=>{if(r.id!==selId)return r;const exps=editExpId==="new"?[...r.additionalExpenses,{...expDraft,id:Date.now()}]:r.additionalExpenses.map(e=>e.id===editExpId?expDraft:e);return{...r,additionalExpenses:exps};})}));setEditExpId(null);setExpDraft(null);};
  const delExp=id=>{setData(d=>({...d,reports:d.reports.map(r=>r.id===selId?{...r,additionalExpenses:r.additionalExpenses.filter(e=>e.id!==id)}:r)}));};
  const createRep=()=>{if(!newRepLabel)return;const last=data.reports[data.reports.length-1];const opening=last?calcReport(last).newInvestment:0;const id=`rep-${Date.now()}`;setData(d=>({...d,reports:[...d.reports,{id,label:newRepLabel,investorId:session.investorId||1,openingInvestment:opening,activities:[],additionalExpenses:[],status:"open",signatures:[],shareToken:null}]}));addAudit(setData,session,"Rapport créé",newRepLabel,"create");addNotification(setData,`Nouveau rapport : ${newRepLabel}`,"info");setSelId(id);setAddingRep(false);setNewRepLabel("");};

  // Signature
  const alreadySigned=report?.signatures?.some(sg=>sg.user===session.username);
  const doSign=()=>{
    setData(d=>({...d,reports:d.reports.map(r=>r.id!==selId?r:{...r,signatures:[...(r.signatures||[]),{user:session.username,name:session.name,date:fmtDateTime(),approved:true}]})}));
    addAudit(setData,session,"Rapport approuvé (signature)",report.label,"create");
    addNotification(setData,`${session.name} a approuvé le rapport ${report.label}`,"success");
  };
  const doUnsign=()=>{setData(d=>({...d,reports:d.reports.map(r=>r.id!==selId?r:{...r,signatures:(r.signatures||[]).filter(sg=>sg.user!==session.username)})}));};

  // Share link
  const doShare=()=>{const token=Math.random().toString(36).substring(2,10).toUpperCase();setData(d=>({...d,reports:d.reports.map(r=>r.id===selId?{...r,shareToken:token}:r)}));setShareToken(token);setShareModal(true);};

  // Attach file to activity
  const attachToActivity=async(actId)=>{const inp=document.createElement("input");inp.type="file";inp.accept="image/*,.pdf";inp.onchange=async e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=ev=>{setData(d=>({...d,reports:d.reports.map(r=>r.id!==selId?r:{...r,activities:r.activities.map(a=>a.id!==actId?a:{...a,attachments:[...(a.attachments||[]),{name:f.name,data:ev.target.result,type:f.type,size:f.size}]})})}));addAudit(setData,session,"Document joint",f.name,"create");};reader.readAsDataURL(f);};inp.click();};

  const tabColors=[C.blue,C.red,C.yellow,C.green];
  const TH=({children,right=false})=><th style={{color:C.muted,fontWeight:700,padding:"6px 8px",textAlign:right?"right":"left",fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.border}44`,whiteSpace:"nowrap"}}>{children}</th>;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{isInvestor?t.report.myReports:t.report.title}</h2><div style={{color:C.muted,fontSize:12,marginTop:2}}>{isInvestor?t.report.personalReports:t.report.historyTitle}</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {isInvestor&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:`${C.green}22`,border:`1px solid ${C.green}44`,borderRadius:7}}><Icon name="eye" size={12} color={C.green}/><span style={{color:C.green,fontSize:11,fontWeight:700}}>{t.readOnly}</span></div>}
        {can(session,"create_report")&&<Btn onClick={()=>setAddingRep(true)} variant="secondary" icon="plus">{t.report.openReport}</Btn>}
      </div>
    </div>

    {visibleReports.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>{t.report.noReports}</div>}

    {visibleReports.length>0&&(
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14,background:C.surface,padding:5,borderRadius:10,border:`1px solid ${C.border}44`}}>
        {visibleReports.map((r,i)=>{const col=tabColors[i%4];const active=selId===r.id;const lc=calcReport(r);return(
          <button key={r.id} onClick={()=>setSelId(r.id)} style={{padding:"6px 12px",borderRadius:7,border:"none",background:active?col+"20":"transparent",color:active?col:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:active?700:400,borderLeft:active?`3px solid ${col}`:"3px solid transparent",transition:"all .15s",display:"flex",flexDirection:"column",gap:1}}>
            <span>{r.label}</span>
            {active&&<span style={{fontSize:9,color:col,fontWeight:600}}>{t.activity.profit}: +{fmtNum(lc.netProfit)} F</span>}
          </button>
        );})}
      </div>
    )}

    {report&&calc&&(<>
      {/* KPIs */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        {[[t.report.investment,report.openingInvestment,C.blue,"wallet"],[t.report.totalRevenue,calc.totalRevenue,C.green,"trend"],[t.report.totalExpenses,calc.totalExpenses,C.red,"money"],[t.report.netProfit,calc.netProfit,C.yellow,"money"],[t.report.newInvestment,calc.newInvestment,C.blue,"wallet"]].map(([label,val,accent,icon])=>(
          <StatCard key={label} label={label} value={fmtNum(val)+" F"} lines={getCurrencyLines(val,s).map(l=>l.value)} accent={accent} icon={icon}/>
        ))}
      </div>

      {/* Actions bar */}
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:12,background:C.surface,padding:"10px 14px",borderRadius:9,border:`1px solid ${C.border}44`}}>
        <Badge closed={locked}/>
        {report.signatures?.length>0&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,background:`${C.green}22`,color:C.green,border:`1px solid ${C.green}44`,fontSize:10,fontWeight:700}}>✅ {report.signatures.length} {t.report.signed.toLowerCase()}</span>}
        {can(session,"close_report")&&(locked?<Btn onClick={()=>askLock("unlock")} variant="ghost" icon="unlock" small>{t.report.unlock}</Btn>:<Btn onClick={()=>askLock("close")} variant="red" icon="lock" small>{t.report.closeReport}</Btn>)}
        <div style={{flex:1}}/>
        {/* Signature */}
        {!alreadySigned&&(isInvestor||session.role==="admin")&&(
          <Btn onClick={doSign} variant="green" icon="pen" small>{t.report.signReport}</Btn>
        )}
        {alreadySigned&&<Btn onClick={doUnsign} variant="ghost" small>✅ {t.report.signed}</Btn>}
        {/* Timeline */}
        <Btn onClick={()=>setShowTimeline(v=>!v)} variant={showTimeline?"teal":"ghost"} icon="activity" small>{t.report.timeline}</Btn>
        {can(session,"print")&&<>
          <Btn onClick={()=>doPrint(report,calc,data.investors,s,lang)} variant="ghost" icon="print" small>{t.report.printReport}</Btn>
          <Btn onClick={()=>doDownloadPDF(report,calc,data.investors,s,lang)} variant="orange" icon="download" small>{t.report.downloadPDF}</Btn>
        </>}
        {/* Share link */}
        {session.role==="admin"&&<Btn onClick={doShare} variant="teal" icon="share" small>{t.share}</Btn>}
      </div>

      {/* Timeline */}
      {showTimeline&&(
        <Card style={{padding:16,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><Icon name="activity" size={13} color={C.teal}/><span style={{color:C.text,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.investor.timeline}</span></div>
          <div style={{position:"relative",paddingLeft:24}}>
            <div style={{position:"absolute",left:8,top:0,bottom:0,width:2,background:`linear-gradient(to bottom,${C.blue},${C.green})`,borderRadius:2}}/>
            {report.activities.map((a,i)=>(
              <div key={a.id} style={{position:"relative",marginBottom:14}}>
                <div style={{position:"absolute",left:-20,top:3,width:12,height:12,borderRadius:"50%",background:tabColors[i%4],border:`2px solid ${C.card}`,boxShadow:`0 0 0 2px ${tabColors[i%4]}44`}}/>
                <div style={{background:C.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}44`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <span style={{color:C.text,fontWeight:600,fontSize:12}}>{a.description}</span>
                    <span style={{color:C.muted,fontSize:10}}>{a.date}</span>
                  </div>
                  <div style={{display:"flex",gap:12,fontSize:11}}>
                    <span style={{color:C.muted}}>{t.activity.invested}: <span style={{color:C.dim,fontWeight:600}}>{fmtNum(a.invested)} F</span></span>
                    <span style={{color:C.muted}}>{t.activity.revenue}: <span style={{color:C.blue,fontWeight:600}}>{fmtNum(a.revenue)} F</span></span>
                    <span style={{color:C.muted}}>{t.activity.profit}: <span style={{color:C.green,fontWeight:700}}>+{fmtNum(a.profit)} F</span></span>
                  </div>
                  {a.attachments?.length>0&&<div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>{a.attachments.map((at,j)=><span key={j} style={{fontSize:10,color:C.teal,background:`${C.teal}22`,borderRadius:5,padding:"2px 7px"}}>📎 {at.name}</span>)}</div>}
                </div>
              </div>
            ))}
            {report.signatures?.map((sg,i)=>(
              <div key={i} style={{position:"relative",marginBottom:14}}>
                <div style={{position:"absolute",left:-20,top:3,width:12,height:12,borderRadius:"50%",background:C.green,border:`2px solid ${C.card}`}}/>
                <div style={{background:`${C.green}11`,borderRadius:8,padding:"8px 14px",border:`1px solid ${C.green}33`}}>
                  <span style={{color:C.green,fontSize:11,fontWeight:600}}>✅ {t.report.approvedBy} {sg.name}</span><span style={{color:C.muted,fontSize:10,marginLeft:10}}>{sg.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Activities table */}
      <Card style={{padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}><Icon name="activity" size={13} color={C.blue}/><span style={{color:C.text,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.report.activities}</span></div>
          {canEdit&&<Btn onClick={startAddAct} icon="plus" small>{t.activity.add}</Btn>}
        </div>
        {editActId==="new"&&actDraft&&(
          <div style={{background:C.surface,borderRadius:8,padding:12,marginBottom:10,border:`1px solid ${C.blue}44`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr 2fr 1fr 1fr 1fr",gap:6,marginBottom:8}}>
              <EditCell value={actDraft.date}        onChange={v=>setActDraft(d=>({...d,date:v}))}        type="date"/>
              <EditCell value={actDraft.category}    onChange={v=>setActDraft(d=>({...d,category:v}))}    options={data.settings.categories||t.categories} optionLabels={(data.settings.categories||t.categories).map((c,i)=>{const pi=PERMANENT_CATEGORIES.indexOf(c);return _lang==="en"&&pi>=0?(PERMANENT_CATEGORIES_EN[pi]||c):c;})}/>
              <EditCell value={actDraft.description} onChange={v=>setActDraft(d=>({...d,description:v}))}/>
              <EditCell value={actDraft.invested}    onChange={v=>setActDraft(d=>({...d,invested:v}))}    type="number"/>
              <EditCell value={actDraft.revenue}     onChange={v=>setActDraft(d=>({...d,revenue:v}))}     type="number"/>
              <EditCell value={actDraft.expenses}    onChange={v=>setActDraft(d=>({...d,expenses:v}))}    type="number"/>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{color:C.muted,fontSize:10}}>{t.report.autoProfit} </span><span style={{color:C.green,fontWeight:700,fontSize:13}}>{fmtNum((actDraft.revenue||0)-(actDraft.invested||0)-(actDraft.expenses||0))} F</span>
              <div style={{flex:1}}/><Btn onClick={saveAct} icon="check" small>{t.activity.save}</Btn><Btn onClick={()=>{setEditActId(null);setActDraft(null);}} variant="ghost" small>{t.activity.cancel}</Btn>
            </div>
          </div>
        )}
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr><TH>{t.activity.date}</TH><TH>{t.activity.category}</TH><TH>{t.activity.description}</TH><TH right>{t.activity.invested}</TH><TH right>{t.activity.revenue}</TH><TH right>{t.activity.expenses}</TH><TH right>{t.activity.profit}</TH><TH/></tr></thead>
            <tbody>{report.activities.map(a=>{const editing=editActId===a.id&&actDraft;return(
              <tr key={a.id} style={{borderBottom:`1px solid ${C.border}44`,background:editing?C.surface+"88":"transparent",verticalAlign:"top"}}>
                {editing?(<>
                  <td style={{padding:"4px 5px"}}><EditCell value={actDraft.date}        onChange={v=>setActDraft(d=>({...d,date:v}))}        type="date"/></td>
                  <td style={{padding:"4px 5px"}}><EditCell value={actDraft.category}    onChange={v=>setActDraft(d=>({...d,category:v}))}    options={data.settings.categories||t.categories} optionLabels={(data.settings.categories||t.categories).map((c,i)=>{const pi=PERMANENT_CATEGORIES.indexOf(c);return _lang==="en"&&pi>=0?(PERMANENT_CATEGORIES_EN[pi]||c):c;})}/></td>
                  <td style={{padding:"4px 5px"}}><EditCell value={actDraft.description} onChange={v=>setActDraft(d=>({...d,description:v}))}/></td>
                  <td style={{padding:"4px 5px"}}><EditCell value={actDraft.invested}    onChange={v=>setActDraft(d=>({...d,invested:v}))}    type="number" style={{textAlign:"right"}}/></td>
                  <td style={{padding:"4px 5px"}}><EditCell value={actDraft.revenue}     onChange={v=>setActDraft(d=>({...d,revenue:v}))}     type="number" style={{textAlign:"right"}}/></td>
                  <td style={{padding:"4px 5px"}}><EditCell value={actDraft.expenses}    onChange={v=>setActDraft(d=>({...d,expenses:v}))}    type="number" style={{textAlign:"right"}}/></td>
                  <td style={{padding:"4px 5px",textAlign:"right"}}><span style={{color:C.green,fontWeight:700}}>{fmtNum((actDraft.revenue||0)-(actDraft.invested||0)-(actDraft.expenses||0))} F</span></td>
                  <td style={{padding:"4px 5px"}}><div style={{display:"flex",gap:3}}><Btn onClick={saveAct} variant="green" small><Icon name="check" size={10} color="#fff"/></Btn><Btn onClick={()=>{setEditActId(null);setActDraft(null);}} variant="ghost" small><Icon name="close" size={10} color={C.muted}/></Btn></div></td>
                </>):(<>
                  <td style={{padding:"8px",color:C.muted,whiteSpace:"nowrap"}}>{a.date}</td>
                  <td style={{padding:"8px",color:C.dim,fontSize:10}}>{a.category}</td>
                  <td style={{padding:"8px",color:C.text}}>{a.description}{a.attachments?.length>0&&<span style={{marginLeft:5,color:C.teal,fontSize:9}}>📎{a.attachments.length}</span>}</td>
                  <td style={{padding:"8px"}}><Amt n={a.invested} settings={s} color={C.muted} size={11}/></td>
                  <td style={{padding:"8px"}}><Amt n={a.revenue}  settings={s} color={C.blue}  size={11}/></td>
                  <td style={{padding:"8px"}}><Amt n={a.expenses} settings={s} color={C.red}   size={11}/></td>
                  <td style={{padding:"8px"}}><Amt n={a.profit}   settings={s} color={C.green} size={11}/></td>
                  <td style={{padding:"8px"}}><div style={{display:"flex",gap:2,justifyContent:"flex-end"}}>
                    {!isInvestor&&canEdit&&<><Btn onClick={()=>startEditAct(a)} variant="ghost" small><Icon name="edit" size={11} color={C.blue}/></Btn>{can(session,"delete_activity")&&<Btn onClick={()=>delAct(a.id)} variant="red" small><Icon name="trash" size={11} color="#fca5a5"/></Btn>}</>}
                    {!isInvestor&&<Btn onClick={()=>attachToActivity(a.id)} variant="ghost" small title="Joindre fichier"><Icon name="paperclip" size={11} color={C.teal}/></Btn>}
                  </div></td>
                </>)}
              </tr>
            );})}
            </tbody>
            <tfoot><tr style={{borderTop:`2px solid ${C.border2}`}}>
              <td colSpan={3} style={{padding:"8px",color:C.yellow,fontWeight:700}}>{t.total.toUpperCase()}</td>
              <td style={{padding:"8px"}}><Amt n={calc.totalInvested} settings={s} color={C.muted} size={11}/></td>
              <td style={{padding:"8px"}}><Amt n={calc.totalRevenue}  settings={s} color={C.blue}  size={11}/></td>
              <td style={{padding:"8px"}}><Amt n={calc.actExp}        settings={s} color={C.red}   size={11}/></td>
              <td style={{padding:"8px"}}><Amt n={report.activities.reduce((s,a)=>s+a.profit,0)} settings={s} color={C.green} size={11}/></td>
              <td/>
            </tr></tfoot>
          </table>
        </div>
      </Card>

      {/* Additional expenses */}
      <Card style={{padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={13} color={C.red}/><span style={{color:C.text,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.report.additionalExpenses}</span></div>
          {can(session,"add_expense")&&!locked&&<Btn onClick={startAddExp} icon="plus" small>{t.report.addExpense}</Btn>}
        </div>
        {editExpId==="new"&&expDraft&&(
          <div style={{background:C.surface,borderRadius:8,padding:10,marginBottom:10,border:`1px solid ${C.red}44`,display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div style={{flex:2,minWidth:160}}><div style={{color:C.muted,fontSize:9,marginBottom:3,textTransform:"uppercase",fontWeight:700}}>{t.activity.expLabel}</div><EditCell value={expDraft.label} onChange={v=>setExpDraft(d=>({...d,label:v}))}/></div>
            <div style={{flex:1,minWidth:120}}><div style={{color:C.muted,fontSize:9,marginBottom:3,textTransform:"uppercase",fontWeight:700}}>{t.activity.expAmount}</div><EditCell value={expDraft.amount} onChange={v=>setExpDraft(d=>({...d,amount:parseFloat(v)||0}))} type="number"/></div>
            <Btn onClick={saveExp} icon="check" small>{t.activity.save}</Btn><Btn onClick={()=>{setEditExpId(null);setExpDraft(null);}} variant="ghost" small>{t.activity.cancel}</Btn>
          </div>
        )}
        {report.additionalExpenses.map(e=>{const editing=editExpId===e.id&&expDraft;return(
          <div key={e.id} style={{display:"flex",alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${C.border}44`,gap:8}}>
            {editing?(<><div style={{flex:2}}><EditCell value={expDraft.label} onChange={v=>setExpDraft(d=>({...d,label:v}))}/></div><div style={{flex:1}}><EditCell value={expDraft.amount} onChange={v=>setExpDraft(d=>({...d,amount:parseFloat(v)||0}))} type="number" style={{textAlign:"right"}}/></div><Btn onClick={saveExp} variant="green" small><Icon name="check" size={11} color="#fff"/></Btn><Btn onClick={()=>{setEditExpId(null);setExpDraft(null);}} variant="ghost" small><Icon name="close" size={11} color={C.muted}/></Btn></>):(<><span style={{flex:2,color:C.dim,fontSize:13,paddingTop:4}}>{e.label}</span><div style={{flex:1}}><Amt n={e.amount} settings={s} color={C.red} size={12}/></div>{can(session,"edit_expense")&&!locked&&<div style={{display:"flex",gap:3,flexShrink:0}}><Btn onClick={()=>startEditExp(e)} variant="ghost" small><Icon name="edit" size={11} color={C.blue}/></Btn>{can(session,"delete_expense")&&<Btn onClick={()=>delExp(e.id)} variant="red" small><Icon name="trash" size={11} color="#fca5a5"/></Btn>}</div>}</>)}
          </div>
        );})}
        {report.additionalExpenses.length>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",marginTop:4,borderTop:`1px solid ${C.border2}`}}><span style={{color:C.muted,fontSize:12,fontWeight:700,paddingTop:4}}>{t.total.toUpperCase()}</span><Amt n={calc.addExp} settings={s} color={C.red} size={12}/></div>}
      </Card>

      {/* Signatures panel */}
      {report.signatures?.length>0&&(
        <Card style={{padding:14,marginBottom:12,border:`1px solid ${C.green}33`}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><Icon name="pen" size={13} color={C.green}/><span style={{color:C.green,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.report.signatureBlock}</span></div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {report.signatures.map((sg,i)=>(
              <div key={i} style={{background:`${C.green}11`,border:`1px solid ${C.green}33`,borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>✅</span>
                <div><div style={{color:C.green,fontWeight:700,fontSize:12}}>{sg.name}</div><div style={{color:C.muted,fontSize:10}}>{sg.date}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card accent={C.yellow} style={{padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Icon name="check" size={13} color={C.yellow}/><span style={{color:C.yellow,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.report.summary} — {report.label}</span></div>
          {can(session,"print")&&<Btn onClick={()=>doCertificate(data.investors.find(i=>i.id===report.investorId)||data.investors[0],data.reports.filter(r=>r.investorId===report.investorId),s,lang)} variant="orange" icon="certificate" small>{t.report.myCerts}</Btn>}
        </div>
        {[[t.report.openingCapital,report.openingInvestment,C.muted],[t.report.totalRevenue,calc.totalRevenue,C.blue],[t.report.totalExpenses,calc.totalExpenses,C.red],[t.report.netProfit,calc.netProfit,C.green],[t.report.newInvestment,calc.newInvestment,C.yellow]].map(([label,val,color])=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:`1px solid ${C.border}44`}}>
            <span style={{color:C.muted,fontSize:13,paddingTop:4}}>{label}</span>
            <Amt n={Math.abs(val)} settings={s} color={color} size={14}/>
          </div>
        ))}
      </Card>
    </>)}

    {lockModal&&<Modal title={t.lock.title} icon="lock" onClose={()=>setLockModal(false)}><div style={{background:"rgba(127,29,29,0.2)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:7,padding:12,marginBottom:14,display:"flex",gap:10}}><Icon name="warning" size={15} color={_C.red}/><p style={{color:_C.dim,fontSize:13,margin:0}}>{t.lock.msg}</p></div><Field label={t.lock.password} value={lockPwd} onChange={setLockPwd} type="password"/>{lockErr&&<div style={{color:_C.red,fontSize:12,marginBottom:10}}>{lockErr}</div>}<div style={{display:"flex",gap:8}}><Btn onClick={doLock} icon="check">{t.lock.confirm}</Btn><Btn onClick={()=>setLockModal(false)} variant="ghost">{t.lock.cancel}</Btn></div></Modal>}
    {addingRep&&<Modal title={t.report.openReport} icon="reports" onClose={()=>setAddingRep(false)}><Field label={t.report.newLabel} value={newRepLabel} onChange={setNewRepLabel}/><div style={{background:_C.surface,borderRadius:7,padding:10,marginBottom:14,border:`1px solid ${_C.border2}`,fontSize:12}}><span style={{color:_C.muted}}>{t.report.openingCapital}: </span><span style={{color:_C.yellow,fontWeight:700}}>{fmtNum(data.reports.length>0?calcReport(data.reports[data.reports.length-1]).newInvestment:0)} F CFA</span></div><div style={{display:"flex",gap:8}}><Btn onClick={createRep} icon="check">{t.confirm}</Btn><Btn onClick={()=>setAddingRep(false)} variant="ghost">{t.activity.cancel}</Btn></div></Modal>}
    {shareModal&&<Modal title={t.shareLink} icon="share" iconColor={_C.teal} onClose={()=>setShareModal(false)}>
      <div style={{background:`${_C.teal}11`,border:`1px solid ${_C.teal}33`,borderRadius:8,padding:14,marginBottom:14}}>
        <div style={{color:_C.muted,fontSize:10,marginBottom:6,textTransform:"uppercase",fontWeight:700}}>{t.linkExpires}</div>
        <div style={{color:_C.teal,fontFamily:"monospace",fontSize:14,fontWeight:700,letterSpacing:2}}># TF-{shareToken}</div>
        <div style={{color:_C.dim,fontSize:11,marginTop:4}}>{t.report.shareInfo}</div>
      </div>
      <Btn onClick={()=>{navigator.clipboard?.writeText(`TF-${shareToken}`);}} variant="teal" icon="copy">{t.copyLink}</Btn>
    </Modal>}
  </div>);
}

// ── INVESTORS PAGE ───────────────────────────────────────────────────────────────
function Investors({data,setData,session,t,lang}){
  const C=_C;const s=data.settings;
  const [editId,setEditId]=useState(null);const [draft,setDraft]=useState(null);
  const [showAdd,setShowAdd]=useState(false);const [addDraft,setAddDraft]=useState(null);
  const [goalModal,setGoalModal]=useState(null);const [goalDraft,setGoalDraft]=useState({goal:0,goalLabel:""});
  const invColors=[C.blue,C.green,C.yellow,C.red];
  const visibleInvestors=session.role==="investor"?data.investors.filter(i=>i.id===session.investorId):data.investors;
  const saveEdit=()=>{setData(d=>({...d,investors:d.investors.map(i=>i.id===editId?draft:i)}));addAudit(setData,session,"Investisseur modifié",draft.name,"update");setEditId(null);setDraft(null);};
  const saveAdd=()=>{const totalCats=(addDraft.investmentCategories||[]).reduce((s,c)=>s+(c.amount||0),0);const ni={...addDraft,initialInvestment:totalCats||addDraft.initialInvestment||0,currentInvestment:totalCats||addDraft.initialInvestment||0,id:Date.now(),goal:0,goalLabel:"",sharedTokens:[]};setData(d=>({...d,investors:[...d.investors,ni]}));addAudit(setData,session,"Investisseur créé",addDraft.name,"create");setShowAdd(false);setAddDraft(null);};
  const saveGoal=()=>{setData(d=>({...d,investors:d.investors.map(i=>i.id===goalModal?{...i,...goalDraft}:i)}));setGoalModal(null);};
  const InfoRow=({icon,label,value})=>(<div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.border}44`}}><Icon name={icon} size={12} color={C.muted}/><div><div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>{label}</div><div style={{color:C.dim,fontSize:12,marginTop:1}}>{value||"—"}</div></div></div>);
  const InvestorForm=({d,setD,onSave,onCancel,saveLabel,settingsData})=>{
    const C=_C;
    const cats=settingsData?.categories||DEFAULT_CATEGORIES;
    const addCat=()=>setD(x=>({...x,investmentCategories:[...(x.investmentCategories||[]),{category:cats[0],amount:0}]}));
    const removeCat=i=>setD(x=>({...x,investmentCategories:(x.investmentCategories||[]).filter((_,j)=>j!==i)}));
    const updateCat=(i,field,val)=>setD(x=>({...x,investmentCategories:(x.investmentCategories||[]).map((c,j)=>j===i?{...c,[field]:field==="amount"?parseFloat(val)||0:val}:c)}));
    const totalCats=(d.investmentCategories||[]).reduce((s,c)=>s+(c.amount||0),0);
    const handleLogoUpload=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setD(x=>({...x,logo:ev.target.result}));r.readAsDataURL(f);};
    const prefCur=d.preferredCurrency||"";
    const curObj=ALL_CURRENCIES.find(c=>c.code===prefCur);
    const rate=(settingsData?.rates||{})[prefCur]||DEFAULT_RATES[prefCur]||1;
    return(<>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[["name",t.register.name],["representative",t.investor.representative],["email",t.investor.email],["phone",t.investor.phone],["country",t.investor.country]].map(([k,l])=>(<div key={k}><Field label={l} value={d[k]} onChange={v=>setD(x=>({...x,[k]:v}))}/></div>))}
        <div>
          <div style={{color:C.muted,fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.investor.investCalc}</div>
          <div style={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:7,padding:"8px 12px",color:C.yellow,fontWeight:700,fontSize:13}}>{fmtNum(totalCats||d.initialInvestment||0)} F CFA</div>
        </div>
      </div>
      <Field label={t.investor.address} value={d.address} onChange={v=>setD(x=>({...x,address:v}))}/>

      {/* Logo upload */}
      <div style={{marginBottom:14}}>
        <div style={{color:C.muted,fontSize:10,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.investor.logoLabel}</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {d.logo?(<><img src={d.logo} alt="logo" style={{height:52,maxWidth:120,objectFit:"contain",border:`1px solid ${C.border2}`,borderRadius:6,padding:4,background:"#fff"}}/><Btn onClick={()=>setD(x=>({...x,logo:null}))} variant="red" small icon="trash">{t.investor.removeLogo}</Btn></>):(
            <label style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 14px",background:"transparent",border:`1px dashed ${C.border2}`,borderRadius:7,cursor:"pointer",color:C.muted,fontSize:12}}>
              <Icon name="paperclip" size={13} color={C.muted}/>{t.investor.uploadLogo}
              <input type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload}/>
            </label>
          )}
        </div>
      </div>

      {/* Preferred currency */}
      <div style={{marginBottom:14}}>
        <div style={{color:C.muted,fontSize:10,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.investor.currencyDesc}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setD(x=>({...x,preferredCurrency:""}))} style={{padding:"6px 14px",borderRadius:7,border:`2px solid ${!prefCur?C.blue:C.border}`,background:!prefCur?`${C.blue}22`:"transparent",color:!prefCur?C.blue:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:!prefCur?700:400}}>{t.investor.fcfaOnly}</button>
          {ALL_CURRENCIES.map(cur=>(<button key={cur.code} onClick={()=>setD(x=>({...x,preferredCurrency:cur.code}))} style={{padding:"6px 14px",borderRadius:7,border:`2px solid ${prefCur===cur.code?cur.color:C.border}`,background:prefCur===cur.code?cur.color+"22":"transparent",color:prefCur===cur.code?cur.color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:prefCur===cur.code?700:400,display:"flex",alignItems:"center",gap:5}}>{prefCur===cur.code&&<Icon name="check" size={11} color={cur.color}/>}{cur.sym} {cur.name}</button>))}
        </div>
        {curObj&&<div style={{color:C.muted,fontSize:10,marginTop:5}}>{t.investor.rateLabel} 1 {curObj.sym} = <span style={{color:curObj.color,fontWeight:700}}>{fmtNum(rate)} F CFA</span></div>}
      </div>

      {/* Investment categories */}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.investor.catsLabel}</div>
          <Btn onClick={addCat} variant="secondary" small icon="plus">{t.investor.add}</Btn>
        </div>
        {(d.investmentCategories||[]).length===0&&<div style={{color:C.muted,fontSize:11,fontStyle:"italic",padding:"8px 0"}}>{t.investor.noCats}</div>}
        {(d.investmentCategories||[]).map((c,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:8,background:C.surface,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}44`}}>
            <div style={{flex:2}}>
              <div style={{color:C.muted,fontSize:9,marginBottom:3,textTransform:"uppercase",fontWeight:700}}>{t.activity.category}</div>
              <select value={c.category} onChange={e=>updateCat(i,"category",e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border2}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:12,outline:"none"}}>
                {cats.map((cat,ci)=>{const pi=PERMANENT_CATEGORIES.indexOf(cat);const label=_lang==="en"&&pi>=0?(PERMANENT_CATEGORIES_EN[pi]||cat):cat;return<option key={cat} value={cat}>{label}</option>;})}
              </select>
            </div>
            <div style={{flex:1}}>
              <div style={{color:C.muted,fontSize:9,marginBottom:3,textTransform:"uppercase",fontWeight:700}}>{t.investor.amountLabel}</div>
              <input type="number" value={c.amount} onChange={e=>updateCat(i,"amount",e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border2}`,borderRadius:6,padding:"7px 10px",color:C.yellow,fontSize:12,fontWeight:700,outline:"none",textAlign:"right"}}/>
            </div>
            {curObj&&c.amount>0&&<div style={{flexShrink:0,fontSize:10,color:curObj.color,fontWeight:700,paddingBottom:8,whiteSpace:"nowrap"}}>{cvt(c.amount,rate,curObj.sym)}</div>}
            <button onClick={()=>removeCat(i)} style={{background:"rgba(127,29,29,0.3)",border:"none",borderRadius:6,padding:"7px 8px",cursor:"pointer",flexShrink:0}}><Icon name="trash" size={12} color="#fca5a5"/></button>
          </div>
        ))}
        {(d.investmentCategories||[]).length>0&&(
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.bg,borderRadius:7,border:`1px solid ${C.border2}`}}>
            <span style={{color:C.muted,fontSize:12,fontWeight:700}}>{t.total}</span>
            <div style={{textAlign:"right"}}>
              <div style={{color:C.yellow,fontSize:13,fontWeight:800}}>{fmtNum(totalCats)} F CFA</div>
              {curObj&&totalCats>0&&<div style={{color:curObj.color,fontSize:12,fontWeight:700}}>{cvt(totalCats,rate,curObj.sym)}</div>}
            </div>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8,marginTop:8}}><Btn onClick={()=>{if(totalCats>0)setD(x=>({...x,initialInvestment:totalCats,currentInvestment:totalCats}));onSave();}} icon="save">{saveLabel}</Btn><Btn onClick={onCancel} variant="ghost">Annuler</Btn></div>
    </>);
  };

  // Consolidated view (admin)
  const totalCapital=data.investors.reduce((s,i)=>s+i.currentInvestment,0);
  const totalProfit=data.investors.reduce((s,i)=>s+i.cumulativeProfit,0);

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <div><h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{t.nav.investors}</h2><div style={{color:C.muted,fontSize:12,marginTop:2}}>{t.investor.subtitle}</div></div>
      {session.role==="admin"&&<Btn onClick={()=>{setAddDraft({id:Date.now(),name:"",initialInvestment:0,currentInvestment:0,cumulativeProfit:0,address:"",phone:"",representative:"",email:"",country:"",goal:0,goalLabel:"",sharedTokens:[],logo:null,preferredCurrency:"GBP",investmentCategories:[]});setShowAdd(true);}} variant="secondary" icon="plus">{t.investor.add}</Btn>}
    </div>

    {/* Consolidated view (admin only) */}
    {session.role==="admin"&&data.investors.length>1&&(
      <Card accent={C.blue} style={{padding:16,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="globe" size={13} color={C.blue}/><span style={{color:C.blue,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.investor.consolidatedView}</span></div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <StatCard label={t.investor.consolidatedCapital} value={fmtNum(totalCapital)+" F"} lines={getCurrencyLines(totalCapital,s).map(l=>l.value)} accent={C.blue} icon="wallet"/>
          <StatCard label={t.investor.consolidatedProfit} value={fmtNum(totalProfit)+" F"} lines={getCurrencyLines(totalProfit,s).map(l=>l.value)} accent={C.green} icon="trend"/>
          <StatCard label={t.investor.investorCount} value={data.investors.length} lines={[t.investor.activePortfolios]} accent={C.yellow} icon="investors"/>
        </div>
        {/* Leaderboard */}
        <div style={{marginTop:14}}>
          <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>{t.investor.ranking}</div>
          {[...data.investors].sort((a,b)=>b.cumulativeProfit-a.cumulativeProfit).map((inv,i)=>{
            const pct=totalProfit>0?(inv.cumulativeProfit/totalProfit)*100:0;
            return(<div key={inv.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{color:i===0?C.yellow:C.muted,fontWeight:700,width:18,fontSize:12}}>#{i+1}</span>
              <span style={{color:C.dim,fontSize:12,flex:1}}>{inv.name}</span>
              <span style={{color:C.green,fontSize:12,fontWeight:700}}>{fmtNum(inv.cumulativeProfit)} F</span>
              <div style={{width:80}}><ProgressBar value={inv.cumulativeProfit} max={totalProfit} color={invColors[i%4]} showPct={false}/></div>
            </div>);
          })}
        </div>
      </Card>
    )}

    {/* Investor cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
      {visibleInvestors.map((inv,i)=>{
        const col=invColors[i%4];const growth=inv.initialInvestment>0?((inv.cumulativeProfit/inv.initialInvestment)*100).toFixed(1):0;
        const invReports=data.reports.filter(r=>r.investorId===inv.id);
        const profitSpark=invReports.map(r=>calcReport(r).netProfit);
        return(<Card key={inv.id} accent={col} style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:42,height:42,borderRadius:10,background:col+"22",border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="investors" size={20} color={col}/></div>
              <div>
                <div style={{color:C.text,fontSize:15,fontWeight:800}}>{inv.name}</div>
                <div style={{color:col,fontSize:11,fontWeight:600}}>+{growth}% {t.investor.totalGrowth}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:4}}>
              {(can(session,"edit_investor")||session.role==="investor")&&<Btn onClick={()=>{setDraft({...inv});setEditId(inv.id);}} variant="ghost" small icon="edit"/>}
              {session.role==="admin"&&<Btn onClick={()=>{setGoalModal(inv.id);setGoalDraft({goal:inv.goal||0,goalLabel:inv.goalLabel||""});}} variant="ghost" small icon="target"/>}
            </div>
          </div>

          {/* Financial rows */}
          {[[t.investor.initial,inv.initialInvestment,C.muted],[t.investor.current,inv.currentInvestment,col],[t.investor.profit,inv.cumulativeProfit,C.green]].map(([label,val,color])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderBottom:`1px solid ${C.border}44`}}>
              <span style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,paddingTop:3}}>{label}</span>
              <Amt n={val} settings={s} color={color} size={11}/>
            </div>
          ))}

          {/* Sparkline */}
          {profitSpark.length>1&&<div style={{marginTop:8,marginBottom:4}}>
            <div style={{color:C.muted,fontSize:9,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>{t.investor.profitEvolution}</div>
            <MiniSparkline values={profitSpark} color={col} width={120} height={28}/>
          </div>}

          {/* Goal */}
          {inv.goal>0&&<div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.muted,fontSize:10}}>{inv.goalLabel||t.investor.goalDefault}</span><span style={{color:C.green,fontSize:10,fontWeight:700}}>{fmtNum(inv.cumulativeProfit)} / {fmtNum(inv.goal)} F</span></div>
            <ProgressBar value={inv.cumulativeProfit} max={inv.goal} color={C.green} showPct={true}/>
          </div>}

          {/* Contact info */}
          <div style={{marginTop:12}}>
            <InfoRow icon="user"  label={t.investor.representative} value={inv.representative}/>
            <InfoRow icon="mail"  label={t.investor.email}          value={inv.email}/>
            <InfoRow icon="phone" label={t.investor.phone}          value={inv.phone}/>
            <InfoRow icon="map"   label={t.investor.address}        value={inv.address}/>
          </div>

          {/* History */}
          <div style={{marginTop:12}}>
            <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700,marginBottom:6}}>{t.investor.history}</div>
            {invReports.map((r,ri)=>{const c=calcReport(r);const rc=invColors[ri%4];return(
              <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,borderBottom:`1px solid ${C.border}44`}}>
                <span style={{color:C.muted,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:"55%"}}>{r.label.substring(0,22)}</span>
                <span style={{color:rc,fontWeight:700}}>+{fmtNum(c.netProfit)} F</span>
              </div>
            );})}
          </div>

          {/* Certificate + Contract buttons */}
          {can(session,"print")&&<div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn onClick={()=>doCertificate(inv,invReports,s,lang)} variant="orange" icon="certificate" small>{t.report.myCerts}</Btn>
            <Btn onClick={()=>doContract(inv,s,lang)} variant="teal" icon="pen" small>{t.contract.print}</Btn>
            <Btn onClick={()=>downloadContract(inv,s,lang)} variant="ghost" icon="download" small>{t.contract.download}</Btn>
          </div>}
        </Card>);
      })}
    </div>

    {editId!==null&&draft&&<Modal title={t.investor.editInfo} icon="investors" wide onClose={()=>{setEditId(null);setDraft(null);}}><InvestorForm d={draft} setD={setDraft} onSave={saveEdit} onCancel={()=>{setEditId(null);setDraft(null);}} saveLabel={t.save} settingsData={data.settings}/></Modal>}
    {showAdd&&addDraft&&<Modal title={t.investor.add} icon="investors" wide onClose={()=>{setShowAdd(false);setAddDraft(null);}}><InvestorForm d={addDraft} setD={setAddDraft} onSave={saveAdd} onCancel={()=>{setShowAdd(false);setAddDraft(null);}} saveLabel={t.confirm} settingsData={data.settings}/></Modal>}
    {goalModal!==null&&<Modal title={t.investor.setGoal} icon="target" iconColor={C.green} onClose={()=>setGoalModal(null)}>
      <Field label={t.investor.goalAmountLabel} value={goalDraft.goal} onChange={v=>setGoalDraft(g=>({...g,goal:parseFloat(v)||0}))} type="number"/>
      <Field label={t.investor.goalLabelField} value={goalDraft.goalLabel} onChange={v=>setGoalDraft(g=>({...g,goalLabel:v}))} hint={t.investor.goalHint}/>
      <div style={{display:"flex",gap:8}}><Btn onClick={saveGoal} icon="check">{t.confirm}</Btn><Btn onClick={()=>setGoalModal(null)} variant="ghost">{t.cancel}</Btn></div>
    </Modal>}
  </div>);
}

// ── AUDIT LOG ────────────────────────────────────────────────────────────────────
function AuditLog({data,t}){
  const C=_C;
  const [filter,setFilter]=useState("all");
  const types=["all","create","update","delete","lock"];
  const typeColors={create:C.green,update:C.blue,delete:C.red,lock:C.yellow};
  const typeIcons={create:"plus",update:"edit",delete:"trash",lock:"lock"};
  const filtered=filter==="all"?data.auditLog:data.auditLog.filter(l=>l.type===filter);
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <div><h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{t.audit.title}</h2><div style={{color:C.muted,fontSize:12,marginTop:2}}>{t.audit.subtitle}</div></div>
      <div style={{display:"flex",gap:4}}>
        {types.map(tp=>(
          <button key={tp} onClick={()=>setFilter(tp)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${filter===tp?(typeColors[tp]||C.blue):C.border}`,background:filter===tp?(typeColors[tp]||C.blue)+"22":"transparent",color:filter===tp?typeColors[tp]||C.blue:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:filter===tp?700:400,textTransform:"capitalize"}}>
            {tp==="all"?t.audit.all:tp}
          </button>
        ))}
      </div>
    </div>
    <Card style={{padding:0,overflow:"hidden"}}>
      {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:C.muted}}>{t.audit.noEntries}</div>}
      <div style={{position:"relative",padding:"8px 16px 8px 40px"}}>
        {filtered.length>0&&<div style={{position:"absolute",left:24,top:0,bottom:0,width:2,background:`linear-gradient(to bottom,${C.border},transparent)`,borderRadius:2}}/>}
        {filtered.map((log,i)=>{const col=typeColors[log.type]||C.muted;const ico=typeIcons[log.type]||"activity";return(
          <div key={log.id} style={{position:"relative",marginBottom:10,paddingLeft:16}}>
            <div style={{position:"absolute",left:-17,top:10,width:12,height:12,borderRadius:"50%",background:col,border:`2px solid ${C.card}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            </div>
            <div style={{background:C.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}44`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={ico} size={11} color={col}/></div>
                  <div>
                    <span style={{color:C.text,fontWeight:600,fontSize:12}}>{log.action}</span>
                    {log.target&&<span style={{color:C.dim,fontSize:11,marginLeft:6}}>→ {log.target}</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                  <div style={{color:C.muted,fontSize:10}}>{log.date}</div>
                  <span style={{display:"inline-block",padding:"1px 7px",borderRadius:10,background:col+"22",color:col,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:2}}>{log.user}</span>
                </div>
              </div>
            </div>
          </div>
        );})}
      </div>
    </Card>
  </div>);
}

// ── USERS PANEL (Admin only) ─────────────────────────────────────────────────────
function UsersPanel({data,setData,session,t}){
  const C=_C;const lang=data.settings.language||"fr";
  const [editUser,setEditUser]=useState(null);const [newUser,setNewUser]=useState(null);
  const [showResetPwd,setShowResetPwd]=useState(null);const [newPwd,setNewPwd]=useState("");
  const approveUser=u=>{const ni=u.investorData;const fu={id:u.id,username:u.username,password:u.password,name:u.name,email:u.email,role:u.role,active:true,approved:true,investorId:u.investorId};setData(d=>({...d,users:[...d.users,fu],investors:ni?[...d.investors,ni]:d.investors,pendingUsers:d.pendingUsers.filter(p=>p.id!==u.id)}));addAudit(setData,session,"Utilisateur approuvé",u.name,"create");addNotification(setData,`${u.name} approuvé(e) comme investisseur`,"success");};
  const rejectUser=id=>{setData(d=>({...d,pendingUsers:d.pendingUsers.filter(p=>p.id!==id)}));};
  const toggleActive=id=>{setData(d=>({...d,users:d.users.map(u=>u.id===id?{...u,active:!u.active}:u)}));};
  const [confirmUser,setConfirmUser]=useState(null);
  const deleteUser=id=>{
    const u=(data.users||[]).find(x=>x.id===id);
    setConfirmUser({id,name:u?.name||u?.username||"?"});
  };
  const saveEdit=()=>{setData(d=>({...d,users:d.users.map(u=>u.id===editUser.id?editUser:u)}));addAudit(setData,session,"Utilisateur modifié",editUser.name,"update");setEditUser(null);};
  const doResetPwd=()=>{if(!newPwd)return;setData(d=>({...d,users:d.users.map(u=>u.id===showResetPwd.id?{...u,password:newPwd}:u)}));addAudit(setData,session,"Mot de passe réinitialisé",showResetPwd.name,"update");setShowResetPwd(null);setNewPwd("");};
  const createUser=()=>{if(!newUser.username||!newUser.password)return;setData(d=>({...d,users:[...d.users,{...newUser,id:Date.now(),active:true,approved:true}]}));setNewUser(null);};
  const TH=({children,right=false})=><th style={{color:C.muted,fontWeight:700,padding:"8px 10px",textAlign:right?"right":"left",fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.border}44`}}>{children}</th>;
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <div><h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{t.users.title}</h2><div style={{color:C.muted,fontSize:12,marginTop:2}}>{t.users.subtitle}</div></div>
      <Btn onClick={()=>setNewUser({username:"",password:"",name:"",email:"",role:"manager",active:true,approved:true,investorId:null})} variant="secondary" icon="plus">{t.users.newUser}</Btn>
    </div>
    {data.pendingUsers.length>0&&(
      <Card accent={C.yellow} style={{padding:16,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{width:8,height:8,borderRadius:"50%",background:C.yellow,boxShadow:`0 0 6px ${C.yellow}`}}/><span style={{color:C.yellow,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.users.pending} ({data.pendingUsers.length})</span></div>
        {data.pendingUsers.map(u=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:C.surface,borderRadius:8,border:`1px solid ${C.border}44`,marginBottom:6}}>
            <div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{u.name}</div><div style={{color:C.muted,fontSize:11}}>{u.email} · @{u.username}</div>{u.investorData&&<div style={{color:C.yellow,fontSize:11,marginTop:2}}>Invest.: {fmtNum(u.investorData.initialInvestment)} F CFA</div>}</div>
            <div style={{display:"flex",gap:6}}><Btn onClick={()=>approveUser(u)} variant="green" icon="check" small>{t.users.approve}</Btn><Btn onClick={()=>rejectUser(u.id)} variant="red" icon="close" small>{t.users.reject}</Btn></div>
          </div>
        ))}
      </Card>
    )}
    <Card style={{padding:0,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:C.surface}}><TH>{t.users.userCol}</TH><TH>{t.users.emailCol}</TH><TH>{t.users.role}</TH><TH>{t.users.status}</TH><TH right>{t.users.actions}</TH></tr></thead>
        <tbody>{data.users.map(u=>(
          <tr key={u.id} style={{borderBottom:`1px solid ${C.border}44`,opacity:u.active?1:0.5}}>
            <td style={{padding:"10px"}}><div style={{color:C.text,fontWeight:600}}>{u.name}</div><div style={{color:C.muted,fontSize:10}}>@{u.username}</div></td>
            <td style={{padding:"10px",color:C.dim,fontSize:11}}>{u.email}</td>
            <td style={{padding:"10px"}}><RoleBadge role={u.role} lang={lang}/></td>
            <td style={{padding:"10px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,background:u.active?`${C.green}22`:`rgba(127,29,29,0.3)`,color:u.active?"#86efac":"#fca5a5",border:`1px solid ${u.active?`${C.green}44`:"rgba(239,68,68,0.3)"}`,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{u.active?t.active:t.inactive}</span></td>
            <td style={{padding:"10px"}}><div style={{display:"flex",gap:4,justifyContent:"flex-end",flexWrap:"wrap"}}>
              {u.id!==session.id&&(<><Btn onClick={()=>setEditUser({...u})} variant="ghost" small icon="edit"/><Btn onClick={()=>{setShowResetPwd(u);setNewPwd("");}} variant="purple" small icon="key"/><Btn onClick={()=>toggleActive(u.id)} variant={u.active?"red":"green"} small>{u.active?t.users.disable:t.users.enable}</Btn>{u.role!=="admin"&&<Btn onClick={()=>deleteUser(u.id)} variant="red" small icon="trash"/>}</>)}
              {u.id===session.id&&<span style={{color:C.muted,fontSize:10,padding:"4px 8px"}}>{t.users.you}</span>}
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </Card>
    {editUser&&<Modal title={t.users.editUser} icon="users" onClose={()=>setEditUser(null)}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label={t.users.nameLabel} value={editUser.name} onChange={v=>setEditUser(u=>({...u,name:v}))}/><Field label={t.users.emailCol} value={editUser.email} onChange={v=>setEditUser(u=>({...u,email:v}))} type="email"/></div>
      <DDrop label={t.users.role} value={editUser.role} onChange={v=>setEditUser(u=>({...u,role:v}))} options={Object.entries(ROLES).map(([k,r])=>({value:k,label:lang==="fr"?r.label:r.labelEn}))}/>
      {editUser.role==="investor"&&<DDrop label={t.users.linkedInvestor} value={editUser.investorId||""} onChange={v=>setEditUser(u=>({...u,investorId:v?parseInt(v):null}))} options={[{value:"",label:t.users.noneOpt},...data.investors.map(i=>({value:i.id,label:i.name}))]}/>}
      <div style={{display:"flex",gap:8}}><Btn onClick={saveEdit} icon="save">{t.save}</Btn><Btn onClick={()=>setEditUser(null)} variant="ghost">{t.cancel}</Btn></div>
    </Modal>}
    {showResetPwd&&<Modal title={`${t.users.resetPwd} — ${showResetPwd.name}`} icon="key" iconColor={C.purple} onClose={()=>setShowResetPwd(null)}>
      <Field label={t.users.newPwd} value={newPwd} onChange={setNewPwd} type="password"/>
      <div style={{display:"flex",gap:8}}><Btn onClick={doResetPwd} variant="purple" icon="check">{t.confirm}</Btn><Btn onClick={()=>setShowResetPwd(null)} variant="ghost">{t.cancel}</Btn></div>
    </Modal>}
    {newUser&&<Modal title={t.users.newUser} icon="users" onClose={()=>setNewUser(null)}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label={t.users.nameField} value={newUser.name} onChange={v=>setNewUser(u=>({...u,name:v}))}/><Field label={t.users.emailCol} value={newUser.email} onChange={v=>setNewUser(u=>({...u,email:v}))} type="email"/><Field label={t.users.usernameField} value={newUser.username} onChange={v=>setNewUser(u=>({...u,username:v}))}/><Field label={t.users.pwdField} value={newUser.password} onChange={v=>setNewUser(u=>({...u,password:v}))} type="password"/></div>
      <DDrop label={t.users.role} value={newUser.role} onChange={v=>setNewUser(u=>({...u,role:v}))} options={Object.entries(ROLES).map(([k,r])=>({value:k,label:lang==="fr"?r.label:r.labelEn}))}/>
      {newUser.role==="investor"&&<DDrop label="Investisseur lié" value={newUser.investorId||""} onChange={v=>setNewUser(u=>({...u,investorId:v?parseInt(v):null}))} options={[{value:"",label:t.users.noneOpt},...data.investors.map(i=>({value:i.id,label:i.name}))]}/>}
      <div style={{display:"flex",gap:8}}><Btn onClick={createUser} icon="plus">{t.confirm}</Btn><Btn onClick={()=>setNewUser(null)} variant="ghost">{t.cancel}</Btn></div>
    </Modal>}
      <ConfirmModal
        open={!!confirmUser}
        title={lang==="fr"?"Supprimer l utilisateur ?":"Delete user?"}
        message={lang==="fr"?"Supprimer definitivement l utilisateur :":"Permanently delete user:"}
        itemName={confirmUser?.name}
        itemType={lang==="fr"?"Utilisateur":"User"}
        lang={lang}
        onConfirm={()=>{setData(d=>({...d,users:d.users.filter(u=>u.id!==confirmUser.id)}));setConfirmUser(null);}}
        onCancel={()=>setConfirmUser(null)}
      />
  </div>);
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────────
function Settings({data,setData,session,t,lang,setLang,theme,setTheme}){
  const C=_C;
  const canEdit=can(session,"edit_settings");
  const s=data.settings;
  const [localRates,setLocalRates]=useState({...s.rates});
  const [selected,setSelected]=useState([...(s.selectedCurrencies||["GBP"])]);
  const [pwd,setPwd]=useState(s.adminPwd);
  const [saved,setSaved]=useState(false);const [fetching,setFetching]=useState(false);const [fetchMsg,setFetchMsg]=useState(""); const [confirmCat,setConfirmCat]=useState(null);
  const allSelected=ALL_CURRENCIES.every(c=>selected.includes(c.code));
  const doFetchRates=async()=>{if(!canEdit)return;setFetching(true);setFetchMsg("");const rates=await fetchLiveRates();setFetching(false);if(rates){setLocalRates(rates);setFetchMsg(t.settings.ratesUpdated);}else setFetchMsg(t.settings.ratesFailed);setTimeout(()=>setFetchMsg(""),4000);};
  const save=()=>{setData(d=>({...d,settings:{...d.settings,rates:localRates,selectedCurrencies:selected,adminPwd:pwd,language:lang,theme,ratesLastUpdated:fmtDateTime()}}));addAudit(setData,session,"Paramètres sauvegardés","Paramètres système","update");setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const previewSettings={...s,rates:localRates,selectedCurrencies:selected};
  const cs={background:C.card,border:`1px solid ${C.border}44`,borderRadius:10,padding:20,marginBottom:12};
  if(!canEdit){
    return(<div>
      <h2 style={{color:C.text,fontSize:20,fontWeight:800,marginBottom:18}}>{t.settings.title}</h2>
      <div style={cs}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span style={{padding:"6px 14px",borderRadius:8,background:`${C.blue}22`,color:C.blue,fontWeight:700}}>F CFA</span>{ALL_CURRENCIES.filter(c=>(s.selectedCurrencies||[]).includes(c.code)).map(cur=>(<span key={cur.code} style={{padding:"6px 14px",borderRadius:8,background:cur.color+"22",color:cur.color,fontSize:16,fontWeight:700}}>{cur.sym} {cur.name}</span>))}</div>
      </div>
      <div style={{background:`${C.red}15`,border:`1px solid ${C.red}44`,borderRadius:8,padding:12,color:"#fca5a5",fontSize:12,display:"flex",gap:8}}><Icon name="shield" size={14} color="#fca5a5"/>{t.settings.adminOnly}</div>
    </div>);
  }
  return(<div>
    <div style={{marginBottom:20}}><h2 style={{color:C.text,fontSize:20,fontWeight:800,margin:0}}>{t.settings.title}</h2><div style={{color:C.muted,fontSize:12,marginTop:2}}>{t.settings.subtitle}</div></div>

      {/* ── ROW 1: Permanent Categories — full width ── */}
      <div style={{...cs,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="activity" size={13} color={C.purple}/><span style={{color:C.text,fontSize:13,fontWeight:700}}>{t.settings.categoriesMgmt}</span></div>
        <div style={{color:C.muted,fontSize:11,marginBottom:12}}>{t.settings.categoriesDesc}</div>
        {/* Permanent categories — read-only */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
            <Icon name="lock" size={10} color={C.yellow}/>
            <span style={{color:C.yellow,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{lang==="fr"?"Catégories permanentes":"Permanent categories"}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {PERMANENT_CATEGORIES.map((cat,i)=>{
              const label=lang==="en"?(PERMANENT_CATEGORIES_EN[i]||cat):cat;
              return(
              <div key={i} style={{background:`${C.yellow}08`,border:`1px solid ${C.yellow}22`,borderRadius:6,padding:"7px 10px",color:C.dim,fontSize:11,display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:C.yellow,fontSize:9,flexShrink:0}}>🔒</span>
                <span style={{lineHeight:1.4}}>{label}</span>
              </div>
              );
            })}
          </div>
        </div>
        {/* Custom categories — editable */}
        {(s.categories||DEFAULT_CATEGORIES).filter(c=>!PERMANENT_CATEGORIES.includes(c)).length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <Icon name="edit" size={10} color={C.blue}/>
              <span style={{color:C.blue,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{lang==="fr"?"Catégories personnalisées":"Custom categories"}</span>
            </div>
            {(s.categories||DEFAULT_CATEGORIES).map((cat,i)=>{
              if(PERMANENT_CATEGORIES.includes(cat))return null;
              return(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                  <input value={cat} onChange={e=>{const newCats=[...(s.categories||DEFAULT_CATEGORIES)];newCats[i]=e.target.value;setData(d=>({...d,settings:{...d.settings,categories:newCats}}));}} style={{flex:1,background:C.surface,border:`1px solid ${C.border2}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:12,outline:"none"}}/>
                  <Btn onClick={()=>setConfirmCat({idx:i,name:cat})} variant="red" small icon="trash"/>
                </div>
              );
            })}
          </div>
        )}
        <div style={{marginTop:8}}>
          <Btn onClick={()=>setData(d=>({...d,settings:{...d.settings,categories:[...(d.settings.categories||DEFAULT_CATEGORIES),t.settings.newCatDefault]}}))} variant="secondary" icon="plus" small>{t.settings.addCategory}</Btn>
        </div>
      </div>

      {/* ── ROW 2: Exchange Rates — full width ── */}
      <div style={{...cs,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Icon name="money" size={13} color={C.green}/><span style={{color:C.text,fontSize:13,fontWeight:700}}>{t.settings.rates}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {fetchMsg&&<span style={{fontSize:11,color:fetchMsg.includes("✓")?"#86efac":"#fca5a5"}}>{fetchMsg}</span>}
            <Btn onClick={doFetchRates} variant="teal" icon="refresh" small disabled={fetching}>{fetching?"...":t.settings.autoRates}</Btn>
          </div>
        </div>
        {s.ratesLastUpdated&&<div style={{color:C.muted,fontSize:10,marginBottom:10}}>{t.settings.lastUpdate} {s.ratesLastUpdated}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {ALL_CURRENCIES.map(cur=>(<div key={cur.code} style={{display:"flex",alignItems:"center",gap:8,background:C.surface,borderRadius:7,padding:"8px 12px",border:`1px solid ${C.border2}`}}>
            <span style={{color:cur.color,fontSize:20,fontWeight:800,width:28,textAlign:"center"}}>{cur.sym}</span>
            <div style={{flex:1}}>
              <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700,marginBottom:2}}>1 {cur.sym} = X F CFA</div>
              <input type="number" value={localRates[cur.code]??DEFAULT_RATES[cur.code]} onChange={e=>setLocalRates(r=>({...r,[cur.code]:parseFloat(e.target.value)||0}))} style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${C.border2}`,color:cur.color,fontSize:13,fontWeight:700,outline:"none",padding:"2px 0"}}/>
            </div>
          </div>))}
        </div>
      </div>

      {/* ── ROW 3: Theme + Currencies side by side ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        {/* Theme */}
        <div style={cs}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name={theme==="dark"?"moon":"sun"} size={13} color={C.yellow}/><span style={{color:C.text,fontSize:13,fontWeight:700}}>{t.settings.theme}</span></div>
          <div style={{display:"flex",gap:8}}>
            {[["dark",t.settings.dark,"moon"],["light",t.settings.light,"sun"]].map(([th,label,ico])=>(
              <button key={th} onClick={()=>setTheme(th)} style={{padding:"10px 20px",borderRadius:8,border:`2px solid ${theme===th?C.yellow:C.border}`,background:theme===th?`${C.yellow}22`:"transparent",color:theme===th?C.yellow:C.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:theme===th?700:400,display:"flex",alignItems:"center",gap:7,transition:"all .15s"}}>
                <Icon name={ico} size={14} color={theme===th?C.yellow:C.muted}/>{label}
              </button>
            ))}
          </div>
        </div>
        {/* Currencies */}
        <div style={cs}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Icon name="globe" size={13} color={C.yellow}/><span style={{color:C.text,fontSize:13,fontWeight:700}}>{t.settings.currencies}</span></div>
          <div style={{color:C.muted,fontSize:11,marginBottom:10}}>{t.settings.currenciesDesc}</div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <button onClick={()=>setSelected(allSelected?[]:ALL_CURRENCIES.map(c=>c.code))} style={{padding:"6px 14px",borderRadius:7,border:`2px solid ${allSelected?C.blue:C.border}`,background:allSelected?`${C.blue}22`:"transparent",color:allSelected?C.blue:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:allSelected?700:400,display:"flex",alignItems:"center",gap:5}}><Icon name="check" size={12} color={allSelected?C.blue:C.muted}/>{t.settings.allCurrencies}</button>
            <button onClick={()=>setSelected([])} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}44`,background:"transparent",color:selected.length===0?C.text:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{t.settings.noCurrencies}</button>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {ALL_CURRENCIES.map(cur=>{const on=selected.includes(cur.code);return(
              <button key={cur.code} onClick={()=>setSelected(prev=>prev.includes(cur.code)?prev.filter(c=>c!==cur.code):[...prev,cur.code])} style={{padding:"8px 16px",borderRadius:8,border:`2px solid ${on?cur.color:C.border}`,background:on?cur.color+"22":"transparent",color:on?cur.color:C.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:on?700:400,display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                {on&&<Icon name="check" size={11} color={cur.color}/>}<span style={{fontSize:16}}>{cur.sym}</span>{cur.name}
              </button>
            );})}
          </div>
          <div style={{background:C.surface,borderRadius:8,padding:12,border:`1px solid ${C.border2}`}}>
            <div style={{color:C.muted,fontSize:10,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>{t.settings.preview} — 16 035 340 F CFA</div>
            <Amt n={16035340} settings={previewSettings} color={C.blue} size={13} right={false}/>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Admin Security + Language side by side ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        {/* Security */}
        <div style={cs}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="lock" size={13} color={C.red}/><span style={{color:C.text,fontSize:13,fontWeight:700}}>{t.settings.security}</span></div>
          <Field label={t.settings.adminPwd} value={pwd} onChange={setPwd} type="password"/>
        </div>
        {/* Language */}
        <div style={cs}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="globe" size={13} color={C.blue}/><span style={{color:C.text,fontSize:13,fontWeight:700}}>{t.settings.language}</span></div>
          <div style={{display:"flex",gap:8}}>
            {[["fr","🇫🇷 Français"],["en","🇬🇧 English"]].map(([l,lbl])=>(<button key={l} onClick={()=>setLang(l)} style={{padding:"9px 20px",borderRadius:8,border:`2px solid ${lang===l?C.blue:C.border}`,background:lang===l?`${C.blue}22`:"transparent",color:lang===l?C.blue:C.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:lang===l?700:400,transition:"all .15s"}}>{lbl}</button>))}
          </div>
        </div>
      </div>

      <Btn onClick={save} icon={saved?"check":"save"} variant={saved?"green":"primary"}>{saved?t.settings.savedOk:t.settings.save}</Btn>
      <ConfirmModal
        open={!!confirmCat}
        title={lang==="fr"?"Supprimer la categorie ?":"Delete category?"}
        message={lang==="fr"?"Supprimer definitivement la categorie :":"Permanently delete category:"}
        itemName={confirmCat?.name}
        itemType={lang==="fr"?"Categorie personnalisee":"Custom category"}
        lang={lang}
        onConfirm={()=>{const newCats=(s.categories||DEFAULT_CATEGORIES).filter((_,j)=>j!==confirmCat.idx);setData(d=>({...d,settings:{...d.settings,categories:newCats}}));setConfirmCat(null);}}
        onCancel={()=>setConfirmCat(null)}
      />
  </div>);
}



// ── CATEGORY DETAIL ──────────────────────────────────────────────────────────────

// ── Base seed data for agricultural products (numeric, editable) ─────────────────
const AGRI_SEED=[
  {id:1, name:"Cacao",              nameEn:"Cacao",           unit:"kg", saison:"Oct – Sept",    saisonEn:"Oct – Sept",  prixBord:2800, prixGros:3400, transport:1.87, qtyKg:1000},
  {id:2, name:"Café Robusta",       nameEn:"Robusta Coffee",  unit:"kg", saison:"Oct – Août",    saisonEn:"Oct – Aug",   prixBord:1700, prixGros:2150, transport:1.87, qtyKg:1000},
  {id:3, name:"Anacarde (cajou)",   nameEn:"Cashew nut",      unit:"kg", saison:"Fév – Juin",    saisonEn:"Feb – Jun",   prixBord:412,  prixGros:800,  transport:1.87, qtyKg:1000},
  {id:4, name:"Caoutchouc (latex)", nameEn:"Natural rubber",  unit:"kg", saison:"Toute l'année", saisonEn:"Year-round",  prixBord:425,  prixGros:800,  transport:1.87, qtyKg:2000},
  {id:5, name:"Huile de palme",     nameEn:"Palm oil",        unit:"L",  saison:"Toute l'année", saisonEn:"Year-round",  prixBord:525,  prixGros:900,  transport:1.87, qtyKg:1000},
  {id:6, name:"Riz paddy local",    nameEn:"Local paddy rice",unit:"kg", saison:"Toute l'année", saisonEn:"Year-round",  prixBord:300,  prixGros:525,  transport:1.87, qtyKg:5000},
  {id:7, name:"Maïs",               nameEn:"Corn / Maize",    unit:"kg", saison:"Toute l'année", saisonEn:"Year-round",  prixBord:185,  prixGros:350,  transport:1.87, qtyKg:5000},
  {id:8, name:"Manioc",             nameEn:"Cassava",         unit:"kg", saison:"Toute l'année", saisonEn:"Year-round",  prixBord:100,  prixGros:250,  transport:1.87, qtyKg:10000},
  {id:9, name:"Banane plantain",    nameEn:"Plantain banana", unit:"kg", saison:"Toute l'année", saisonEn:"Year-round",  prixBord:250,  prixGros:500,  transport:1.87, qtyKg:2000},
  {id:10,name:"Igname",             nameEn:"Yam",             unit:"kg", saison:"Juil – Mars",   saisonEn:"Jul – Mar",   prixBord:325,  prixGros:700,  transport:1.87, qtyKg:2000},
  {id:11,name:"Tomate fraîche",     nameEn:"Fresh tomato",    unit:"kg", saison:"Nov – Avril",   saisonEn:"Nov – Apr",   prixBord:450,  prixGros:1000, transport:1.87, qtyKg:1000},
];

const calcProfit=(p)=>Math.round((p.prixGros - p.prixBord - (p.transport||0)) * p.qtyKg);
const calcMontantMin=(p)=>Math.round(p.prixBord * p.qtyKg);
const fmtQty=(kg,unit)=>kg>=1000?`${kg/1000} ${unit==="L"?"000 L":"tonne"}${kg>=2000?"s":""}`:kg+" "+unit;

const MERCHANDISE_TYPES_FR=["Produits agricoles","Matériel agricole","Produits d'entretien agricole","Produits alimentaires","Produits cosmétiques","Matériel informatique","Matériel mécanique","Véhicule","Matériel industriel"];
const MERCHANDISE_TYPES_EN=["Agricultural products","Agricultural equipment","Agricultural maintenance products","Food products","Cosmetic products","IT equipment","Mechanical equipment","Vehicle","Industrial equipment"];
const TRANSPORT_TYPES_FR=["Produits agricoles","Produits d'entretien agricole","Matériel agricole","Matériaux de construction","Matériel de construction","Véhicules"];
const TRANSPORT_TYPES_EN=["Agricultural products","Agricultural maintenance products","Agricultural equipment","Construction materials","Construction equipment","Vehicles"];
const PERMANENT_CATEGORIES_EN=[
  "Merchandise transport","Merchandise purchase","Merchandise sale",
  "IT expertise: consulting, installation, maintenance, software & app development",
  "Import-Export of various goods and products",
  "Mobile money transfer services (Orange, MTN, Moov, etc.)",
  "Purchase and sale of land and property, land management",
  "All building and civil engineering works (BTP): construction, development and maintenance",
  "Agri-food, hotel and restaurant sector","Education and training in various fields",
  "Agro-fish farming operation","Road transport",
  "Acquisition, rental and sale of all movable and immovable property",
  "Borrowing from financial institutions with the option to pledge company assets as collateral",
  "All financial, commercial, industrial, movable and immovable operations related to the corporate purpose",
];
const CATEGORY_CONFIG_FR={
  "Transport de marchandise":{icon:"🚚",color:"#FBBC05",hasTypeDropdown:true,dropdownLabelFr:"Type de marchandise",dropdownLabelEn:"Merchandise type",optionsFr:TRANSPORT_TYPES_FR,optionsEn:TRANSPORT_TYPES_EN},
  "Achat de marchandise":{icon:"🛒",color:"#4285F4",hasTypeDropdown:true,dropdownLabelFr:"Type de marchandise",dropdownLabelEn:"Merchandise type",optionsFr:MERCHANDISE_TYPES_FR,optionsEn:MERCHANDISE_TYPES_EN}
};
const CATEGORY_CONFIG_EN={
  "Merchandise transport":{icon:"🚚",color:"#FBBC05",hasTypeDropdown:true,dropdownLabelFr:"Type de marchandise",dropdownLabelEn:"Merchandise type",optionsFr:TRANSPORT_TYPES_FR,optionsEn:TRANSPORT_TYPES_EN},
  "Merchandise purchase":{icon:"🛒",color:"#4285F4",hasTypeDropdown:true,dropdownLabelFr:"Type de marchandise",dropdownLabelEn:"Merchandise type",optionsFr:MERCHANDISE_TYPES_FR,optionsEn:MERCHANDISE_TYPES_EN}
};
const getCategoryConfig=(cat,lang)=>CATEGORY_CONFIG_FR[cat]||CATEGORY_CONFIG_EN[cat]||null;


// ── KEDA transport data (ALEPE → destinations) ──────────────────────────────────
const KEDA_ROUTES=[
  {dest:"SAN PEDRO",    t35:500000,t40:550000,t45:600000,t50:650000},
  {dest:"SOUBRÉ",       t35:500000,t40:550000,t45:600000,t50:650000},
  {dest:"BLOLEQUIN",    t35:700000,t40:750000,t45:800000,t50:850000},
  {dest:"GUIBÉROUA",    t35:450000,t40:500000,t45:550000,t50:600000},
  {dest:"YAMOUSSOUKRO", t35:350000,t40:350000,t45:400000,t50:400000},
  {dest:"DIVO",         t35:300000,t40:300000,t45:350000,t50:350000},
  {dest:"LAKOTA",       t35:350000,t40:350000,t45:400000,t50:400000},
  {dest:"GAGNOA",       t35:350000,t40:350000,t45:400000,t50:400000},
  {dest:"DALOA",        t35:500000,t40:530000,t45:580000,t50:580000},
  {dest:"VAVOUA",       t35:550000,t40:600000,t45:650000,t50:650000},
  {dest:"DOUEKOUE",     t35:600000,t40:600000,t45:650000,t50:650000},
  {dest:"ABENGOUROU",   t35:300000,t40:300000,t45:350000,t50:350000},
  {dest:"BONDOUKOU",    t35:550000,t40:550000,t45:600000,t50:600000},
  {dest:"AGNIBILÉKROU", t35:350000,t40:350000,t45:400000,t50:400000},
  {dest:"ADZOPÉ",       t35:180000,t40:200000,t45:220000,t50:220000},
  {dest:"TOUMODI",      t35:300000,t40:300000,t45:340000,t50:340000},
  {dest:"BOUAKÉ",       t35:450000,t40:450000,t45:480000,t50:480000},
  {dest:"KORHOGO",      t35:700000,t40:700000,t45:750000,t50:750000},
  {dest:"BOUNDIALI",    t35:750000,t40:800000,t45:850000,t50:850000},
  {dest:"KOUTO",        t35:750000,t40:800000,t45:850000,t50:850000},
  {dest:"OUANGOLODOUGOU",t35:750000,t40:800000,t45:850000,t50:850000},
];
const TRANSPORT_COMPANIES_FR=["KEDA CÔTE D'IVOIRE CERAMICS","MELCHAT GHANA LIMITED"];
const TRANSPORT_COMPANIES_EN=["KEDA CÔTE D'IVOIRE CERAMICS","MELCHAT GHANA LIMITED"];

// ── Inline editable cell ─────────────────────────────────────────────────────────
function InlineCell({value,onChange,type="text",min,step,placeholder,style={}}){
  const C=_C;
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(value);
  const ref=useRef(null);
  useEffect(()=>{setVal(value);},[value]);
  useEffect(()=>{if(editing&&ref.current)ref.current.focus();},[editing]);
  const commit=()=>{setEditing(false);if(val!==value)onChange(type==="number"?parseFloat(val)||0:val);};
  if(!editing)return(
    <div onClick={()=>setEditing(true)} title="Cliquer pour modifier" style={{cursor:"pointer",minHeight:20,color:C.dim,...style}}>
      {value!==undefined&&value!==null&&value!==""?value:<span style={{color:C.muted,fontStyle:"italic",fontSize:10}}>—</span>}
      <span style={{marginLeft:4,opacity:0.3,fontSize:9}}>✎</span>
    </div>
  );
  return(
    <input
      ref={ref} type={type} value={val}
      onChange={e=>setVal(e.target.value)}
      onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setEditing(false);setVal(value);}}}
      min={min} step={step} placeholder={placeholder}
      style={{width:"100%",background:C.surface,border:`1px solid ${C.blue}`,borderRadius:5,padding:"3px 7px",color:C.text,fontSize:13,fontWeight:700,outline:"none",fontFamily:"inherit",...style}}
    />
  );
}

function CategoryDetail({category,lang,data,onBack}){
  const C=_C;
  const [selectedType,setSelectedType]=useState("");
  const cfg=getCategoryConfig(category,lang);
  const catOptions=lang==="en"?(cfg?.optionsEn||cfg?.optionsFr||[]):(cfg?.optionsFr||[]);
  const ICONS=["🚚","🛒","📦","💻","🌍","📱","🏠","🏗️","🍽️","📚","🐟","🚛","🏘️","🏦","⚙️"];
  const COLORS=["#FBBC05","#4285F4","#34A853","#4285F4","#EA4335","#34A853","#FBBC05","#EA4335","#34A853","#9C27B0","#34A853","#FBBC05","#FBBC05","#4285F4","#9C27B0"];
  const ci=PERMANENT_CATEGORIES.indexOf(category);
  const icon=ci>=0?ICONS[ci]:"📋";
  const color=ci>=0?COLORS[ci]:C.blue;
  const inp={width:"100%",background:C.surface,border:`1px solid ${C.border}44`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",cursor:"pointer",appearance:"none",WebkitAppearance:"none"};

  // ── Seasons state ──────────────────────────────────────────────────────────────
  const [confirmState,setConfirmState]=useState(null);
  const [selectedCompany,setSelectedCompany]=useState("");
  const [kedaRows,setKedaRows]=useState(KEDA_ROUTES.map(r=>({...r,transport:0})));
  const [seasons,setSeasons]=useState([
    {id:1,label:"Côte d'Ivoire 2025–2026",products:AGRI_SEED.map(p=>({...p}))}
  ]);
  const [activeSeason,setActiveSeason]=useState(1);
  const [showAddSeason,setShowAddSeason]=useState(false);

  const showAgriTable=selectedType===MERCHANDISE_TYPES_FR[0]||selectedType===MERCHANDISE_TYPES_EN[0];
  const showConstTable=selectedType===TRANSPORT_TYPES_FR[4]||selectedType===TRANSPORT_TYPES_EN[4]; // "Matériel de construction"
  const season=seasons.find(s=>s.id===activeSeason)||seasons[0];

  // ── Product CRUD ───────────────────────────────────────────────────────────────
  const updateProduct=(pid,field,value)=>{
    setSeasons(ss=>ss.map(s=>s.id!==activeSeason?s:{
      ...s,products:s.products.map(p=>p.id!==pid?p:{...p,[field]:value})
    }));
  };
  const deleteProduct=(pid)=>{
    const p=season.products.find(x=>x.id===pid);
    setConfirmState({type:lang==="fr"?"Produit agricole":"Agricultural product",name:lang==="en"?p?.nameEn||p?.name:p?.name||"?",onConfirm:()=>{setSeasons(ss=>ss.map(s=>s.id!==activeSeason?s:{...s,products:s.products.filter(pr=>pr.id!==pid)}));setConfirmState(null);}});
  };
  const addProduct=()=>{
    const newId=Date.now();
    const newP={id:newId,name:lang==="fr"?"Nouveau produit":"New product",nameEn:"New product",unit:"kg",saison:"",saisonEn:"",prixBord:0,prixGros:0,transport:1.87,qtyKg:1000};
    setSeasons(ss=>ss.map(s=>s.id!==activeSeason?s:{...s,products:[...s.products,newP]}));
  };

  // ── Season CRUD ────────────────────────────────────────────────────────────────
  const duplicateSeason=(srcId)=>{
    // Always base the new season on the LAST season in the list
    const lastSeason=seasons[seasons.length-1];
    const src=seasons.find(s=>s.id===srcId)||lastSeason;
    const years=lastSeason.label.match(/(\d{4})–(\d{4})/);
    const y1=years?parseInt(years[1])+1:2026;
    const y2=years?parseInt(years[2])+1:2027;
    const newS={id:Date.now(),label:`Côte d'Ivoire ${y1}–${y2}`,products:lastSeason.products.map(p=>({...p,id:Date.now()+Math.random()}))};
    setSeasons(ss=>[...ss,newS]);
    setActiveSeason(newS.id);
    setShowAddSeason(false);
  };
  const deleteSeason=(sid)=>{
    if(seasons.length<=1){alert(lang==="fr"?"Impossible de supprimer la derniere saison.":"Cannot delete the last season.");return;}
    const s=seasons.find(x=>x.id===sid);
    setConfirmState({type:lang==="fr"?"Saison agricole":"Agricultural season",name:s?.label||"?",onConfirm:()=>{setSeasons(ss=>ss.filter(x=>x.id!==sid));setActiveSeason(seasons.find(x=>x.id!==sid)?.id||seasons[0].id);setConfirmState(null);}});
  };
  const renameseason=(sid,label)=>{
    setSeasons(ss=>ss.map(s=>s.id!==sid?s:{...s,label}));
  };

  // ── Print / PDF ─────────────────────────────────────────────────────────────────
  const buildAgriHTML=()=>{
    const settings=data?.settings||{rates:DEFAULT_RATES,selectedCurrencies:["GBP"]};
    const rows=season.products.map(p=>{
      const profitFcfa=calcProfit(p);
      const montantMin=calcMontantMin(p);
      const profitLines=getCurrencyLines(profitFcfa,settings);
      const profitCur=profitLines.map(l=>`<span style="color:${l.color};font-size:10px;display:block;">${l.value}</span>`).join("");
      return`<tr>
        <td><strong>${lang==="en"?p.nameEn:p.name}</strong><br/><span style="color:#888;font-size:10px">/${p.unit}</span></td>
        <td style="text-align:center"><span style="background:#fef3c7;border:1px solid #fbbf24;color:#b45309;border-radius:5px;padding:2px 8px;font-size:10px;white-space:nowrap">${lang==="en"?p.saisonEn:p.saison}</span></td>
        <td style="text-align:right;color:#34A853;font-weight:700">${p.prixBord}<br/><span style="color:#888;font-size:9px">FCFA/${p.unit}</span></td>
        <td style="text-align:right;color:#9C27B0;font-weight:700">${p.transport}<br/><span style="color:#888;font-size:9px">FCFA/${p.unit}</span></td>
        <td style="text-align:right;color:#4285F4;font-weight:700">${p.prixGros}<br/><span style="color:#888;font-size:9px">FCFA/${p.unit}</span></td>
        <td style="text-align:right">${lang==="en"?p.qteMinEn:p.qtyKg+" "+p.unit}</td>
        <td style="text-align:right;font-weight:700">${fmtNum(montantMin)}<br/><span style="color:#888;font-size:9px">F CFA</span></td>
        <td style="text-align:right;color:${profitFcfa>=0?"#34A853":"#EA4335"};font-weight:700">${fmtNum(profitFcfa)}<br/><span style="color:#888;font-size:9px">F CFA</span>${profitCur}</td>
      </tr>`;
    }).join("");
    const title=lang==="fr"?`Produits Agricoles — ${season.label}`:`Agricultural Products — ${season.label}`;
    const formula=lang==="fr"?"Profit = (Prix usine/gros − Prix bord champ − Transport usine) × Quantité min":"Profit = (Factory price − Farm gate − Transport) × Min. quantity";
    const colH=(txt,right=false)=>`<th style="padding:8px 10px;text-align:${right?"right":"left"};background:#1a1a2e;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap">${txt}</th>`;
    return`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;font-size:12px;background:#fff;}
      .content{padding:16px 24px 20px}
      .formula{background:#fef3c7;border:1px solid #fbbf24;color:#92400e;border-radius:7px;padding:7px 14px;font-size:10px;font-weight:700;margin-bottom:14px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{padding:8px 10px;white-space:nowrap}
      td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top}
      .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
      @media print{@page{margin:0;size:A4 landscape}}
    </style></head>
    <body>
${buildPrintHeader(lang==="fr"?"Catégorie : Achat de marchandise":"Category: Merchandise purchase",lang==="fr"?`Produits Agricoles — ${season.label}`:`Agricultural Products — ${season.label}`)}
      <div class="content"><div class="formula">📐 ${formula}</div>
      <table>
        <thead><tr>
          ${colH(lang==="fr"?"Produit":"Product")}
          ${colH(lang==="fr"?"Disponibilité":"Availability",true)}
          ${colH(lang==="fr"?"Prix bord champ":"Farm gate",true)}
          ${colH(lang==="fr"?"Transport usine":"Factory transport",true)}
          ${colH(lang==="fr"?"Prix usine / gros":"Factory / bulk",true)}
          ${colH(lang==="fr"?"Quantité min.":"Min. qty",true)}
          ${colH(lang==="fr"?"Achat min. (FCFA)":"Min. purchase",true)}
          ${colH(lang==="fr"?"Profit estimé":"Est. Profit",true)}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <span>${lang==="fr"?"Source : Prix officiels + moyennes marché agricole ivoirien":"Source: Official prices + Ivorian agricultural market averages"}</span>
        <span>${lang==="fr"?"Généré le":"Generated on"} ${new Date().toLocaleDateString(lang==="fr"?"fr-FR":"en-GB",{year:"numeric",month:"long",day:"numeric"})}</span>
      </div>
      </div>
    </body></html>`;
  };

  const printAgriTable=()=>{
    const win=window.open("","_blank","width=1100,height=700");
    if(!win)return;
    win.document.write(buildAgriHTML());
    win.document.close();
    win.focus();
    setTimeout(()=>{win.print();},400);
  };

  const downloadAgriPDF=()=>{
    const html=buildAgriHTML();
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`produits-agricoles-${season.label.replace(/[\s']/g,"-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────────
  const TH=({ch,right=false,w})=>(
    <th style={{padding:"10px 13px",textAlign:right?"right":"left",color:"#ffffff",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}44`,whiteSpace:"nowrap",background:C.surface,width:w||"auto"}}>{ch}</th>
  );

  return(
    <div style={{padding:"20px 24px",maxWidth:1300,margin:"0 auto"}}>
      {/* Back */}
      <div style={{marginBottom:16}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1px solid ${C.border}44`,borderRadius:8,padding:"6px 14px",color:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
          <Icon name="arrow" size={13} color={C.muted}/>{lang==="fr"?"Retour":"Back"}
        </button>
      </div>

      {/* TOP ROW */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20,alignItems:"stretch"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:13,background:`${color}18`,border:`1px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{icon}</div>
          <div>
            <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:3}}>{lang==="fr"?"Catégorie":"Category"}</div>
            <div style={{color:C.text,fontWeight:800,fontSize:15,lineHeight:1.3}}>{lang==="en"?(PERMANENT_CATEGORIES_EN[ci]||category):category}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5}}><span>🔒</span><span style={{color:C.muted,fontSize:10}}>{lang==="fr"?"Catégorie permanente":"Permanent category"}</span></div>
          </div>
        </div>
        {cfg?.hasTypeDropdown&&(
          <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"18px 20px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <label style={{display:"block",color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{lang==="fr"?cfg.dropdownLabelFr:cfg.dropdownLabelEn} *</label>
            <div style={{position:"relative"}}>
              <select value={selectedType} onChange={e=>setSelectedType(e.target.value)} style={{...inp,paddingRight:36,borderColor:selectedType?color:C.border}}>
                <option value="">{lang==="fr"?"— Sélectionner —":"— Select —"}</option>
                {catOptions.map((opt,i)=><option key={i} value={opt}>{opt}</option>)}
              </select>
              <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:11}}>▼</div>
            </div>
            {selectedType&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:color}}/><span style={{color:color,fontWeight:700,fontSize:12}}>{selectedType}</span></div>}
          </div>
        )}
      </div>

      {/* ── AGRICULTURAL PRODUCTS TABLE ─────────────────────────────────────────── */}
      {showAgriTable&&(
        <div>
          {/* Season tabs */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            {seasons.map(s=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:0}}>
                <button onClick={()=>setActiveSeason(s.id)} style={{padding:"7px 16px",borderRadius:seasons.length>1?"8px 0 0 8px":8,border:`1px solid ${activeSeason===s.id?color:C.border}`,background:activeSeason===s.id?`${color}18`:"transparent",color:activeSeason===s.id?color:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:activeSeason===s.id?700:400,transition:"all .15s",whiteSpace:"nowrap"}}>
                  📅 {s.label}
                </button>
                {seasons.length>1&&<button onClick={()=>deleteSeason(s.id)} style={{padding:"7px 8px",borderRadius:"0 8px 8px 0",border:`1px solid ${C.border}44`,borderLeft:"none",background:"transparent",color:C.red,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>✕</button>}
              </div>
            ))}
            <button onClick={()=>duplicateSeason(activeSeason)} style={{padding:"7px 14px",borderRadius:8,border:`1px dashed ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
              ＋ {lang==="fr"?"Nouvelle saison":"New season"}
            </button>
          </div>

          {/* Table card */}
          <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,overflow:"hidden"}}>
            {/* Header */}
            <div style={{padding:"15px 22px",borderBottom:`1px solid ${C.border}44`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontWeight:800,fontSize:16,color:C.text}}>🌾 {lang==="fr"?`Produits Agricoles — ${season.label}`:`Agricultural Products — ${season.label}`}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <div style={{background:`${C.yellow}18`,border:`1px solid ${C.yellow}30`,color:C.yellow,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{lang==="fr"?"Profit = (Prix usine/gros − Prix bord champ − Transport usine) × Quantité min":"Profit = (Factory price − Farm gate − Transport) × Min. quantity"}</div>
                <div style={{background:`${C.green}15`,border:`1px solid ${C.green}30`,color:C.green,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700}}>{season.products.length} {lang==="fr"?"produits":"products"}</div>
                <button onClick={printAgriTable} title={lang==="fr"?"Imprimer":"Print"} style={{padding:"6px 13px",borderRadius:8,border:`1px solid ${C.blue}`,background:`${C.blue}15`,color:C.blue,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                  🖨️ {lang==="fr"?"Imprimer":"Print"}
                </button>
                <button onClick={downloadAgriPDF} title={lang==="fr"?"Télécharger PDF":"Download PDF"} style={{padding:"6px 13px",borderRadius:8,border:`1px solid ${C.purple}`,background:`${C.purple}15`,color:C.purple,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                  ⬇️ {lang==="fr"?"Télécharger":"Download"}
                </button>
                <button onClick={addProduct} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${color}`,background:`${color}15`,color:color,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                  ＋ {lang==="fr"?"Ajouter":"Add"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr>
                  <TH ch={lang==="fr"?"Produit":"Product"} w="160px"/>
                  <TH ch={lang==="fr"?"Disponibilité":"Availability"} right w="130px"/>
                  <TH ch={lang==="fr"?"Prix bord champ":"Farm gate"} right w="130px"/>
                  <TH ch={lang==="fr"?"Transport usine":"Factory transport"} right w="130px"/>
                  <TH ch={lang==="fr"?"Prix usine / gros":"Factory / bulk"} right w="130px"/>
                  <TH ch={lang==="fr"?"Quantité min.":"Min. quantity"} right w="120px"/>
                  <TH ch={lang==="fr"?"Achat min. (F CFA)":"Min. purchase (FCFA)"} right w="150px"/>
                  <TH ch={lang==="fr"?"Profit estimé":"Est. Profit"} right w="160px"/>
                  <TH ch="" w="40px"/>
                </tr></thead>
                <tbody>
                  {season.products.map((p,i)=>{
                    const profitFcfa=calcProfit(p);
                    const montantMin=calcMontantMin(p);
                    const settings=data?.settings||{rates:DEFAULT_RATES,selectedCurrencies:["GBP"]};
                    const profitLines=getCurrencyLines(profitFcfa,settings);
                    const isPos=profitFcfa>=0;
                    return(
                      <tr key={p.id} style={{borderBottom:`1px solid ${C.border}44`}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.surface+"88"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

                        {/* Product name */}
                        <td style={{padding:"10px 13px",minWidth:160}}>
                          <InlineCell value={lang==="en"?p.nameEn:p.name} onChange={v=>updateProduct(p.id,lang==="en"?"nameEn":"name",v)}
                            style={{fontWeight:800,fontSize:14,color:C.dim}}/>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>/ {p.unit}</div>
                        </td>

                        {/* Availability */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:130}}>
                          <InlineCell value={lang==="en"?p.saisonEn:p.saison} onChange={v=>updateProduct(p.id,lang==="en"?"saisonEn":"saison",v)}
                            style={{display:"inline-block",background:`${C.yellow}18`,border:`1px solid ${C.yellow}30`,color:C.yellow,borderRadius:7,padding:"3px 9px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",textAlign:"center"}}/>
                        </td>

                        {/* Prix bord champ */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:130}}>
                          <InlineCell value={p.prixBord} onChange={v=>updateProduct(p.id,"prixBord",v)} type="number" min="0" step="1"
                            style={{color:C.green,fontWeight:800,fontSize:14,textAlign:"right"}}/>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>FCFA / {p.unit}</div>
                        </td>

                        {/* Transport usine */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:130}}>
                          <InlineCell value={p.transport} onChange={v=>updateProduct(p.id,"transport",v)} type="number" min="0" step="0.01"
                            style={{color:"#9C27B0",fontWeight:800,fontSize:14,textAlign:"right"}}/>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>FCFA / {p.unit}</div>
                        </td>

                        {/* Prix usine / gros */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:130}}>
                          <InlineCell value={p.prixGros} onChange={v=>updateProduct(p.id,"prixGros",v)} type="number" min="0" step="1"
                            style={{color:C.blue,fontWeight:800,fontSize:14,textAlign:"right"}}/>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>FCFA / {p.unit}</div>
                        </td>

                        {/* Quantité min */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:120}}>
                          <InlineCell value={p.qtyKg} onChange={v=>updateProduct(p.id,"qtyKg",v)} type="number" min="1" step="100"
                            style={{color:C.dim,fontWeight:700,fontSize:14,textAlign:"right"}}/>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>{p.unit}</div>
                        </td>

                        {/* Achat min */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:150}}>
                          <div style={{color:C.text,fontWeight:800,fontSize:14}}>{fmtNum(montantMin)}</div>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>F CFA</div>
                        </td>

                        {/* Profit */}
                        <td style={{padding:"10px 13px",textAlign:"right",minWidth:160}}>
                          <div style={{color:isPos?C.green:C.red,fontWeight:800,fontSize:14}}>{fmtNum(profitFcfa)}</div>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>F CFA</div>
                          {profitLines.map((l,li)=>(
                            <div key={li} style={{color:l.color,fontSize:11,fontWeight:600,marginTop:2,whiteSpace:"nowrap"}}>{l.value}</div>
                          ))}
                        </td>

                        {/* Delete */}
                        <td style={{padding:"10px 8px",textAlign:"center"}}>
                          <button onClick={()=>deleteProduct(p.id)} title={lang==="fr"?"Supprimer":"Delete"} style={{background:"transparent",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,cursor:"pointer",padding:"4px 7px",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Icon name="trash" size={12} color={C.red}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{padding:"11px 22px",borderTop:`1px solid ${C.border}44`,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{color:C.muted,fontSize:10}}>✏️ <span style={{color:C.dim}}>{lang==="fr"?"Cliquez sur une valeur pour la modifier directement dans le tableau":"Click any value to edit it directly in the table"}</span></div>
              <div style={{fontSize:10,color:C.muted,marginLeft:"auto",fontStyle:"italic"}}>{lang==="fr"?"Source : Prix officiels + moyennes marché agricole ivoirien · 2025–2026":"Source: Official prices + Ivorian agricultural market averages · 2025–2026"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Construction materials table */}
      {showConstTable&&(
        <div>
          {/* Company selector row */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"0 0 320px"}}>
              <select value={selectedCompany} onChange={e=>setSelectedCompany(e.target.value)}
                style={{width:"100%",background:C.card,border:`1px solid ${selectedCompany?C.blue:C.border}`,borderRadius:8,padding:"8px 36px 8px 12px",color:selectedCompany?C.text:C.muted,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer",appearance:"none",WebkitAppearance:"none"}}>
                <option value="">{lang==="fr"?"— Sélectionner une société —":"— Select a company —"}</option>
                {(lang==="en"?TRANSPORT_COMPANIES_EN:TRANSPORT_COMPANIES_FR).map((c,i)=><option key={i} value={c}>{c}</option>)}
              </select>
              <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:11}}>▼</div>
            </div>
          </div>

          {/* KEDA table */}
          {selectedCompany&&(selectedCompany.includes("KEDA")||selectedCompany.includes("keda"))&&(
            <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}44`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15,color:C.text}}>🏭 {selectedCompany}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2}}>{lang==="fr"?"Tarifs de transport ALEPE → destinations · Tonnage initial : 35T":"Transport rates ALEPE → destinations · Initial tonnage: 35T"}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{background:`${C.yellow}15`,border:`1px solid ${C.yellow}30`,color:C.yellow,borderRadius:7,padding:"4px 12px",fontSize:10,fontWeight:700}}>📐 Profit = Tonnage − Transport facturé</div>
                  <div style={{background:`${C.green}15`,color:C.green,border:`1px solid ${C.green}30`,borderRadius:7,padding:"4px 12px",fontSize:10,fontWeight:700}}>{kedaRows.length} trajets</div>
                  <button onClick={()=>{
                    const win=window.open("","_blank","width=1200,height=750");if(!win)return;
                    const kdSettings=data?.settings||{rates:DEFAULT_RATES,selectedCurrencies:["GBP"]};
                    const curLines=(n)=>getCurrencyLines(n,kdSettings).map(l=>`<div style="color:${l.color};font-size:9px;margin-top:1px">${l.value}</div>`).join("");
                    const amtCell=(n,color="#1a1a2e")=>`<div style="color:${color};font-weight:700">${fmtNum(n)} <span style="color:#1a1a2e;font-weight:600">F CFA</span></div>${getCurrencyLines(n,kdSettings).map(l=>`<div style="color:${l.color};font-weight:700;font-size:11px;margin-top:1px">${l.value}</div>`).join("")}`;
                    const profCell=(n,transport)=>{if(transport===0)return"—";const p=n-transport;const c=p>=0?"#34A853":"#EA4335";return`<div style="color:${c};font-weight:700">${p>=0?"+":"-"}${fmtNum(Math.abs(p))} <span style="color:#1a1a2e;font-weight:600">F CFA</span></div>${getCurrencyLines(Math.abs(p),kdSettings).map(l=>`<div style="color:${l.color};font-weight:700;font-size:11px;margin-top:1px">${p>=0?"+":"-"}${l.value}</div>`).join("")}`};
                    const rows=kedaRows.map(r=>`<tr>
                      <td><b>ALEPE – ${r.dest}</b></td>
                      <td style="text-align:right">${amtCell(r.transport,"#9C27B0")}</td>
                      <td style="text-align:right">${amtCell(r.t35)}</td>
                      <td style="text-align:right">${profCell(r.t35,r.transport)}</td>
                      <td style="text-align:right">${amtCell(r.t40)}</td>
                      <td style="text-align:right">${profCell(r.t40,r.transport)}</td>
                      <td style="text-align:right">${amtCell(r.t45)}</td>
                      <td style="text-align:right">${profCell(r.t45,r.transport)}</td>
                      <td style="text-align:right">${amtCell(r.t50)}</td>
                      <td style="text-align:right">${profCell(r.t50,r.transport)}</td>
                    </tr>`).join("");
                    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${selectedCompany}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;background:#fff}.content{padding:14px 22px 20px}p.formula{background:#fef3c7;border:1px solid #fbbf24;color:#92400e;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;margin-bottom:12px}table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:#fff;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:right;white-space:normal;vertical-align:top}th:first-child{text-align:left}td{padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:11px}td:first-child{text-align:left;font-weight:700}@media print{@page{size:A4 landscape;margin:0}}</style></head><body>${buildPrintHeader("Catégorie : Transport de marchandise",`Matériel de construction — ${selectedCompany}`)}<div class="content"><p class="formula">📐 Profit = Tonnage − Transport facturé</p><table><thead><tr><th style="text-align:left">Trajet<div style="font-weight:400;font-size:9px;opacity:.65;text-transform:none;margin-top:2px">ALEPE →</div></th><th style="color:#CE93D8">Transport<div style="font-weight:400;font-size:9px;opacity:.65;text-transform:none;margin-top:2px">facturé</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">35T – 40T</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">35T – 40T</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">40T – 45T</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">40T – 45T</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">45T – 50T</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">45T – 50T</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">50T+</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">50T+</div></th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`;
                    win.document.write(html);win.document.close();win.focus();setTimeout(()=>win.print(),400);
                  }} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${C.blue}`,background:`${C.blue}15`,color:C.blue,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                    🖨️ {lang==="fr"?"Imprimer":"Print"}
                  </button>
                  <button onClick={()=>{
                    const kdSettings2=data?.settings||{rates:DEFAULT_RATES,selectedCurrencies:["GBP"]};
                    const curLines2=(n)=>getCurrencyLines(n,kdSettings2).map(l=>`<div style="color:${l.color};font-size:9px;margin-top:1px">${l.value}</div>`).join("");
                    const amtCell2=(n,color="#1a1a2e")=>`<div style="color:${color};font-weight:700">${fmtNum(n)} <span style="color:#1a1a2e;font-weight:600">F CFA</span></div>${getCurrencyLines(n,kdSettings2).map(l=>`<div style="color:${l.color};font-weight:700;font-size:11px;margin-top:1px">${l.value}</div>`).join("")}`;
                    const profCell2=(n,transport)=>{if(transport===0)return"—";const p=n-transport;const c=p>=0?"#34A853":"#EA4335";return`<div style="color:${c};font-weight:700">${p>=0?"+":"-"}${fmtNum(Math.abs(p))} <span style="color:#1a1a2e;font-weight:600">F CFA</span></div>${getCurrencyLines(Math.abs(p),kdSettings2).map(l=>`<div style="color:${l.color};font-weight:700;font-size:11px;margin-top:1px">${p>=0?"+":"-"}${l.value}</div>`).join("")}`};
                    const rows=kedaRows.map(r=>`<tr>
                      <td><b>ALEPE – ${r.dest}</b></td>
                      <td style="text-align:right">${amtCell2(r.transport,"#9C27B0")}</td>
                      <td style="text-align:right">${amtCell2(r.t35)}</td>
                      <td style="text-align:right">${profCell2(r.t35,r.transport)}</td>
                      <td style="text-align:right">${amtCell2(r.t40)}</td>
                      <td style="text-align:right">${profCell2(r.t40,r.transport)}</td>
                      <td style="text-align:right">${amtCell2(r.t45)}</td>
                      <td style="text-align:right">${profCell2(r.t45,r.transport)}</td>
                      <td style="text-align:right">${amtCell2(r.t50)}</td>
                      <td style="text-align:right">${profCell2(r.t50,r.transport)}</td>
                    </tr>`).join("");
                    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${selectedCompany}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;background:#fff}.content{padding:14px 22px 20px}p.formula{background:#fef3c7;border:1px solid #fbbf24;color:#92400e;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;margin-bottom:12px}table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:#fff;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;text-align:right;white-space:normal;vertical-align:top}th:first-child{text-align:left}td{padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right}td:first-child{text-align:left;font-weight:700}@media print{@page{size:A4 landscape;margin:0}}</style></head><body>${buildPrintHeader("Catégorie : Transport de marchandise",`Matériel de construction — ${selectedCompany}`)}<div class="content"><p class="formula">📐 Profit = Tonnage − Transport facturé</p><table><thead><tr><th style="text-align:left">Trajet<div style="font-weight:400;font-size:9px;opacity:.65;text-transform:none;margin-top:2px">ALEPE →</div></th><th style="color:#CE93D8">Transport<div style="font-weight:400;font-size:9px;opacity:.65;text-transform:none;margin-top:2px">facturé</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">35T – 40T</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">35T – 40T</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">40T – 45T</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">40T – 45T</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">45T – 50T</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">45T – 50T</div></th><th>Quantité<div style="font-weight:400;font-size:9px;color:#aaa;text-transform:none;margin-top:2px">50T+</div></th><th style="color:#81C995">Profit<div style="font-weight:400;font-size:9px;color:#81C995;opacity:.7;text-transform:none;margin-top:2px">50T+</div></th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`;
                    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html"}));a.download=`${(selectedCompany||"transport").replace(/[^a-zA-Z0-9]/g,"-")}.html`;a.click();
                  }} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${C.purple}`,background:`${C.purple}15`,color:C.purple,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                    ⬇️ {lang==="fr"?"Télécharger":"Download"}
                  </button>
                  <button onClick={()=>setKedaRows(r=>[...r,{dest:"NOUVEAU TRAJET",t35:0,t40:0,t45:0,t50:0,transport:0}])} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${C.green}`,background:`${C.green}15`,color:C.green,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                    ＋ {lang==="fr"?"Ajouter":"Add"}
                  </button>
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr>
                    {[
                      {label:lang==="fr"?"Trajet":"Route",right:false,sub:"ALEPE →",w:"170px",color:"#fff"},
                      {label:lang==="fr"?"Transport":"Charged",right:true,sub:lang==="fr"?"facturé":"transport",color:"#9C27B0",w:"120px"},
                      {label:lang==="fr"?"Quantité":"Qty",right:true,sub:"35T – 40T",w:"130px",color:"#fff"},
                      {label:lang==="fr"?"Profit":"Profit",right:true,sub:"35T – 40T",color:"#34A853",w:"130px"},
                      {label:lang==="fr"?"Quantité":"Qty",right:true,sub:"40T – 45T",w:"130px",color:"#fff"},
                      {label:lang==="fr"?"Profit":"Profit",right:true,sub:"40T – 45T",color:"#34A853",w:"130px"},
                      {label:lang==="fr"?"Quantité":"Qty",right:true,sub:"45T – 50T",w:"130px",color:"#fff"},
                      {label:lang==="fr"?"Profit":"Profit",right:true,sub:"45T – 50T",color:"#34A853",w:"130px"},
                      {label:lang==="fr"?"Quantité":"Qty",right:true,sub:"50T+",w:"130px",color:"#fff"},
                      {label:lang==="fi"?"Profit":"Profit",right:true,sub:"50T+",color:"#34A853",w:"130px"},
                    ].map((h,i)=>(
                      <th key={i} style={{padding:"8px 8px",textAlign:h.right?"right":"left",background:C.surface,color:h.color||C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${C.border}44`,whiteSpace:"nowrap",borderLeft:h.color?`2px solid ${h.color}30`:"none",width:h.w,minWidth:h.w,maxWidth:h.w}}>
                        {h.label}{h.sub&&<span style={{display:"block",fontWeight:400,fontSize:9,letterSpacing:0,textTransform:"none",opacity:.65,marginTop:1}}>{h.sub}</span>}
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {kedaRows.map((r,i)=>{
                      const p35=r.t35-r.transport; const p40=r.t40-r.transport;
                      const p45=r.t45-r.transport; const p50=r.t50-r.transport;
                      const kdCurSettings=data?.settings||{rates:DEFAULT_RATES,selectedCurrencies:["GBP"]};
                      const profitCell=(val)=>{
                        const pos=val>=0;
                        const curLines=getCurrencyLines(Math.abs(val),kdCurSettings);
                        return r.transport>0?(
                          <td style={{padding:"8px 6px",textAlign:"right",borderLeft:`2px solid ${pos?C.green:C.red}22`,background:pos?`${C.green}06`:`${C.red}06`,width:"130px",minWidth:"130px"}}>
                            <div style={{color:pos?C.green:C.red,fontWeight:800,fontSize:12}}>{pos?"+":""}{fmtNum(val)} <span style={{color:pos?C.green:C.red,fontWeight:600}}>F CFA</span></div>
                            {curLines.map((l,li)=><div key={li} style={{color:l.color,fontWeight:700,fontSize:12,marginTop:2,whiteSpace:"nowrap"}}>{pos?"+":"-"}{l.value}</div>)}
                          </td>
                        ):<td style={{padding:"8px 6px",textAlign:"right",color:C.muted,fontSize:11,width:"130px"}}>—</td>;
                      };
                      const upd=(field,val)=>setKedaRows(rows=>rows.map((x,j)=>j===i?{...x,[field]:field==="dest"?val:parseFloat(val)||0}:x));
                      const qtyCell=(val,field,w="130px")=>{
                        const curLines=getCurrencyLines(val,kdCurSettings);
                        return(
                          <td style={{padding:"8px 7px",textAlign:"right",width:w,minWidth:w}}>
                            <InlineCell value={val} onChange={v=>upd(field,v)} type="number" min="0" step="10000"
                              style={{color:"#ffffff",fontWeight:700,fontSize:12,textAlign:"right"}}/>
                            <div style={{color:"#ffffff",fontSize:12,marginTop:1,fontWeight:600}}>F CFA</div>
                            {curLines.map((l,li)=><div key={li} style={{color:l.color,fontWeight:700,fontSize:12,marginTop:2,whiteSpace:"nowrap"}}>{l.value}</div>)}
                          </td>
                        );
                      };
                      return(
                        <tr key={i} style={{borderBottom:`1px solid ${C.border}44`}}
                          onMouseEnter={e=>e.currentTarget.style.background=C.surface+"88"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          {/* Route — editable */}
                          <td style={{padding:"8px 8px",width:"170px",maxWidth:"170px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:3}}>
                              <span style={{color:C.muted,fontWeight:500,fontSize:12,flexShrink:0}}>ALEPE –</span>
                              <InlineCell value={r.dest} onChange={v=>upd("dest",v)} type="text"
                                style={{color:C.dim,fontWeight:700,fontSize:12}}/>
                            </div>
                          </td>
                          {/* Transport facturé — editable */}
                          <td style={{padding:"8px 8px",textAlign:"right",width:"120px",minWidth:"120px",maxWidth:"120px",borderLeft:`2px solid #9C27B022`}}>
                            <InlineCell value={r.transport} onChange={v=>upd("transport",v)} type="number" min="0" step="10000"
                              style={{color:"#9C27B0",fontWeight:800,fontSize:13,textAlign:"right"}}/>
                            <div style={{color:"#9C27B0",fontSize:12,marginTop:1,fontWeight:600}}>F CFA</div>
                            {getCurrencyLines(r.transport,kdCurSettings).map((l,li)=><div key={li} style={{color:l.color,fontWeight:700,fontSize:12,marginTop:2,whiteSpace:"nowrap"}}>{l.value}</div>)}
                          </td>
                          {/* 35T-40T + profit */}
                          {qtyCell(r.t35,"t35","90px")}
                          {profitCell(p35)}
                          {/* 40T-45T + profit */}
                          {qtyCell(r.t40,"t40","90px")}
                          {profitCell(p40)}
                          {/* 45T-50T + profit */}
                          {qtyCell(r.t45,"t45","90px")}
                          {profitCell(p45)}
                          {/* 50T+ + profit */}
                          {qtyCell(r.t50,"t50","80px")}
                          {profitCell(p50)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{padding:"10px 20px",borderTop:`1px solid ${C.border}44`,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{color:C.muted,fontSize:10}}>✏️ <span style={{color:C.dim}}>{lang==="fr"?"Cliquez sur n'importe quelle cellule pour la modifier — les profits se recalculent automatiquement":"Click any cell to edit it — profits recalculate automatically"}</span></div>
                <div style={{marginLeft:"auto",color:C.muted,fontSize:10,fontStyle:"italic"}}>{lang==="fr"?"Source : Grille tarifaire KEDA CI 2025–2026":"Source: KEDA CI rate schedule 2025–2026"}</div>
              </div>
            </div>
          )}

          {selectedCompany&&selectedCompany.includes("MELCHAT")&&(
            <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"36px 24px",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:10}}>🚧</div>
              <div style={{color:C.dim,fontWeight:700,fontSize:14,marginBottom:6}}>MELCHAT GHANA LIMITED</div>
              <div style={{color:C.muted,fontSize:12}}>{lang==="fr"?"Tableau disponible prochainement.":"Table coming soon."}</div>
            </div>
          )}

          {!selectedCompany&&(
            <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"30px 24px",textAlign:"center",opacity:0.6}}>
              <div style={{fontSize:32,marginBottom:8}}>👆</div>
              <div style={{color:C.muted,fontSize:13}}>{lang==="fr"?"Sélectionnez une société pour afficher les tarifs de transport.":"Select a company to display transport rates."}</div>
            </div>
          )}
        </div>
      )}

      {/* Coming soon */}
      {selectedType&&!showAgriTable&&!showConstTable&&(
        <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"36px 24px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🚧</div>
          <div style={{color:C.dim,fontWeight:700,fontSize:15,marginBottom:6}}>{selectedType}</div>
          <div style={{color:C.muted,fontSize:12}}>{lang==="fr"?"Tableau disponible prochainement.":"Table coming soon."}</div>
        </div>
      )}
      {!selectedType&&cfg?.hasTypeDropdown&&(
        <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"32px 24px",textAlign:"center",opacity:0.55}}>
          <div style={{fontSize:36,marginBottom:10}}>👆</div>
          <div style={{color:C.muted,fontSize:13}}>{lang==="fr"?"Sélectionnez un type de marchandise pour afficher le tableau.":"Select a merchandise type to display the table."}</div>
        </div>
      )}
      {!cfg&&(
        <div style={{background:C.card,border:`1px solid ${C.border}44`,borderRadius:14,padding:"32px 24px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>&#128679;</div>
          <div style={{color:C.dim,fontWeight:700,fontSize:14}}>{lang==="fr"?"Fonctionnalite a venir":"Feature coming soon"}</div>
        </div>
      )}
      <ConfirmModal
        open={!!confirmState}
        title={lang==="fr"?"Confirmer la suppression":"Confirm deletion"}
        message={lang==="fr"?"Vous allez supprimer definitivement :":"You are about to permanently delete:"}
        itemName={confirmState?.name}
        itemType={confirmState?.type}
        lang={lang}
        onConfirm={confirmState?.onConfirm}
        onCancel={()=>setConfirmState(null)}
      />
    </div>
  );
}


// ── FORECAST / PROJECTIONS ───────────────────────────────────────────────────────
const MONTHS_FR=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTHS_EN=["January","February","March","April","May","June","July","August","September","October","November","December"];

function Forecast({data,setData,session,t,lang}){
  const C=_C;
  const isAdmin=session.role==="admin";
  const isInvestor=session.role==="investor";

  // Filter projections visible to current user
  const myProjections=isInvestor
    ? data.projections.filter(p=>p.investorId===session.investorId)
    : data.projections;

  const [view,setView]=useState("list"); // "list"|"create"|"detail"
  const [selProj,setSelProj]=useState(null);
  const [confirmProj,setConfirmProj]=useState(null);
  const [confirmAct,setConfirmAct]=useState(null);
  const [editMode,setEditMode]=useState(false);

  // Create form state
  const emptyForm=()=>({
    id:null,
    investorId:"",
    investorName:"",
    title:"",
    months:3,
    createdAt:"",
    entries:[], // [{monthIndex,label,category,description,invested,revenue,expenses}]
  });
  const [form,setForm]=useState(emptyForm());
  const [activeMonth,setActiveMonth]=useState(0);

  // Month labels based on current date
  const now=new Date();
  const getMonthLabels=(n)=>Array.from({length:n},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()+i+1,1);
    return lang==="fr"?MONTHS_FR[d.getMonth()]+" "+d.getFullYear():MONTHS_EN[d.getMonth()]+" "+d.getFullYear();
  });

  const monthLabels=getMonthLabels(form.months);

  // Ensure entries array matches months count
  const syncEntries=(months,existing=[])=>{
    const labels=getMonthLabels(months);
    return Array.from({length:months},(_,i)=>existing[i]||{
      monthIndex:i,
      label:labels[i],
      activities:[],
    });
  };

  const setMonths=(n)=>{
    setForm(f=>({...f,months:n,entries:syncEntries(n,f.entries)}));
    setActiveMonth(0);
  };

  const addActivity=(monthIdx)=>{
    setForm(f=>{
      const entries=[...f.entries];
      entries[monthIdx]={...entries[monthIdx],activities:[...entries[monthIdx].activities,{
        id:Date.now(),category:data.settings.categories[0]||"",description:"",invested:0,revenue:0,expenses:0
      }]};
      return {...f,entries};
    });
  };

  const updateActivity=(monthIdx,actId,field,val)=>{
    setForm(f=>{
      const entries=f.entries.map((e,i)=>i!==monthIdx?e:{
        ...e,
        activities:e.activities.map(a=>a.id!==actId?a:{...a,[field]:field==="invested"||field==="revenue"||field==="expenses"?parseFloat(val)||0:val})
      });
      return {...f,entries};
    });
  };

  const removeActivity=(monthIdx,actId)=>{
    const entry=(form.entries||[])[monthIdx];
    const act=entry?.activities?.find(a=>a.id===actId);
    setConfirmAct({monthIdx,actId,name:act?.description||act?.category||"?"});
  };

  // Calculations
  const calcMonth=(entry)=>{
    const rev=entry.activities.reduce((s,a)=>s+a.revenue,0);
    const exp=entry.activities.reduce((s,a)=>s+a.expenses,0);
    const inv=entry.activities.reduce((s,a)=>s+a.invested,0);
    return {revenue:rev,expenses:exp,invested:inv,profit:rev-exp-inv};
  };

  const calcTotal=(entries)=>{
    const totals=entries.map(calcMonth);
    return {
      revenue:totals.reduce((s,m)=>s+m.revenue,0),
      expenses:totals.reduce((s,m)=>s+m.expenses,0),
      invested:totals.reduce((s,m)=>s+m.invested,0),
      profit:totals.reduce((s,m)=>s+m.profit,0),
    };
  };

  const saveProjection=()=>{
    if(!form.investorId){alert(lang==="fr"?"Sélectionnez un investisseur":"Select an investor");return;}
    if(!form.title.trim()){alert(lang==="fr"?"Ajoutez un titre":"Add a title");return;}
    const proj={
      ...form,
      id:form.id||Date.now(),
      createdAt:form.createdAt||fmtDateTime(),
      updatedAt:fmtDateTime(),
      createdBy:session.username,
    };
    setData(d=>({
      ...d,
      projections:form.id
        ?d.projections.map(p=>p.id===form.id?proj:p)
        :[...d.projections,proj]
    }));
    setView("list");
    setForm(emptyForm());
  };

  const deleteProjection=(id)=>{
    const proj=(data.projections||[]).find(p=>p.id===id);
    setConfirmProj({id,name:proj?.title||"?",investor:proj?.investorName||""});
  };;

  const openEdit=(proj)=>{
    setForm({...proj,entries:syncEntries(proj.months,proj.entries)});
    setActiveMonth(0);
    setView("create");
  };

  const openDetail=(proj)=>{setSelProj(proj);setView("detail");};

  // PDF Print
  const printProjection=(proj)=>{
    const investor=data.investors.find(i=>i.id===proj.investorId);
    const months=lang==="fr"?MONTHS_FR:MONTHS_EN;
    const total=calcTotal(proj.entries);
    const rows=proj.entries.map(e=>{
      const m=calcMonth(e);
      return `<tr><td>${e.label}</td><td>${fmtNum(m.invested)} F CFA</td><td>${fmtNum(m.revenue)} F CFA</td><td>${fmtNum(m.expenses)} F CFA</td><td style="color:${m.profit>=0?"#34A853":"#EA4335"};font-weight:700">${fmtNum(m.profit)} F CFA</td></tr>`;
    }).join("");
    const actRows=proj.entries.flatMap(e=>e.activities.map(a=>`<tr><td>${e.label}</td><td>${a.category}</td><td>${a.description}</td><td>${fmtNum(a.invested)}</td><td>${fmtNum(a.revenue)}</td><td>${fmtNum(a.expenses)}</td><td style="color:${a.revenue-a.expenses-a.invested>=0?"green":"red"}">${fmtNum(a.revenue-a.expenses-a.invested)}</td></tr>`)).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${proj.title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1a1a2e;}
    
    .brand{font-size:20px;font-weight:900;}.brand span:nth-child(1){color:#4285F4}.brand span:nth-child(2){color:#EA4335}.brand span:nth-child(3){color:#FBBC05}.brand span:nth-child(4){color:#34A853}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;}th{background:#f1f5f9;font-weight:700;}
    .total{background:#0a1628;color:white;}.total td{border-color:#1e3a5f;}
    h2{color:#1a1a2e;margin:20px 0 10px;font-size:14px;}
    .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
    .card{padding:12px;border-radius:8px;border:1px solid #e2e8f0;text-align:center;}
    .card .val{font-size:16px;font-weight:800;margin-top:4px;}
    .card .lbl{font-size:10px;color:#64748b;text-transform:uppercase;}
    </style></head><body>
    ${buildPrintHeader(lang==="fr"?"Catégorie: Projection / Forecast":"Category: Projection / Forecast",proj.title)}
    <h2>${lang==="fr"?"Résumé Global":"Global Summary"}</h2>
    <div class="summary">
      <div class="card"><div class="lbl">${lang==="fr"?"Investi":"Invested"}</div><div class="val" style="color:#4285F4">${fmtNum(total.invested)} F</div></div>
      <div class="card"><div class="lbl">${lang==="fr"?"Revenus":"Revenue"}</div><div class="val" style="color:#34A853">${fmtNum(total.revenue)} F</div></div>
      <div class="card"><div class="lbl">${lang==="fr"?"Dépenses":"Expenses"}</div><div class="val" style="color:#EA4335">${fmtNum(total.expenses)} F</div></div>
      <div class="card"><div class="lbl">Profit Net</div><div class="val" style="color:${total.profit>=0?"#34A853":"#EA4335"}">${fmtNum(total.profit)} F</div></div>
    </div>
    <h2>${lang==="fr"?"Résumé par Mois":"Monthly Summary"}</h2>
    <table><thead><tr><th>${lang==="fr"?"Mois":"Month"}</th><th>${lang==="fr"?"Investi":"Invested"}</th><th>${lang==="fr"?"Revenus":"Revenue"}</th><th>${lang==="fr"?"Dépenses":"Expenses"}</th><th>Profit</th></tr></thead>
    <tbody>${rows}<tr class="total"><td><strong>TOTAL</strong></td><td>${fmtNum(total.invested)} F</td><td>${fmtNum(total.revenue)} F</td><td>${fmtNum(total.expenses)} F</td><td style="font-weight:800;color:${total.profit>=0?"#34A853":"#EA4335"}">${fmtNum(total.profit)} F</td></tr></tbody></table>
    <h2>${lang==="fr"?"Détail des Activités":"Activity Details"}</h2>
    <table><thead><tr><th>${lang==="fr"?"Mois":"Month"}</th><th>${lang==="fr"?"Catégorie":"Category"}</th><th>Description</th><th>${lang==="fr"?"Investi":"Invested"}</th><th>${lang==="fr"?"Revenus":"Revenue"}</th><th>${lang==="fr"?"Dépenses":"Expenses"}</th><th>Profit</th></tr></thead><tbody>${actRows}</tbody></table>
    <script>window.onload=()=>window.print();</script></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();
  };

  const shareProjection=(proj,method)=>{
    const investor=data.investors.find(i=>i.id===proj.investorId);
    const total=calcTotal(proj.entries);
    const text=`📊 ${proj.title}
🏢 Thunderfam Investment
👤 ${investor?investor.name:""}
📅 ${proj.months} ${lang==="fr"?"mois":"months"}

💰 ${lang==="fr"?"Investi":"Invested"}: ${fmtNum(total.invested)} F CFA
📈 ${lang==="fr"?"Revenus":"Revenue"}: ${fmtNum(total.revenue)} F CFA
📉 ${lang==="fr"?"Dépenses":"Expenses"}: ${fmtNum(total.expenses)} F CFA
✅ Profit Net: ${fmtNum(total.profit)} F CFA

Créé le ${proj.createdAt}`;
    const enc=encodeURIComponent(text);
    if(method==="whatsapp")window.open(`https://wa.me/?text=${enc}`,"_blank");
    else if(method==="telegram")window.open(`https://t.me/share/url?text=${enc}`,"_blank");
    else if(method==="email"){
      const subject=encodeURIComponent(`[Thunderfam] ${proj.title}`);
      window.open(`mailto:?subject=${subject}&body=${enc}`,"_blank");
    }
    else if(method==="native"&&navigator.share){navigator.share({title:proj.title,text});}
  };

  // ── STYLES ──
  const inp={width:"100%",background:C.surface,border:`1px solid ${C.border}44`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"};
  const card={background:C.card,border:`1px solid ${C.border}44`,borderRadius:12,padding:"16px 18px"};

  // ── LIST VIEW ──────────────────────────────────────────────────────────────────
  if(view==="list")return(
    <div style={{padding:"24px",maxWidth:1000,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:C.text}}>{lang==="fr"?"📊 Projections":"📊 Forecast"}</div>
          <div style={{color:C.muted,fontSize:12,marginTop:2}}>{lang==="fr"?"Planifiez et visualisez les performances futures":"Plan and visualize future performance"}</div>
        </div>
        {isAdmin&&<Btn onClick={()=>{setForm({...emptyForm(),entries:syncEntries(3)});setActiveMonth(0);setView("create");}} icon="add">{lang==="fr"?"+ Nouvelle Projection":"+ New Forecast"}</Btn>}
      </div>

      {/* Empty state */}
      {myProjections.length===0&&(
        <div style={{...card,textAlign:"center",padding:48}}>
          <div style={{fontSize:48,marginBottom:12}}>📊</div>
          <div style={{color:C.dim,fontWeight:700,marginBottom:6}}>{lang==="fr"?"Aucune projection":"No forecasts yet"}</div>
          <div style={{color:C.muted,fontSize:12}}>{isAdmin?(lang==="fr"?"Créez votre première projection ci-dessus":"Create your first forecast above"):(lang==="fr"?"L'administrateur n'a pas encore créé de projection":"No forecasts have been created yet")}</div>
        </div>
      )}

      {/* Projections grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {myProjections.map(proj=>{
          const investor=data.investors.find(i=>i.id===proj.investorId);
          const total=calcTotal(proj.entries);
          return(
            <div key={proj.id} style={{...card,cursor:"pointer",transition:"all .15s"}} onClick={()=>openDetail(proj)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:800,color:C.text,fontSize:14,marginBottom:3}}>{proj.title}</div>
                  <div style={{color:C.muted,fontSize:11}}>{investor?.name||"—"}</div>
                </div>
                <div style={{background:`${"#9C27B0"}18`,border:`1px solid ${"#9C27B0"}44`,color:"#9C27B0",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{proj.months} {lang==="fr"?"mois":"mo."}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {l:lang==="fr"?"Revenus":"Revenue",v:total.revenue,c:C.green},
                  {l:lang==="fr"?"Dépenses":"Expenses",v:total.expenses,c:C.red},
                  {l:lang==="fr"?"Investi":"Invested",v:total.invested,c:C.blue},
                  {l:"Profit Net",v:total.profit,c:total.profit>=0?C.green:C.red},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.surface,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.l}</div>
                    <div style={{color:s.c,fontWeight:700,fontSize:12,marginTop:2}}>{fmtNum(s.v)} F</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{color:C.muted,fontSize:10}}>{proj.updatedAt||proj.createdAt}</div>
                {isAdmin&&(
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <Btn small variant="secondary" onClick={()=>openEdit(proj)}><Icon name="edit" size={11}/></Btn>
                    <Btn small variant="danger" onClick={()=>deleteProjection(proj.id)}><Icon name="trash" size={11}/></Btn>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────────
  if(view==="detail"&&selProj){
    const proj=selProj;
    const investor=data.investors.find(i=>i.id===proj.investorId);
    const total=calcTotal(proj.entries);
    const [showShare,setShowShare]=useState(false);
    return(
      <div style={{padding:"24px",maxWidth:1000,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Btn small variant="secondary" onClick={()=>{setSelProj(null);setView("list");}}><Icon name="arrow" size={12}/> {lang==="fr"?"Retour":"Back"}</Btn>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:C.text}}>{proj.title}</div>
              <div style={{color:C.muted,fontSize:11}}>{investor?.name} · {proj.months} {lang==="fr"?"mois":"months"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,position:"relative"}}>
            <Btn small variant="secondary" onClick={()=>printProjection(proj)}><Icon name="print" size={11}/> PDF</Btn>
            <div>
              <Btn small variant="secondary" onClick={()=>setShowShare(s=>!s)}>📤 {lang==="fr"?"Partager":"Share"}</Btn>
              {showShare&&(
                <div style={{position:"absolute",right:0,top:"110%",zIndex:200,background:C.card,border:`1px solid ${C.border}44`,borderRadius:10,padding:8,minWidth:170,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
                  {[["email","📧 Email"],["whatsapp","💬 WhatsApp"],["telegram","✈️ Telegram"],["native","📱 Partager"]].map(([m,lb])=>(
                    <div key={m} onClick={()=>{shareProjection(proj,m);setShowShare(false);}} style={{padding:"8px 12px",borderRadius:7,cursor:"pointer",color:C.dim,fontSize:12,display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background=C.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{lb}</div>
                  ))}
                </div>
              )}
            </div>
            {isAdmin&&<Btn small onClick={()=>openEdit(proj)}><Icon name="edit" size={11}/> {lang==="fr"?"Modifier":"Edit"}</Btn>}
          </div>
        </div>

        {/* Global summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {l:lang==="fr"?"Total Investi":"Total Invested",v:total.invested,c:C.blue,icon:"💰"},
            {l:lang==="fr"?"Total Revenus":"Total Revenue",v:total.revenue,c:C.green,icon:"📈"},
            {l:lang==="fr"?"Total Dépenses":"Total Expenses",v:total.expenses,c:C.red,icon:"📉"},
            {l:"Profit Net Total",v:total.profit,c:total.profit>=0?C.green:C.red,icon:"✅"},
          ].map((s,i)=>(
            <div key={i} style={{...card,textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
              <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{s.l}</div>
              <div style={{color:s.c,fontWeight:800,fontSize:16}}>{fmtNum(s.v)}</div>
              <div style={{color:C.muted,fontSize:10}}>F CFA</div>
            </div>
          ))}
        </div>

        {/* Monthly breakdown */}
        <div style={{...card,marginBottom:16}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:14,fontSize:13}}>{lang==="fr"?"Résumé par Mois":"Monthly Breakdown"}</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.surface}}>
                  {[lang==="fr"?"Mois":"Month",lang==="fr"?"Investi":"Invested",lang==="fr"?"Revenus":"Revenue",lang==="fr"?"Dépenses":"Expenses","Profit"].map((h,i)=>(
                    <th key={i} style={{padding:"8px 12px",textAlign:i===0?"left":"right",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}44`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proj.entries.map((e,i)=>{
                  const m=calcMonth(e);
                  return(
                    <tr key={i} style={{borderBottom:`1px solid ${C.border}44`}}>
                      <td style={{padding:"8px 12px",color:C.dim,fontWeight:600}}>{e.label}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",color:C.blue}}>{fmtNum(m.invested)}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",color:C.green}}>{fmtNum(m.revenue)}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",color:C.red}}>{fmtNum(m.expenses)}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",color:m.profit>=0?C.green:C.red,fontWeight:700}}>{fmtNum(m.profit)}</td>
                    </tr>
                  );
                })}
                <tr style={{background:C.surface,fontWeight:800}}>
                  <td style={{padding:"8px 12px",color:C.text}}>TOTAL</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.blue}}>{fmtNum(total.invested)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.green}}>{fmtNum(total.revenue)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.red}}>{fmtNum(total.expenses)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:total.profit>=0?C.green:C.red,fontWeight:800}}>{fmtNum(total.profit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity details per month */}
        {proj.entries.map((entry,mi)=>{
          const m=calcMonth(entry);
          return entry.activities.length>0?(
            <div key={mi} style={{...card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>📅 {monthLabels[form.entries.indexOf(entry)]||entry.label}</div>
                <div style={{display:"flex",gap:12}}>
                  <span style={{color:C.green,fontSize:11}}>+{fmtNum(m.revenue)}</span>
                  <span style={{color:C.red,fontSize:11}}>-{fmtNum(m.expenses)}</span>
                  <span style={{color:m.profit>=0?C.green:C.red,fontWeight:700,fontSize:11}}>={fmtNum(m.profit)}</span>
                </div>
              </div>
              {entry.activities.map(a=>{
                const p=a.revenue-a.expenses-a.invested;
                return(
                  <div key={a.id} style={{background:C.surface,borderRadius:8,padding:"10px 12px",marginBottom:6,border:`1px solid ${C.border}44`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:600,color:C.dim,fontSize:12}}>{a.category}</div>
                        {a.description&&<div style={{color:C.muted,fontSize:11,marginTop:2}}>{a.description}</div>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:p>=0?C.green:C.red,fontWeight:700,fontSize:12}}>{fmtNum(p)} F</div>
                        <div style={{color:C.muted,fontSize:9}}>profit</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:16,marginTop:8}}>
                      {[{l:lang==="fr"?"Investi":"Inv.",v:a.invested,c:C.blue},{l:lang==="fr"?"Revenus":"Rev.",v:a.revenue,c:C.green},{l:lang==="fr"?"Dépenses":"Exp.",v:a.expenses,c:C.red}].map((s,i)=>(
                        <div key={i}><span style={{color:C.muted,fontSize:10}}>{s.l}: </span><span style={{color:s.c,fontWeight:600,fontSize:11}}>{fmtNum(s.v)}</span></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ):null;
        })}
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ────────────────────────────────────────────────────────
  if(view==="create"&&isAdmin){
    const monthTotal=calcMonth(form.entries[activeMonth]||{activities:[]});
    const grandTotal=calcTotal(form.entries);
    return(
      <div style={{padding:"24px",maxWidth:1100,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Btn small variant="secondary" onClick={()=>{setView("list");setForm(emptyForm());}}><Icon name="arrow" size={12}/> {lang==="fr"?"Retour":"Back"}</Btn>
            <div style={{fontWeight:800,fontSize:18,color:C.text}}>{form.id?(lang==="fr"?"Modifier Projection":"Edit Forecast"):(lang==="fr"?"Nouvelle Projection":"New Forecast")}</div>
          </div>
          <Btn onClick={saveProjection}><Icon name="save" size={13}/> {lang==="fr"?"Enregistrer":"Save"}</Btn>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {/* Title */}
          <div>
            <label style={{display:"block",color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{lang==="fr"?"Titre *":"Title *"}</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={inp} placeholder={lang==="fr"?"Ex: Projection Q1 2026":"E.g. Q1 2026 Forecast"}/>
          </div>
          {/* Investor selector */}
          <div>
            <label style={{display:"block",color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{lang==="fr"?"Investisseur *":"Investor *"}</label>
            <select value={form.investorId} onChange={e=>{const inv=data.investors.find(i=>i.id===parseInt(e.target.value));setForm(f=>({...f,investorId:inv?inv.id:"",investorName:inv?inv.name:""}));}} style={{...inp,cursor:"pointer"}}>
              <option value="">{lang==="fr"?"— Sélectionner —":"— Select —"}</option>
              {data.investors.map(inv=><option key={inv.id} value={inv.id}>{inv.name}</option>)}
            </select>
          </div>
        </div>

        {/* Months selector */}
        <div style={{...card,marginBottom:16}}>
          <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{lang==="fr"?"Nombre de mois":"Number of months"}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {Array.from({length:12},(_,i)=>i+1).map(n=>(
              <button key={n} onClick={()=>setMonths(n)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${form.months===n?C.blue:C.border}`,background:form.months===n?C.blue+"22":"transparent",color:form.months===n?C.blue:C.muted,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,transition:"all .15s"}}>{n}</button>
            ))}
          </div>
        </div>

        {/* Month tabs + content */}
        <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
          {/* Left: month tabs */}
          <div style={{...card,padding:8}}>
            <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"4px 8px",marginBottom:6}}>{lang==="fr"?"Mois":"Months"}</div>
            {form.entries.map((e,mi)=>{
              const m=calcMonth(e);
              const isActive=activeMonth===mi;
              return(
                <div key={mi} onClick={()=>setActiveMonth(mi)} style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",background:isActive?C.blue+"18":"transparent",border:`1px solid ${isActive?C.blue:C.border}`,marginBottom:4,transition:"all .15s"}}>
                  <div style={{fontWeight:isActive?700:500,color:isActive?C.blue:C.dim,fontSize:12}}>{monthLabels[mi]}</div>
                  <div style={{fontSize:10,color:m.profit>=0?C.green:m.profit<0?C.red:C.muted,marginTop:1}}>{e.activities.length} act. · {fmtNum(m.profit)} F</div>
                </div>
              );
            })}
            {/* Grand total */}
            <div style={{padding:"8px 10px",borderRadius:8,background:C.surface,border:`1px solid ${C.border}44`,marginTop:8}}>
              <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{lang==="fr"?"TOTAL":"TOTAL"}</div>
              <div style={{color:grandTotal.profit>=0?C.green:C.red,fontWeight:800,fontSize:13,marginTop:2}}>{fmtNum(grandTotal.profit)} F</div>
            </div>
          </div>

          {/* Right: month activities */}
          <div>
            <div style={{...card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,color:C.text,fontSize:14}}>📅 {monthLabels[activeMonth]}</div>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  {[
                    {l:lang==="fr"?"Investi":"Inv.",v:monthTotal.invested,c:C.blue},
                    {l:lang==="fr"?"Rev.":"Rev.",v:monthTotal.revenue,c:C.green},
                    {l:lang==="fr"?"Dép.":"Exp.",v:monthTotal.expenses,c:C.red},
                    {l:"Profit",v:monthTotal.profit,c:monthTotal.profit>=0?C.green:C.red},
                  ].map((s,i)=>(
                    <div key={i} style={{textAlign:"center"}}>
                      <div style={{color:C.muted,fontSize:9}}>{s.l}</div>
                      <div style={{color:s.c,fontWeight:700,fontSize:12}}>{fmtNum(s.v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities for active month */}
              {(form.entries[activeMonth]?.activities||[]).map((act,ai)=>{
                const profit=act.revenue-act.expenses-act.invested;
                return(
                  <div key={act.id} style={{background:C.surface,border:`1px solid ${C.border}44`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div style={{color:C.dim,fontWeight:600,fontSize:12}}>Activité {ai+1}</div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:11}}>
                          <span style={{color:C.muted}}>Profit: </span>
                          <span style={{color:profit>=0?C.green:C.red,fontWeight:700}}>{fmtNum(profit)} F CFA</span>
                        </div>
                        <Btn small variant="danger" onClick={()=>removeActivity(activeMonth,act.id)}><Icon name="trash" size={10}/></Btn>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div>
                        <label style={{display:"block",color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{lang==="fr"?"Catégorie":"Category"}</label>
                        <select value={act.category} onChange={e=>updateActivity(activeMonth,act.id,"category",e.target.value)} style={{...inp,fontSize:11,padding:"6px 10px"}}>
                          {data.settings.categories.map((c,i)=>{const pIdx=PERMANENT_CATEGORIES.indexOf(c);const label=lang==="en"&&pIdx>=0?(PERMANENT_CATEGORIES_EN[pIdx]||c):c;const disp=label.length>55?label.substring(0,55)+"...":label;return<option key={i} value={c}>{disp}</option>;})}
                        </select>
                      </div>
                      <div>
                        <label style={{display:"block",color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Description</label>
                        <input value={act.description} onChange={e=>updateActivity(activeMonth,act.id,"description",e.target.value)} style={{...inp,fontSize:11,padding:"6px 10px"}} placeholder={lang==="fr"?"Description libre...":"Free description..."}/>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[
                        {k:"invested",l:"💰 "+(lang==="fr"?"Investi (F CFA)":"Invested (F CFA)"),c:C.blue},
                        {k:"revenue",l:"📈 "+(lang==="fr"?"Revenus (F CFA)":"Revenue (F CFA)"),c:C.green},
                        {k:"expenses",l:"📉 "+(lang==="fr"?"Dépenses (F CFA)":"Expenses (F CFA)"),c:C.red},
                      ].map(f=>(
                        <div key={f.k}>
                          <label style={{display:"block",color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{f.l}</label>
                          <input type="number" value={act[f.k]} onChange={e=>updateActivity(activeMonth,act.id,f.k,e.target.value)} style={{...inp,fontSize:11,padding:"6px 10px",borderColor:f.c+"44"}} min="0"/>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <Btn variant="secondary" small onClick={()=>addActivity(activeMonth)}>+ {lang==="fr"?"Ajouter une activité":"Add activity"}</Btn>
            </div>
          </div>
        </div>
      
      <ConfirmModal
        open={!!confirmProj}
        title={lang==="fr"?"Confirmer la suppression":"Confirm deletion"}
        message={lang==="fr"?"Supprimer definitivement la projection :":"Permanently delete projection:"}
        itemName={confirmProj?(confirmProj.name+(confirmProj.investor?" - "+confirmProj.investor:"")):""}
        itemType="Projection / Forecast"
        lang={lang}
        onConfirm={()=>{setData(d=>({...d,projections:d.projections.filter(p=>p.id!==confirmProj.id)}));addAudit(setData,session,"Projection supprimee","Forecast","delete");setConfirmProj(null);}}
        onCancel={()=>setConfirmProj(null)}
      />
      <ConfirmModal
        open={!!confirmAct}
        title={lang==="fr"?"Supprimer l activite ?":"Delete activity?"}
        message={lang==="fr"?"Supprimer definitivement l activite :":"Permanently delete activity:"}
        itemName={confirmAct?.name}
        itemType={lang==="fr"?"Activite de projection":"Projection activity"}
        lang={lang}
        onConfirm={()=>{if(confirmAct){setForm(f=>{const entries=f.entries.map((e,i)=>i!==confirmAct.monthIdx?e:{...e,activities:e.activities.filter(a=>a.id!==confirmAct.actId)});return{...f,entries};});setConfirmAct(null);}}}
        onCancel={()=>setConfirmAct(null)}
      /></div>
    );
  }

  return null;
}

// ── APP ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang,setLang]=useState("fr");
  const [theme,setTheme]=useState("dark");
  const [data,setData]=useState(INIT);
  const [session,setSession]=useState(null);
  const [view,setView]=useState("dashboard");
  const [showNotif,setShowNotif]=useState(false);
  const [showUserMenu,setShowUserMenu]=useState(false);
  const [showCatMenu,setShowCatMenu]=useState(false);
  const [selCategory,setSelCategory]=useState(null);

  // Apply theme globally
  _C = theme==="dark" ? DARK : LIGHT;
  _lang = lang;
  const C=_C;
  const t=T[lang];

  useEffect(()=>{fetchLiveRates().then(rates=>{if(rates)setData(d=>({...d,settings:{...d.settings,rates,ratesLastUpdated:fmtDateTime()}}));});},[]);

  const doLogout=()=>{setSession(null);setView("dashboard");};
  const markAllRead=()=>setData(d=>({...d,notifications:d.notifications.map(n=>({...n,read:true}))}));
  const unread=data.notifications.filter(n=>!n.read).length;

  if(!session){return<LoginScreen data={data} setData={setData} onLogin={u=>{setSession(u);setLang(data.settings.language||"fr");setTheme(data.settings.theme||"dark");}} lang={lang} setLang={setLang}/>;}

  const role=session.role;
  const s=data.settings;
  const activeCurs=ALL_CURRENCIES.filter(c=>(s.selectedCurrencies||[]).includes(c.code));
  const navTabs=[
    {key:"dashboard",icon:"dashboard",label:t.nav.dashboard,color:C.blue,show:true},
    {key:"analytics", icon:"analytics", label:t.nav.analytics, color:C.teal, show:true},
    {key:"reports",   icon:"reports",   label:role==="investor"?t.report.myReports:t.nav.reports, color:C.red, show:true},
    {key:"investors", icon:"investors", label:t.nav.investors,  color:C.yellow, show:true},
    {key:"users",     icon:"users",     label:t.nav.users,      color:C.purple, show:can(session,"manage_users")},
    {key:"audit",     icon:"audit",     label:t.nav.audit,      color:C.green,  show:can(session,"view_audit")},
    {key:"categories",icon:"activity",  label:t.nav.categories, color:"#FBBC05", show:true, hasSub:true},
    {key:"forecast",  icon:"forecast",  label:t.nav.forecast,   color:"#9C27B0", show:role==="admin"||role==="investor"},
    {key:"settings",  icon:"settings",  label:t.nav.settings,   color:C.green,  show:true},
  ].filter(n=>n.show);

  const views={
    dashboard: <Dashboard  data={data} session={session} t={t}/>,
    analytics: <Analytics  data={data} session={session} t={t} lang={lang}/>,
    reports:   <Reports    data={data} setData={setData} session={session} t={t} lang={lang}/>,
    investors: <Investors  data={data} setData={setData} session={session} t={t} lang={lang}/>,
    users:     can(session,"manage_users")?<UsersPanel data={data} setData={setData} session={session} t={t}/>:<div style={{padding:40,textAlign:"center",color:C.red}}>{t.accessDenied}</div>,
    audit:     can(session,"view_audit")?<AuditLog data={data} t={t}/>:<div style={{padding:40,textAlign:"center",color:C.red}}>{t.accessDenied}</div>,
    forecast:  <Forecast data={data} setData={setData} session={session} t={t} lang={lang}/>,
    category_detail: <CategoryDetail category={selCategory} lang={lang} data={data} onBack={()=>setView('dashboard')}/>,
    settings:  <Settings   data={data} setData={setData} session={session} t={t} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme}/>,
  };
  const roleInfo=ROLES[role];

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}} onClick={()=>setShowCatMenu(false)}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}input,select{color-scheme:${theme};}input:focus,select:focus{border-color:${C.blue}!important;outline:none;box-shadow:0 0 0 2px ${C.blue}22;}button{transition:filter .15s,background .15s;}button:not(:disabled):hover{filter:brightness(1.12);}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:${C.surface};}::-webkit-scrollbar-thumb{background:${C.border2};border-radius:3px;}`}</style>

      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}44`,padding:"0 18px",display:"flex",alignItems:"center",gap:14,height:54,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <TFLogo size={28}/>
          <div>
            <div style={{fontSize:13,fontWeight:800}}><span style={{color:C.blue}}>Th</span><span style={{color:C.red}}>un</span><span style={{color:C.yellow}}>der</span><span style={{color:C.green}}>fam</span><span style={{color:C.text}}> Investment</span></div>
            <div style={{color:C.muted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>IN — CI</div>
          </div>
        </div>

        <nav style={{display:"flex",gap:1,flex:1,justifyContent:"center",flexWrap:"wrap",position:"relative"}}>
          {navTabs.map(n=>{const active=view===n.key||("categories"===n.key&&showCatMenu);
            if(n.key==="categories") return(
              <div key="categories" style={{position:"relative"}}>
                <button onClick={e=>{e.stopPropagation();setShowCatMenu(v=>!v);}} style={{padding:"0 10px",height:36,border:"none",background:showCatMenu?n.color+"18":"transparent",color:showCatMenu?n.color:C.muted,borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:showCatMenu?700:500,display:"flex",alignItems:"center",gap:5,borderBottom:showCatMenu?`2px solid ${n.color}`:"2px solid transparent"}}>
                  <Icon name="activity" size={12} color={showCatMenu?n.color:C.muted}/>{n.label}<span style={{fontSize:9,marginLeft:1,opacity:0.7}}>{showCatMenu?"▲":"▼"}</span>
                </button>
                {showCatMenu&&(
                  <div style={{position:"absolute",top:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",zIndex:500,background:C.card,border:`1px solid ${C.border}44`,borderRadius:12,padding:"8px 0",boxShadow:"0 16px 48px rgba(0,0,0,0.6)",minWidth:340,maxWidth:420,maxHeight:"70vh",overflowY:"auto"}}
                    onClick={e=>e.stopPropagation()}>
                    <div style={{padding:"8px 16px 6px",borderBottom:`1px solid ${C.border}44`,marginBottom:4}}>
                      <div style={{color:n.color,fontWeight:800,fontSize:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>{lang==="fr"?"Secteurs d'Activité":"Activity Sectors"}</div>
                      <div style={{color:C.muted,fontSize:10,marginTop:1}}>{lang==="fr"?"Catégories permanentes de Thunderfam Investment":"Thunderfam Investment permanent categories"}</div>
                    </div>
                    {PERMANENT_CATEGORIES.map((cat,i)=>{
                      const icons=["🚚","🛒","📦","💻","🌍","📱","🏠","🏗️","🍽️","📚","🐟","🚛","🏘️","🏦","⚙️"];
                      const colors=[C.yellow,C.blue,C.green,"#4285F4","#EA4335","#34A853","#FBBC05","#EA4335","#34A853","#9C27B0","#34A853",C.yellow,"#FBBC05","#4285F4","#9C27B0"];
                      const locked=i>1;
                      const catLabel=lang==="en"?(PERMANENT_CATEGORIES_EN[i]||cat):cat;
                      return(
                        <div key={i} onClick={()=>{setSelCategory(cat);setView("category_detail");setShowCatMenu(false);}} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 16px",borderRadius:0,cursor:"pointer",borderBottom:i<PERMANENT_CATEGORIES.length-1?`1px solid ${C.border}22`:"none"}}
                          onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{width:28,height:28,borderRadius:7,background:`${colors[i]}18`,border:`1px solid ${colors[i]}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginTop:1}}>{icons[i]}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{color:C.dim,fontSize:11,fontWeight:600,lineHeight:1.35}}>{catLabel}</div>
                          </div>
                          {locked&&<div style={{fontSize:10,color:C.muted,flexShrink:0,marginTop:4}}>🔒</div>}
                          <div style={{fontSize:9,color:C.muted,flexShrink:0,marginTop:5,opacity:0.5}}>›</div>
                        </div>
                      );
                    })}
                    <div style={{padding:"8px 16px",borderTop:`1px solid ${C.border}44`,marginTop:4}}>
                      <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em"}}>{fmtNum(PERMANENT_CATEGORIES.length)} {lang==="fr"?"catégories au total":"categories total"}</div>
                    </div>
                  </div>
                )}
              </div>
            );
            return(
            <button key={n.key} onClick={()=>{setView(n.key);setShowCatMenu(false);}} style={{padding:"0 10px",height:36,border:"none",background:active?n.color+"18":"transparent",color:active?n.color:C.muted,borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:active?700:500,display:"flex",alignItems:"center",gap:5,borderBottom:active?`2px solid ${n.color}`:"2px solid transparent"}}>
              <Icon name={n.icon} size={12} color={active?n.color:C.muted}/>{n.label}
            </button>
          );})}
        </nav>

        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>

          {/* Notifications */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowNotif(v=>!v)} style={{background:unread>0?`${C.yellow}22`:C.surface,border:`1px solid ${unread>0?C.yellow:C.border}`,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <Icon name="bell" size={14} color={unread>0?C.yellow:C.muted}/>
              {unread>0&&<span style={{position:"absolute",top:-3,right:-3,background:C.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
            </button>
            {showNotif&&<div style={{position:"absolute",top:38,right:0,width:300,background:C.card,border:`1px solid ${C.border}44`,borderRadius:10,boxShadow:"0 16px 40px rgba(0,0,0,0.4)",zIndex:200,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderBottom:`1px solid ${C.border}44`}}>
                <span style={{color:C.text,fontSize:12,fontWeight:700}}>{t.notifications}</span>
                <button onClick={markAllRead} style={{background:"none",border:"none",color:C.blue,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{t.markAllRead}</button>
              </div>
              <div style={{maxHeight:280,overflowY:"auto"}}>
                {data.notifications.length===0&&<div style={{padding:20,textAlign:"center",color:C.muted,fontSize:12}}>{t.noNotifications}</div>}
                {data.notifications.map(n=>(
                  <div key={n.id} style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}44`,background:n.read?"transparent":C.surface,opacity:n.read?0.6:1}}>
                    <div style={{display:"flex",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:n.type==="success"?C.green:n.type==="warning"?C.yellow:C.blue,flexShrink:0,marginTop:4}}/>
                      <div><div style={{color:C.dim,fontSize:11}}>{n.msg}</div><div style={{color:C.muted,fontSize:9,marginTop:2}}>{n.date}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>}
          </div>

          {/* Lang toggle */}
          <button onClick={()=>setLang(l=>l==="fr"?"en":"fr")} style={{padding:"4px 8px",border:`1px solid ${C.border}44`,borderRadius:7,background:"transparent",color:C.dim,cursor:"pointer",fontSize:10,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
            <Icon name="globe" size={10} color={C.dim}/>{lang==="fr"?"EN":"FR"}
          </button>

          {/* User menu — contains theme, currencies, logout */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowUserMenu(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",background:showUserMenu?C.surface:C.bg,border:`1px solid ${showUserMenu?C.border2:C.border}`,borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>
              <div style={{width:22,height:22,borderRadius:6,background:(roleInfo?.color||C.blue)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{roleInfo?.icon||"👤"}</div>
              <div style={{textAlign:"left"}}>
                <div style={{color:C.text,fontSize:11,fontWeight:700,lineHeight:1.1}}>{session.name}</div>
                <div style={{color:roleInfo?.color||C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{lang==="fr"?roleInfo?.label:roleInfo?.labelEn}</div>
              </div>
              <Icon name={showUserMenu?"chevron-up":"chevron-down"} size={10} color={C.muted}/>
            </button>
            {showUserMenu&&<>
              {/* Backdrop */}
              <div onClick={()=>setShowUserMenu(false)} style={{position:"fixed",inset:0,zIndex:299}}/>
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:C.card,border:`1px solid ${C.border}44`,borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,0.4)",zIndex:300,minWidth:220,overflow:"hidden"}}>
                {/* Identity */}
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}44`,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:8,background:(roleInfo?.color||C.blue)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{roleInfo?.icon||"👤"}</div>
                  <div>
                    <div style={{color:C.text,fontSize:12,fontWeight:700}}>{session.name}</div>
                    <div style={{color:C.muted,fontSize:10,marginTop:1}}>{session.email||""}</div>
                    <div style={{color:roleInfo?.color||C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{lang==="fr"?roleInfo?.label:roleInfo?.labelEn}</div>
                  </div>
                </div>

                {/* Active currencies */}
                <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}44`}}>
                  <div style={{color:C.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{t.settings.currencies}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{padding:"3px 10px",borderRadius:6,background:`${C.blue}22`,color:C.blue,fontSize:11,fontWeight:800}}>F CFA</span>
                    {activeCurs.map(c=><span key={c.code} style={{padding:"3px 10px",borderRadius:6,background:c.color+"22",color:c.color,fontSize:13,fontWeight:800}}>{c.sym} {c.name}</span>)}
                    {activeCurs.length===0&&<span style={{color:C.muted,fontSize:10,fontStyle:"italic"}}>{t.settings.noCurrencies}</span>}
                  </div>
                </div>

                {/* Theme toggle */}
                <button onClick={()=>{setTheme(t=>t==="dark"?"light":"dark");}} style={{width:"100%",padding:"10px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}44`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Icon name={theme==="dark"?"sun":"moon"} size={13} color={C.muted}/>
                    <span style={{color:C.dim,fontSize:12}}>{theme==="dark"?t.settings.toLightMode:t.settings.toDarkMode}</span>
                  </div>
                  <div style={{width:32,height:18,borderRadius:9,background:theme==="dark"?C.blue:`${C.blue}44`,position:"relative",transition:"background .2s"}}>
                    <div style={{position:"absolute",top:2,left:theme==="dark"?14:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                  </div>
                </button>

                {/* Logout */}
                <button onClick={()=>{setShowUserMenu(false);doLogout();}} style={{width:"100%",padding:"10px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:C.red,fontSize:12,fontFamily:"inherit",fontWeight:600}}>
                  <Icon name="lock" size={13} color={C.red}/>{t.login.logout}
                </button>
              </div>
            </>}
          </div>
        </div>
      </header>

      <main style={{flex:1,padding:"20px 22px",maxWidth:1380,margin:"0 auto",width:"100%"}}>{views[view]||views.dashboard}</main>

      <footer style={{borderTop:`1px solid ${C.border}44`,padding:"10px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surface}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><TFLogo size={12}/><span style={{color:C.muted,fontSize:10}}>© 2026 Thunderfam Investment — Côte d'Ivoire</span></div>
        <span style={{color:C.muted,fontSize:10}}>v13.0 · {theme==="dark"?t.settings.dark:t.settings.light} · RBAC · Audit</span>
      </footer>
    </div>
  );
}
