import { useState, useMemo, useCallback, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, LabelList,
  ComposedChart, Area
} from "recharts";

// ── DATA (RAW_OPPS injected below) ───────────────────────────────────────────
// Source: OpportunityLineItem WHERE Product2.Name LIKE '%Interactions Hub Migrat%'
// 175 unique opportunities · region: filled from SF or inferred from territory

// ── CONFIRMED MIGRATED CALLS PRODUCT SKUs ──────
// Only deals with at least one of these SKUs are included in RAW_OPPS
const MIGRATED_CALLS_SKUS = {
  PRODUCT: ['1448-2562-XXX', '1448-2563-XXX'],          // Mgmt: Per-1000-interactions (15m+) & Per-BU (up to 15m)
  SERVICES: ['610318-2564-XXX','610318-2565-XXX',        // Migration service: up to 10M, 20M,
             '610318-2566-XXX','610318-2567-XXX',        //                    50M, 100M,
             '610318-2568-XXX','610318-2569-XXX'],        //                    200M, 400M interactions
};

// Auto-synced from Salesforce · last sync: 2026-06-02 · 178 opps (60 won, 71 lost, 47 open)
// amount=recurring ACV (1448-256x) · amountServices=one-time migration fees (610318-256x) · oppAmount=full CXone deal
// Auto-synced from Salesforce · last sync: 2026-07-01 · 187 opps (64 won, 78 lost, 45 open)
// amount=recurring ACV (1448-256x) · amountServices=one-time migration fees (610318-256x) · oppAmount=full CXone deal
const RAW_OPPS = [
  {"id":"006Ui00000O9QGrIAN","name":"NATIONAL GRID | Amendment | Interaction Hub Migrated Calls Pivot PBP $0 Dollar","account":"NATIONAL GRID USA SERVICE COMPANY INC","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":0.16,"amountServices":55000,"oppAmount":57200.16,"closeDate":"2029-01-05","fy":2029,"fq":1,"forecast":"Long Shot","owner":"Dave Smith","territory":"Industrial and Infrastructure","region":"Americas","regionSource":"salesforce","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","mainIncumbent":"Calabrio","currentProvider":"Cisco Systems","probability":25,"nextStep":"8/25 CE: Pivot from Play Back Portal Legacy to Interactions Hub $0 Dollar.......  Ash Approved Dave doing $0 Dollar Signatureless Amendment","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001joX4nIAE","name":"GENERAL DYNAMICS INFORMATION TECHNOLOGY| GSI DEMO BU","account":"GENERAL DYNAMICS IT DEMO BU","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":0,"amountServices":0,"oppAmount":9135.74,"closeDate":"2027-12-31","fy":2027,"fq":4,"forecast":"Best Case","owner":"Ben Martinez","territory":"Federal","region":"","regionSource":"inferred","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New BU","mainIncumbent":"","currentProvider":"Other","probability":25,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001iNk3VIAS","name":"Hyundai Capital America | CXone Cognigy 1CX SmartReach | Omnichannel | 1350 Agents","account":"HYUNDAI CAPITAL AMERICA","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":0.2,"amountServices":74250,"oppAmount":2243406.069,"closeDate":"2027-09-24","fy":2027,"fq":3,"forecast":"Best Case","owner":"Shaun Musil","territory":"Enterprise West","region":"Americas","regionSource":"salesforce","cxoneInstance":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"New OCR Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":25,"nextStep":"4/10: awaiting details, HCA not moving forward now","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001u7ARiIAM","name":"TCS | CXone | 600","account":"TCS - INDIA - ENTERPRISE","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":2100,"amountServices":23100,"oppAmount":689458.2377,"closeDate":"2027-06-15","fy":2027,"fq":2,"forecast":"Best Case","owner":"Novin Vathipatikkal","territory":"India","region":"International","regionSource":"salesforce","cxoneInstance":"E38","dcRegion":"EU2","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Exst. Customer / New LOB","mainIncumbent":"Cisco","currentProvider":"NICE CXone Mpower","probability":25,"nextStep":"RFP submitted, awaiting feedback from TCS","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000aIU69IAG","name":"DCF | FL Dept of Children & Families | VZ | CXone Auto Summary | Verizon | $300k | T3","account":"State of FL - Dept of Children & Families","stage":"4 - Confirm Value & Agreement","isWon":false,"isClosed":false,"amount":2500,"amountServices":22000,"oppAmount":508113.74,"closeDate":"2027-05-25","fy":2027,"fq":2,"forecast":"Most Likely","owner":"Lucas Hall","territory":"SLED Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":50,"nextStep":"2/20/2026 (LDH): Using VZ opportunity to show difference in price between going direct with NiCE or using VCC","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001CpocrIAB","name":"GlaxoSmithKline | CXone | Complete Suite + Textel + PC Dialer | 105","account":"GlaxoSmithKline plc.","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":2000,"amountServices":15400,"oppAmount":240434.338,"closeDate":"2027-04-28","fy":2027,"fq":2,"forecast":"Best Case","owner":"Jack Whiteman","territory":"Commercial East 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Pharma","contractType":"New Logo","mainIncumbent":"None","currentProvider":"NICE CXone Mpower","probability":25,"nextStep":"4/17 JW _ connected with Angelo and aligned with him on the reality of a direct relationship with NiCE vs. with Alphnumeric. Created a digital room to get him up to speed on the latest on NiCE + Cognigy. Nuturing this opportunity","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002KtUKJIA3","name":"Fifth Third - Engagement Hub (300M)","account":"FIFTH THIRD BANK, NATIONAL ASSOCIATION","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":60000,"amountServices":170500,"oppAmount":255860.36,"closeDate":"2027-04-21","fy":2027,"fq":2,"forecast":"Long Shot","owner":"James Cowart","territory":"FSI 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"","currentProvider":"Genesys","probability":0,"nextStep":"6/26 1/ Setting meeting for cloud option review","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001fueibIAA","name":"Miral Enterprise | CXone | RFI | 90 Agents | TCL","account":"Miral Enterprise","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":1200,"amountServices":15400,"oppAmount":294753.97,"closeDate":"2027-02-22","fy":2027,"fq":1,"forecast":"Best Case","owner":"Shweta Bhatia","territory":"Middle East","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Entertainment and Media","contractType":"New Logo","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":25,"nextStep":"Project is put on hold in lieu of the current situation in ME","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001bdCY9IAM","name":"NJM INSURANCE GROUP |  Amendment  | Recording and QM Uplift","account":"NJM INSURANCE GROUP","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":14128.8,"amountServices":96800,"oppAmount":195540.8,"closeDate":"2027-02-19","fy":2027,"fq":1,"forecast":"Best Case","owner":"Mike Elkind","territory":"FSI 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C53","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Addendum","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":25,"nextStep":"ME 5/11 - SDD and SOW being drafted. NiCE and Ring have a proposal review with NJM 5/12 to review pricing for BO recording solution.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui000027fqaJIAQ","name":"Insignia Financial | CXone | 800 AGTS | VIC, Australia","account":"Insignia Financial Ltd","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":2980,"amountServices":26224,"oppAmount":1004284.32,"closeDate":"2027-02-10","fy":2027,"fq":1,"forecast":"Long Shot","owner":"Callum Docherty","territory":"ANZ - 1","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Financial Services","contractType":"New Logo","mainIncumbent":"","currentProvider":"Genesys","probability":0,"nextStep":"Reach out to the team as customer was puirchased by Private Equity and priorities all put on hold.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001V3FybIAF","name":"Banner Life -CXone Open-C1","account":"Banner Life","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":2000,"amountServices":22000,"oppAmount":107196.86,"closeDate":"2026-12-18","fy":2026,"fq":4,"forecast":"Best Case","owner":"Steve Ledbetter","territory":"Commercial East 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Legal","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":25,"nextStep":"7.15 waiting to schedule demo through C1, another partner also getting involved","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000Ot8NKIAZ","name":"US Census | Recording, | FedRAMP for Multi-ACD | 500 | 500k ACV I FedRamp Multi ACD Availability","account":"Census Bureau","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":1550,"amountServices":11000,"oppAmount":71752.07,"closeDate":"2026-12-15","fy":2026,"fq":4,"forecast":"Most Likely","owner":"Ben Martinez","territory":"Federal","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"NICE","currentProvider":"Cisco Systems","probability":25,"nextStep":"5/20/2026 - Need Census RFP Decision (note: delays due lack of budget clarity).  Anticipate decision in October but could continue to push out. Voice Products is Partner (contract vehicle)","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000qvisvIAA","name":"MetLife JPN | CXone Dev BU | Amendment | CXone iHub Migrated for testing","account":"METLIFE INSURANCE K.K. DEV","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":2500,"amountServices":15400,"oppAmount":19825,"closeDate":"2026-12-15","fy":2026,"fq":4,"forecast":"Best Case","owner":"Ritsuko Iida","territory":"Japan","region":"","regionSource":"inferred","cxoneInstance":"J32","dcRegion":"JP1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","mainIncumbent":"NICE","currentProvider":"Cisco Systems","probability":25,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001kelZtIAI","name":"Auckland Group Shared Services (NTT DATA NZ) | New Zealand | CXone | 1000 agts","account":"Auckland Council (NTT)","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":1043,"amountServices":4982.56,"oppAmount":477235.6607,"closeDate":"2026-12-01","fy":2026,"fq":4,"forecast":"Best Case","owner":"Zac Randall","territory":"ANZ - 2","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government & Public Administration","contractType":"New Logo","mainIncumbent":"NICE","currentProvider":"Genesys","probability":25,"nextStep":"Tender released and due 12/6, Phase 2 Lean Agile Procurement30/6","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000021v0phIAA","name":"GSI ACCENTURE DEMO","account":"ACCENTURE DEMO","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":2000,"amountServices":22000,"oppAmount":260098.88,"closeDate":"2026-11-20","fy":2026,"fq":4,"forecast":"Best Case","owner":"Robert Maze","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"Other","currentProvider":"Other","probability":25,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002E9s6YIAR","name":"The ESP Group | Engagement Hub + QMA | 250","account":"ESP Group","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":0.09,"amountServices":13904,"oppAmount":60651.06,"closeDate":"2026-11-09","fy":2026,"fq":4,"forecast":"Best Case","owner":"Josh Chapman","territory":"UK&I - 4","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Call Center / BPO​","contractType":"New Logo","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":25,"nextStep":"27/04 - JCH - Catch up call with Kira took place to get feedback & next steps, next call scheduled 01/06.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001qFvAnIAK","name":"TAFE NSW RFP | AU | Optus | 550 concurrent core","account":"TAFE NSW","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":1430.4,"amountServices":13112,"oppAmount":350634.4439,"closeDate":"2026-10-30","fy":2026,"fq":4,"forecast":"Best Case","owner":"Matt Turner","territory":"ANZ - 1","region":"","regionSource":"inferred","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government & Public Administration","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":25,"nextStep":"MT 26/06/26::  Quote submitted for deal desk approval. PQD to Optus & Deal team review Mon 29th. Submission 13th July.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001WRZhuIAH","name":"HCTRA | CXone | Engagement Hub for Cloud Recording | 1000","account":"Harris County Toll Road Authority","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":3000,"amountServices":27500,"oppAmount":393095.96,"closeDate":"2026-10-28","fy":2026,"fq":4,"forecast":"Most Likely","owner":"Rob Colson","territory":"SLED West","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"New Logo","mainIncumbent":"","currentProvider":"Cisco Systems","probability":0,"nextStep":"3/20/2026 (RC) customer contact has not returned calls/emails, looking to validate this opportunity.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002O3P4jIAF","name":"VRAD INC |  Amendment  | 2026-05-07","account":"VRAD INC","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":3000,"amountServices":27500,"oppAmount":80690,"closeDate":"2026-10-22","fy":2026,"fq":4,"forecast":"Long Shot","owner":"Noa Nightingale","territory":"Healthcare 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"Genesys","probability":0,"nextStep":"5/21 -Confirming service term with the client","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002JdYicIAF","name":"EXPERIAN SERVICES CORP. |  Amendment  | Avaya/Verint Interactions Hub Migrated Calls","account":"EXPERIAN SERVICES CORP.","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":2000,"amountServices":17600,"oppAmount":19600,"closeDate":"2026-09-30","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Kirsten Doornbos","territory":"FSI 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C57","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / New LOB","mainIncumbent":"","currentProvider":"Avaya","probability":0,"nextStep":"6/26 got a second quote from another provider.  TBD on need/desire.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001Xf0jyIAB","name":"BT - UK - Enterprise - CXone CCaaS - RFP","account":"British Telecom","stage":"4 - Confirm Value & Agreement","isWon":false,"isClosed":false,"amount":6500,"amountServices":43450,"oppAmount":3753195.04,"closeDate":"2026-09-25","fy":2026,"fq":3,"forecast":"Most Likely","owner":"Richard Hawkes","territory":"UK&I - 1","region":"EMEA","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Telco","contractType":"New OCR Logo","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":50,"nextStep":"RH 08/06/2026 - working on the current (aggressive) ehub proposal for BT. BT Sourced have indicated that they are supportive of our CCaaS proposal. Looking to conclude by September.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002SNFObIAP","name":"UHG OptumRX Uptivity Server final","account":"UNITED HEALTH GROUP","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":1500,"amountServices":20625,"oppAmount":25425,"closeDate":"2026-09-24","fy":2026,"fq":3,"forecast":"Best Case","owner":"Amy Wiesenmayer","territory":"Healthcare 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C75","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"Addendum","mainIncumbent":"","currentProvider":"Amazon Connect","probability":25,"nextStep":"6/25 AW: This is a compliant requirement to pull recordings from OptumRXs Uptivity system. They requested amendment to be created on 6/24.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001lAbVlIAK","name":"ACCENTURE DEMO | Ultimate | Amendment  | AI Products","account":"ACCENTURE DEMO","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":0,"amountServices":0,"oppAmount":9135,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Robert Maze","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"","currentProvider":"Other","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000022jgLtIAI","name":"VIDEOTRON LTD. |  Amendment  | Interactions Hub - Verint Recording Replacement","account":"VIDEOTRON LTD.","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":0.14,"amountServices":33165,"oppAmount":118235.39,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","owner":"Steve Rapp","territory":"Canada","region":"Americas","regionSource":"salesforce","cxoneInstance":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Telco","contractType":"Addendum","mainIncumbent":"Verint","currentProvider":"NICE CXone Mpower","probability":25,"nextStep":"06/12 - Waiting for customer to provide critical data to allow for quoting, customer is working on it, but its been stalled for several weeks.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002LZE6DIAX","name":"VIDEOTRON |  Amendment  | Interactions Hub - Genesys","account":"VIDEOTRON LTD.","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":4020,"amountServices":36850,"oppAmount":313800,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Steve Rapp","territory":"Canada","region":"Americas","regionSource":"salesforce","cxoneInstance":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Telco","contractType":"Exst. Customer / Expansions","mainIncumbent":"Verint","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"06/12 - Waiting for customer to provide critical data to allow for quoting, customer is working on it, but its been stalled for several weeks.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002Nnn9PIAR","name":"LONG ISLAND POWER AUTHORITY |  Recordings Migration","account":"LONG ISLAND POWER AUTHORITY","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":3000,"amountServices":27500,"oppAmount":34900,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","owner":"Anthony Citera","territory":"Enterprise East","region":"Americas","regionSource":"salesforce","cxoneInstance":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / Expansions","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":25,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000028QaOoIAK","name":"BOH - Engagement Hub and QM","account":"Bank of Hawaii Corporation","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":3000,"amountServices":27500,"oppAmount":53790.36,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","owner":"Craig Griffin","territory":"Commercial West 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"New Logo","mainIncumbent":"Genesys","currentProvider":"Aspect","probability":25,"nextStep":"6.25 moved to program with BlueIP. Program will be presented 6.25 as phase one to move off the Mitel program and create a window for IVR then Cognigy","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001AbiTfIAJ","name":"Canadian Tire Financial Services | CXone Mpower + Cognigy","account":"Canadian Tire Financial Services Limited","stage":"5 - Proposal / Negotiation","isWon":false,"isClosed":false,"amount":0.0837,"amountServices":40535,"oppAmount":2631808.6477,"closeDate":"2026-09-15","fy":2026,"fq":3,"forecast":"Commit","owner":"Amitej Vaid","territory":"Canada","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"CA1","dcSource":"inferred","currency":"CAD","industry":"Other","contractType":"Exst. Customer / New LOB","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":75,"nextStep":"Per CTFS CIO request, NiCE has provided dates when our legal counsel can travel and meet CTFS legal onsite. CTFS has hired external counsel to fast track the progress and expected to share redlines soon.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui000028pPMyIAM","name":"McGraw-Hill Education l CXone New BU Direct from VZ | 350 Concurrent","account":"McGraw-Hill Education","stage":"4 - Confirm Value & Agreement","isWon":false,"isClosed":false,"amount":1350,"amountServices":0,"oppAmount":179262.91,"closeDate":"2026-09-11","fy":2026,"fq":3,"forecast":"Most Likely","owner":"James Lacouture","territory":"Enterprise East","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Educational Services","contractType":"New Logo","mainIncumbent":"NICE","currentProvider":"Other","probability":50,"nextStep":"7.1: NiCE awaiting decision from Angela/Cori.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001HpIVFIA3","name":"ST. LUKE'S HEALTH SYSTEM |  Amendment  | Interactions Hub | ICS","account":"ST. LUKE'S HEALTH SYSTEM","stage":"4 - Confirm Value & Agreement","isWon":false,"isClosed":false,"amount":1700,"amountServices":18700,"oppAmount":22270.07,"closeDate":"2026-09-10","fy":2026,"fq":3,"forecast":"Most Likely","owner":"Ryan Black","territory":"Healthcare 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Addendum","mainIncumbent":"Uptivity","currentProvider":"Avaya","probability":50,"nextStep":"06/16 RB Interactions Hub stalled as St. Luke's withholds payment over dissatisfaction with C1 build via ICS; NiCE's 06/09 way-forward unanswered; escalating 06/19 to Ken Kiernan (ICS President) and Andy Neill (ICS Sales Lead); close slips Q3 09/10.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002SMKNAIA5","name":"VRAD INC |  Amendment  | CXSuccess Premier","account":"VRAD INC","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":3000,"amountServices":27500,"oppAmount":83670,"closeDate":"2026-09-08","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Noa Nightingale","territory":"Healthcare 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / New LOB","mainIncumbent":"","currentProvider":"Genesys","probability":0,"nextStep":"6.19 continuing to nudge for joint review of contract 6.2. shared contracted ready for execution to jason mutcher and Nong Lor","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002UOFRqIAP","name":"NC DHHS DPH - Vital Records - FedRAMP Migration MRC | 70 Agents","account":"NC DHHS Division of Public Health FedRAMP","stage":"5 - Proposal / Negotiation","isWon":false,"isClosed":false,"amount":0.182,"amountServices":0,"oppAmount":15821.7888,"closeDate":"2026-08-31","fy":2026,"fq":3,"forecast":"Commit","owner":"Jamie Laberge","territory":"SLED East","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"Exst. Customer / New BU","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":75,"nextStep":"JNL 06/24 - Customer requested SOWs to support work - developing and reviewing in late June - DIT needs to repackage and get approvals from its end customes to then execute the Docusign.","product":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002UNuc1IAD","name":"NC DHHS DPH - Vital Records - FedRAMP Migration NRC | 70 Agents","account":"NC DHHS Division of Public Health FedRAMP","stage":"5 - Proposal / Negotiation","isWon":false,"isClosed":false,"amount":0,"amountServices":27500,"oppAmount":106370.11,"closeDate":"2026-08-31","fy":2026,"fq":3,"forecast":"Most Likely","owner":"Jamie Laberge","territory":"SLED East","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"Exst. Customer / New BU","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":75,"nextStep":"JNL 06/24 - Customer requested SOWs to support work - developing and reviewing in late June - DIT needs to repackage and get approvals from its end customes to then execute the Docusign.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00002OwlcQIAR","name":"Nutrien Australia | NUTRIEN US LLC","account":"Nutrien Australia","stage":"2 - Determining Problem / Impact","isWon":false,"isClosed":false,"amount":3000,"amountServices":5500,"oppAmount":45758.43,"closeDate":"2026-08-28","fy":2026,"fq":3,"forecast":"Best Case","owner":"Cory Shields","territory":"Commercial Central 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Construction/Real Estate","contractType":"Exst. Customer / New BU","mainIncumbent":"","currentProvider":"","probability":25,"nextStep":"20260623 Working to schedule a call with Nutrien in India and our connectivity team is US.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui0000271A0KIAU","name":"BT - UK - Enterprise - CXone Engagement Hub - Multi-ACD - Production Platform - 18000","account":"BRITISH TELECOMMUNICATIONS PLC - PM TEST INSTANCE","stage":"4 - Confirm Value & Agreement","isWon":false,"isClosed":false,"amount":0.048,"amountServices":38127.7,"oppAmount":727997.204,"closeDate":"2026-08-21","fy":2026,"fq":3,"forecast":"Most Likely","owner":"Richard Hawkes","territory":"UK&I - 1","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Telco","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"NICE","currentProvider":"Genesys","probability":50,"nextStep":"RH -23062026 -  BT Sourced (Tiana) is being pushed by BT seniors to close with quickly. Sign off (July 1st). Signatures next week as Anuja has compressed the timeline. This will be an initiation of August 1st. 29 month contract.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002IDfMwIAL","name":"INTEGRATED CARE 24 |  Amendment  | Integrations Hub","account":"INTEGRATED CARE 24","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":0.08,"amountServices":18249,"oppAmount":20690.68,"closeDate":"2026-08-20","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Adam Massingberd - Mundy","territory":"UK&I - 4","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Call Center / BPO​","contractType":"Exst. Customer / Expansions","mainIncumbent":"","currentProvider":"Cisco Systems","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002SMKwcIAH","name":"CHUBB EUROPEAN GROUP SE |  Amendment  | Calls Migration","account":"CHUBB EUROPEAN GROUP SE","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":3000,"amountServices":27500,"oppAmount":38217,"closeDate":"2026-08-03","fy":2026,"fq":3,"forecast":"Long Shot","owner":"William Edmonds","territory":"UK&I - 3","region":"International","regionSource":"salesforce","cxoneInstance":"E35","dcRegion":"EU1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002XnOhxIAF","name":"ACCENTURE PARTNER | Amendment | NiSource Interaction HUB Implementation","account":"ACCENTURE PARTNER","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":0,"amountServices":96800,"oppAmount":105600,"closeDate":"2026-08-01","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Ryan Kay","territory":"Enterprise Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB)"},
  {"id":"006Ui00002XA8UyIAL","name":"CALOPTIMA |  Amendment  | PS Only | Migrating calls from engage","account":"CALOPTIMA","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":0,"amountServices":27500,"oppAmount":27500,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Long Shot","owner":"Peter Kazaryan","territory":"SLED West","region":"Americas","regionSource":"salesforce","cxoneInstance":"C200","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Government & Public Administration","contractType":"PS Only","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00000nHR1BIAW","name":"SSE AIRTRICITY |  Conscia | Amendment | Migrated Calls","account":"SSE AIRTRICITY","stage":"5 - Proposal / Negotiation","isWon":false,"isClosed":false,"amount":1820,"amountServices":20020,"oppAmount":38589.8,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Commit","owner":"Sarah Cruickshanks","territory":"UK&I - 5","region":"International","regionSource":"salesforce","cxoneInstance":"E34","dcRegion":"EU2","dcSource":"cluster","currency":"EUR","industry":"Utilities","contractType":"Exst. Customer / New LOB","mainIncumbent":"Calabrio","currentProvider":"NICE CXone Mpower","probability":75,"nextStep":"SC: Quote updated and to be sent over to Conscia. Expecting PO in July.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002GjTlCIAV","name":"Select Portfolio Servicing | CXone | 600 Infosys I Skyward I AI Rebate","account":"Select Portfolio Servicing , Inc.","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":2180.64,"amountServices":30800,"oppAmount":1052371.02,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Best Case","owner":"Anthony Citera","territory":"Enterprise East","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":75,"nextStep":"6/29 Murali has approved via email, Infosys team obtaining SOW signature and they will sign ours","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002MHibeIAD","name":"NISOURCE CORPORATE SERVICES COMPANY |  Amendment  | NiSource Migrated Calls","account":"NISOURCE CORPORATE SERVICES COMPANY","stage":"3 - Aligning Benefits & Value","isWon":false,"isClosed":false,"amount":12109.12,"amountServices":0,"oppAmount":12109.12,"closeDate":"2026-07-15","fy":2026,"fq":3,"forecast":"Best Case","owner":"Ryan Kay","territory":"Enterprise Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"C200","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / New LOB","mainIncumbent":"","currentProvider":"Genesys","probability":25,"nextStep":"6/22 Quoted to Accenture 6/15, they are not happy, but is required for migration. no timeline","product":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001iLMBnIAO","name":"Claritev | CXone | 950 Agents | Skyward & Northbound","account":"Claritev Corporation","stage":"5 - Proposal / Negotiation","isWon":false,"isClosed":false,"amount":3000,"amountServices":55000,"oppAmount":1660883.7775,"closeDate":"2026-07-07","fy":2026,"fq":3,"forecast":"Commit","owner":"Dillon Hughes","territory":"Commercial East 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Technology","contractType":"New Logo","mainIncumbent":"Aspect","currentProvider":"Aspect","probability":75,"nextStep":"DH | 6/30 - Expecting all 3 docs (BAA, CSO, MRA) back today. Feedback from customer is no major concerns. Sharing Letter of intent template tied to resource allocation with signatures by 7/6.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002ECl0VIAT","name":"COGNIZANT TECHNOLOGY DEMO BU |  Amendment  | 2026-03-18","account":"COGNIZANT TECHNOLOGY DEMO BU","stage":"1 - Identification / Qualification","isWon":false,"isClosed":false,"amount":0,"amountServices":0,"oppAmount":41840.03,"closeDate":"2026-06-30","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Scott Washburn","territory":"SmartReach","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"","currentProvider":"Other","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00002D65sXIAR","name":"Wesleyan - R101 - CXone - 143","account":"Wesleyan Financial","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1074.4,"amountServices":8342.4,"oppAmount":38576.5483,"closeDate":"2026-06-30","fy":2026,"fq":2,"forecast":"Commit","owner":"Sarah Stevenson","territory":"UK&I - 3","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Financial Services","contractType":"New OCR Logo","mainIncumbent":"Alcatel-Lucent","currentProvider":"Other","probability":90,"nextStep":"30/06 - MSA review to finalise by Midday. R101 will accept order form and MSA to place order on NiCE today - SOW to be signed later this week","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002QI93GIAT","name":"PPL UTILITIES |  Amendment  | 10M Call Migration PS","account":"PPL UTILITIES","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":20625,"oppAmount":20625,"closeDate":"2026-06-29","fy":2026,"fq":2,"forecast":"Commit","owner":"Jim Kelley","territory":"Enterprise AI Acquisition","region":"Americas","regionSource":"salesforce","cxoneInstance":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":95,"nextStep":"6/19- Addendum sent to procurement and LOB on 5/21 - Funding approved - Procurement reviewing","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00001S0HrRIAV","name":"SS&C TECHNOLOGIES HOLDINGS, INC. |  Amendment  | I-hub, PM, Data share for Australia group","account":"SS&C TECHNOLOGIES HOLDINGS, INC.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":3000,"amountServices":27500,"oppAmount":32700,"closeDate":"2026-06-26","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Michael Ryswyk","territory":"FSI 3","region":"","regionSource":"inferred","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"MR 6/22: Dan Stutts to align with IT leadership and the business week of 6/22 for go/no-go decision & determine SOE based on options presented at 5/7 QBR","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002Pb63vIAB","name":"RINGCENTRAL CC SE1 B32 OSH |  Amendment  | Quality Management Advanced GenAI: non-commit","account":"RINGCENTRAL CC SE1 B32 OSH","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":-22000,"oppAmount":-49319.92,"closeDate":"2026-06-25","fy":2026,"fq":2,"forecast":"Commit","owner":"Lorenz Alfred Durandar","territory":"Enterprise AI Acquisition","region":"","regionSource":"inferred","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00002IJblFIAT","name":"Bankinter | Evolutio | Engagement Hub | 1,100","account":"BANKINTER GLOBAL SERVICES S.A.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1820.11,"amountServices":232232,"oppAmount":274896.11,"closeDate":"2026-06-16","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Jaime Colom","territory":"Southern Europe","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"EUR","industry":"Banks","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"Genesys","probability":0,"nextStep":"JCC - Asked questions to partner about number of calls and DB size to make an accurate quote","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001p4GQ6IAM","name":"ENERGY AUSTRALIA 2ND BU |  Amendment  | Interactions Hub CR - No ACV","account":"ENERGY AUSTRALIA 2ND BU","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":420,"amountServices":3278,"oppAmount":18720.4,"closeDate":"2026-06-14","fy":2026,"fq":2,"forecast":"Commit","owner":"Mitchell Hawke","territory":"ANZ - 1","region":"International","regionSource":"salesforce","cxoneInstance":"A32","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Other","contractType":"Addendum","mainIncumbent":"Other","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Finance assessing previous service credit. Waiting for PQD acceptance","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000029FOdMIAW","name":"SS&C TECHNOLOGIES HOLDINGS, INC. |  Amendment  | Add 8 DBs Capita,LiquidVoice,Metlife,CapTech,Witness,IPFX,Nice,Genesys","account":"SS&C TECHNOLOGIES HOLDINGS, INC.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2400,"amountServices":82500,"oppAmount":95460.08,"closeDate":"2026-06-12","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Michael Ryswyk","territory":"FSI 3","region":"","regionSource":"inferred","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / New LOB","mainIncumbent":"No competitor","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"MR 6/8:  Awaiting confirmation from SS&C IT re: build vs. buy decision, confirming on 6/10 with Dan Stutts","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001pvflJIAQ","name":"AECC | ES | CXone | Omnichannel + AI Analytics Cognigy","account":"Asoc. Española Contra el Cáncer","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1274,"amountServices":20020,"oppAmount":71452.7303,"closeDate":"2026-06-10","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Jaime Colom","territory":"Southern Europe","region":"","regionSource":"inferred","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"EUR","industry":"Not-for-Profit Services","contractType":"New Logo","mainIncumbent":"Other","currentProvider":"IT Build (Homegrow)","probability":0,"nextStep":"Latest feedback from AECC: \"At this moment, and due to the need to complete additional reviews, the decision-making process has been delayed. As of today, we are unable to provide a new date for the resolution of the process.\"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"0063n000010n3dHAAQ","name":"SP Group | RFP | CXone | 340 | Genesys Replacement","account":"SP Group Singapore","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":58080,"oppAmount":457868.895,"closeDate":"2026-06-03","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Gabriel Ng","territory":"SEA","region":"APAC","regionSource":"salesforce","cxoneInstance":"","dcRegion":"","dcSource":"inferred","currency":"USD","industry":"Utilities","contractType":"New Logo","mainIncumbent":"Genesys Engage","currentProvider":"Other","probability":0,"nextStep":"Tender has been recalled. Singtel has been informed that the tender will not go ahead. Shortlisted vendors not announced yet. SP updated that local instance is still a concern with their IT team.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui000011sAkTIAU","name":"OPTUS SYSTEMS PTY LTD PROD | Amendment | Interactions Hub - Legacy Recording Decommissioning Project","account":"OPTUS SINGTEL LTD  PROD BU","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":4320,"amountServices":81950,"oppAmount":90378,"closeDate":"2026-06-03","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Roger McCarthy","territory":"ANZ - 1","region":"International","regionSource":"salesforce","cxoneInstance":"A32","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Telco","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"The Addendum CR approved & with Optus for DocuSign - AE to withdraw the current proposal if not accepted by May 15.. Optus Consumer would like to combin the Engage Decommissioning with a QM uplift to CXone","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000guF2oIAE","name":"Swift | CXone | Multi ACD | 300","account":"S.W.I.F.T. SC","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2275,"amountServices":20020,"oppAmount":59073.61,"closeDate":"2026-06-03","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Bob Fokke","territory":"Northern Europe","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"EUR","industry":"Financial Services","contractType":"Expansion New Product","mainIncumbent":"Cisco","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"no action needed for now. This might pop up again in the future.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001tSg5lIAC","name":"Ameritas | Cxone | Resell | CapGemini | Complete Suite","account":"AMERITAS LIFE INSURANCE - USA","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1400,"amountServices":62857.14,"oppAmount":253010.02,"closeDate":"2026-05-26","fy":2026,"fq":2,"forecast":"Commit","owner":"Jordan Geiger","territory":"Commercial West 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C57","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":100,"nextStep":"5/22: CAP & Ameritas have flinal clean copy of Order. Waiting on CIO to execute were confirmed that would happen today.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001GTJggIAH","name":"SIA | RFP | Genesys Replacement | 3000","account":"Singapore Airlines - Singapore - Enterprise","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":500,"amountServices":8800,"oppAmount":2006401.0412,"closeDate":"2026-05-15","fy":2026,"fq":2,"forecast":"Commit","owner":"Gabriel Ng","territory":"SEA","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Airlines, Airports & Air Services","contractType":"New Logo","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":75,"nextStep":"Confirming official award vendor.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002CPszlIAD","name":"FIDELITY INFORMATION SERVICES LLC BRAZIL |  Amendment  | Migration Engage to Callink BU 461048","account":"FIDELITY INFORMATION SERVICES LLC BRAZIL","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":70537.5,"oppAmount":78897.5,"closeDate":"2026-05-02","fy":2026,"fq":2,"forecast":"Commit","owner":"Hector Ortega","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"C18","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Outsourcing","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"4/1-HRO-Submit approved quote to Euler/Procurement.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB)"},
  {"id":"006Ui000029nDfRIAU","name":"Sharp | Interaction Hub Migrated Calls","account":"SHARP HEALTHCARE","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":4400,"amountServices":55000,"oppAmount":81460.36,"closeDate":"2026-04-30","fy":2026,"fq":2,"forecast":"Commit","owner":"Noa Nightingale","territory":"Healthcare 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C62","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"New OCR Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001XgpR6IAJ","name":"Student Loans Company | SVL | CXone | 1,900","account":"Student Loans Company","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":474.09,"amountServices":17380,"oppAmount":220794.623,"closeDate":"2026-04-28","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Sarah Stevenson","territory":"UK&I - 3","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Government","contractType":"Exst. Customer / New BU","mainIncumbent":"Amazon Connect","currentProvider":"Avaya","probability":0,"nextStep":"17/04 - Expect another extension update was due 15/04 but no comms so have moved close date out","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000xaWNaIAM","name":"Prince George’s County, Maryland | Uptivity Replacement | CXone | 50","account":"Prince George's County MD","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2500,"amountServices":22000,"oppAmount":65520.96,"closeDate":"2026-04-23","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Jamie Laberge","territory":"SLED East","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"New Logo","mainIncumbent":"Five9","currentProvider":"Genesys","probability":0,"nextStep":"12/16 - Quote is in customer hands. Working on getting approvals for EOY purchase.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002G3tQkIAJ","name":"RINGCENTRAL CUSTOMER TRAINING USER HUB DEMO |  Amendment  | Mpower Ultimate Suite: Non-Commit","account":"RINGCENTRAL CUSTOMER TRAINING USER HUB DEMO","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2400,"amountServices":0,"oppAmount":17675.37,"closeDate":"2026-04-16","fy":2026,"fq":2,"forecast":"Commit","owner":"Lauren Marchand","territory":"Enterprise AI Acquisition","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New LOB","mainIncumbent":"RingCentral","currentProvider":"Other","probability":100,"nextStep":"","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002EbWRFIA3","name":"WNS GLOBAL SERVICES (P) LTD - TOKYU BU |  Amendment  | Adding CXone Interactions Hub","account":"WNS GLOBAL SERVICES (P) LTD - TOKYU BU","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":0,"closeDate":"2026-04-14","fy":2026,"fq":2,"forecast":"Commit","owner":"Mayur Jorapur","territory":"India","region":"International","regionSource":"salesforce","cxoneInstance":"J32","dcRegion":"JP1","dcSource":"cluster","currency":"USD","industry":"Call Center / BPO​","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"Avaya","probability":100,"nextStep":"Amendment for CXone Interactions hub","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002ALrwzIAD","name":"FL Blue - BCBS - Engage to Cloud Conversion 500 seats","account":"BLUE CROSS BLUE SHIELD OF FLORIDA, INC","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1200,"amountServices":23430,"oppAmount":97224.63,"closeDate":"2026-04-14","fy":2026,"fq":2,"forecast":"Long Shot","owner":"James Heck","territory":"FSI 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"Not applicable / No Decision","currentProvider":"Cisco Systems","probability":0,"nextStep":"EJL 3/30Working with Troy LeClair (Mgr. IT Serv.) - Updating quote for Premise and Cloud solutions 3/30","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002EbrfNIAR","name":"WNS INDIA LTD- MULTI ACD LONDON BU |  Amendment  | 2026-03-20","account":"WNS INDIA LTD- MULTI ACD LONDON BU","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":0.35,"closeDate":"2026-04-14","fy":2026,"fq":2,"forecast":"Commit","owner":"Mayur Jorapur","territory":"India","region":"International","regionSource":"salesforce","cxoneInstance":"L35","dcRegion":"UK1","dcSource":"cluster","currency":"USD","industry":"Call Center / BPO​","contractType":"Exst. Customer / Expansions","mainIncumbent":"","currentProvider":"Avaya","probability":100,"nextStep":"Amendment for MRS","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002GZ61tIAD","name":"RINGCENTRAL B32 CHILD |  Amendment  | Ultimate Bundle | Non Commit","account":"RINGCENTRAL B32 CHILD","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2400,"amountServices":0,"oppAmount":17331.26,"closeDate":"2026-04-13","fy":2026,"fq":2,"forecast":"Commit","owner":"Lauren Marchand","territory":"Enterprise AI Acquisition","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00002Ft0VaIAJ","name":"RINGCENTRAL DEMO OSH B32 |  Amendment  | Mpower Ultimate Suite | Non Commit","account":"RINGCENTRAL DEMO OSH B32","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2400,"amountServices":0,"oppAmount":17110.96,"closeDate":"2026-04-13","fy":2026,"fq":2,"forecast":"Commit","owner":"Lauren Marchand","territory":"Enterprise AI Acquisition","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001pOoU3IAK","name":"PPL UTILITIES |  Amendment  | ASR Addition OLD","account":"PPL UTILITIES","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":-157258.06,"amountServices":0,"oppAmount":-179030.43,"closeDate":"2026-04-08","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Jim Kelley","territory":"Enterprise AI Acquisition","region":"Americas","regionSource":"salesforce","cxoneInstance":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","mainIncumbent":"No competitor","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"4/3 - Second phase of Hammer Performance and Load Testing for IVA in KY.  Working with Hammer to provide initial pricing and scoping week of 4/6.","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000coJ1ZIAU","name":"Montefiore Health System | CXone | 791","account":"MONTEFIORE MEDICAL CENTER","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":8400,"amountServices":29150,"oppAmount":1383977.13,"closeDate":"2026-04-06","fy":2026,"fq":2,"forecast":"Commit","owner":"Matt Gerth","territory":"Healthcare 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C46","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":100,"nextStep":"4/6, MG: All contract documents have been signed by NiCE and returned to Montefiore for CEO (Dr. Philip Ozuah) counter-signature.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001WHPYgIAP","name":"ADNOC_NEW BU 2024 | Amendment | Recording Migration | Advance Services | EU to UAE BU | E&","account":"ABU DHABI NATIONAL OILCOMPANY ADNOC","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2000,"amountServices":22000,"oppAmount":34560,"closeDate":"2026-04-03","fy":2026,"fq":2,"forecast":"Long Shot","owner":"Rachit Bansal","territory":"Middle East","region":"International","regionSource":"salesforce","cxoneInstance":"E34","dcRegion":"EU2","dcSource":"cluster","currency":"USD","industry":"Mining & Metals","contractType":"Exst. Customer / New LOB","mainIncumbent":"Unknown","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"Commercial proposal has been given to ADNOC for keeping EU BU as UAT/ Test BU while UAE as primary BU. Customer currently reviewing the commercials for next steps to initiate the contract.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui0000279WjZIAU","name":"Markerstudy | CXone | Interactions Hub, 50 Users - Historical Recordings | 10","account":"SWINTON INSURANCE","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2400,"amountServices":20856,"oppAmount":51206.85,"closeDate":"2026-03-31","fy":2026,"fq":1,"forecast":"Commit","owner":"Maxine Allard","territory":"UK&I - 1","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"Avaya","currentProvider":"UJET","probability":100,"nextStep":"30/03 - MA - Requested docusign be issued for signature - Legal","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001TH7YYIA1","name":"ROYAL LONDON - UK - ENTERPRISE |  Amendment  | Interactions Hub| Natilik","account":"ROYAL LONDON - UK - ENTERPRISE","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.09,"amountServices":31284,"oppAmount":33795.45,"closeDate":"2026-03-30","fy":2026,"fq":1,"forecast":"Commit","owner":"Maxine Allard","territory":"UK&I - 1","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"30/03 - MA - Approved PQD Received - AE","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000WL8kwIAD","name":"Baycare | CXone | Multi-ACD and QM | Direct | 500","account":"BayCare Health System","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1750,"amountServices":19250,"oppAmount":112927.83,"closeDate":"2026-03-25","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Josh Barber","territory":"Healthcare","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"","currentProvider":"Avaya","probability":0,"nextStep":"looking to close out beachhead opportunity with Feedback Management before we start discussing other opportunities for cloud expansion with baycare.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001w3qD3IAI","name":"MERCURY NEW ZEALAND |  Amendment  | Additional Call Import | NTT","account":"MERCURY NEW ZEALAND","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":26224,"oppAmount":27273.6,"closeDate":"2026-03-25","fy":2026,"fq":1,"forecast":"Commit","owner":"Zac Randall","territory":"ANZ - 2","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Utilities","contractType":"PS Only","mainIncumbent":"No Incumbent","currentProvider":"Amazon Connect","probability":100,"nextStep":"Customer signoff","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00001C0IDdIAN","name":"Republic Bank and Trust Co. | Sandler | CXone | Multi-ACD | 250","account":"Republic Bank and Trust Co.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2500,"amountServices":22000,"oppAmount":42071.03,"closeDate":"2026-03-20","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Rusty Dewitt","territory":"Commercial Central 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"New Logo","mainIncumbent":"TalkDesk","currentProvider":"Other","probability":0,"nextStep":"Update 5/21: NDA signed and pricing delivered.  Asking for date of execution should have an idea by end of week.  Asked for update from Partner on 4/14.  Not getting a response.  Asked for update from partner 5/12.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001wj5uTIAQ","name":"NiSource PS work for Accenture","account":"ACCENTURE PARTNER","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":17600,"oppAmount":512109.33,"closeDate":"2026-03-10","fy":2026,"fq":1,"forecast":"Commit","owner":"Ryan Kay","territory":"Enterprise Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / Expansions","mainIncumbent":"Genesys","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Daily SOW calls with Accenture","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00001b73rNIAQ","name":"Pioneer Credit | Australia | CCNA | SmartReach / 42 months 175kpm Interactions","account":"OPTUS NETWORKS PTY LIMITED","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2384,"amountServices":22946,"oppAmount":146562.58,"closeDate":"2026-03-08","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Jarrah Sladek","territory":"ANZ - 2","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Finance and Insurance","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":0,"nextStep":"19/2 NiCE has been selected as preferred Vendor. Customer now tendering 3 different partners - Optus/CCNA/NTT - working through that process of partner selection of the next 2 weeks","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001pOuHhIAK","name":"GENERAL DYNAMICS IT Demo 360 Vision BU   | GSI v1","account":"GENERAL DYNAMICS IT DEMO BU","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":39.73,"closeDate":"2026-03-04","fy":2026,"fq":1,"forecast":"Commit","owner":"Ben Martinez","territory":"Federal","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New BU","mainIncumbent":"No Incumbent","currentProvider":"Other","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)"},
  {"id":"006Ui00001kTCsPIAW","name":"CITY OF WANNEROO COUNCIL | Recordings Import","account":"CITY OF WANNEROO COUNCIL","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2980,"amountServices":26224,"oppAmount":34452,"closeDate":"2026-02-26","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Ronnie Osment","territory":"ANZ - 2","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Government & Public Administration","contractType":"Exst. Customer / New LOB","mainIncumbent":"Avaya","currentProvider":"Genesys","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001qknTvIAI","name":"TCS | CXone | State Street Migration","account":"TCS STATE STREET NEW BU","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1020,"amountServices":7040,"oppAmount":11016.9755,"closeDate":"2026-02-26","fy":2026,"fq":1,"forecast":"Commit","owner":"Novin Vathipatikkal","territory":"India","region":"International","regionSource":"salesforce","cxoneInstance":"C44","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Exst. Customer / New BU","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":100,"nextStep":"TCL awaiting PO from TCS, GPS approval closed, they should be getting the PO in couple of days. PQD will be approved after receiving the PO.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001RzwNDIAZ","name":"SS&C TECHNOLOGIES HOLDINGS, INC. |  Amendment  | 2025-06-11","account":"SS&C TECHNOLOGIES HOLDINGS, INC.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":3000,"amountServices":27500,"oppAmount":67092.05,"closeDate":"2026-02-20","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Sarah Hill","territory":"FSI 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Addendum","mainIncumbent":"No competitor","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001GQ7k6IAD","name":"Salud Interactiva | Migura/Telmex | CXone Comp | 60","account":"Salud Interactiva","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":700,"amountServices":7700,"oppAmount":60942.4565,"closeDate":"2026-02-10","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Teresa Arriaga","territory":"Northern Cone","region":"","regionSource":"inferred","cxoneInstance":"","dcRegion":"","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Unknown","currentProvider":"Other","probability":0,"nextStep":"TA:  Meeting with Telmex to get confirmation on of the approved budget  Feb 6th , AE/TA and Migura","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001V2T24IAF","name":"SA Water | Optus | Australia | CXone - 150 User","account":"SA Water","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1788,"amountServices":0,"oppAmount":42584.668,"closeDate":"2026-02-10","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Zac Randall","territory":"ANZ - 2","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Other","probability":0,"nextStep":"9/2 - Just notified this project has been cancelled","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001sns65IAA","name":"CALOPTIMA |  Amendment  | CXone Interactions Hub Migrated Call Management","account":"CALOPTIMA","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":3000,"amountServices":19250,"oppAmount":22250,"closeDate":"2026-02-03","fy":2026,"fq":1,"forecast":"Commit","owner":"Peter Kazaryan","territory":"SLED West","region":"Americas","regionSource":"salesforce","cxoneInstance":"C200","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Government & Public Administration","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"2/2/26 - pk - waiting for customer countersignature","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001EOzszIAD","name":"Travel & Leisure WYND BU Interactions Hub Migration of Qfiniti Calls","account":"WYND","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":27500,"oppAmount":27500.16,"closeDate":"2026-01-29","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Dave Smith","territory":"Industrial and Infrastructure","region":"","regionSource":"inferred","cxoneInstance":"C61","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Travel and Hospitality","contractType":"Exst. Customer / New LOB","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"1/16 CE: Qfiniti Platform Shut Down KC: Michele Grady Dir PR: Int Hub Migration NS: T&L to provide call # and sample file to enable pricing model D.S","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001BopzlIAB","name":"Spire Energy | Accenture | CXone | 500","account":"SPIRE","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2000,"amountServices":22000,"oppAmount":533578.25,"closeDate":"2026-01-20","fy":2026,"fq":1,"forecast":"Commit","owner":"Jason Cates","territory":"Commercial Central 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C67","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"New Logo","mainIncumbent":"SAP AG","currentProvider":"Amazon","probability":100,"nextStep":"1/16 Signatures for Spire/Accenture is complete.  working to get us signatures/po, so I can close/won this deal","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001palydIAA","name":"First Merchants Bank | Engagement Hub | 50","account":"First Merchants Corporation","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":3000,"amountServices":0,"oppAmount":227312,"closeDate":"2026-01-16","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Jay Case Jr","territory":"Commercial Central 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"New Logo","mainIncumbent":"Alvaria (Aspect + Noble)","currentProvider":"Avaya","probability":0,"nextStep":"1.2.26JC Next step is connectivity call for Multi-ACD. Not scheduled. FU 1.2. If nothing scheduled soon will need to push out.","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000UKDJBIA5","name":"MetLife JPN | CXone Prod BU | Amendment | CXone Interactions Hub | 50M Interactions","account":"METLIFE INSURANCE K.K.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":5500,"amountServices":127875,"oppAmount":151937.5,"closeDate":"2026-01-13","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Ritsuko Iida","territory":"Japan","region":"International","regionSource":"salesforce","cxoneInstance":"J32","dcRegion":"JP1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","mainIncumbent":"No competitor","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"MLJ will email us this week and request us to apply more deep discount to the MRC. We will review what we can do the best once the email is arrived.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001zaKEIIA2","name":"CANADIAN INSURANCE ALLIANCE (2018) INC. |Amendment| Removal NRC","account":"HUB INTERNATIONAL CANADA HOLDING LIMITED","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":-33000,"oppAmount":-33000,"closeDate":"2026-01-07","fy":2026,"fq":1,"forecast":"Commit","owner":"Julie Henderson","territory":"Commercial Central 2","region":"","regionSource":"inferred","cxoneInstance":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Send through approvals","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)"},
  {"id":"006Ui00001oCRLhIAO","name":"INTEGRATED CARE 24 | Amendment | Interactions Hub","account":"INTEGRATED CARE 24","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.08,"amountServices":18249,"oppAmount":20995.18,"closeDate":"2026-01-07","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Adam Massingberd - Mundy","territory":"UK&I - 4","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Outsourcing","contractType":"Exst. Customer / Expansions","mainIncumbent":"No competitor","currentProvider":"Cisco Systems","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000GdUgAIAV","name":"DentaQuest Ventures | CXone | Multi ACD & Quality","account":"DentaQuest Ventures","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":875,"amountServices":18700,"oppAmount":110640.26,"closeDate":"2026-01-05","fy":2026,"fq":1,"forecast":"Long Shot","owner":"Neil Balthazaar","territory":"Canada","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"CA1","dcSource":"inferred","currency":"USD","industry":"Insurance","contractType":"New Logo","mainIncumbent":"Amazon Connect","currentProvider":"Cisco Systems","probability":0,"nextStep":"1) Updated pricing submitted to customer 10/21/24","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001Q6YKVIA3","name":"GENERAL MOTORS Interactions Hub Engage Call Migration 155M Calls","account":"GENERAL MOTORS CORPORATION","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.2,"amountServices":121000,"oppAmount":132000.2,"closeDate":"2025-12-22","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Dave Smith","territory":"Strategic East","region":"Americas","regionSource":"salesforce","cxoneInstance":"C64","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Manufacturing","contractType":"Addendum","mainIncumbent":"Salesforce Service Cloud Voice","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"12/19 Legal may remove HOLD requirement and GM not need Legal WK shop on Jan 14th Touchpoint with Director AnMarie Salinas 1/20","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001nEZNlIAO","name":"CITY OF WANNEROO COUNCIL |  Amendment  | Migrate calls to CXone","account":"CITY OF WANNEROO COUNCIL","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2682,"amountServices":18356.8,"oppAmount":24712.4,"closeDate":"2025-12-19","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Laveena Aggarwal","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Government & Public Administration","contractType":"Exst. Customer / New LOB","mainIncumbent":"Avaya","currentProvider":"Genesys","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001qaVLNIA2","name":"UMB Financial Corporation | Amendment | Project Shake and Bake IHub","account":"UMB FINANCIAL CORPORATION","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2250,"amountServices":5500,"oppAmount":8740.08,"closeDate":"2025-12-17","fy":2025,"fq":4,"forecast":"Commit","owner":"Julie Henderson","territory":"Commercial Central 3","region":"","regionSource":"inferred","cxoneInstance":"C8","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Banks","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Verbal commit from Ashok that he will get this signed this week","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001cSRoUIAW","name":"FL Blue - Engagement Hub - CPQ","account":"BLUE CROSS BLUE SHIELD OF FLORIDA, INC","stage":"Closed – No Opportunity","isWon":false,"isClosed":true,"amount":0.2,"amountServices":55000,"oppAmount":301746.23,"closeDate":"2025-12-16","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Ed Lewczyk","territory":"Enterprise East 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Finance and Insurance","contractType":"","mainIncumbent":"","currentProvider":"Cisco Systems","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001AmHQ6IAN","name":"NiSource -MPower Ultimate 480 (RFP)","account":"NISOURCE CORPORATE SERVICES COMPANY","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1600,"amountServices":0,"oppAmount":212461.49,"closeDate":"2025-12-15","fy":2025,"fq":4,"forecast":"Commit","owner":"Ryan Kay","territory":"Enterprise East 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"C200","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"New OCR Logo","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":100,"nextStep":"12/15 Have 1 last issue to resolve on T&C, still on track to sign 12/15, CIO Waco Bankston is ready. Close date moved to 12/17 in case legal issue persists.","product":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000FpnkPIAR","name":"Kroger Specialty Pharm - Uptivity Calls to Elevance","account":"Kroger","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.08,"amountServices":51975,"oppAmount":79370.12,"closeDate":"2025-11-14","fy":2025,"fq":4,"forecast":"Best Case","owner":"Tim Sprissler","territory":"Enterprise East 1","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Retail","contractType":"New Logo","mainIncumbent":"NICE","currentProvider":"Five9","probability":25,"nextStep":"5/9/2025 - Meeting with Jason Harvey from CBTS next week to discuss this need.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001AxLoYIAV","name":"GOVERNMENT EMPLOYEES HEALTH ASSOCIATION (GEHA) |  Amendment  | 2025-02-28","account":"GOVERNMENT EMPLOYEES HEALTH ASSOCIATION (GEHA)","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.16,"amountServices":55000,"oppAmount":57200.16,"closeDate":"2025-11-07","fy":2025,"fq":4,"forecast":"Commit","owner":"Jason Cates","territory":"Commercial Central 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C43","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"None","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"7/15/2025 this deal has closed for recording migration.  We've had the sales to service call and they've had the initial kick-off call.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001qmw01IAA","name":"MY RHB_CXOne_RFP","account":"RHB Bank Berhad - Malaysia - Enterprise","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2000,"amountServices":44000,"oppAmount":110847.54,"closeDate":"2025-11-06","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Ash Ramsammy","territory":"South Asia","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"Exst. Customer / New LOB","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001Ox8CxIAJ","name":"Zurich North America | AIG Travel Guard Acquisition | Cloud PBP + CC & Services | 900","account":"Zurich Travel Guard","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.19,"amountServices":74250,"oppAmount":139900.86,"closeDate":"2025-11-06","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Casey Jones","territory":"Strategic Verticals","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Finance and Insurance","contractType":"New Logo","mainIncumbent":"Genesys Cloud","currentProvider":"Genesys","probability":0,"nextStep":"1030 closed loss error. they cancelled the project.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001AxAGRIA3","name":"Truist - CXone Engagement Hub","account":"Truist Financial Corporation - Enterprise","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1000,"amountServices":15400,"oppAmount":88856.56,"closeDate":"2025-10-31","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Christi Civalier","territory":"Strategic Financial Services","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"Exst. Customer / New LOB","mainIncumbent":"None","currentProvider":"Amazon","probability":0,"nextStep":"10/21 Discuss 2 options On-Prem - internal process would not be approved before renewal 12/25 they have security issues that need to be resolved ASAP Engage is EOL in 7 months - Engage to Cloud next steps","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001f4HyDIAU","name":"NJM INSURANCE GROUP |  Amendment  | Applink Option for Migration","account":"NJM INSURANCE GROUP","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.14,"amountServices":59400,"oppAmount":250814.36,"closeDate":"2025-10-30","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Jaime Reloj","territory":"Enterprise East 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"C53","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","mainIncumbent":"None","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"10/27 Met with S.Knorr Dir of IT and Ring on proposal configuration for full migration from Engage to Cxone. Agreement to submit proposal from Ring to NJM for internal review and approvals.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001iARDBIA4","name":"The Toronto Dominion Bank US West | Bell Canada | CXone Multi ACD 12k Services","account":"THE TORONTO-DOMINION BANK US WEST","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":29480,"oppAmount":156014.4,"closeDate":"2025-10-29","fy":2025,"fq":4,"forecast":"Commit","owner":"Neil Balthazaar","territory":"Canada","region":"Americas","regionSource":"salesforce","cxoneInstance":"C205","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Finance and Insurance","contractType":"Exst. Customer / Expansions","mainIncumbent":"Verint","currentProvider":"Cisco Systems","probability":100,"nextStep":"TD has executed the agreement with Bell Canada. Waiting partner approval to CLOSED WON. *Following up with BELL Canada daily 10/24","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)"},
  {"id":"006Ui00001lqApKIAU","name":"RINGCENTRAL CC SE1 B32 OSH |  Amendment  | 2025-10-07","account":"RINGCENTRAL CC SE1 B32 OSH","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2400,"amountServices":22000,"oppAmount":567806.26,"closeDate":"2025-10-22","fy":2025,"fq":4,"forecast":"Commit","owner":"Andrew Sorensen","territory":"Enterprise West 1","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New LOB","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001MZD5FIAX","name":"CaixaBank P&C | CXone | DTGB | 250","account":"CaixaBank Payments & Consumer","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1600,"amountServices":20020,"oppAmount":33923.43,"closeDate":"2025-10-10","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Jaime Colom","territory":"Southern Europe","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"EUR","industry":"Banks","contractType":"Exst. Customer / New LOB","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":0,"nextStep":"JCC - DTGB proposal was not accepted by Caixa. MD from DTGB is trying to get a call with CEO and CIO from Caixa to align, but Caixa is stating that for now they wont accept any change from current contract","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001RdtkbIAB","name":"W.C. BRADLEY |  Amendment  | Interactions Hub","account":"W.C. BRADLEY","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":0,"closeDate":"2025-10-02","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Jon Gray","territory":"Commercial Central 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C63","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Retail Trade​","contractType":"Addendum","mainIncumbent":"None","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"7/21 JG - Working through requirements with customer.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000sV8tRIAS","name":"Amex TRS_Skyward_CXone Omnichannel (+ LVox) [32,000]","account":"AMERICAN EXPRESS TRAVEL RELATED SERVICES COMPANY","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.09,"amountServices":106480,"oppAmount":4270502.63,"closeDate":"2025-10-02","fy":2025,"fq":4,"forecast":"Long Shot","owner":"Rich Barefoot","territory":"Strategic Industries","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Financial Services","contractType":"New OCR Logo","mainIncumbent":"Genesys Engage","currentProvider":"Genesys","probability":0,"nextStep":"7/25 RB 1)Mtg w VP Patrick B 7/18 2)Cognizant told us RFP released Aug 6 to (3) hyperscalers + NiCE /Genesys 3) PB stated decision influx; being viewed as more transformative by leadership 4) PB will text updates 5) Follow up w/ Cognizant","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001eEIdRIAW","name":"TRUHEARING |  Amendment  | Interactions Hub","account":"TRUHEARING","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":3000,"amountServices":27500,"oppAmount":43720,"closeDate":"2025-09-29","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Brady Smith","territory":"Commercial West 3","region":"","regionSource":"inferred","cxoneInstance":"C56","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / New LOB","mainIncumbent":"None","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"Obtain quote internally then send to TruHearing","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"0063n000011zsc1AAA","name":"TD Bank Financial Group - CXone Multi ACD - Verint Takeout","account":"THE TORONTO-DOMINION BANK US WEST","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2680,"amountServices":0,"oppAmount":679912.36,"closeDate":"2025-09-26","fy":2025,"fq":3,"forecast":"Commit","owner":"Neil Balthazaar","territory":"Canada","region":"Americas","regionSource":"salesforce","cxoneInstance":"C205","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Financial Services","contractType":"Addendum","mainIncumbent":"Verint","currentProvider":"Cisco Systems","probability":100,"nextStep":"9/26/2025 All approvals complete from TD. Awaiting Execution today 9/26, latest 9/29.","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001jQGbVIAW","name":"WNS On Prem to Cloud (Multi ACD) US BU 200","account":"WNS GLOBAL SERVICES (P) LTD - INDIA - HQ","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":626,"amountServices":7040,"oppAmount":15374.34,"closeDate":"2025-09-26","fy":2025,"fq":3,"forecast":"Commit","owner":"Mayur Jorapur","territory":"South Asia","region":"International","regionSource":"salesforce","cxoneInstance":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Call Center / BPO​","contractType":"Exst. Customer / New BU","mainIncumbent":"NICE","currentProvider":"Avaya","probability":100,"nextStep":"Same opp of WNS multi ACD, need one more BU, in US for WNS end customer, this change happened post the ping test","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000KSez6IAD","name":"VISA | Multi ACD | QC | NFC | 2000 agents","account":"Visa Inc","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":55000,"oppAmount":196132.2,"closeDate":"2025-09-26","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Ryan Teague","territory":"Enterprise East 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Digital Payments","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"NICE","currentProvider":"Genesys","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001G5KSbIAN","name":"INSURANCE AUSTRALIA GROUP |  Amendment  | Multi-ACD - CISCO CM | 5000","account":"INSURANCE AUSTRALIA GROUP","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.17,"amountServices":86632,"oppAmount":144023.2,"closeDate":"2025-09-21","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Roger McCarthy","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"Verint","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001TFASUIA5","name":"BCBSAZ MEDISUN INC DBA BCBS OF ARIZONA |  Amendment  | Interactions Hub","account":"BCBSAZ MEDISUN INC DBA BCBS OF ARIZONA","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":6160,"amountServices":82500,"oppAmount":95260,"closeDate":"2025-09-08","fy":2025,"fq":3,"forecast":"Commit","owner":"Larissa Bakaldin","territory":"Commercial West 3","region":"","regionSource":"inferred","cxoneInstance":"C17","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"9/8 - fully executed SO attached to opp","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000nwNJNIA2","name":"OneMain Financial - PRIMARY CXone Mpower with IEX Integrated- 7,700 Agents","account":"OneMain Financial","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.04,"amountServices":19140,"oppAmount":2708084.06,"closeDate":"2025-08-28","fy":2025,"fq":3,"forecast":"Commit","owner":"Luke Johnson","territory":"Enterprise West 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C40","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"8/27/25 - LJ - Agreement fully executed, AWS Addendum being processed for signature. Closing once quote approvals are complete.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000RDQBdIAP","name":"Flagstar Bank | Engage Cloud Migration | 1190","account":"FLAGSTAR BANK","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":27500,"oppAmount":122225.2,"closeDate":"2025-08-27","fy":2025,"fq":3,"forecast":"Best Case","owner":"Amanda Lynn","territory":"Enterprise West 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"","currentProvider":"Cisco Systems","probability":25,"nextStep":"6/24/24 Spoke with IT team this morning about multi tenant v  single tenant. Preparing additional information on differences and next call is this wednesday. We are working with Flagstar to get in front of the Sparc comitteeTechnical call with Flagstar IT","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001ZQhsfIAD","name":"ANZ |  Amendment  | Interactions Hub","account":"ANZ","stage":"5 - Proposal / Negotiation","isWon":false,"isClosed":false,"amount":0.3,"amountServices":70280.21,"oppAmount":-39667.28,"closeDate":"2025-08-14","fy":2025,"fq":3,"forecast":"Commit","owner":"Callum Docherty","territory":"ANZ - 1","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Other","contractType":"Exst. Customer / New LOB","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":75,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001D0oMbIAJ","name":"PBS - 1200 CXone Mpower CSA","account":"PENINSULA BUSINESS SERVICES LTD","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":3950,"amountServices":17380,"oppAmount":448192.08,"closeDate":"2025-08-08","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Stephen Cosgrove","territory":"UK&I Major Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Call Center / BPO​","contractType":"New Logo","mainIncumbent":"RingCentral","currentProvider":"RingDNA","probability":0,"nextStep":"07/07 Board mtg/decision SC to contact QA 03/07 final on-site mtg 03/07 1.00pm to present follow-up items 26/06 several follow-up items to deliver, following two-day on-site (see teams channel -BAFO ACTIONS FILE)20/06 Ryan PoV on-site","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001VGtm9IAD","name":"PPL Utilities | Accenture | CXone | Professional Services | 1150","account":"PPL UTILITIES","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":22000,"oppAmount":1016385,"closeDate":"2025-08-08","fy":2025,"fq":3,"forecast":"Commit","owner":"Jim Kelley","territory":"Enterprise East 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / Expansions","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00000XGALNIA5","name":"FIDELITY INFORMATION SERVICES LLC NORTH AMERICA |  Amendment  | Interactions Hub-CANX","account":"FIDELITY INFORMATION SERVICES LLC NORTH AMERICA","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2500,"amountServices":22000,"oppAmount":27800.16,"closeDate":"2025-08-01","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Hector Ortega","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"C34","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Outsourcing","contractType":"Exst. Customer / New LOB","mainIncumbent":"No competitor","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001XkRo4IAF","name":"TALKTALK |  Amendment  | 2025-07-15 Interactions Hub","account":"TALKTALK","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2370,"amountServices":21725,"oppAmount":26274.07,"closeDate":"2025-07-31","fy":2025,"fq":3,"forecast":"Commit","owner":"Ian O'Farrell","territory":"UK&I Major Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"L35","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Telco","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"22/7/25 Interactions hub requirement for call miner ingestion. quote with customer. but Cal miner extraction will need to be done by CM as TalkTalk don't have skills and outside of NiCE responsibility","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000KdcZrIAJ","name":"MIGDAL Insurance - CXone Multi-ACD - 1,500 Agents","account":"MIGDAL INSURANCE COMPANY LTD.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.06,"amountServices":51975,"oppAmount":85137.57,"closeDate":"2025-07-28","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Eytan Chen","territory":"Africa & Israel","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / Expansions","mainIncumbent":"No competitor","currentProvider":"Cisco Systems","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001FQow5IAD","name":"INSURANCE AUSTRALIA GROUP |  Amendment  | Interactions Hub - Engage Call Migration","account":"INSURANCE AUSTRALIA GROUP","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":3060,"amountServices":65560,"oppAmount":71122.4,"closeDate":"2025-07-25","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Roger McCarthy","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"Not applicable / No Decision","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"Optus / IAG to provide a migration server to enable the migration of legacy recordings. Finding a viable technical solution for the migration of legacy recordings is delaying closing this opportunity","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000LgEyXIAV","name":"Broadview FCU | SKYWARD | CXone Bundle | 350","account":"BROADVIEW FEDERAL CREDIT UNION","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1575,"amountServices":0,"oppAmount":429287.03,"closeDate":"2025-07-23","fy":2025,"fq":3,"forecast":"Commit","owner":"Andrew Amoth","territory":"SMB Verticals","region":"Americas","regionSource":"salesforce","cxoneInstance":"C44","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Credit Unions","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"AA: 7/22 - Broadview signed. Collecting countersignatures internally and moving to Closed-Won!!!","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001Px9zdIAB","name":"CAG | CXone | 17 | Avaya Replacement | Skyward 2025","account":"Changi Airport Group (Singapore) Pte Ltd","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1200,"amountServices":22000,"oppAmount":91505.65,"closeDate":"2025-07-14","fy":2025,"fq":3,"forecast":"Most Likely","owner":"Gabriel Ng","territory":"South Asia","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Aerospace & Defense","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":50,"nextStep":"Too expensive for the current use case. Relooking into the larger CC of CAG as they are facing issues with their current vendor.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000uwDhNIAU","name":"Vanderbilt University Medical Center | Multi-ACD WEM Suite | 500","account":"Vanderbilt University Medical Center","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":55000,"oppAmount":209219.16,"closeDate":"2025-07-03","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Dillon Hughes","territory":"Commercial East 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Calabrio","currentProvider":"Cisco Systems","probability":0,"nextStep":"RFP Proposal submitted December 20th. Demo/on-site visits were scheduled for 1/6-1/17, but have been delayed. Re-submitted an updated RFP on 1/28, and shared with RFP team that we will be at ViVE. Vendor selection process was scheduled to begin 1/31.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001QGnTVIA1","name":"TT2 LTD |  Amendment  | 2025-05-30","account":"TT2 LTD","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":0,"closeDate":"2025-07-03","fy":2025,"fq":3,"forecast":"Commit","owner":"George Thompson","territory":"UK&I Major Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Transportation and Warehousing","contractType":"Addendum","mainIncumbent":"","currentProvider":"Other","probability":100,"nextStep":"Pushing through approvals","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000FVOF8IAP","name":"ConEd  | CXone | 1300 MPower","account":"ConEd  - Enterprise","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1617.6,"amountServices":33000,"oppAmount":1571686.34,"closeDate":"2025-07-02","fy":2025,"fq":3,"forecast":"Long Shot","owner":"Soleil Charbonnier","territory":"Enterprise East 1","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Utilities","contractType":"New Logo","mainIncumbent":"Genesys Engage","currentProvider":"Nortel","probability":0,"nextStep":"6/16 BAFO (#5) submitted to Ed Clarke (VP procurement) and uploaded into their RFP system today. Partner expects decision by 6/27","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000013Bt6zIAC","name":"PPL Utilities | CXone CCaaS RFP | 1150 | Skyward","account":"PPL UTILITIES","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":0,"oppAmount":1146085.87,"closeDate":"2025-06-30","fy":2025,"fq":2,"forecast":"Commit","owner":"Jeff Davis","territory":"Enterprise East 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"New OCR Logo","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"6/30 5p JMD:  1) PPL's General Counsel has requested some last minute changes to AI language.  Met at 4p and are passing redlines  2) After new language is approved, Jacque English will sign.","product":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001DMjMfIAL","name":"SS&C TECHNOLOGIES HOLDINGS, INC. |  Amendment  | Interactions Hub - Migrated calls |10 yr retention","account":"SS&C TECHNOLOGIES HOLDINGS, INC.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":0,"oppAmount":0.24,"closeDate":"2025-06-30","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Sarah Hill","territory":"Enterprise East 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Addendum","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"6/20 SIGNED by SS&C - now processing internal signatures and booking by 6/24","product":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000bjLRIIA2","name":"SS&C TECHNOLOGIES HOLDINGS, INC. |  Amendment  | Interactions Hub - Migrated calls 3 yr & 10 yr retention","account":"SS&C TECHNOLOGIES HOLDINGS, INC.","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.16,"amountServices":89540,"oppAmount":96052.16,"closeDate":"2025-06-30","fy":2025,"fq":2,"forecast":"Commit","owner":"Sarah Hill","territory":"Enterprise East 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Addendum","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"6/20 SIGNED by SS&C - now processing internal signatures and booking by 6/24","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001NQuSDIA1","name":"Workcover Queensland RFP | Australia | Optus | CXone | 1000 agts","account":"Workcover Queensland","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1043,"amountServices":18356.8,"oppAmount":180290.95,"closeDate":"2025-06-27","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Matt Turner","territory":"ANZ","region":"","regionSource":"inferred","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Other","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":0,"nextStep":"MT 12/06/25::  Advised that round 2 vendor presentation will be w/c 23rd June. Preparing content and deliver with Optus.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000mUPJtIAO","name":"SeekWell | New BU |  CXone ACD | 750","account":"","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2000,"amountServices":22000,"oppAmount":477174.31,"closeDate":"2025-06-26","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Greg Koehler","territory":"Enterprise East 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Ecommerce","contractType":"New OCR Logo","mainIncumbent":"Cisco","currentProvider":"","probability":0,"nextStep":"**placeholder for Opp 331995\"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000tjeT3IAI","name":"Seekwell | Skyward2025 | New Logo | CXone ACD Core Bundle | IEX Cloud | EEM | PM | FM | QMA | IA | Avant-Phase2 | 900","account":"1800 CONTACTS","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.1,"amountServices":0,"oppAmount":253588.58,"closeDate":"2025-06-24","fy":2025,"fq":2,"forecast":"Commit","owner":"Greg Koehler","territory":"Enterprise East 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"New OCR Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":100,"nextStep":"(GK) - All final drafts submitted in Docusign on 6/20  (MSA, BAA, DPA, SOW, OF). Multiple signers, expecting completed signatures by 6/24.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000LNdFtIAL","name":"Mercury NZ Limited (NTT) | New Zealand | CXone 500 agts","account":"MERCURY NEW ZEALAND","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2980,"amountServices":26224,"oppAmount":207883.51,"closeDate":"2025-06-13","fy":2025,"fq":2,"forecast":"Commit","owner":"Zac Randall","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Other","contractType":"New Logo","mainIncumbent":"Amazon Connect","currentProvider":"Amazon Connect","probability":100,"nextStep":"Signed, awaiting CCDC","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000bOHlZIAW","name":"GEHA | Recording Migration | 150","account":"GOVERNMENT EMPLOYEES HEALTH ASSOCIATION (GEHA)","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.16,"amountServices":27500,"oppAmount":29706.12,"closeDate":"2025-06-12","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Jason Cates","territory":"Commercial Central 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"C43","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"6/5/2025 We have the contract and PO back and getting pushed through approvals to complete and set-up a kick-off call","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001V58eZIAR","name":"Geisinger System | Avant | CXone | 1550 Skyward 2025","account":"GEISINGER SYSTEM SERVICES","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":3200,"amountServices":27500,"oppAmount":2055526.87,"closeDate":"2025-06-10","fy":2025,"fq":2,"forecast":"Commit","owner":"Christy Klesney","territory":"Strategic Industries","region":"Americas","regionSource":"salesforce","cxoneInstance":"C58","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / New BU","mainIncumbent":"Cisco","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"6.6 - Next step is 6.6 -  MRA, Order Doc, SOW all fully execute by Dan B and Ash on 6/5/25 and Dan B and Mike on 6/6/25. Close win opp on 6/10","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000yagz3IAA","name":"Alliance Healthcare Group | Genesys Replacement | Singtel | CXone | 50","account":"Alliance Healthcare Group Limited","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1200,"amountServices":11000,"oppAmount":161081.94,"closeDate":"2025-06-09","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Gabriel Ng","territory":"South Asia","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Takacom","currentProvider":"Genesys","probability":0,"nextStep":"Technical clarifications completed. AHG expected to announce vendor shortlist on 6th June, followed by BAFO.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001XfTBJIA3","name":"UNC Healthcare | Avant | Multi ACD | Presidio | 1200","account":"UNC Health Care System - Enterprise","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.11,"amountServices":19250,"oppAmount":245689.15,"closeDate":"2025-06-06","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Josh Barber","territory":"Healthcare","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"NICE","currentProvider":"Cisco Systems","probability":0,"nextStep":"Check in with partner at presidio to see if other projects have been completed that were causing this project to be placed on hold. checkin scheduled for Monday may 26th","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"0063n000011zYNjAAM","name":"Puget Sound Energy | Uptivity to Engage - 2024 Uptivity Campaign","account":"PUGET SOUND ENERGY CORP","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2500,"amountServices":16500,"oppAmount":61406.26,"closeDate":"2025-06-04","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Larissa Bakaldin","territory":"Commercial West 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"C62","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New LOB","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":0,"nextStep":"6/2 - escalated internally for updated docs 5/29 - Substantial change on security requirements from PSE during contracting. Adjusting SKU's for rapid close for Phase 1. Currently waiting on Advance services to send the new LOE for the migration","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001AbMZaIAN","name":"PUGET SOUND ENERGY CALL CENTER |  Amendment  | Premier Pkg","account":"PUGET SOUND ENERGY CALL CENTER","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2500,"amountServices":27500,"oppAmount":99701.96,"closeDate":"2025-06-04","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Larissa Bakaldin","territory":"Commercial West 2","region":"","regionSource":"inferred","cxoneInstance":"C62","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","mainIncumbent":"Uptivity","currentProvider":"Cisco Systems","probability":0,"nextStep":"6/2 - escalated internally for updated docs 5/29 - Substantial change on security requirements from PSE during contracting. Adjusting SKU's for rapid close for Phase 1. Currently waiting on Advance services to send the new LOE for the migration","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000rHdhZIAS","name":"ENERGY AUSTRALIA 2ND BU |  Amendment  | 2024-10-30","account":"ENERGY AUSTRALIA 2ND BU","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2980,"amountServices":26224,"oppAmount":33701.4,"closeDate":"2025-06-04","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Mitchell Hawke","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A32","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Utilities","contractType":"Addendum","mainIncumbent":"No competitor","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"0063n000010nhUSAAY","name":"Westpac (Optus) | ANZ | CXone CCaaS | 2000","account":"Westpac Banking Corporation Limited","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1192.07,"amountServices":68838,"oppAmount":2629035.74,"closeDate":"2025-06-03","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Callum Docherty","territory":"ANZ","region":"APAC","regionSource":"salesforce","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Banks","contractType":"New OCR Logo","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":0,"nextStep":"RFP Complete. Demo complete. Budgeting to be confirmed by Customer. Awaiting selection as a finalist decision.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000fewVVIAY","name":"ENERGY AUSTRALIA | Amendment | Interactions Hub Call Migration","account":"ENERGY AUSTRALIA 2ND BU","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2682,"amountServices":23601.6,"oppAmount":37208.16,"closeDate":"2025-06-03","fy":2025,"fq":2,"forecast":"Commit","owner":"Mitchell Hawke","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A32","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Utilities","contractType":"Exst. Customer / New LOB","mainIncumbent":"Other","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"EA budget brought forward into June and have signed contract with Optus. PQD being accepted.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000c2YgRIAU","name":"DELOITTE | Ultimate bundle for Demo BU","account":"DELOITTE GPS DEMO BU 32","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":124,"closeDate":"2025-06-03","fy":2025,"fq":2,"forecast":"Commit","owner":"Adam Arbeit","territory":"Commercial East 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00001IeAIkIAN","name":"ANZ NCCR QA | ANZ","account":"ANZ NCCR QA","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.3,"amountServices":40975,"oppAmount":46080.54,"closeDate":"2025-06-01","fy":2025,"fq":2,"forecast":"Commit","owner":"Andrew Austin","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Banks","contractType":"Exst. Customer / New BU","mainIncumbent":"NICE","currentProvider":"Genesys","probability":100,"nextStep":"AA - Quote to be finalised","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001IeBmfIAF","name":"ANZ NCCR Dev | ANZ","account":"ANZ NCCR DEV","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.24,"amountServices":32780,"oppAmount":54132.9,"closeDate":"2025-05-27","fy":2025,"fq":2,"forecast":"Commit","owner":"Andrew Austin","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Banks","contractType":"Exst. Customer / New BU","mainIncumbent":"NICE","currentProvider":"Genesys","probability":100,"nextStep":"AA - Quote to be approved by 29th May. Opportunity will then be booked","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001XhKbwIAF","name":"Cincinnati Children's Medical | 2024 Uptivity Campaign | 2000","account":"CINCINNATI CHILDRENS MEDICAL CENTER","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2500,"amountServices":22000,"oppAmount":83868.98,"closeDate":"2025-05-20","fy":2025,"fq":2,"forecast":"Most Likely","owner":"Ryan Black","territory":"Healthcare","region":"Americas","regionSource":"salesforce","cxoneInstance":"C46","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Uptivity","currentProvider":"Other","probability":50,"nextStep":"RB - Still no response from Taylor Haas.  I've sent a final email today and will close this out if I don't hear back by 5/16.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"0063n000010m4BwAAI","name":"DWP - UK - Enterprise - CCaaS","account":"DEPARTMENT FOR WORK AND PENSIONS","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":39000,"amountServices":75429.2,"oppAmount":3384378.83,"closeDate":"2025-05-14","fy":2025,"fq":2,"forecast":"Commit","owner":"Martin Joice","territory":"UK&I Major Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"LO26","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Government","contractType":"New Logo","mainIncumbent":"Genesys Engage","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"09.05.25 MJ: Target to be booked by 16.05.25","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001HRHAXIA5","name":"YOUNG WILLIAMS NON-FEDRAMP | Amendment | Remove Interaction Hub","account":"YOUNG WILLIAMS NON-FEDRAMP","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":-2000,"amountServices":-22000,"oppAmount":-40135,"closeDate":"2025-05-09","fy":2025,"fq":2,"forecast":"Commit","owner":"Collin Alexander","territory":"SLED East","region":"Americas","regionSource":"salesforce","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Government & Public Administration","contractType":"Addendum","mainIncumbent":"","currentProvider":"Genesys","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000MRi0JIAT","name":"Phoenix Insurence - Israel | Multi ACD recording | 1,200","account":"The Phoenix Insurance Company Limited","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.06,"amountServices":84700,"oppAmount":115479,"closeDate":"2025-05-08","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Eytan Chen","territory":"Africa & Israel","region":"International","regionSource":"salesforce","cxoneInstance":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Insurance","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"No competitor","currentProvider":"Avaya","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001AasI9IAJ","name":"Newcastle Building Society - SVL - Call Recording Import","account":"NEWCASTLE BUILDING SOCIETY","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.11,"amountServices":175500,"oppAmount":175941.15,"closeDate":"2025-05-02","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Sarah Stevenson","territory":"UK&I Major Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"L35","dcRegion":"UK1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001XhJJ1IAN","name":"Irwin Mitchell LLP - Natilik - Omnichannel - 160","account":"Irwin Mitchell LLP","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":4740,"amountServices":13904,"oppAmount":154850.74,"closeDate":"2025-05-01","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Jonathan Bradney","territory":"UK&I Major Accounts","region":"EMEA","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Legal","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":0,"nextStep":"Decision expected this week","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001Xh6uZIAR","name":"Irwin Mitchell | BSL | Omnichannel | 160","account":"Irwin Mitchell","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.09,"amountServices":13904,"oppAmount":199392.08,"closeDate":"2025-05-01","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Jonathan Bradney","territory":"UK&I Major Accounts","region":"EMEA","regionSource":"salesforce","cxoneInstance":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Legal","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":0,"nextStep":"RFP Submitted, Demo Completed and Clarifications submitted - requested formal next steps. Partners have heard nothing last week","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00001BQn9VIAT","name":"NEWCASTLE BUILDING SOCIETY |  Amendment  | Interactions Hub Call Import | SVL","account":"NEWCASTLE BUILDING SOCIETY","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1019.1,"amountServices":11728.02,"oppAmount":13932.71,"closeDate":"2025-04-30","fy":2025,"fq":2,"forecast":"Long Shot","owner":"Sarah Stevenson","territory":"UK&I Major Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"L35","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Financial Services","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"Provide quote once checked with SE Yutaka - Needs to coincide with Avaya renewal activity (date TBC)","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000uEyNRIA0","name":"Bank of the Sierra | 2024 Uptivity Campaign | 30","account":"BANK OF THE SIERRA","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":0,"oppAmount":4785.96,"closeDate":"2025-04-25","fy":2025,"fq":2,"forecast":"Commit","owner":"Kalie Phillipy","territory":"SMB Verticals","region":"","regionSource":"inferred","cxoneInstance":"C44","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"Other","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Customer has Addendum. Waiting for signatures.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000016RQwwIAG","name":"FIS GLOBAL - INTERNATIONAL BANKING |  Amendment | Add Interaction Hub","account":"FIS GLOBAL - INTERNATIONAL BANKING","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":19800,"oppAmount":24775,"closeDate":"2025-04-14","fy":2025,"fq":2,"forecast":"Commit","owner":"Hector Ortega","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"E35","dcRegion":"EU1","dcSource":"cluster","currency":"USD","industry":"Outsourcing","contractType":"Exst. Customer / Expansions","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Finalize order with Sherri and sales ops submission","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000lWknqIAC","name":"Waste Management | CXone | Multi ACD","account":"Waste Management, Inc.","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.05,"amountServices":51975,"oppAmount":435101.21,"closeDate":"2025-03-31","fy":2025,"fq":1,"forecast":"Long Shot","owner":"Chris Shandley","territory":"Enterprise West 3","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Utilities","contractType":"New Logo","mainIncumbent":"","currentProvider":"Avaya","probability":25,"nextStep":"11/25 CE - Engage on prem upgrade w IA and N4C Prod - Multi ACDKC - Pundi Ashok NS- Quote reviewed and WM is still focused on cloud conversions.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001XhOIhIAN","name":"Cedars Sinai | Avant | CXone Multi-ACD | 650","account":"Cedars-Sinai Medical Center","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1750,"amountServices":22000,"oppAmount":68480.89,"closeDate":"2025-03-28","fy":2025,"fq":1,"forecast":"Best Case","owner":"Kyler Wilson","territory":"Healthcare","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":25,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001V3mneIAB","name":"Sydney Water | Australia | CXone | 354 agents","account":"Sydney Water","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1543.73,"amountServices":23273.8,"oppAmount":180637.91,"closeDate":"2025-03-18","fy":2025,"fq":1,"forecast":"Long Shot","owner":"Richard Langstaff","territory":"ANZ","region":"APAC","regionSource":"salesforce","cxoneInstance":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Utilities","contractType":"New Logo","mainIncumbent":"Genesys PureCloud","currentProvider":"Genesys","probability":0,"nextStep":"Guiding client on certified partners","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000IHJqHIAX","name":"ALLIANT ENERGY CORPORATE SERVICES, INC. |  Playback Portal to Interactions Hub","account":"ALLIANT ENERGY CORPORATE SERVICES, INC.","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":12300,"amountServices":18500,"oppAmount":-1327113.33,"closeDate":"2025-03-17","fy":2025,"fq":1,"forecast":"Commit","owner":"Jon Kane","territory":"Commercial Central 1","region":"Americas","regionSource":"salesforce","cxoneInstance":"C69","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui000016R68bIAC","name":"WORLDPAY, LLC |  Amendment  | Add Interactions Hub","account":"WORLDPAY, LLC","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":31838.4,"oppAmount":44596.39,"closeDate":"2025-03-13","fy":2025,"fq":1,"forecast":"Commit","owner":"Hector Ortega","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"E32","dcRegion":"EU1","dcSource":"cluster","currency":"USD","industry":"Outsourcing","contractType":"Exst. Customer / Expansions","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Recording labs to finish analysis of the sample recordings provided.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000rIseYIAS","name":"American National | Multi ACD | New BU","account":"AMERICAN NATIONAL INSURANCE COMPANY INC (ANICO)","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0.16,"amountServices":44000,"oppAmount":191757.96,"closeDate":"2025-02-27","fy":2025,"fq":1,"forecast":"Commit","owner":"Cassie Schroeder","territory":"Commercial Central 4","region":"Americas","regionSource":"salesforce","cxoneInstance":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / New BU","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":100,"nextStep":"2/21 - C1 to sign NICE order","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000z67uvIAA","name":"CONSTELLATION INSURANCE |  Amendment  | remove playback portal add I hub","account":"CONSTELLATION INSURANCE","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":0,"oppAmount":-14700,"closeDate":"2025-02-24","fy":2025,"fq":1,"forecast":"Commit","owner":"Jaime Reloj","territory":"Enterprise East 2","region":"Americas","regionSource":"salesforce","cxoneInstance":"C69","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000xjkEPIAY","name":"CROSS COUNTRY TRAINS |  Amendment  | legacy call ingestion | Fournet","account":"CROSS COUNTRY TRAINS","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":1343,"amountServices":11297,"oppAmount":13562.43,"closeDate":"2025-02-17","fy":2025,"fq":1,"forecast":"Long Shot","owner":"George Thompson","territory":"UK&I Commercial","region":"International","regionSource":"salesforce","cxoneInstance":"L35","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Transportation and Warehousing","contractType":"Exst. Customer / Expansions","mainIncumbent":"No competitor","currentProvider":"Cisco Systems","probability":0,"nextStep":"v2 proposal under consideration for compliance requirement for 12 months legacy call access (via Fournet)","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000lMMZtIAO","name":"CANADIAN INSURANCE ALLIANCE (2018) INC. |  Amendment | Interactions Hub Migration Upgrade","account":"HUB INTERNATIONAL CANADA HOLDING LIMITED","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2593.4399999999996,"amountServices":55000,"oppAmount":60343.52,"closeDate":"2025-01-27","fy":2025,"fq":1,"forecast":"Commit","owner":"Julie Henderson","territory":"Commercial Central 2","region":"","regionSource":"inferred","cxoneInstance":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Addendum sent out for signature. Awaiting them to sign","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000wTsLjIAK","name":"OPTUS SYSTEMS PTY LTD |  Amendment  | CXone Interactions Hub","account":"OPTUS SYSTEMS PTY LTD","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.24,"amountServices":81950,"oppAmount":79134.36,"closeDate":"2025-01-07","fy":2025,"fq":1,"forecast":"Long Shot","owner":"Roger McCarthy","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A32","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Telco","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000xwap7IAA","name":"OPTUS SYSTEMS PTY LTD |  Amendment  | Interactions Hub - Legacy Recording Decommissioning Project","account":"OPTUS SYSTEMS PTY LTD","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":9600,"amountServices":81950,"oppAmount":92370,"closeDate":"2025-01-07","fy":2025,"fq":1,"forecast":"Long Shot","owner":"Roger McCarthy","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A32","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Telco","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000ubDcLIAU","name":"CSAA INSURANCE SERVICES INC | Amendment | Conversion from PBP to IH","account":"CSAA INSURANCE SERVICES INC","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":10112.16,"amountServices":0,"oppAmount":10112.16,"closeDate":"2025-01-06","fy":2025,"fq":1,"forecast":"Commit","owner":"David Young","territory":"Enterprise West 1","region":"Americas","regionSource":"salesforce","cxoneInstance":"C63","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000vLBHNIA4","name":"YOUNG WILLIAMS | NON-FEDRAMP | Amendment  | Interactions Hub","account":"YOUNG WILLIAMS NON-FEDRAMP","stage":"Closed - Cancelled (Implementation)","isWon":false,"isClosed":true,"amount":2000,"amountServices":22000,"oppAmount":40135,"closeDate":"2024-12-27","fy":2024,"fq":4,"forecast":"Long Shot","owner":"Brian Romine","territory":"SLED East","region":"Americas","regionSource":"salesforce","cxoneInstance":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Government & Public Administration","contractType":"Addendum","mainIncumbent":"","currentProvider":"Genesys","probability":0,"nextStep":"12/23 - Customer deciding how to proceed after unfavorable decision to hold YW to a clerical error by NICE and billing issue relating to storage ($30 gig) overpaying nearly $50K.  Need Ash to give up $55k to get $400K.  Billing needs fixed ASAP!","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000q4BVBIA2","name":"YOUNG WILLIAMS | FedRamp | Amendment | Interactions Hub","account":"YOUNG WILLIAMS","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2000,"amountServices":22000,"oppAmount":39799,"closeDate":"2024-12-27","fy":2024,"fq":4,"forecast":"Commit","owner":"Brian Romine","territory":"SLED East","region":"Americas","regionSource":"salesforce","cxoneInstance":"C74","dcRegion":"NA2","dcSource":"cluster","currency":"USD","industry":"Government & Public Administration","contractType":"Addendum","mainIncumbent":"Genesys","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"12/23 - Customer deciding how to proceed after unfavorable decision to hold YW to a clerical error by NICE and billing issue relating to storage ($30 gig) overpaying nearly $50K.  Need Ash to give up $55k to get $400K.  Billing needs fixed ASAP!","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000OPJJOIA5","name":"Raymond James | CXOne Direct","account":"RAYMOND JAMES & ASSOCIATES, INC.","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":12100,"oppAmount":1199032.58,"closeDate":"2024-12-23","fy":2024,"fq":4,"forecast":"Commit","owner":"Robert McCants","territory":"Named South","region":"Americas","regionSource":"salesforce","cxoneInstance":"C38","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"12/23 - Signed docs in hand - processing for booking","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000nwyxFIAQ","name":"CINCH HOME SERVICES, INC. |  Amendment  | Engage Migration + IH","account":"CINCH HOME SERVICES, INC.","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1750,"amountServices":19250,"oppAmount":22870,"closeDate":"2024-12-20","fy":2024,"fq":4,"forecast":"Commit","owner":"Kristee Blanciak","territory":"Named South","region":"Americas","regionSource":"salesforce","cxoneInstance":"C43","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / Expansions","mainIncumbent":"NICE","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"Signatureless addendum","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000djoLZIAY","name":"Columbia Valley Community Health | Telarus | CXone | 25 - Uptivity","account":"COLUMBIA VALLEY COMMUNITY HEALTH","stage":"Closed - Cancelled (Implementation)","isWon":false,"isClosed":true,"amount":0.16,"amountServices":0,"oppAmount":2408.85,"closeDate":"2024-12-05","fy":2024,"fq":4,"forecast":"Commit","owner":"Chris Anderson","territory":"SMB NorthCentral","region":"","regionSource":"inferred","cxoneInstance":"","dcRegion":"","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"New OCR Logo","mainIncumbent":"Uptivity","currentProvider":"Cisco Systems","probability":0,"nextStep":"Ready to sign","product":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000HmaCIIAZ","name":"Exelon C1 Applink, QM","account":"EXELON CORPORATION - ENTERPRISE","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.07,"amountServices":35200,"oppAmount":181375.64,"closeDate":"2024-11-25","fy":2024,"fq":4,"forecast":"Long Shot","owner":"James Cowart","territory":"Majors East","region":"Americas","regionSource":"salesforce","cxoneInstance":"C210","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / New LOB","mainIncumbent":"NICE","currentProvider":"Avaya","probability":0,"nextStep":"CE: EOS for Engage, cloud migration P: Applink QM KC: Heather Foss NS: Formalize SOE and competing offer from C1","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001V2NkLIAV","name":"Cadence Bank | Avant | CXone | 400","account":"CADENCE BANK  NA","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1875,"amountServices":15400,"oppAmount":522568.23,"closeDate":"2024-11-19","fy":2024,"fq":4,"forecast":"Commit","owner":"Nick Amon","territory":"Commercial East 1","region":"Americas","regionSource":"salesforce","cxoneInstance":"C700","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Banks","contractType":"New Logo","mainIncumbent":"Cisco","currentProvider":"Cisco Systems","probability":100,"nextStep":"Contracts to be Executed","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000l0s5bIAA","name":"American National | C1 | CXone Multi-ACD | 1000 agents | 2024 Uptivity Campaign","account":"AMERICAN NATIONAL INSURANCE COMPANY INC (ANICO)","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":28801.25,"amountServices":0,"oppAmount":673441326.37,"closeDate":"2024-11-08","fy":2024,"fq":4,"forecast":"Long Shot","owner":"Cassie Schroeder","territory":"Nationals Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"New Logo","mainIncumbent":"Avaya","currentProvider":"Avaya","probability":0,"nextStep":"Deliver approved Quote","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above; CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001V3vObIAJ","name":"Amex TRS_CXone Omnichannel (+ LVox) [32,000]","account":"AMERICAN EXPRESS TRAVEL RELATED SERVICES COMPANY","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2.89,"amountServices":106480,"oppAmount":2918233624402.59,"closeDate":"2024-11-07","fy":2024,"fq":4,"forecast":"Long Shot","owner":"Rich Barefoot","territory":"Strategic Industries East","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / New LOB","mainIncumbent":"Genesys Engage","currentProvider":"Genesys","probability":0,"nextStep":"11.04.24 Preparing onsite 11/18 for technical 'how to' session for migration w/VP IT Joe Fenicle and several directors","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000PgRodIAF","name":"TP - HEALTHADVOCATE | Amendment | Swap PBP with Interaction Hub","account":"TP - HEALTHADVOCATE","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1980,"amountServices":55000,"oppAmount":-66878,"closeDate":"2024-11-01","fy":2024,"fq":4,"forecast":"Commit","owner":"Hector Ortega","territory":"Global BPO","region":"Americas","regionSource":"salesforce","cxoneInstance":"C69","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Outsourcing","contractType":"Exst. Customer / Expansions","mainIncumbent":"Avaya","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000mV4JpIAK","name":"HRB TAX GROUP INC |  Amendment  | Engage to Interactions Hub","account":"HRB TAX GROUP INC","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":0,"oppAmount":0,"closeDate":"2024-11-01","fy":2024,"fq":4,"forecast":"Commit","owner":"Michael Carlin","territory":"Nationals South","region":"Americas","regionSource":"salesforce","cxoneInstance":"C42","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000WxFlNIAV","name":"ANZ Bank | Australia | CXone | Interactions Hub","account":"ANZ","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":7.2,"amountServices":0,"oppAmount":18471464836.4,"closeDate":"2024-10-28","fy":2024,"fq":4,"forecast":"Long Shot","owner":"Andrew Austin","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"NICE","currentProvider":"Genesys","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000Ql3rVIAR","name":"ANZ Bank | Australia | Cloud Recording Multi ACD","account":"ANZ","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":0,"amountServices":21307,"oppAmount":846155.65,"closeDate":"2024-10-10","fy":2024,"fq":4,"forecast":"Commit","owner":"Andrew Austin","territory":"ANZ","region":"International","regionSource":"salesforce","cxoneInstance":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"Genesys","currentProvider":"Genesys","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)"},
  {"id":"006Ui00000Gwsi1IAB","name":"Phoenix | SVL | Interactions Hub | 1800","account":"PHOENIX GROUP HOLDINGS PLC","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":2000,"amountServices":21725,"oppAmount":25133,"closeDate":"2024-09-24","fy":2024,"fq":3,"forecast":"Long Shot","owner":"John Taggart","territory":"UK&I Major New Accounts","region":"International","regionSource":"salesforce","cxoneInstance":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Financial Services","contractType":"Exst. Customer / New LOB","mainIncumbent":"BT","currentProvider":"Cisco Systems","probability":0,"nextStep":"JT - 050924 - As per Multi ACD opp update.","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Ui00000RoUMjIAN","name":"American National | C1 | Uptivity Conversion | Multi-ACD | 1300","account":"","stage":"Closed – No Opportunity","isWon":false,"isClosed":true,"amount":0.06,"amountServices":13750,"oppAmount":39489.31,"closeDate":"2024-06-24","fy":2024,"fq":2,"forecast":"Best Case","owner":"Andrew McNulty","territory":"Nationals Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Insurance","contractType":"New Logo","mainIncumbent":"","currentProvider":"","probability":25,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"0063n0000118CVmAAM","name":"Golden 1 Credit Union | CXone | 750 Agents","account":"GOLDEN 1 CREDIT UNION","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1125,"amountServices":5500,"oppAmount":630159.77,"closeDate":"2024-04-29","fy":2024,"fq":2,"forecast":"Commit","owner":"Alexis Flynn","territory":"Nationals West","region":"Americas","regionSource":"salesforce","cxoneInstance":"C210","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Credit Unions","contractType":"New Logo","mainIncumbent":"Genesys Engage","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Hu00001XhPSLIA3","name":"Hub HCC  | Amendment I Interactions Hub - Migrated Calls Project (Cisco)","account":"HUB INTERNATIONAL CANADA HOLDING LIMITED","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":2500,"amountServices":27500,"oppAmount":32200.08,"closeDate":"2024-04-15","fy":2024,"fq":2,"forecast":"Commit","owner":"Anthony Jarbou","territory":"Premier Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"USD","industry":"Insurance","contractType":"Addendum","mainIncumbent":"","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"},
  {"id":"006Ui00000GI5GAIA1","name":"CareSource | CXone Multi-ACD Recording | 1792 agents","account":"CARESOURCE MANAGEMENT SERVICES LLC","stage":"Closed – Lost","isWon":false,"isClosed":true,"amount":0.07,"amountServices":55000,"oppAmount":214979.25,"closeDate":"2024-04-03","fy":2024,"fq":2,"forecast":"Long Shot","owner":"Jeff Alsberg","territory":"Named Central","region":"Americas","regionSource":"salesforce","cxoneInstance":"C34","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / Cloud conversion","mainIncumbent":"Cisco","currentProvider":"NICE CXone Mpower","probability":0,"nextStep":"","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above"},
  {"id":"006Hu00001XfSRbIAN","name":"Carnival UK | CXone | legacy recording, interaction HUB | 330 Direct","account":"CARNIVAL PLC","stage":"Closed – Won","isWon":true,"isClosed":true,"amount":1645.18,"amountServices":17380,"oppAmount":20769.24,"closeDate":"2024-03-28","fy":2024,"fq":1,"forecast":"Commit","owner":"Greg Cheetham","territory":"UK&I Major New Accounts","region":"EMEA","regionSource":"salesforce","cxoneInstance":"L36","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Travel and Hospitality","contractType":"Exst. Customer / Expansions","mainIncumbent":"Verint","currentProvider":"NICE CXone Mpower","probability":100,"nextStep":"GC 27-3  signed contrcat PDF is with CUK procurement to be countersigned","product":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB); CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls"}
];

// Auto-synced pipeline line items · 2026-06-02 · 97 items across 47 open opps
// Auto-synced from Salesforce · last sync: 2026-07-01 · 85 pipeline line items · 45 open opps
const PIPELINE_LINE_ITEMS = [
  {"lineItemId":"00kUi00000DRBZOIA5","oppId":"006Ui00001ZQhsfIAD","oppName":"ANZ |  Amendment  | Interactions Hub","account":"ANZ","stage":"5 - Proposal / Negotiation","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.3,"listPrice":0.3,"unitPrice":0.3,"quantity":1,"closeDate":"2025-08-14","fy":2025,"fq":3,"forecast":"Commit","forecastCat":"—","region":"International","segment":"","territory":"ANZ - 1","cluster":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Other","contractType":"Exst. Customer / New LOB","incumbent":"Genesys","probability":75,"expRevenue":0.23,"oppAmount":-39667.28,"nextStep":""},
  {"lineItemId":"00kUi00000DRBZPIA5","oppId":"006Ui00001ZQhsfIAD","oppName":"ANZ |  Amendment  | Interactions Hub","account":"ANZ","stage":"5 - Proposal / Negotiation","sku":"Migration Service – 200,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB)","totalPrice":70280.21,"listPrice":108290,"unitPrice":70280.21,"quantity":1,"closeDate":"2025-08-14","fy":2025,"fq":3,"forecast":"Commit","forecastCat":"—","region":"International","segment":"","territory":"ANZ - 1","cluster":"A33","dcRegion":"AU1","dcSource":"cluster","currency":"AUD","industry":"Other","contractType":"Exst. Customer / New LOB","incumbent":"Genesys","probability":75,"expRevenue":52710.16,"oppAmount":-39667.28,"nextStep":""},
  {"lineItemId":"00kUi00000L4eVtIAJ","oppId":"006Ui00002ECl0VIAT","oppName":"COGNIZANT TECHNOLOGY DEMO BU |  Amendment  | 2026-03-18","account":"COGNIZANT TECHNOLOGY DEMO BU","stage":"1 - Identification / Qualification","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":0,"listPrice":22000,"unitPrice":0,"quantity":1,"closeDate":"2026-06-30","fy":2026,"fq":2,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"SmartReach","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":41840.03,"nextStep":""},
  {"lineItemId":"00kUi00000L4eVsIAJ","oppId":"006Ui00002ECl0VIAT","oppName":"COGNIZANT TECHNOLOGY DEMO BU |  Amendment  | 2026-03-18","account":"COGNIZANT TECHNOLOGY DEMO BU","stage":"1 - Identification / Qualification","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0,"listPrice":0.11,"unitPrice":0,"quantity":1,"closeDate":"2026-06-30","fy":2026,"fq":2,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"SmartReach","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":41840.03,"nextStep":""},
  {"lineItemId":"00kUi00000P16mbIAB","oppId":"006Ui00001iLMBnIAO","oppName":"Claritev | CXone | 950 Agents | Skyward & Northbound","account":"Claritev Corporation","stage":"5 - Proposal / Negotiation","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":55000,"listPrice":27500,"unitPrice":27500,"quantity":2,"closeDate":"2026-07-07","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial East 3","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Technology","contractType":"New Logo","incumbent":"Aspect","probability":75,"expRevenue":41250.0,"oppAmount":1660883.78,"nextStep":"DH | 6/30 - Expecting all 3 docs (BAA, CSO, MRA) back today. Feedback from customer is no major concerns. Sharing Letter of intent template tied to resource allocation with signatures by 7/6."},
  {"lineItemId":"00kUi00000P16maIAB","oppId":"006Ui00001iLMBnIAO","oppName":"Claritev | CXone | 950 Agents | Skyward & Northbound","account":"Claritev Corporation","stage":"5 - Proposal / Negotiation","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-07-07","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial East 3","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Technology","contractType":"New Logo","incumbent":"Aspect","probability":75,"expRevenue":2250.0,"oppAmount":1660883.78,"nextStep":"DH | 6/30 - Expecting all 3 docs (BAA, CSO, MRA) back today. Feedback from customer is no major concerns. Sharing Letter of intent template tied to resource allocation with signatures by 7/6."},
  {"lineItemId":"00kUi00000Oa73ZIAR","oppId":"006Ui00002MHibeIAD","oppName":"NISOURCE CORPORATE SERVICES COMPANY |  Amendment  | NiSource Migrated Calls","account":"NISOURCE CORPORATE SERVICES COMPANY","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":12109.12,"listPrice":0.2,"unitPrice":0.08,"quantity":151364,"closeDate":"2026-07-15","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise Central","cluster":"C200","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / New LOB","incumbent":"","probability":25,"expRevenue":3027.28,"oppAmount":12109.12,"nextStep":"6/22 Quoted to Accenture 6/15, they are not happy, but is required for migration. no timeline"},
  {"lineItemId":"00kUi00000Otu3lIAB","oppId":"006Ui00002XA8UyIAL","oppName":"CALOPTIMA |  Amendment  | PS Only | Migrating calls from engage","account":"CALOPTIMA","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"SLED West","cluster":"C200","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Government & Public Administration","contractType":"PS Only","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":27500,"nextStep":""},
  {"lineItemId":"00kUi00000OhYiBIAV","oppId":"006Ui00002GjTlCIAV","oppName":"Select Portfolio Servicing | CXone | 600 Infosys I Skyward I AI Rebate","account":"Select Portfolio Servicing , Inc.","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":2180.64,"listPrice":0.11,"unitPrice":0.11,"quantity":19824,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise East","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"New Logo","incumbent":"Cisco","probability":75,"expRevenue":1635.48,"oppAmount":1052371.02,"nextStep":"6/29 Murali has approved via email, Infosys team obtaining SOW signature and they will sign ours"},
  {"lineItemId":"00kUi00000OhYiCIAV","oppId":"006Ui00002GjTlCIAV","oppName":"Select Portfolio Servicing | CXone | 600 Infosys I Skyward I AI Rebate","account":"Select Portfolio Servicing , Inc.","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 50,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB)","totalPrice":30800,"listPrice":44000,"unitPrice":30800,"quantity":1,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise East","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"New Logo","incumbent":"Cisco","probability":75,"expRevenue":23100.0,"oppAmount":1052371.02,"nextStep":"6/29 Murali has approved via email, Infosys team obtaining SOW signature and they will sign ours"},
  {"lineItemId":"00kUi000006nKOkIAM","oppId":"006Ui00000nHR1BIAW","oppName":"SSE AIRTRICITY |  Conscia | Amendment | Migrated Calls","account":"SSE AIRTRICITY","stage":"5 - Proposal / Negotiation","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1820,"listPrice":1820,"unitPrice":1820,"quantity":1,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 5","cluster":"E34","dcRegion":"EU2","dcSource":"cluster","currency":"EUR","industry":"Utilities","contractType":"Exst. Customer / New LOB","incumbent":"Calabrio","probability":75,"expRevenue":1365.0,"oppAmount":38589.8,"nextStep":"SC: Quote updated and to be sent over to Conscia. Expecting PO in July."},
  {"lineItemId":"00kUi00000GnH0IIAV","oppId":"006Ui00000nHR1BIAW","oppName":"SSE AIRTRICITY |  Conscia | Amendment | Migrated Calls","account":"SSE AIRTRICITY","stage":"5 - Proposal / Negotiation","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":20020,"listPrice":20020,"unitPrice":20020,"quantity":1,"closeDate":"2026-07-31","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 5","cluster":"E34","dcRegion":"EU2","dcSource":"cluster","currency":"EUR","industry":"Utilities","contractType":"Exst. Customer / New LOB","incumbent":"Calabrio","probability":75,"expRevenue":15015.0,"oppAmount":38589.8,"nextStep":"SC: Quote updated and to be sent over to Conscia. Expecting PO in July."},
  {"lineItemId":"00kUi00000P4n3nIAB","oppId":"006Ui00002XnOhxIAF","oppName":"ACCENTURE PARTNER | Amendment | NiSource Interaction HUB Implementation","account":"ACCENTURE PARTNER","stage":"1 - Identification / Qualification","sku":"Migration Service – 200,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB)","totalPrice":96800,"listPrice":96800,"unitPrice":96800,"quantity":1,"closeDate":"2026-08-01","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise Central","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":105600,"nextStep":""},
  {"lineItemId":"00kUi00000Np5tIIAR","oppId":"006Ui00002SMKwcIAH","oppName":"CHUBB EUROPEAN GROUP SE |  Amendment  | Calls Migration","account":"CHUBB EUROPEAN GROUP SE","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-08-03","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 3","cluster":"E35","dcRegion":"EU1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":38217,"nextStep":""},
  {"lineItemId":"00kUi00000Np5tKIAR","oppId":"006Ui00002SMKwcIAH","oppName":"CHUBB EUROPEAN GROUP SE |  Amendment  | Calls Migration","account":"CHUBB EUROPEAN GROUP SE","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-08-03","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 3","cluster":"E35","dcRegion":"EU1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Exst. Customer / New LOB","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":38217,"nextStep":""},
  {"lineItemId":"00kUi00000LSkGmIAL","oppId":"006Ui00002IDfMwIAL","oppName":"INTEGRATED CARE 24 |  Amendment  | Integrations Hub","account":"INTEGRATED CARE 24","stage":"1 - Identification / Qualification","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":18249,"listPrice":26070,"unitPrice":18249,"quantity":1,"closeDate":"2026-08-20","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 4","cluster":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Call Center / BPO​","contractType":"Exst. Customer / Expansions","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":20690.68,"nextStep":""},
  {"lineItemId":"00kUi00000LSkGlIAL","oppId":"006Ui00002IDfMwIAL","oppName":"INTEGRATED CARE 24 |  Amendment  | Integrations Hub","account":"INTEGRATED CARE 24","stage":"1 - Identification / Qualification","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.08,"listPrice":0.16,"unitPrice":0.08,"quantity":1,"closeDate":"2026-08-20","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 4","cluster":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Call Center / BPO​","contractType":"Exst. Customer / Expansions","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":20690.68,"nextStep":""},
  {"lineItemId":"00kUi00000LeZcTIAV","oppId":"006Ui0000271A0KIAU","oppName":"BT - UK - Enterprise - CXone Engagement Hub - Multi-ACD - Production Platform - 18000","account":"BRITISH TELECOMMUNICATIONS PLC - PM TEST INSTANCE","stage":"4 - Confirm Value & Agreement","sku":"Migration Service – 100,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB)","totalPrice":38127.7,"listPrice":58658,"unitPrice":38127.7,"quantity":1,"closeDate":"2026-08-21","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 1","cluster":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Telco","contractType":"Exst. Customer / Cloud conversion","incumbent":"NICE","probability":50,"expRevenue":19063.85,"oppAmount":727997.2,"nextStep":"RH -23062026 -  BT Sourced (Tiana) is being pushed by BT seniors to close with quickly. Sign off (July 1st). Signatures next week as Anuja has compressed the timeline. This will be an initiation of August 1st. 29 month contract."},
  {"lineItemId":"00kUi00000JqbBxIAJ","oppId":"006Ui0000271A0KIAU","oppName":"BT - UK - Enterprise - CXone Engagement Hub - Multi-ACD - Production Platform - 18000","account":"BRITISH TELECOMMUNICATIONS PLC - PM TEST INSTANCE","stage":"4 - Confirm Value & Agreement","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.048,"listPrice":0.16,"unitPrice":0.048,"quantity":1,"closeDate":"2026-08-21","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 1","cluster":"L33","dcRegion":"UK1","dcSource":"cluster","currency":"GBP","industry":"Telco","contractType":"Exst. Customer / Cloud conversion","incumbent":"NICE","probability":50,"expRevenue":0.02,"oppAmount":727997.2,"nextStep":"RH -23062026 -  BT Sourced (Tiana) is being pushed by BT seniors to close with quickly. Sign off (July 1st). Signatures next week as Anuja has compressed the timeline. This will be an initiation of August 1st. 29 month contract."},
  {"lineItemId":"00kUi00000N6BICIA3","oppId":"006Ui00002OwlcQIAR","oppName":"Nutrien Australia | NUTRIEN US LLC","account":"Nutrien Australia","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":5500,"listPrice":27500,"unitPrice":5500,"quantity":1,"closeDate":"2026-08-28","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial Central 4","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Construction/Real Estate","contractType":"Exst. Customer / New BU","incumbent":"","probability":25,"expRevenue":1375.0,"oppAmount":45758.43,"nextStep":"20260623 Working to schedule a call with Nutrien in India and our connectivity team is US."},
  {"lineItemId":"00kUi00000N6BIBIA3","oppId":"006Ui00002OwlcQIAR","oppName":"Nutrien Australia | NUTRIEN US LLC","account":"Nutrien Australia","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-08-28","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial Central 4","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Construction/Real Estate","contractType":"Exst. Customer / New BU","incumbent":"","probability":25,"expRevenue":750.0,"oppAmount":45758.43,"nextStep":"20260623 Working to schedule a call with Nutrien in India and our connectivity team is US."},
  {"lineItemId":"00kUi00000PJRWHIA5","oppId":"006Ui00002UNuc1IAD","oppName":"NC DHHS DPH - Vital Records - FedRAMP Migration NRC | 70 Agents","account":"NC DHHS Division of Public Health FedRAMP","stage":"5 - Proposal / Negotiation","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-08-31","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"SLED East","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"Exst. Customer / New BU","incumbent":"NICE","probability":75,"expRevenue":20625.0,"oppAmount":106370.11,"nextStep":"JNL 06/24 - Customer requested SOWs to support work - developing and reviewing in late June - DIT needs to repackage and get approvals from its end customes to then execute the Docusign."},
  {"lineItemId":"00kUi00000PJRMjIAP","oppId":"006Ui00002UOFRqIAP","oppName":"NC DHHS DPH - Vital Records - FedRAMP Migration MRC | 70 Agents","account":"NC DHHS Division of Public Health FedRAMP","stage":"5 - Proposal / Negotiation","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.182,"listPrice":0.2,"unitPrice":0.182,"quantity":1,"closeDate":"2026-08-31","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"Americas","segment":"","territory":"SLED East","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"Exst. Customer / New BU","incumbent":"NICE","probability":75,"expRevenue":0.14,"oppAmount":15821.79,"nextStep":"JNL 06/24 - Customer requested SOWs to support work - developing and reviewing in late June - DIT needs to repackage and get approvals from its end customes to then execute the Docusign."},
  {"lineItemId":"00kUi00000Np7NIIAZ","oppId":"006Ui00002SMKNAIA5","oppName":"VRAD INC |  Amendment  | CXSuccess Premier","account":"VRAD INC","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-09-08","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 3","cluster":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / New LOB","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":83670,"nextStep":"6.19 continuing to nudge for joint review of contract 6.2. shared contracted ready for execution to jason mutcher and Nong Lor"},
  {"lineItemId":"00kUi00000Np7NHIAZ","oppId":"006Ui00002SMKNAIA5","oppName":"VRAD INC |  Amendment  | CXSuccess Premier","account":"VRAD INC","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-09-08","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 3","cluster":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / New LOB","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":83670,"nextStep":"6.19 continuing to nudge for joint review of contract 6.2. shared contracted ready for execution to jason mutcher and Nong Lor"},
  {"lineItemId":"00kUi00000AvbMtIAJ","oppId":"006Ui00001HpIVFIA3","oppName":"ST. LUKE'S HEALTH SYSTEM |  Amendment  | Interactions Hub | ICS","account":"ST. LUKE'S HEALTH SYSTEM","stage":"4 - Confirm Value & Agreement","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":18700,"listPrice":22000,"unitPrice":18700,"quantity":1,"closeDate":"2026-09-10","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 3","cluster":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Addendum","incumbent":"Uptivity","probability":50,"expRevenue":9350.0,"oppAmount":22270.07,"nextStep":"06/16 RB Interactions Hub stalled as St. Luke's withholds payment over dissatisfaction with C1 build via ICS; NiCE's 06/09 way-forward unanswered; escalating 06/19 to Ken Kiernan (ICS President) and Andy Neill (ICS Sales Lead); close slips Q3 09/10."},
  {"lineItemId":"00kUi00000AvbMsIAJ","oppId":"006Ui00001HpIVFIA3","oppName":"ST. LUKE'S HEALTH SYSTEM |  Amendment  | Interactions Hub | ICS","account":"ST. LUKE'S HEALTH SYSTEM","stage":"4 - Confirm Value & Agreement","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1700,"listPrice":2000,"unitPrice":1700,"quantity":1,"closeDate":"2026-09-10","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 3","cluster":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Addendum","incumbent":"Uptivity","probability":50,"expRevenue":850.0,"oppAmount":22270.07,"nextStep":"06/16 RB Interactions Hub stalled as St. Luke's withholds payment over dissatisfaction with C1 build via ICS; NiCE's 06/09 way-forward unanswered; escalating 06/19 to Ken Kiernan (ICS President) and Andy Neill (ICS Sales Lead); close slips Q3 09/10."},
  {"lineItemId":"00kUi00000KwyE7IAJ","oppId":"006Ui000028pPMyIAM","oppName":"McGraw-Hill Education l CXone New BU Direct from VZ | 350 Concurrent","account":"McGraw-Hill Education","stage":"4 - Confirm Value & Agreement","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1350,"listPrice":3000,"unitPrice":1350,"quantity":1,"closeDate":"2026-09-11","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise East","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Educational Services","contractType":"New Logo","incumbent":"NICE","probability":50,"expRevenue":675.0,"oppAmount":179262.91,"nextStep":"7.1: NiCE awaiting decision from Angela/Cori."},
  {"lineItemId":"00kUi00000KwyE9IAJ","oppId":"006Ui000028pPMyIAM","oppName":"McGraw-Hill Education l CXone New BU Direct from VZ | 350 Concurrent","account":"McGraw-Hill Education","stage":"4 - Confirm Value & Agreement","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":0,"listPrice":27500,"unitPrice":0,"quantity":1,"closeDate":"2026-09-11","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise East","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Educational Services","contractType":"New Logo","incumbent":"NICE","probability":50,"expRevenue":0.0,"oppAmount":179262.91,"nextStep":"7.1: NiCE awaiting decision from Angela/Cori."},
  {"lineItemId":"00kUi00000KXt2sIAD","oppId":"006Ui00001AbiTfIAJ","oppName":"Canadian Tire Financial Services | CXone Mpower + Cognigy","account":"Canadian Tire Financial Services Limited","stage":"5 - Proposal / Negotiation","sku":"Migration Service – 50,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB)","totalPrice":40535,"listPrice":73700,"unitPrice":40535,"quantity":1,"closeDate":"2026-09-15","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"Americas","segment":"","territory":"Canada","cluster":"","dcRegion":"CA1","dcSource":"inferred","currency":"CAD","industry":"Other","contractType":"Exst. Customer / New LOB","incumbent":"Cisco","probability":75,"expRevenue":30401.25,"oppAmount":2631808.65,"nextStep":"Per CTFS CIO request, NiCE has provided dates when our legal counsel can travel and meet CTFS legal onsite. CTFS has hired external counsel to fast track the progress and expected to share redlines soon."},
  {"lineItemId":"00kUi00000KXt2qIAD","oppId":"006Ui00001AbiTfIAJ","oppName":"Canadian Tire Financial Services | CXone Mpower + Cognigy","account":"Canadian Tire Financial Services Limited","stage":"5 - Proposal / Negotiation","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.0837,"listPrice":0.27,"unitPrice":0.0837,"quantity":1,"closeDate":"2026-09-15","fy":2026,"fq":3,"forecast":"Commit","forecastCat":"—","region":"Americas","segment":"","territory":"Canada","cluster":"","dcRegion":"CA1","dcSource":"inferred","currency":"CAD","industry":"Other","contractType":"Exst. Customer / New LOB","incumbent":"Cisco","probability":75,"expRevenue":0.06,"oppAmount":2631808.65,"nextStep":"Per CTFS CIO request, NiCE has provided dates when our legal counsel can travel and meet CTFS legal onsite. CTFS has hired external counsel to fast track the progress and expected to share redlines soon."},
  {"lineItemId":"00kUi00000P669FIAR","oppId":"006Ui000028QaOoIAK","oppName":"BOH - Engagement Hub and QM","account":"Bank of Hawaii Corporation","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial West 2","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"New Logo","incumbent":"Genesys","probability":25,"expRevenue":6875.0,"oppAmount":53790.36,"nextStep":"6.25 moved to program with BlueIP. Program will be presented 6.25 as phase one to move off the Mitel program and create a window for IVR then Cognigy"},
  {"lineItemId":"00kUi00000FEDtcIAH","oppId":"006Ui00001lAbVlIAK","oppName":"ACCENTURE DEMO | Ultimate | Amendment  | AI Products","account":"ACCENTURE DEMO","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":0,"listPrice":2000,"unitPrice":0,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Global BPO","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":9135,"nextStep":""},
  {"lineItemId":"00kUi00000FEDtdIAH","oppId":"006Ui00001lAbVlIAK","oppName":"ACCENTURE DEMO | Ultimate | Amendment  | AI Products","account":"ACCENTURE DEMO","stage":"1 - Identification / Qualification","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":0,"listPrice":22000,"unitPrice":0,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Global BPO","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":9135,"nextStep":""},
  {"lineItemId":"00kUi00000P669EIAR","oppId":"006Ui000028QaOoIAK","oppName":"BOH - Engagement Hub and QM","account":"Bank of Hawaii Corporation","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial West 2","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"New Logo","incumbent":"Genesys","probability":25,"expRevenue":750.0,"oppAmount":53790.36,"nextStep":"6.25 moved to program with BlueIP. Program will be presented 6.25 as phase one to move off the Mitel program and create a window for IVR then Cognigy"},
  {"lineItemId":"00kUi00000MqxaQIAR","oppId":"006Ui00002Nnn9PIAR","oppName":"LONG ISLAND POWER AUTHORITY |  Recordings Migration","account":"LONG ISLAND POWER AUTHORITY","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise East","cluster":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / Expansions","incumbent":"","probability":25,"expRevenue":750.0,"oppAmount":34900,"nextStep":""},
  {"lineItemId":"00kUi00000OmVTdIAN","oppId":"006Ui00002LZE6DIAX","oppName":"VIDEOTRON |  Amendment  | Interactions Hub - Genesys","account":"VIDEOTRON LTD.","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":4020,"listPrice":4020,"unitPrice":4020,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Canada","cluster":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Telco","contractType":"Exst. Customer / Expansions","incumbent":"Verint","probability":0,"expRevenue":0.0,"oppAmount":313800,"nextStep":"06/12 - Waiting for customer to provide critical data to allow for quoting, customer is working on it, but its been stalled for several weeks."},
  {"lineItemId":"00kUi00000HwEH4IAN","oppId":"006Ui000022jgLtIAI","oppName":"VIDEOTRON LTD. |  Amendment  | Interactions Hub - Verint Recording Replacement","account":"VIDEOTRON LTD.","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":33165,"listPrice":44220,"unitPrice":33165,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Canada","cluster":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Telco","contractType":"Addendum","incumbent":"Verint","probability":25,"expRevenue":8291.25,"oppAmount":118235.39,"nextStep":"06/12 - Waiting for customer to provide critical data to allow for quoting, customer is working on it, but its been stalled for several weeks."},
  {"lineItemId":"00kUi00000MqxaRIAR","oppId":"006Ui00002Nnn9PIAR","oppName":"LONG ISLAND POWER AUTHORITY |  Recordings Migration","account":"LONG ISLAND POWER AUTHORITY","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise East","cluster":"C54","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Exst. Customer / Expansions","incumbent":"","probability":25,"expRevenue":6875.0,"oppAmount":34900,"nextStep":""},
  {"lineItemId":"00kUi00000OmVTeIAN","oppId":"006Ui00002LZE6DIAX","oppName":"VIDEOTRON |  Amendment  | Interactions Hub - Genesys","account":"VIDEOTRON LTD.","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":36850,"listPrice":36850,"unitPrice":36850,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Canada","cluster":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Telco","contractType":"Exst. Customer / Expansions","incumbent":"Verint","probability":0,"expRevenue":0.0,"oppAmount":313800,"nextStep":"06/12 - Waiting for customer to provide critical data to allow for quoting, customer is working on it, but its been stalled for several weeks."},
  {"lineItemId":"00kUi00000HwEH3IAN","oppId":"006Ui000022jgLtIAI","oppName":"VIDEOTRON LTD. |  Amendment  | Interactions Hub - Verint Recording Replacement","account":"VIDEOTRON LTD.","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.14,"listPrice":0.27,"unitPrice":0.14,"quantity":1,"closeDate":"2026-09-18","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Canada","cluster":"M33","dcRegion":"CA1","dcSource":"cluster","currency":"CAD","industry":"Telco","contractType":"Addendum","incumbent":"Verint","probability":25,"expRevenue":0.04,"oppAmount":118235.39,"nextStep":"06/12 - Waiting for customer to provide critical data to allow for quoting, customer is working on it, but its been stalled for several weeks."},
  {"lineItemId":"00kUi00000NpsXVIAZ","oppId":"006Ui00002SNFObIAP","oppName":"UHG OptumRX Uptivity Server final","account":"UNITED HEALTH GROUP","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":20625,"listPrice":27500,"unitPrice":20625,"quantity":1,"closeDate":"2026-09-24","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 4","cluster":"C75","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"Addendum","incumbent":"","probability":25,"expRevenue":5156.25,"oppAmount":25425,"nextStep":"6/25 AW: This is a compliant requirement to pull recordings from OptumRXs Uptivity system. They requested amendment to be created on 6/24."},
  {"lineItemId":"00kUi00000NpsXUIAZ","oppId":"006Ui00002SNFObIAP","oppName":"UHG OptumRX Uptivity Server final","account":"UNITED HEALTH GROUP","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1500,"listPrice":3000,"unitPrice":1500,"quantity":1,"closeDate":"2026-09-24","fy":2026,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 4","cluster":"C75","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Healthcare","contractType":"Addendum","incumbent":"","probability":25,"expRevenue":375.0,"oppAmount":25425,"nextStep":"6/25 AW: This is a compliant requirement to pull recordings from OptumRXs Uptivity system. They requested amendment to be created on 6/24."},
  {"lineItemId":"00kUi00000BXpMBIA1","oppId":"006Hu00001Xf0jyIAB","oppName":"BT - UK - Enterprise - CXone CCaaS - RFP","account":"British Telecom","stage":"4 - Confirm Value & Agreement","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":6500,"listPrice":0.16,"unitPrice":0.13,"quantity":50000,"closeDate":"2026-09-25","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"EMEA","segment":"","territory":"UK&I - 1","cluster":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Telco","contractType":"New OCR Logo","incumbent":"Genesys","probability":50,"expRevenue":3250.0,"oppAmount":3753195.04,"nextStep":"RH 08/06/2026 - working on the current (aggressive) ehub proposal for BT. BT Sourced have indicated that they are supportive of our CCaaS proposal. Looking to conclude by September."},
  {"lineItemId":"00kUi00000BXpMDIA1","oppId":"006Hu00001Xf0jyIAB","oppName":"BT - UK - Enterprise - CXone CCaaS - RFP","account":"British Telecom","stage":"4 - Confirm Value & Agreement","sku":"Migration Service – 50,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB)","totalPrice":43450,"listPrice":43450,"unitPrice":43450,"quantity":1,"closeDate":"2026-09-25","fy":2026,"fq":3,"forecast":"Most Likely","forecastCat":"—","region":"EMEA","segment":"","territory":"UK&I - 1","cluster":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Telco","contractType":"New OCR Logo","incumbent":"Genesys","probability":50,"expRevenue":21725.0,"oppAmount":3753195.04,"nextStep":"RH 08/06/2026 - working on the current (aggressive) ehub proposal for BT. BT Sourced have indicated that they are supportive of our CCaaS proposal. Looking to conclude by September."},
  {"lineItemId":"00kUi00000Ln52VIAR","oppId":"006Ui00002JdYicIAF","oppName":"EXPERIAN SERVICES CORP. |  Amendment  | Avaya/Verint Interactions Hub Migrated Calls","account":"EXPERIAN SERVICES CORP.","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":17600,"listPrice":17600,"unitPrice":17600,"quantity":1,"closeDate":"2026-09-30","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"FSI 4","cluster":"C57","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / New LOB","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":19600,"nextStep":"6/26 got a second quote from another provider.  TBD on need/desire."},
  {"lineItemId":"00kUi00000Ln52UIAR","oppId":"006Ui00002JdYicIAF","oppName":"EXPERIAN SERVICES CORP. |  Amendment  | Avaya/Verint Interactions Hub Migrated Calls","account":"EXPERIAN SERVICES CORP.","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2000,"listPrice":2000,"unitPrice":2000,"quantity":1,"closeDate":"2026-09-30","fy":2026,"fq":3,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"FSI 4","cluster":"C57","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Exst. Customer / New LOB","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":19600,"nextStep":"6/26 got a second quote from another provider.  TBD on need/desire."},
  {"lineItemId":"00kUi00000MtfxFIAR","oppId":"006Ui00002O3P4jIAF","oppName":"VRAD INC |  Amendment  | 2026-05-07","account":"VRAD INC","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-10-22","fy":2026,"fq":4,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 3","cluster":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / Expansions","incumbent":"NICE","probability":0,"expRevenue":0.0,"oppAmount":80690,"nextStep":"5/21 -Confirming service term with the client"},
  {"lineItemId":"00kUi00000MtfxEIAR","oppId":"006Ui00002O3P4jIAF","oppName":"VRAD INC |  Amendment  | 2026-05-07","account":"VRAD INC","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-10-22","fy":2026,"fq":4,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Healthcare 3","cluster":"C32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Healthcare","contractType":"Exst. Customer / Expansions","incumbent":"NICE","probability":0,"expRevenue":0.0,"oppAmount":80690,"nextStep":"5/21 -Confirming service term with the client"},
  {"lineItemId":"00kUi00000DBIfdIAH","oppId":"006Ui00001WRZhuIAH","oppName":"HCTRA | CXone | Engagement Hub for Cloud Recording | 1000","account":"Harris County Toll Road Authority","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":27500,"listPrice":27500,"unitPrice":27500,"quantity":1,"closeDate":"2026-10-28","fy":2026,"fq":4,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"SLED West","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":393095.96,"nextStep":"3/20/2026 (RC) customer contact has not returned calls/emails, looking to validate this opportunity."},
  {"lineItemId":"00kUi00000DBIfcIAH","oppId":"006Ui00001WRZhuIAH","oppName":"HCTRA | CXone | Engagement Hub for Cloud Recording | 1000","account":"Harris County Toll Road Authority","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":3000,"listPrice":3000,"unitPrice":3000,"quantity":1,"closeDate":"2026-10-28","fy":2026,"fq":4,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"SLED West","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":393095.96,"nextStep":"3/20/2026 (RC) customer contact has not returned calls/emails, looking to validate this opportunity."},
  {"lineItemId":"00kUi00000PFFOxIAP","oppId":"006Ui00001qFvAnIAK","oppName":"TAFE NSW RFP | AU | Optus | 550 concurrent core","account":"TAFE NSW","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1430.4,"listPrice":2980,"unitPrice":1430.4,"quantity":1,"closeDate":"2026-10-30","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"","segment":"","territory":"ANZ - 1","cluster":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"Cisco","probability":25,"expRevenue":357.6,"oppAmount":350634.44,"nextStep":"MT 26/06/26::  Quote submitted for deal desk approval. PQD to Optus & Deal team review Mon 29th. Submission 13th July."},
  {"lineItemId":"00kUi00000PFFOzIAP","oppId":"006Ui00001qFvAnIAK","oppName":"TAFE NSW RFP | AU | Optus | 550 concurrent core","account":"TAFE NSW","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":13112,"listPrice":26224,"unitPrice":13112,"quantity":1,"closeDate":"2026-10-30","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"","segment":"","territory":"ANZ - 1","cluster":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"Cisco","probability":25,"expRevenue":3278.0,"oppAmount":350634.44,"nextStep":"MT 26/06/26::  Quote submitted for deal desk approval. PQD to Optus & Deal team review Mon 29th. Submission 13th July."},
  {"lineItemId":"00kUi00000M7EUpIAN","oppId":"006Ui00002E9s6YIAR","oppName":"The ESP Group | Engagement Hub + QMA | 250","account":"ESP Group","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.09,"listPrice":0.16,"unitPrice":0.09,"quantity":1,"closeDate":"2026-11-09","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 4","cluster":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Call Center / BPO​","contractType":"New Logo","incumbent":"Genesys","probability":25,"expRevenue":0.02,"oppAmount":60651.06,"nextStep":"27/04 - JCH - Catch up call with Kira took place to get feedback & next steps, next call scheduled 01/06."},
  {"lineItemId":"00kUi00000M7EUqIAN","oppId":"006Ui00002E9s6YIAR","oppName":"The ESP Group | Engagement Hub + QMA | 250","account":"ESP Group","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":13904,"listPrice":21725,"unitPrice":13904,"quantity":1,"closeDate":"2026-11-09","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"UK&I - 4","cluster":"","dcRegion":"UK1","dcSource":"inferred","currency":"GBP","industry":"Call Center / BPO​","contractType":"New Logo","incumbent":"Genesys","probability":25,"expRevenue":3476.0,"oppAmount":60651.06,"nextStep":"27/04 - JCH - Catch up call with Kira took place to get feedback & next steps, next call scheduled 01/06."},
  {"lineItemId":"00kUi00000HiFIWIA3","oppId":"006Ui000021v0phIAA","oppName":"GSI ACCENTURE DEMO","account":"ACCENTURE DEMO","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2000,"listPrice":2000,"unitPrice":2000,"quantity":1,"closeDate":"2026-11-20","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Global BPO","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"Other","probability":25,"expRevenue":500.0,"oppAmount":260098.88,"nextStep":""},
  {"lineItemId":"00kUi00000HiFIXIA3","oppId":"006Ui000021v0phIAA","oppName":"GSI ACCENTURE DEMO","account":"ACCENTURE DEMO","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":22000,"listPrice":22000,"unitPrice":22000,"quantity":1,"closeDate":"2026-11-20","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Global BPO","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Addendum","incumbent":"Other","probability":25,"expRevenue":5500.0,"oppAmount":260098.88,"nextStep":""},
  {"lineItemId":"00kUi00000OI4bsIAD","oppId":"006Ui00001kelZtIAI","oppName":"Auckland Group Shared Services (NTT DATA NZ) | New Zealand | CXone | 1000 agts","account":"Auckland Council (NTT)","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1043,"listPrice":2980,"unitPrice":1043,"quantity":1,"closeDate":"2026-12-01","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"ANZ - 2","cluster":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"NICE","probability":25,"expRevenue":260.75,"oppAmount":477235.66,"nextStep":"Tender released and due 12/6, Phase 2 Lean Agile Procurement30/6"},
  {"lineItemId":"00kUi00000OI4btIAD","oppId":"006Ui00001kelZtIAI","oppName":"Auckland Group Shared Services (NTT DATA NZ) | New Zealand | CXone | 1000 agts","account":"Auckland Council (NTT)","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":4982.56,"listPrice":26224,"unitPrice":4982.56,"quantity":1,"closeDate":"2026-12-01","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"ANZ - 2","cluster":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"NICE","probability":25,"expRevenue":1245.64,"oppAmount":477235.66,"nextStep":"Tender released and due 12/6, Phase 2 Lean Agile Procurement30/6"},
  {"lineItemId":"00kUi000005GokgIAC","oppId":"006Ui00000Ot8NKIAZ","oppName":"US Census | Recording, | FedRAMP for Multi-ACD | 500 | 500k ACV I FedRamp Multi ACD Availability","account":"Census Bureau","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":11000,"listPrice":27500,"unitPrice":11000,"quantity":1,"closeDate":"2026-12-15","fy":2026,"fq":4,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"Federal","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government","contractType":"Exst. Customer / Cloud conversion","incumbent":"NICE","probability":25,"expRevenue":2750.0,"oppAmount":71752.07,"nextStep":"5/20/2026 - Need Census RFP Decision (note: delays due lack of budget clarity).  Anticipate decision in October but could continue to push out. Voice Products is Partner (contract vehicle)"},
  {"lineItemId":"00kUi000007K6msIAC","oppId":"006Ui00000qvisvIAA","oppName":"MetLife JPN | CXone Dev BU | Amendment | CXone iHub Migrated for testing","account":"METLIFE INSURANCE K.K. DEV","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":15400,"listPrice":27500,"unitPrice":15400,"quantity":1,"closeDate":"2026-12-15","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"","segment":"","territory":"Japan","cluster":"J32","dcRegion":"JP1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","incumbent":"NICE","probability":25,"expRevenue":3850.0,"oppAmount":19825,"nextStep":""},
  {"lineItemId":"00kUi000007K6mrIAC","oppId":"006Ui00000qvisvIAA","oppName":"MetLife JPN | CXone Dev BU | Amendment | CXone iHub Migrated for testing","account":"METLIFE INSURANCE K.K. DEV","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2500,"listPrice":3000,"unitPrice":2500,"quantity":1,"closeDate":"2026-12-15","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"","segment":"","territory":"Japan","cluster":"J32","dcRegion":"JP1","dcSource":"cluster","currency":"USD","industry":"Finance and Insurance","contractType":"Addendum","incumbent":"NICE","probability":25,"expRevenue":625.0,"oppAmount":19825,"nextStep":""},
  {"lineItemId":"00kUi000005GokfIAC","oppId":"006Ui00000Ot8NKIAZ","oppName":"US Census | Recording, | FedRAMP for Multi-ACD | 500 | 500k ACV I FedRamp Multi ACD Availability","account":"Census Bureau","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1550,"listPrice":3000,"unitPrice":1550,"quantity":1,"closeDate":"2026-12-15","fy":2026,"fq":4,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"Federal","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government","contractType":"Exst. Customer / Cloud conversion","incumbent":"NICE","probability":25,"expRevenue":387.5,"oppAmount":71752.07,"nextStep":"5/20/2026 - Need Census RFP Decision (note: delays due lack of budget clarity).  Anticipate decision in October but could continue to push out. Voice Products is Partner (contract vehicle)"},
  {"lineItemId":"00kUi00000EtGnKIAV","oppId":"006Hu00001V3FybIAF","oppName":"Banner Life -CXone Open-C1","account":"Banner Life","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2000,"listPrice":2000,"unitPrice":2000,"quantity":1,"closeDate":"2026-12-18","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial East 3","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Legal","contractType":"New Logo","incumbent":"Avaya","probability":25,"expRevenue":500.0,"oppAmount":107196.86,"nextStep":"7.15 waiting to schedule demo through C1, another partner also getting involved"},
  {"lineItemId":"00kUi00000EtGnLIAV","oppId":"006Hu00001V3FybIAF","oppName":"Banner Life -CXone Open-C1","account":"Banner Life","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":22000,"listPrice":22000,"unitPrice":22000,"quantity":1,"closeDate":"2026-12-18","fy":2026,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial East 3","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Legal","contractType":"New Logo","incumbent":"Avaya","probability":25,"expRevenue":5500.0,"oppAmount":107196.86,"nextStep":"7.15 waiting to schedule demo through C1, another partner also getting involved"},
  {"lineItemId":"00kUi00000JAtXlIAL","oppId":"006Ui000027fqaJIAQ","oppName":"Insignia Financial | CXone | 800 AGTS | VIC, Australia","account":"Insignia Financial Ltd","stage":"1 - Identification / Qualification","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2980,"listPrice":2980,"unitPrice":2980,"quantity":1,"closeDate":"2027-02-10","fy":2027,"fq":1,"forecast":"Long Shot","forecastCat":"—","region":"International","segment":"","territory":"ANZ - 1","cluster":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Financial Services","contractType":"New Logo","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":1004284.32,"nextStep":"Reach out to the team as customer was puirchased by Private Equity and priorities all put on hold."},
  {"lineItemId":"00kUi00000JAtXmIAL","oppId":"006Ui000027fqaJIAQ","oppName":"Insignia Financial | CXone | 800 AGTS | VIC, Australia","account":"Insignia Financial Ltd","stage":"1 - Identification / Qualification","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":26224,"listPrice":26224,"unitPrice":26224,"quantity":1,"closeDate":"2027-02-10","fy":2027,"fq":1,"forecast":"Long Shot","forecastCat":"—","region":"International","segment":"","territory":"ANZ - 1","cluster":"","dcRegion":"AU1","dcSource":"inferred","currency":"AUD","industry":"Financial Services","contractType":"New Logo","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":1004284.32,"nextStep":"Reach out to the team as customer was puirchased by Private Equity and priorities all put on hold."},
  {"lineItemId":"00kUi00000NEejWIAT","oppId":"006Ui00001bdCY9IAM","oppName":"NJM INSURANCE GROUP |  Amendment  | Recording and QM Uplift","account":"NJM INSURANCE GROUP","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 200,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 200,000,000 interactions (per source DB)","totalPrice":96800,"listPrice":96800,"unitPrice":96800,"quantity":1,"closeDate":"2027-02-19","fy":2027,"fq":1,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"FSI 3","cluster":"C53","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Addendum","incumbent":"NICE","probability":25,"expRevenue":24200.0,"oppAmount":195540.8,"nextStep":"ME 5/11 - SDD and SOW being drafted. NiCE and Ring have a proposal review with NJM 5/12 to review pricing for BO recording solution."},
  {"lineItemId":"00kUi00000NEejVIAT","oppId":"006Ui00001bdCY9IAM","oppName":"NJM INSURANCE GROUP |  Amendment  | Recording and QM Uplift","account":"NJM INSURANCE GROUP","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":14128.8,"listPrice":0.14,"unitPrice":0.14,"quantity":100920,"closeDate":"2027-02-19","fy":2027,"fq":1,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"FSI 3","cluster":"C53","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"Addendum","incumbent":"NICE","probability":25,"expRevenue":3532.2,"oppAmount":195540.8,"nextStep":"ME 5/11 - SDD and SOW being drafted. NiCE and Ring have a proposal review with NJM 5/12 to review pricing for BO recording solution."},
  {"lineItemId":"00kUi00000GaCj0IAF","oppId":"006Ui00001fueibIAA","oppName":"Miral Enterprise | CXone | RFI | 90 Agents | TCL","account":"Miral Enterprise","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":1200,"listPrice":2000,"unitPrice":1200,"quantity":1,"closeDate":"2027-02-22","fy":2027,"fq":1,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"Middle East","cluster":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Entertainment and Media","contractType":"New Logo","incumbent":"Genesys","probability":25,"expRevenue":300.0,"oppAmount":294753.97,"nextStep":"Project is put on hold in lieu of the current situation in ME"},
  {"lineItemId":"00kUi00000GaCj1IAF","oppId":"006Ui00001fueibIAA","oppName":"Miral Enterprise | CXone | RFI | 90 Agents | TCL","account":"Miral Enterprise","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":15400,"listPrice":22000,"unitPrice":15400,"quantity":1,"closeDate":"2027-02-22","fy":2027,"fq":1,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"Middle East","cluster":"","dcRegion":"EU1","dcSource":"inferred","currency":"USD","industry":"Entertainment and Media","contractType":"New Logo","incumbent":"Genesys","probability":25,"expRevenue":3850.0,"oppAmount":294753.97,"nextStep":"Project is put on hold in lieu of the current situation in ME"},
  {"lineItemId":"00kUi00000Meg2QIAR","oppId":"006Ui00002KtUKJIA3","oppName":"Fifth Third - Engagement Hub (300M)","account":"FIFTH THIRD BANK, NATIONAL ASSOCIATION","stage":"1 - Identification / Qualification","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":60000,"listPrice":0.2,"unitPrice":0.2,"quantity":300000,"closeDate":"2027-04-21","fy":2027,"fq":2,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"FSI 2","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":255860.36,"nextStep":"6/26 1/ Setting meeting for cloud option review"},
  {"lineItemId":"00kUi00000Meg2RIAR","oppId":"006Ui00002KtUKJIA3","oppName":"Fifth Third - Engagement Hub (300M)","account":"FIFTH THIRD BANK, NATIONAL ASSOCIATION","stage":"1 - Identification / Qualification","sku":"CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB)","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 400,000,000 interactions (per source DB)","totalPrice":170500,"listPrice":170500,"unitPrice":170500,"quantity":1,"closeDate":"2027-04-21","fy":2027,"fq":2,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"FSI 2","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Banks","contractType":"Exst. Customer / Cloud conversion","incumbent":"","probability":0,"expRevenue":0.0,"oppAmount":255860.36,"nextStep":"6/26 1/ Setting meeting for cloud option review"},
  {"lineItemId":"00kUi00000B3kHjIAJ","oppId":"006Ui00001CpocrIAB","oppName":"GlaxoSmithKline | CXone | Complete Suite + Textel + PC Dialer | 105","account":"GlaxoSmithKline plc.","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2000,"listPrice":3000,"unitPrice":2000,"quantity":1,"closeDate":"2027-04-28","fy":2027,"fq":2,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial East 4","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Pharma","contractType":"New Logo","incumbent":"None","probability":25,"expRevenue":500.0,"oppAmount":240434.34,"nextStep":"4/17 JW _ connected with Angelo and aligned with him on the reality of a direct relationship with NiCE vs. with Alphnumeric. Created a digital room to get him up to speed on the latest on NiCE + Cognigy. Nuturing this opportunity"},
  {"lineItemId":"00kUi00000B3kHkIAJ","oppId":"006Ui00001CpocrIAB","oppName":"GlaxoSmithKline | CXone | Complete Suite + Textel + PC Dialer | 105","account":"GlaxoSmithKline plc.","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":15400,"listPrice":27500,"unitPrice":15400,"quantity":1,"closeDate":"2027-04-28","fy":2027,"fq":2,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Commercial East 4","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Pharma","contractType":"New Logo","incumbent":"None","probability":25,"expRevenue":3850.0,"oppAmount":240434.34,"nextStep":"4/17 JW _ connected with Angelo and aligned with him on the reality of a direct relationship with NiCE vs. with Alphnumeric. Created a digital room to get him up to speed on the latest on NiCE + Cognigy. Nuturing this opportunity"},
  {"lineItemId":"00kUi000006PBmqIAG","oppId":"006Ui00000aIU69IAG","oppName":"DCF | FL Dept of Children & Families | VZ | CXone Auto Summary | Verizon | $300k | T3","account":"State of FL - Dept of Children & Families","stage":"4 - Confirm Value & Agreement","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2500,"listPrice":2000,"unitPrice":2500,"quantity":1,"closeDate":"2027-05-25","fy":2027,"fq":2,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"SLED Central","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"Avaya","probability":50,"expRevenue":1250.0,"oppAmount":508113.74,"nextStep":"2/20/2026 (LDH): Using VZ opportunity to show difference in price between going direct with NiCE or using VCC"},
  {"lineItemId":"00kUi000006PBmrIAG","oppId":"006Ui00000aIU69IAG","oppName":"DCF | FL Dept of Children & Families | VZ | CXone Auto Summary | Verizon | $300k | T3","account":"State of FL - Dept of Children & Families","stage":"4 - Confirm Value & Agreement","sku":"Migration Service – 10,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 10,000,000 interactions (per source DB)","totalPrice":22000,"listPrice":17600,"unitPrice":22000,"quantity":1,"closeDate":"2027-05-25","fy":2027,"fq":2,"forecast":"Most Likely","forecastCat":"—","region":"Americas","segment":"","territory":"SLED Central","cluster":"","dcRegion":"NA1","dcSource":"inferred","currency":"USD","industry":"Government & Public Administration","contractType":"New Logo","incumbent":"Avaya","probability":50,"expRevenue":11000.0,"oppAmount":508113.74,"nextStep":"2/20/2026 (LDH): Using VZ opportunity to show difference in price between going direct with NiCE or using VCC"},
  {"lineItemId":"00kUi00000H4Wn9IAF","oppId":"006Ui00001u7ARiIAM","oppName":"TCS | CXone | 600","account":"TCS - INDIA - ENTERPRISE","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":23100,"listPrice":33000,"unitPrice":23100,"quantity":1,"closeDate":"2027-06-15","fy":2027,"fq":2,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"India","cluster":"E38","dcRegion":"EU2","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Exst. Customer / New LOB","incumbent":"Cisco","probability":25,"expRevenue":5775.0,"oppAmount":689458.24,"nextStep":"RFP submitted, awaiting feedback from TCS"},
  {"lineItemId":"00kUi00000H4Wn5IAF","oppId":"006Ui00001u7ARiIAM","oppName":"TCS | CXone | 600","account":"TCS - INDIA - ENTERPRISE","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":2100,"listPrice":3000,"unitPrice":2100,"quantity":1,"closeDate":"2027-06-15","fy":2027,"fq":2,"forecast":"Best Case","forecastCat":"—","region":"International","segment":"","territory":"India","cluster":"E38","dcRegion":"EU2","dcSource":"cluster","currency":"USD","industry":"Technology","contractType":"Exst. Customer / New LOB","incumbent":"Cisco","probability":25,"expRevenue":525.0,"oppAmount":689458.24,"nextStep":"RFP submitted, awaiting feedback from TCS"},
  {"lineItemId":"00kUi00000KAvmYIAT","oppId":"006Ui00001iNk3VIAS","oppName":"Hyundai Capital America | CXone Cognigy 1CX SmartReach | Omnichannel | 1350 Agents","account":"HYUNDAI CAPITAL AMERICA","stage":"3 - Aligning Benefits & Value","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.2,"listPrice":0.2,"unitPrice":0.2,"quantity":1,"closeDate":"2027-09-24","fy":2027,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise West","cluster":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"New OCR Logo","incumbent":"Cisco","probability":25,"expRevenue":0.05,"oppAmount":2243406.07,"nextStep":"4/10: awaiting details, HCA not moving forward now"},
  {"lineItemId":"00kUi00000KAvmZIAT","oppId":"006Ui00001iNk3VIAS","oppName":"Hyundai Capital America | CXone Cognigy 1CX SmartReach | Omnichannel | 1350 Agents","account":"HYUNDAI CAPITAL AMERICA","stage":"3 - Aligning Benefits & Value","sku":"Migration Service – 100,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 100,000,000 interactions (per source DB)","totalPrice":74250,"listPrice":74250,"unitPrice":74250,"quantity":1,"closeDate":"2027-09-24","fy":2027,"fq":3,"forecast":"Best Case","forecastCat":"—","region":"Americas","segment":"","territory":"Enterprise West","cluster":"C209","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Financial Services","contractType":"New OCR Logo","incumbent":"Cisco","probability":25,"expRevenue":18562.5,"oppAmount":2243406.07,"nextStep":"4/10: awaiting details, HCA not moving forward now"},
  {"lineItemId":"00kUi00000F2aGAIAZ","oppId":"006Ui00001joX4nIAE","oppName":"GENERAL DYNAMICS INFORMATION TECHNOLOGY| GSI DEMO BU","account":"GENERAL DYNAMICS IT DEMO BU","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per BU) – up to 15m calls","skuFull":"CXone Interactions Hub Migrated Call Management (Per BU) - up to 15m calls","totalPrice":0,"listPrice":2000,"unitPrice":0,"quantity":1,"closeDate":"2027-12-31","fy":2027,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"","segment":"","territory":"Federal","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New BU","incumbent":"","probability":25,"expRevenue":0.0,"oppAmount":9135.74,"nextStep":""},
  {"lineItemId":"00kUi00000F2aGBIAZ","oppId":"006Ui00001joX4nIAE","oppName":"GENERAL DYNAMICS INFORMATION TECHNOLOGY| GSI DEMO BU","account":"GENERAL DYNAMICS IT DEMO BU","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 20,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 20,000,000 interactions (per source DB)","totalPrice":0,"listPrice":22000,"unitPrice":0,"quantity":1,"closeDate":"2027-12-31","fy":2027,"fq":4,"forecast":"Best Case","forecastCat":"—","region":"","segment":"","territory":"Federal","cluster":"B32","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Other","contractType":"Exst. Customer / New BU","incumbent":"","probability":25,"expRevenue":0.0,"oppAmount":9135.74,"nextStep":""},
  {"lineItemId":"00kUi000003TpBuIAK","oppId":"006Ui00000O9QGrIAN","oppName":"NATIONAL GRID | Amendment | Interaction Hub Migrated Calls Pivot PBP $0 Dollar","account":"NATIONAL GRID USA SERVICE COMPANY INC","stage":"2 - Determining Problem / Impact","sku":"Migration Service – 50,000,000","skuFull":"CXone Interactions Hub Migration Services Migrated calls Service Up to 50,000,000 interactions (per source DB)","totalPrice":55000,"listPrice":55000,"unitPrice":55000,"quantity":1,"closeDate":"2029-01-05","fy":2029,"fq":1,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Industrial and Infrastructure","cluster":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","incumbent":"Calabrio","probability":25,"expRevenue":13750.0,"oppAmount":57200.16,"nextStep":"8/25 CE: Pivot from Play Back Portal Legacy to Interactions Hub $0 Dollar.......  Ash Approved Dave doing $0 Dollar Signatureless Amendment"},
  {"lineItemId":"00kUi000003TpBtIAK","oppId":"006Ui00000O9QGrIAN","oppName":"NATIONAL GRID | Amendment | Interaction Hub Migrated Calls Pivot PBP $0 Dollar","account":"NATIONAL GRID USA SERVICE COMPANY INC","stage":"2 - Determining Problem / Impact","sku":"Mgmt (Per 1000 Interactions) – 15m+","skuFull":"CXone Interactions Hub Migrated Call Management (Per 1000 Interactions) – 15m Interactions and above","totalPrice":0.16,"listPrice":0.2,"unitPrice":0.16,"quantity":1,"closeDate":"2029-01-05","fy":2029,"fq":1,"forecast":"Long Shot","forecastCat":"—","region":"Americas","segment":"","territory":"Industrial and Infrastructure","cluster":"C204","dcRegion":"NA1","dcSource":"cluster","currency":"USD","industry":"Utilities","contractType":"Addendum","incumbent":"Calabrio","probability":25,"expRevenue":0.04,"oppAmount":57200.16,"nextStep":"8/25 CE: Pivot from Play Back Portal Legacy to Interactions Hub $0 Dollar.......  Ash Approved Dave doing $0 Dollar Signatureless Amendment"}
];

const CLUSTER_DC = {"A32":"AU1","A33":"AU1","AE26":"UAE","B32":"NA1","C8":"NA1","C17":"NA1","C32":"NA1","C34":"NA1","C38":"NA1","C40":"NA1","C42":"NA1","C43":"NA1","C44":"NA1","C46":"NA1","C53":"NA1","C54":"NA1","C56":"NA1","C57":"NA1","C58":"NA1","C61":"NA1","C62":"NA1","C63":"NA1","C64":"NA1","C67":"NA1","C69":"NA1","C74":"NA2","C200":"NA1","C204":"NA1","C205":"CA1","C209":"NA1","C210":"NA1","C700":"NA1","E32":"EU1","E34":"EU2","E35":"EU1","E38":"EU2","J32":"JP1","L33":"UK1","L35":"UK1","L36":"UK1","LO26":"UK1","M33":"CA1"};
// Auto-synced from Jira · last sync: 2026-06-29 · 67 epics
const JIRA_EPICS = [
  {"key":"CXREC-62311","release":"25.4","status":"Done","priority":"P2","assignee":"Alex Ivanov","feature":"Scale","title":"[Historical] - Amigos - Support Higher Load (10M/15M calls per Day)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-62311"},
  {"key":"CXREC-64417","release":"25.4","status":"Done","priority":"P2","assignee":"Priyanka Magdum","feature":"Scale","title":"Historical migration - 10 million segments per day support - Phase 1","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-64417"},
  {"key":"CXREC-68383","release":"25.4","status":"Done","priority":"P2","assignee":"Shay Kintzlinger","feature":"QA / Monitoring","title":"[Historical] - Rockets - Playbook + Monitoring","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-68383"},
  {"key":"CXREC-83113","release":"25.4","status":"Done","priority":"P2","assignee":"Amy Parizada","feature":"Infrastructure","title":"[Historical][Amigos] – Inject Historical Calls with No Audio into CXone","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-83113"},
  {"key":"CXREC-92008","release":"25.4","status":"Done","priority":"P1","assignee":"Dvir Harazi","feature":"Cost / Infra","title":"[Historical + S&F + AppLink][Amigos] - Node.js Upgrade to v22","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-92008"},
  {"key":"CXREC-96480","release":"25.4","status":"Done","priority":"P2","assignee":"Kalpesh Jadhav","feature":"Scale","title":"Historical migration - 10 million segments per day support - Phase 2","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-96480"},
  {"key":"CXREC-97110","release":"25.4","status":"Done","priority":"P1","assignee":"Pini Kaminer","feature":"Region / Security","title":"[Historical] - Support DE (EU) and JP Regions","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97110"},
  {"key":"CXREC-100043","release":"26.1","status":"Done","priority":"P1","assignee":"Amy Parizada","feature":"Monitoring","title":"[Historical][Amigos]  proactive detection and alarming for media-upload response SLA breach","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-100043"},
  {"key":"CXREC-100047","release":"26.1","status":"Done","priority":"None","assignee":"Or Eizen","feature":"Media Upload","title":"[Historical][Amigos] media upload adhoc evidence report","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-100047"},
  {"key":"CXREC-102461","release":"26.1","status":"Done","priority":"P1","assignee":"Vinayak Bhati","feature":"Playback","title":"[Player] - [Migrated Calls] Add G.711a (PCMA) support for External WAV (Genesys ➜ CXone)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-102461"},
  {"key":"CXREC-106258","release":"26.1","status":"Done","priority":"P1","assignee":"Priyanka Shelke","feature":"Playback","title":"[Historical Data Upload][Player] - Voyager - support mp3 file playback and download from CXone Player and Playback API","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-106258"},
  {"key":"CXREC-41166","release":"26.1","status":"Done","priority":"P1","assignee":"Alex Ivanov","feature":"Region / Security","title":"[Historical] - Multi-Region Storage Support - Migrate Calls through the Bulk upload API to different regions than the BU","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-41166"},
  {"key":"CXREC-70491","release":"26.1","status":"Done","priority":"P2","assignee":"Alex Ivanov","feature":"QA / Monitoring","title":"[Historical] - Amigos - Playbook","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-70491"},
  {"key":"CXREC-91358","release":"26.1","status":"Done","priority":"P1","assignee":"Pini Kaminer","feature":"Region / Security","title":"[Historical] - Support SOV Regions (DWP) + Security support (internal encryption)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-91358"},
  {"key":"CXREC-92018","release":"26.1","status":"Done","priority":"P2","assignee":"Shay Kintzlinger","feature":"Business Data","title":"[Historical] - Support 250 BD fields with 4KB size limit per field, 15KB size limit per Segment & 70 BD fields per Segment","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-92018"},
  {"key":"CXREC-95296","release":"26.1","status":"Done","priority":"P1","assignee":"Adir Akhavan","feature":"Region / Security","title":"[Historical] - Support AU SOV & EU SOV Regions + Security support (internal encryption)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-95296"},
  {"key":"CXREC-97112","release":"26.1","status":"Done","priority":"P1","assignee":"Adir Akhavan","feature":"Region / Security","title":"[Historical] - Support JO + AE Regions","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97112"},
  {"key":"CXREC-97587","release":"26.1","status":"Done","priority":"P2","assignee":"Kalpesh Jadhav","feature":"Scale","title":"[Historical Migration][Falcons] - 40 million segments per day support - Phase 2","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97587"},
  {"key":"CXREC-100013","release":"26.2","status":"Done","priority":"P2","assignee":"Itchy Sun","feature":"Scale","title":"[Historical] - Rockets - Support Higher Load (40M calls per Day) - DWP/HRB/SS&C/etc.","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-100013"},
  {"key":"CXREC-101537","release":"26.2","status":"Done","priority":"None","assignee":"Omer Lubko","feature":"Infrastructure","title":"Migrated Calls - Add Icon Support in Dictionary - integration & testing","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-101537"},
  {"key":"CXREC-104222","release":"26.2","status":"Done","priority":"P2","assignee":"Kalpesh Jadhav","feature":"Scale","title":"[Historical Migration][Falcons] - 40 million segments per day support - Phase 3","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-104222"},
  {"key":"CXREC-107505","release":"26.2","status":"Done","priority":"None","assignee":"Vinayak Bhati","feature":"Playback","title":"[Voyager][Migrated Calls] -[ Support G.723/G723.1 Codec Playback] - for DWP","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-107505"},
  {"key":"CXREC-108061","release":"26.2","status":"Done","priority":"None","assignee":"Lina Kogan","feature":"Search / RBAC","title":"[Migrated Calls]: [RBAC] Support Interaction-Segment Views","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-108061"},
  {"key":"CXREC-109052","release":"26.2","status":"Done","priority":"P2","assignee":"Dilip Kale","feature":"Scale","title":"[Historical Migration][Voyager][SDR] - 40 million segments per day support","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-109052"},
  {"key":"CXREC-109053","release":"26.2","status":"Done","priority":"P2","assignee":"Manoj Biradar","feature":"Scale","title":"[Historical Migration][iHub] - 40 million segments per day support","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-109053"},
  {"key":"CXREC-109925","release":"26.2","status":"Done","priority":"P1","assignee":"Pini Kaminer","feature":"Infrastructure","title":"[Historical] - Enable to inject the Same ContactID again to add/fix Segment(s) within already injected Contact","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-109925"},
  {"key":"CXREC-112513","release":"26.2","status":"Done","priority":"None","assignee":"Balkrushna Jadhav","feature":"Cost / Infra","title":"[Lib Usage][TS][lambda-mcr-historical-segment-dl-ingestion] Migrate the lambda to node 22 and aws sdk v3","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-112513"},
  {"key":"CXREC-70009","release":"26.2","status":"Done","priority":"P1","assignee":"Or Eizen","feature":"Tech Debt","title":"[FT Removal] Amigos - Historical + AppLink solutions Removal of FT","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-70009"},
  {"key":"CXREC-85368","release":"26.2","status":"Done","priority":"P1","assignee":"Sabi Shalom","feature":"QA / Monitoring","title":"[E2E Automation] [Interactions]  - Historical + SM - phase 1 - injection","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-85368"},
  {"key":"CXREC-94982","release":"26.2","status":"Done","priority":"P1","assignee":"Mark Tregub","feature":"Media Upload","title":"[Historical] - Media Upload - reprocess flow","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-94982"},
  {"key":"CXREC-101116","release":"26.3","status":"Done","priority":"P1","assignee":"David Bisson","feature":"QA / Monitoring","title":"[E2E Automation] [SM]  - Migrated Calls","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-101116"},
  {"key":"CXREC-111921","release":"26.3","status":"Done","priority":"None","assignee":"Vinayak Bhati","feature":"Playback","title":"[Voyagers][Migrated Calls] - [Support G.726 ADPCM Codec Playback] - for SS&C","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-111921"},
  {"key":"CXREC-116963","release":"26.3","status":"In Progress","priority":"None","assignee":"Charles Cohen","feature":"Infrastructure","title":"[CXCROSS][Historical] - Data Classification - AWS Resource Tagging - Hybrid Recording","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-116963"},
  {"key":"CXREC-118713","release":"26.3","status":"In Definition","priority":"None","assignee":"Simcha Schaum","feature":"Search / RBAC","title":"[E2E Automation][Interactions] [Migrated Calls]: [RBAC] Support Interaction-Segment Views","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-118713"},
  {"key":"CXREC-97187","release":"26.3","status":"In Progress","priority":"P1","assignee":"Vinayak Bhati","feature":"Infrastructure","title":"[Historical Data Upload] - Voyager - support same format download for Migrated Calls as uploaded from Player","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97187"},
  {"key":"CXREC-108280","release":"26.4","status":"In Definition","priority":"P1","assignee":"Adir Akhavan","feature":"Region / Security","title":"[Historical] - Utilize synthtic and sanity on  AU SOV & EU SOV Regions + Security support (internal encryption)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-108280"},
  {"key":"CXREC-127282","release":"26.4","status":"New","priority":"None","assignee":"Mark Tregub","feature":"Cost / Infra","title":"[AppLink][Historical] Upgrade  both. SAP MS to JAVA 21","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-127282"},
  {"key":"CXREC-132665","release":"26.4","status":"New","priority":"None","assignee":"Meir Abukasis","feature":"Reporting","title":"[Historicals] Add Expiration Date to Evidence Report","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-132665"},
  {"key":"CXREC-133511","release":"26.4","status":"New","priority":"None","assignee":"Unassigned","feature":"Playback","title":"[Data Lake]Full Interaction Playback Support for Migrated Calls Search - Complex call identifier","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-133511"},
  {"key":"CXREC-72355","release":"26.4","status":"New","priority":"P2","assignee":"Lina Kogan","feature":"Search / Scale","title":"Interactions: Search migrated calls BE - Autoscale","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-72355"},
  {"key":"CXREC-83612","release":"26.4","status":"Ready for Dev","priority":"P1","assignee":"Meir Vitkin","feature":"Cost / Infra","title":"[Historical][Cost] - Switch from Redis to ValKey Serverless","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-83612"},
  {"key":"CXREC-92871","release":"26.4","status":"New","priority":"P1","assignee":"Itchy Sun","feature":"QA / Monitoring","title":"[Historical] - Performance test as part of the GATE","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-92871"},
  {"key":"CXREC-95098","release":"26.4","status":"New","priority":"P2","assignee":"Rotem Harduf","feature":"Performance","title":"[AppLink][Historical] - Performance - E2E performance -  break repositories and upgrade platform JAR","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-95098"},
  {"key":"CXREC-100528","release":"27.1","status":"New","priority":"P2","assignee":"Meir Abukasis","feature":"Multi-tenancy","title":"[Historical] - Support Tenant Segmentation","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-100528"},
  {"key":"CXREC-101989","release":"27.1","status":"New","priority":"P1","assignee":"Barak Yaffe","feature":"Media Upload","title":"[Historical] – convert media upload component to TS compatible","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-101989"},
  {"key":"CXREC-109604","release":"27.1","status":"Ready for Dev","priority":"P1","assignee":"Adir Akhavan","feature":"Region / Security","title":"[Historical] - Support KR Region","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-109604"},
  {"key":"CXREC-111017","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Cost / Infra","title":"[Historical] – Support Data Scanning - Monitoring and Performance and cost","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-111017"},
  {"key":"CXREC-113473","release":"27.1","status":"In Definition","priority":"P1","assignee":"Rohit Kumbhar","feature":"Region / Security","title":"[Historical] - Support UK Sov 2 (HMRC) Region","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-113473"},
  {"key":"CXREC-114095","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Business Data","title":"[Historical] - Business Data invocation from Cache","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-114095"},
  {"key":"CXREC-114171","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Region / Security","title":"[Historical] - Support ZA Region (South Africa)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-114171"},
  {"key":"CXREC-117495","release":"27.1","status":"New","priority":"None","assignee":"Unassigned","feature":"Resiliency","title":"[Historical][Resiliency] Failed Step Functions rerty","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-117495"},
  {"key":"CXREC-36042","release":"27.1","status":"New","priority":"P2","assignee":"Meir Abukasis","feature":"Cost / Infra","title":"[Historical] - Amigos - NFR: Minimize number of 'VPC Connected' Lambdas","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-36042"},
  {"key":"CXREC-50377","release":"27.1","status":"New","priority":"None","assignee":"Fabrizio Mieli","feature":"Resiliency","title":"[Historical] - SAP service public API's should be resilient to unplanned load (AKA rate limiting)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-50377"},
  {"key":"CXREC-50774","release":"27.1","status":"In Definition","priority":"P3","assignee":"Meir Abukasis","feature":"Tech Debt","title":"[Historical + Applink] Amigos Components clean-up","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-50774"},
  {"key":"CXREC-54974","release":"27.1","status":"New","priority":"P2","assignee":"Meir Abukasis","feature":"Reporting","title":"[Historical] - Add migration process errors to migration reporting API - (Migration Reporting phase 3)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-54974"},
  {"key":"CXREC-55846","release":"27.1","status":"New","priority":"P2","assignee":"Meir Abukasis","feature":"Metadata","title":"[Historical] - Update injected segments Metadata after injection to CXone","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-55846"},
  {"key":"CXREC-83613","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Cost / Infra","title":"[Historical][Cost] - Replace SAP microservice with lambda as  API","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-83613"},
  {"key":"CXREC-91184","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Screen Recording","title":"[Historical][Media] - Support Screen Recording Migration","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-91184"},
  {"key":"CXREC-91441","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Screen Recording","title":"[Historical][Metadata] - Support Screen Recording Migration","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-91441"},
  {"key":"CXREC-93028","release":"27.1","status":"New","priority":"P2","assignee":"Meir Abukasis","feature":"Monitoring","title":"[Historical] - Addition of CTI Analysis (CTIA) Metrics","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-93028"},
  {"key":"CXREC-94777","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Injection API","title":"[Historical Injection API] - Historical API for calls Injection (Voice & Screen)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-94777"},
  {"key":"CXREC-97705","release":"27.1","status":"In Definition","priority":"P2","assignee":"Alex Ivanov","feature":"Cost / Infra","title":"[Historical][Cost] - redesign media upload after usage of S3 as station between steps","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97705"},
  {"key":"CXREC-97738","release":"27.1","status":"New","priority":"P1","assignee":"Meir Abukasis","feature":"Injection API","title":"[Historical Injection API] - Historical calls Injection (Voice & Screen)","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97738"},
  {"key":"CXREC-97741","release":"27.1","status":"In Definition","priority":"P1","assignee":"Charles Cohen","feature":"Security","title":"[Historical] - Handle Security Sanitization for BD input","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-97741"},
  {"key":"CXREC-36047","release":"27.2","status":"New","priority":"P2","assignee":"Meir Abukasis","feature":"Cost / Infra","title":"[Historical] - NFR: Minimize number of 'VPC Connected' Lambdas","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-36047"},
  {"key":"CXREC-56310","release":"27.2","status":"New","priority":"None","assignee":"Meir Abukasis","feature":"Cost / Infra","title":"[APPLINK + Historical][Cost] - conclude the best cost-effective configuration for our lambdas - Rockets","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-56310"},
  {"key":"CXREC-56687","release":"27.2","status":"New","priority":"None","assignee":"Meir Abukasis","feature":"Cost / Infra","title":"[APPLINK + Historical][Cost] - conclude the best cost-effective configuration for our lambdas - Amigos","url":"https://nice-ce-cxone-prod.atlassian.net/browse/CXREC-56687"}
];
const RELEASES = [
  {"v":"25.4","status":"Released","q":"2025-Q4"},
  {"v":"26.1","status":"Released","q":"2026-Q1"},
  {"v":"26.2","status":"Released","q":"2026-Q2"},
  {"v":"26.3","status":"In Progress","q":"2026-Q3"},
  {"v":"26.4","status":"Planned","q":"2026-Q4"},
  {"v":"27.1","status":"Planned","q":"2027-Q1"},
  {"v":"27.2","status":"Planned","q":"2027-Q2"}
];
// Auto-synced tenants · 2026-06-02 · 46 tenants (16 completed, 14 in-progress, 16 not-started)
// Auto-synced via scheduled task · last sync: 2026-07-01
const TENANTS = [
  {"customer":"Carnival","dcRegion":"UK1","bookingQ":"Q1 2024","source":"Verint","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":3.0,"calls":3000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"HCC (Canadian Insurance)","dcRegion":"CA1","bookingQ":"Q2 2024","source":"Uptivity","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":10.0,"calls":10292870,"pendingCalls":0,"status":"Completed"},
  {"customer":"National Grid","dcRegion":"NA1","bookingQ":"Q4 2023","source":"Calabrio","sku":"PBP Swap (FOC)","storageTB":30.0,"calls":28700000,"pendingCalls":0,"status":"Completed"},
  {"customer":"TP – HEALTH ADVOCATE","dcRegion":"NA1","bookingQ":"Q4 2024","source":"Uptivity","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":15.0,"calls":30000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"CINCH HOME SERVICES","dcRegion":"NA1","bookingQ":"Q4 2024","source":"NICE Engage","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":10000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"CONSTELLATION INSURANCE","dcRegion":"NA1","bookingQ":"Q1 2025","source":"NICE Engage","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":1.5,"calls":4000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"CSAA INSURANCE SERVICES","dcRegion":"NA1","bookingQ":"Q1 2025","source":"NICE Engage + NIM4.1","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":10000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"HRB TAX GROUP","dcRegion":"NA1","bookingQ":"Q4 2024","source":"NICE Engage","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":85000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"YOUNG WILLIAMS","dcRegion":"NA2","bookingQ":"Q4 2024","source":"Genesys","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":1300000,"pendingCalls":0,"status":"Completed"},
  {"customer":"WORLDPAY, LLC","dcRegion":"EU1","bookingQ":"Q1 2025","source":"ININ+Calabrio+CXone","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":4000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"ENERGY AUSTRALIA","dcRegion":"AU1","bookingQ":"Q2 2025","source":"NICE Engage + NIM4.1","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":27400000,"pendingCalls":null,"status":"In Progress"},
  {"customer":"GOVERNMENT EMPLOYEES HEALTH ASSOCIATION (GEHA)","dcRegion":"NA1","bookingQ":"Q2 2025","source":"Engage + NIM4.1","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":20000000,"pendingCalls":0,"status":"Completed"},
  {"customer":"TT2","dcRegion":"UK1","bookingQ":"Q3 2025","source":"CXone","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":70000,"pendingCalls":0,"status":"Completed"},
  {"customer":"TALKTALK","dcRegion":"UK1","bookingQ":"Q3 2025","source":"Call Miner","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":3500000,"pendingCalls":0,"status":"Completed"},
  {"customer":"Golden1","dcRegion":"NA1","bookingQ":"Q2 2024","source":"Genesys PureConnect","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":5.0,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"Cadence Bank","dcRegion":"NA1","bookingQ":"Q4 2024","source":"Eleveo","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"Raymond James","dcRegion":"NA1","bookingQ":"Q4 2024","source":"CXone","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":350000,"pendingCalls":0,"status":"Completed"},
  {"customer":"AMERICAN NATIONAL INSURANCE","dcRegion":"NA1","bookingQ":"Q1 2025","source":"Uptivity Hybrid","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"ALLIANT ENERGY CORPORATE SERVICES, INC.","dcRegion":"NA1","bookingQ":"Q1 2025","source":"Calabrio","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"FIS Brazil","dcRegion":"SA1","bookingQ":"Q2 2026","source":"NICE Engage","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"FIS GLOBAL - INTERNATIONAL BANKING","dcRegion":"EU1","bookingQ":"Q2 2025","source":"CXone","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":970000,"pendingCalls":0,"status":"Completed"},
  {"customer":"Bank of the Sierra","dcRegion":"NA1","bookingQ":"Q2 2025","source":"Uptivity","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"DWP","dcRegion":"UK1","bookingQ":"Q2 2025","source":"Verint","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":300.0,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"ANZ NCCR QA","dcRegion":"AU1","bookingQ":"Q2 2025","source":"NICE Engage","sku":"Lab (1000 ints)","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"GEISINGER SYSTEM SERVICES","dcRegion":"NA1","bookingQ":"Q2 2025","source":"—","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"Mercury New Zealand","dcRegion":"AU1","bookingQ":"Q2 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":1100000,"pendingCalls":null,"status":"In Progress"},
  {"customer":"SS&C TECHNOLOGIES HOLDINGS, INC.","dcRegion":"NA1","bookingQ":"Q3 2025","source":"Engage + 3rd party","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"1800 CONTACTS","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"PPL UTILITIES","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"BROADVIEW FEDERAL CREDIT UNION","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"OneMain Financial - PRIMARY ENTERPRISE ACCOUNT","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"BCBSAZ MEDISUN INC DBA BCBS OF ARIZONA","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":15100000,"pendingCalls":0,"status":"Completed"},
  {"customer":"THE TORONTO-DOMINION BANK US WEST","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"WNS Global Services (P) Ltd - India - HQ","dcRegion":"NA1","bookingQ":"Q3 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"RINGCENTRAL CC SE1 B32 OSH","dcRegion":"NA1","bookingQ":"Q4 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"NISOURCE CORPORATE SERVICES COMPANY - Accenture Partner","dcRegion":"NA1","bookingQ":"Q4 2025","source":"—","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"UMB FINANCIAL CORPORATION","dcRegion":"NA1","bookingQ":"Q4 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"Not Started"},
  {"customer":"SPIRE","dcRegion":"NA1","bookingQ":"Q4 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"CALOPTIMA","dcRegion":"NA1","bookingQ":"Q4 2025","source":"—","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"ANZ","dcRegion":"AU1","bookingQ":"Q4 2024","source":"NICE Engage","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":null,"pendingCalls":10000000,"status":"Not Started"},
  {"customer":"ANZ NCCR DEV","dcRegion":"AU1","bookingQ":"Q2 2025","source":"NICE Engage","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":1000,"status":"Not Started"},
  {"customer":"TCS State Street New BU","dcRegion":"NA1","bookingQ":"Q1 2026","source":"To confirm","sku":"Mgmt (Per BU) – up to 15m calls","storageTB":null,"calls":10000000,"pendingCalls":null,"status":"In Progress"},
  {"customer":"Royal London UK Enterprise","dcRegion":"EU1","bookingQ":"Q1 2026","source":"To confirm","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":null,"status":"In Progress"},
  {"customer":"Swinton Insurance (Markerstudy)","dcRegion":"EU1","bookingQ":"Q1 2026","source":"To confirm","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":15000000,"pendingCalls":null,"status":"In Progress"},
  {"customer":"Montefiore Medical Center","dcRegion":"NA1","bookingQ":"Q2 2026","source":"To confirm","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":42000000,"status":"Not Started"},
  {"customer":"Sharp Healthcare","dcRegion":"NA1","bookingQ":"Q2 2026","source":"To confirm","sku":"Mgmt (Per 1000 Interactions) – 15m+","storageTB":null,"calls":null,"pendingCalls":22000000,"status":"Not Started"}
];

// Auto-synced changelog · updated by scheduled task on each run
const CHANGELOG = [
  {"type":"new_win","date":"2026-07-01","title":"New win: Wesleyan Financial","detail":"International · 2026-06 · $1,074 rec ACV + $8,342 services"},
  {"date":"2026-06-30","type":"new_deal","message":"New pipeline: TAFE NSW (TAFE NSW RFP | AU | Optus | 550 concurre)","id":"006Ui00001qFvAnIAK"},
  {"date":"2026-06-30","type":"new_win","message":"New win: PPL UTILITIES (PPL UTILITIES |  Amendment  | 10M Call M)","id":"006Ui00002QI93GIAT"},
  {"date":"2026-06-30","type":"new_tenant","message":"New tenant: WNS India Ltd London BU (Not Started)"},
  {"date":"2026-06-30","type":"new_tenant","message":"New tenant: WNS Global Services Tokyu BU (Not Started)"},
  {"type":"new_loss","date":"2026-06-29","title":"Deal lost: SS&C TECHNOLOGIES HOLDINGS, INC.","detail":" · Close: 2026-06"},
  {"type":"new_deal","date":"2026-06-26","title":"New deal added: ACCENTURE PARTNER","detail":"Stage: 1 - Identification / Qualification · Close: 2026-08 · Americas"},
  {"type":"new_win","date":"2026-06-26","title":"New win: RINGCENTRAL CC SE1 B32 OSH","detail":" · 2026-06 + $-22,000 services"},
  {"type":"new_deal","date":"2026-06-25","title":"New deal added: Claritev Corporation","detail":"Stage: 5 - Proposal / Negotiation · Close: 2026-06 · Americas"},
  {"type":"new_deal","date":"2026-06-23","title":"New deal added: CALOPTIMA","detail":"Stage: 1 - Identification / Qualification · Close: 2026-07 · Americas"},
  {"type":"new_deal","date":"2026-06-22","title":"New deal added: VIDEOTRON LTD.","detail":"Stage: 1 - Identification / Qualification · Close: 2026-09 · Americas"},
  {"type":"new_deal","date":"2026-06-22","title":"New deal added: NC DHHS Division of Public Health FedRAMP","detail":"Stage: 5 - Proposal / Negotiation · Close: 2026-08 · Americas"},
  {"type":"new_deal","date":"2026-06-22","title":"New deal added: Select Portfolio Servicing , Inc.","detail":"Stage: 3 - Aligning Benefits & Value · Close: 2026-06 · Americas"},
  {"type":"new_win","date":"2026-06-22","title":"New win: YOUNG WILLIAMS NON-FEDRAMP","detail":"Americas · 2025-05 · $-2,000 rec ACV + $-22,000 services"},
  {"type":"new_deal","date":"2026-06-19","title":"New deal added: Sword Group NG","detail":"Stage: 5 - Proposal / Negotiation · Close: 2026-05 · "},
  {"type":"new_loss","date":"2026-06-17","title":"Deal lost: BANKINTER GLOBAL SERVICES S.A.","detail":"International · Close: 2026-06"},
  {"type":"new_deal","date":"2026-06-16","title":"New deal added: Auckland Council (NTT)","detail":"Stage: 3 - Aligning Benefits & Value · Close: 2026-12 · International"},
  {"type":"new_deal","date":"2026-06-16","title":"New deal added: NC DHHS Division of Public Health FedRAMP","detail":"Stage: 5 - Proposal / Negotiation · Close: 2026-08 · Americas"},
  {"type":"new_deal","date":"2026-06-16","title":"New deal added: RINGCENTRAL CC SE1 B32 OSH","detail":"Stage: 2 - Determining Problem / Impact · Close: 2026-06 · "},
  {"type":"new_win","date":"2026-06-16","title":"New win: ENERGY AUSTRALIA 2ND BU","detail":"International · 2026-06 · $420 rec ACV + $3,278 services"},
  {"type":"new_loss","date":"2026-06-16","title":"Deal lost: SS&C TECHNOLOGIES HOLDINGS, INC.","detail":" · Close: 2026-06"},
  {"type":"new_loss","date":"2026-06-16","title":"Deal lost: Asoc. Española Contra el Cáncer","detail":" · Close: 2026-06"},
  {"type":"new_loss","date":"2026-06-16","title":"Deal lost: OPTUS SINGTEL LTD  PROD BU","detail":"International · Close: 2026-06"},
  {"type":"new_deal","date":"2026-06-01","title":"New deal added: UNITED HEALTH GROUP","detail":"Stage: 0 - Prospecting · Close: 2026-07 · International"},
  {"type":"new_deal","date":"2026-06-01","title":"New deal added: VRAD INC","detail":"Stage: 1 - Identification / Qualification · Close: 2026-06 · International"},
  {"type":"new_deal","date":"2026-06-01","title":"New deal added: CHUBB EUROPEAN GROUP SE","detail":"Stage: 1 - Identification / Qualification · Close: 2026-06 · International"},
  {"type":"new_win","date":"2026-05-28","title":"New win: AMERITAS LIFE INSURANCE - USA","detail":"Americas · 2026-05 · $1,400 rec ACV + $62,857 services"},
  {"type":"new_deal","date":"2026-05-21","title":"New deal added: NATIONAL GRID USA SERVICE COMPANY INC","detail":"Stage: 2 - Determining Problem / Impact · Close: 2029-01 · Americas"}
];

// Correct DC regions from cluster lookup — overrides any stale baked-in values
// (Cluster prefix is the ground truth: A→AU1, J→JP1, M→CA1, L/LO→UK1, E→EU1/EU2, etc.)
[...RAW_OPPS, ...PIPELINE_LINE_ITEMS].forEach(o => {
  const cl = o.cxoneInstance || o.cluster;
  if(cl && CLUSTER_DC[cl]) { o.dcRegion = CLUSTER_DC[cl]; o.dcSource = "cluster"; }
});

// ── Constants & Helpers ───────────────────────────────────────────────────────
const fmt     = v => !v||v===0?"$0":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`;
// FX conversion — approximate rates to USD (updated May 2026)
const FX_TO_USD = { USD:1, GBP:1.26, AUD:0.64, CAD:0.74, EUR:1.08 };
const toUSD = (amount, currency) => (amount||0) * (FX_TO_USD[currency] || 1);
// Service_Term_Months__c from Salesforce per recurring (1448-256x) line item · verified June 2026
// Deals not listed default to 12 months · sub-12-month terms (amendments) capped at 12 for annualisation
const TERM_MONTHS = {
  '0063n000010m4BwAAI':60, // DWP
  '0063n0000118CVmAAM':36, // Golden 1 CU
  '0063n000011zsc1AAA':48, // TD Bank US West
  '006Hu00001XhPSLIA3':36, // Hub Intl (PBU opp)
  '006Hu00001V2NkLIAV':36, // Cadence Bank
  '006Hu00001V58eZIAR':60, // Geisinger
  '006Ui00000IHJqHIAX':60, // Alliant Energy
  '006Ui00000LNdFtIAL':36, // Mercury NZ
  '006Ui00000LgEyXIAV':60, // Broadview FCU
  '006Ui00000OPJJOIA5':46, // Raymond James
  '006Ui00000bjLRIIA2':60, // SS&C (placeholder TCV; ACV unknown)
  '006Ui00000coJ1ZIAU':42, // Montefiore
  '006Ui00000fewVVIAY':18, // Energy Australia (PBU opp)
  '006Ui00000lMMZtIAO':84, // Hub Intl (Per 1000 opp)
  '006Ui00000nwyxFIAQ':48, // Cinch Home
  '006Ui00000uEyNRIA0':36, // Bank of Sierra
  '006Ui000013Bt6zIAC':66, // PPL Utilities
  '006Ui00001AmHQ6IAN':60, // NiSource
  '006Ui00001BopzlIAB':60, // Spire
  '006Ui00001TFASUIA5':36, // BCBS AZ
  '006Ui00001XkRo4IAF':60, // TalkTalk
  '006Ui00001jQGbVIAW':36, // WNS India HQ
  '006Ui00001tSg5lIAC':60, // Ameritas Life
  '006Ui0000279WjZIAU':36, // Swinton Insurance
  '006Ui00002GZ61tIAD':12, // RingCentral B32 Child (4m actual → capped at 12)
};
// ACV normalisation: TCV ÷ term × 12  (term floored at 12 to avoid inflating short amendments)
const acvNorm = (o) => { const t = Math.max(TERM_MONTHS[o.id]||12, 12); return (o.amount||0)/t*12; };
const TODAY   = new Date();
const isFut   = o => !o.isClosed && new Date(o.closeDate) > new Date(TODAY.getTime()+90*24*36e5);
const isOngo  = o => !o.isClosed && !isFut(o);
const statusOf= o => o.isClosed&&o.isWon?"Won":o.isClosed&&!o.isWon?"Lost":isOngo(o)?"Ongoing":"Future";

const SC = { Won:"#059669",Lost:"#dc2626",Ongoing:"#d97706",Future:"#7c3aed","No Opp":"#94a3b8" };
const FC = { Commit:"#059669","Most Likely":"#3b82f6","Best Case":"#d97706","Long Shot":"#dc2626" };
const RC = { Released:"#059669","In Progress":"#d97706",Planned:"#7c3aed" };
const JC = { "In Progress":"#d97706","In Definition":"#7c3aed",Done:"#059669","Ready for Dev":"#2563eb",New:"#64748b" };
const GC = { Americas:"#3b82f6",EMEA:"#7c3aed",APAC:"#fb923c",International:"#60a5fa" };
const DC_COLORS = { NA1:"#2563eb",NA2:"#d97706",CA1:"#06b6d4",SA1:"#a78bfa",AU1:"#fb923c",EU1:"#60a5fa",EU2:"#3b82f6",UK1:"#7c3aed",JP1:"#f472b6",UAE:"#34d399" };
const DC_LABEL  = { NA1:"North America 1",NA2:"North America 2 (FedRAMP)",CA1:"Canada 1",SA1:"South America 1",AU1:"Australia 1",EU1:"Europe 1",EU2:"Europe 2",UK1:"UK & Ireland",JP1:"Japan 1",UAE:"UAE" };
const ST_COL = { Completed:"#059669","In Progress":"#d97706","Not Started":"#475569","In POC":"#7c3aed" };

// ── Global CSS — same old UI ──────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@400;500;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:  #f8fafc;  --sur:#f1f5f9;  --card:#ffffff;  --bdr:#e2e8f0;
    --teal:#2563eb;  --teal2:#1d4ed8; --amb:#d97706;  --grn:#059669;
    --red: #dc2626;  --pur:#7c3aed;  --blu:#3b82f6;  --mut:#94a3b8;
    --txt: #0f172a;  --sub:#475569;
    font-family:'Outfit',sans-serif;
  }
  body{background:var(--bg);color:var(--txt);min-height:100vh}
  .mono{font-family:'Sora',sans-serif;font-weight:700}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:var(--sur)}
  ::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
  .chip{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:600;letter-spacing:.4px;border:1px solid currentColor}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:10px 14px;color:var(--sub);font-weight:700;font-size:11px;letter-spacing:.8px;border-bottom:1px solid var(--bdr);cursor:pointer;user-select:none;white-space:nowrap}
  th:hover{color:var(--teal)}
  td{padding:9px 14px;border-bottom:1px solid rgba(226,232,240,.6);vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr.hover-row:hover td{background:rgba(37,99,235,.05);cursor:pointer}
  select,input[type=number],input[type=text]{background:var(--bg);border:1px solid var(--bdr);color:var(--txt);padding:4px 9px;border-radius:6px;font-size:11px;font-family:'Outfit',sans-serif;outline:none}
  select:focus,input:focus{border-color:var(--teal)} option{background:var(--bg)}
  .stitle{font-size:12px;font-weight:700;letter-spacing:.1px;color:var(--txt);margin-bottom:12px;text-transform:none}
  .tab{padding:5px 14px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--txt);transition:all .12s;font-family:'Outfit',sans-serif}
  .tab.active{background:var(--teal);color:#ffffff;border-color:var(--teal)}
  .tab:not(.active):hover{border-color:var(--teal);color:var(--teal)}
  .kpi-card{cursor:pointer;transition:border-color .15s,transform .12s,box-shadow .15s}
  .kpi-card:hover{border-color:transparent!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,.08)}
  .drawer-row{display:flex;gap:8px;padding:9px 0;border-bottom:1px solid rgba(226,232,240,1)}
  .drawer-row:last-child{border-bottom:none}
  @keyframes pu{0%,100%{opacity:1}50%{opacity:.35}}.live{animation:pu 2s infinite}
  @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.fade{animation:fu .3s ease forwards}
  @keyframes slideIn{from{transform:translateX(100%)}to{transform:none}}
  @keyframes modalIn{from{opacity:0;transform:translateY(-14px) scale(.97)}to{opacity:1;transform:none}}
  @keyframes ovIn{from{opacity:0}to{opacity:1}}
  .sect-tab{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:all .15s;font-family:'Outfit',sans-serif}
`;

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
const TT = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:"#ffffff",border:"1px solid var(--bdr)",borderRadius:8,padding:"9px 13px",fontSize:11}}>
    <div style={{color:"#64748b",marginBottom:5,fontWeight:600}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",marginTop:2}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:p.color}}/>
      <span style={{color:"var(--txt)"}}>{p.name}:</span>
      <span className="mono" style={{color:p.color}}>{typeof p.value==="number"?fmt(p.value):p.value}</span>
    </div>)}
  </div>;
};

// ── Deal Grid Modal ───────────────────────────────────────────────────────────
function Modal({modal, onClose, onDeal}) {
  const [mSort,setMSort] = useState("amount");
  const [mDir, setMDir]  = useState("desc");
  useEffect(()=>{
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[onClose]);
  if(!modal) return null;
  const mHs = col=>{ setMSort(col); setMDir(d=> mSort===col?(d==="asc"?"desc":"asc"):"desc"); };
  const arrow = col => mSort===col?(mDir==="asc"?" ↑":" ↓"):"";
  const mDeals = [...modal.deals].sort((a,b)=>{
    let va=a[mSort]??0, vb=b[mSort]??0;
    if(typeof va==="string"){va=va.toLowerCase();vb=vb.toLowerCase();}
    return mDir==="asc"?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0);
  });
  const cols = [["account","Account"],["amount","Amount"],["stage","Stage"],["closeDate","Close Date"],["fy","FY"],["dcRegion","DC Region"],["cxoneInstance","Cluster"],["forecast","Forecast"],["territory","Territory"],["owner","Owner"]];
  return <>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,animation:"ovIn .2s"}}/>
    <div style={{position:"fixed",top:"5%",left:"50%",transform:"translateX(-50%)",width:"min(96vw,1200px)",maxHeight:"88vh",background:"#ffffff",border:"1px solid var(--bdr)",borderRadius:14,zIndex:201,display:"flex",flexDirection:"column",animation:"modalIn .22s ease"}}>
      <div style={{padding:"16px 22px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"#0f172a"}}>{modal.title}</div>
          <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{modal.subtitle} · click column header to sort</div>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--bdr)",borderRadius:7,padding:"5px 11px",color:"#64748b",cursor:"pointer",fontSize:14}}>✕</button>
      </div>
      <div style={{overflowY:"auto",flex:1,overflowX:"auto"}}>
        <table>
          <thead style={{position:"sticky",top:0,background:"var(--bg)",zIndex:1}}>
            <tr>
              {cols.map(([col,lbl])=>(
                <th key={col} onClick={()=>mHs(col)} style={{color:mSort===col?"var(--teal)":"var(--sub)"}}>
                  {lbl}{arrow(col)}
                </th>
              ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mDeals.map(o=>{
              const st=statusOf(o);
              return <tr key={o.id} className="hover-row" onClick={()=>onDeal(o)}>
                <td style={{fontWeight:600,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.account}</td>
                <td className="mono" style={{color:o.amount>0?"#2563eb":"#64748b",fontWeight:600}}>{fmt(o.amount)}{o.currency&&o.currency!=="USD"?<span style={{fontSize:9,color:"#64748b",marginLeft:3}}>{o.currency}</span>:""}</td>
                <td style={{fontSize:11,color:"#64748b",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.stage}</td>
                <td className="mono" style={{fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>{o.closeDate}</td>
                <td className="mono" style={{fontSize:10,color:"#64748b"}}>{o.fy?`FY${o.fy} Q${o.fq}`:""}</td>
                <td>{o.dcRegion?<span className="chip" style={{color:DC_COLORS[o.dcRegion]||"#64748b",fontSize:9}} title={o.dcSource==="inferred"?`Inferred: ${o.territory}`:o.cxoneInstance}>{o.dcRegion}{o.dcSource==="inferred"&&<span style={{fontSize:7,opacity:.7}}> ~</span>}</span>:<span style={{color:"#64748b"}}>—</span>}</td>
                <td className="mono" style={{fontSize:10,color:"#2563eb"}}>{o.cxoneInstance||"—"}</td>
                <td><span className="chip" style={{color:FC[o.forecast]||"#64748b",fontSize:9}}>{o.forecast||"—"}</span></td>
                <td style={{fontSize:11,color:"#64748b",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.territory||"—"}</td>
                <td style={{fontSize:11,color:"#64748b"}}>{o.owner}</td>
                <td><span className="chip" style={{color:SC[st],fontSize:9}}>{st}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 22px",borderTop:"1px solid var(--bdr)",fontSize:10,color:"#64748b"}}>{modal.deals.length} deals · sorted by {mSort} {mDir} · click any row for full detail</div>
    </div>
  </>;
}

// ── Deal Detail Drawer ────────────────────────────────────────────────────────
function Drawer({deal, onClose, onBack}) {
  useEffect(()=>{
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[onClose]);
  if(!deal) return null;
  const st = statusOf(deal);
  const dc = deal.dcRegion;
  const rows = [
    ["Opportunity",     <span style={{fontSize:11,lineHeight:1.4}}>{deal.name}</span>],
    ["Account",         deal.account],
    ["Stage",           deal.stage],
    ["Status",          <span className="chip" style={{color:SC[st]}}>{st}</span>],
    ["DC Region",       dc?<span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                          <span style={{background:DC_COLORS[dc],color:"#f8fafc",fontWeight:800,fontSize:10,padding:"2px 9px",borderRadius:4}}>{dc}</span>
                          <span style={{fontSize:11,color:"var(--sub)"}}>{DC_LABEL[dc]}</span>
                        </span>:"—"],
    ["CXone Cluster",   deal.cxoneInstance?<span className="mono" style={{color:"var(--teal)",fontWeight:700}}>{deal.cxoneInstance}</span>:"—"],
    ["Line Item Amt",   <span className="mono" style={{color:"#2563eb",fontWeight:700,fontSize:15}}>{fmt(deal.amount)}{deal.currency!=="USD"?<span style={{fontSize:10,color:"var(--sub)",marginLeft:4}}>{deal.currency}</span>:""}</span>],
    ["Opp Total Amt",   <span className="mono" style={{color:"var(--sub)"}}>{fmt(deal.oppAmount)}</span>],
    ["Product / SKU",   <span style={{fontSize:11,color:"var(--sub)",lineHeight:1.5}}>{deal.product||"—"}</span>],
    ["Forecast",        <span className="chip" style={{color:FC[deal.forecast]||"#64748b"}}>{deal.forecast||"—"}</span>],
    ["Close Date",      <span className="mono">{deal.closeDate}</span>],
    ["Fiscal",          `FY${deal.fy} · Q${deal.fq}`],
    ["Contract Type",   deal.contractType||"—"],
    ["Sales Region",    deal.region?<span style={{display:"inline-flex",alignItems:"center",gap:6}}><span>{deal.region}</span>{deal.regionSource==="inferred"&&<span style={{fontSize:9,color:"var(--amb)",background:"rgba(245,158,11,.1)",borderRadius:4,padding:"1px 5px",border:"1px solid rgba(245,158,11,.25)"}}>~ inferred from territory</span>}</span>:"—"],
    ["Territory",       deal.territory||"—"],
    ["Industry",        deal.industry||"—"],
    ["Owner",           deal.owner],
    ["Main Incumbent",  deal.mainIncumbent||"—"],
    ["Prev. Provider",  deal.currentProvider||"—"],
    ["Probability",     deal.probability>0?<span className="mono" style={{color:deal.probability>=75?"#059669":deal.probability>=25?"#d97706":"#dc2626"}}>{deal.probability}%</span>:"—"],
    ["Next Step",       deal.nextStep?<span style={{fontSize:11,lineHeight:1.5}}>{deal.nextStep}</span>:<span style={{color:"var(--mut)"}}>—</span>],
    ...(deal._lostData ? [
      ["Lost Reason",   deal._lostData.cat?<span className="chip" style={{color:"#f43f5e",fontSize:10}}>{deal._lostData.cat}</span>:<span style={{color:"var(--mut)"}}>—</span>],
      ["Competitor",    deal._lostData.competitor?<span style={{fontWeight:600,color:"var(--txt)"}}>{deal._lostData.competitor}</span>:<span style={{color:"var(--mut)"}}>—</span>],
      ["Notes",         deal._lostData.notes&&deal._lostData.notes.trim()&&deal._lostData.notes!=="."
                          ?<span style={{fontSize:11,lineHeight:1.6,color:"var(--txt)",display:"block",maxWidth:340}}>{deal._lostData.notes}</span>
                          :<span style={{color:"var(--mut)"}}>—</span>],
    ] : []),
    ["SF Opp ID",       <span className="mono" style={{fontSize:9,color:"var(--mut)",wordBreak:"break-all"}}>{deal.id}</span>],
  ];
  return <>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:300,animation:"ovIn .2s"}}/>
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:480,background:"var(--sur)",borderLeft:"1px solid var(--bdr)",zIndex:301,display:"flex",flexDirection:"column",animation:"slideIn .22s cubic-bezier(.22,.68,0,1.1)"}}>
      <div style={{padding:"16px 22px",borderBottom:"1px solid var(--bdr)",background:"linear-gradient(135deg,rgba(37,99,235,.06),transparent 60%)",flexShrink:0}}>
        {onBack&&<button onClick={onBack} style={{background:"transparent",border:"1px solid var(--bdr)",borderRadius:6,padding:"3px 10px",color:"var(--sub)",fontSize:10,fontWeight:600,cursor:"pointer",marginBottom:10,fontFamily:"'Outfit',sans-serif"}}>← Back to list</button>}
        <div style={{fontWeight:800,fontSize:14,color:"var(--txt)",lineHeight:1.3,marginBottom:14,maxWidth:400}}>{deal.name.length>80?deal.name.slice(0,80)+"…":deal.name}</div>
        <div style={{display:"flex",gap:10}}>
          {[{l:"LINE ITEM AMT",v:fmt(deal.amount),c:"#2563eb"},{l:"CLOSE DATE",v:deal.closeDate,c:"var(--txt)"},{l:"FY / Q",v:`FY${deal.fy} Q${deal.fq}`,c:"var(--sub)"}].map((k,i)=>(
            <div key={i} style={{flex:1,background:"var(--card)",borderRadius:8,padding:"9px 12px",border:"1px solid var(--bdr)"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"var(--mut)",marginBottom:5}}>{k.l}</div>
              <div className="mono" style={{fontWeight:700,fontSize:13,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"4px 22px 16px"}}>
        {rows.map(([label,val],i)=>(
          <div key={i} className="drawer-row">
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".4px",color:"var(--sub)",textTransform:"uppercase",width:112,flexShrink:0,paddingTop:1}}>{label}</div>
            <div style={{fontSize:12,color:"var(--txt)",flex:1}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 22px",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:"var(--mut)"}}>Source: SF CXone · OpportunityLineItem</span>
        <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--bdr)",borderRadius:6,padding:"4px 12px",color:"var(--sub)",cursor:"pointer",fontSize:11,fontFamily:"'Outfit',sans-serif"}}>Close</button>
      </div>
    </div>
  </>;
}

// ── TENANT DETAIL DRAWER ──────────────────────────────────────────────────────
function TenantDrawer({tenant, onClose}) {
  useEffect(()=>{ const h=e=>{if(e.key==="Escape")onClose();}; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[onClose]);
  if(!tenant) return null;
  const SC = {Completed:"#059669","In Progress":"#d97706","Not Started":"#64748b","In POC":"#7c3aed"};
  const sc = SC[tenant.status]||"#64748b";
  const sfSearch = `https://nice.lightning.force.com/lightning/r/Account/search?term=${encodeURIComponent(tenant.customer)}`;
  return <>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:300,animation:"ovIn .2s"}}/>
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:460,background:"var(--sur)",borderLeft:"1px solid var(--bdr)",zIndex:301,display:"flex",flexDirection:"column",animation:"slideIn .22s cubic-bezier(.22,.68,0,1.1)"}}>
      <div style={{padding:"18px 22px",borderBottom:"1px solid var(--bdr)",background:`linear-gradient(135deg,rgba(37,99,235,.06),transparent 60%)`,flexShrink:0}}>
        <div style={{fontWeight:800,fontSize:15,color:"var(--txt)",marginBottom:14}}>{tenant.customer}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {l:"STATUS",v:tenant.status,c:sc},
            {l:"DC REGION",v:tenant.dcRegion||"—",c:"var(--teal)"},
            {l:"BOOKING Q",v:tenant.bookingQ||"—",c:"var(--txt)"},
          ].map((k,i)=>(
            <div key={i} style={{flex:"1 1 100px",background:"var(--card)",borderRadius:8,padding:"9px 12px",border:"1px solid var(--bdr)"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"var(--mut)",marginBottom:5}}>{k.l}</div>
              <div style={{fontWeight:700,fontSize:13,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"4px 22px 16px"}}>
        {[
          ["Source System",  tenant.source||"—"],
          ["SKU / Plan",     tenant.sku||"—"],
          ["Storage",        tenant.storageTB!=null?`${tenant.storageTB} TB`:"—"],
          ["Calls Migrated", tenant.calls?(tenant.calls/1e6).toFixed(2)+"M calls":"—"],
          ["Calls Pending",  tenant.pendingCalls?(tenant.pendingCalls/1e6).toFixed(2)+"M calls":"—"],
          ["Go Live",        tenant.goLive||"—"],
          ["Release",        tenant.release||"—"],
        ].map(([label,val],i)=>(
          <div key={i} className="drawer-row">
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".4px",color:"var(--sub)",textTransform:"uppercase",width:120,flexShrink:0,paddingTop:1}}>{label}</div>
            <div style={{fontSize:12,color:"var(--txt)",flex:1}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 22px",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <span style={{fontSize:10,color:"var(--mut)"}}>Source: Confluence MCR · Hybrid-Recording Tenants</span>
        <div style={{display:"flex",gap:8}}>
          <a href={`https://nice-ce-cxone-prod.atlassian.net/wiki/spaces/MCR/pages/1677295668`} target="_blank" rel="noreferrer" style={{background:"transparent",border:"1px solid var(--bdr)",borderRadius:6,padding:"4px 12px",color:"var(--teal)",cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"'Outfit',sans-serif",textDecoration:"none"}}>↗ Confluence</a>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--bdr)",borderRadius:6,padding:"4px 12px",color:"var(--sub)",cursor:"pointer",fontSize:11,fontFamily:"'Outfit',sans-serif"}}>Close</button>
        </div>
      </div>
    </div>
  </>;
}


// ── Lost deal data (static — sourced from SF, see sync task) ─────────────────
const LOST_DATA = {
    "006Hu00001XgpR6IAJ": {cat:"Competitor / Price", competitor:"Avaya", detail:"they didn't", notes:"SVL confirmed that the commercials they provided were not competitive to the winning bid. Disruptive bid vs Salesforce Service Cloud Voice and Amazon Connect"},
    "006Ui00000xaWNaIAM": {cat:"Duplicate / Admin", competitor:"Genesys Cloud", detail:"NA DUPLICATE", notes:"NA Duplicate"},
    "006Ui00002ALrwzIAD": {cat:"Stayed with Vendor", competitor:"Genesys Cloud", detail:"Financial Decision", notes:"Decision to stay on prem engage to get them to the bcbs instance of Genesys"},
    "006Ui00001pOoU3IAK": {cat:"Duplicate / Admin", competitor:"", detail:"they are cloud based already", notes:"Duplicate quote and opp"},
    "006Ui00001WHPYgIAP": {cat:"No Decision", competitor:"Genesys Cloud", detail:"Customer is taking long to conclude on the recording migration approach", notes:"Customer is taking long to conclude on the recording migration approach, so there is no decision yet on this."},
    "006Ui00000WL8kwIAD": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Ui00001C0IDdIAN": {cat:"Competitor / Price", competitor:"Talkdesk", detail:"", notes:""},
    "006Ui00001b73rNIAQ": {cat:"Duplicate / Admin", competitor:"Genesys Cloud", detail:"Couldn't change internal mindset", notes:"duplicate"},
    "006Ui00001kTCsPIAW": {cat:"No Decision", competitor:"Avaya", detail:"INDICATIVE PRICING THAT WAS REQUESTED BY THE PARTNER FOR THE CUSTOMER.", notes:"INDICATIVE PRICING THAT WAS REQUESTED BY THE PARTNER FOR THE CUSTOMER."},
    "006Ui00001RzwNDIAZ": {cat:"Duplicate / Admin", competitor:"", detail:"created in another opp", notes:"created in another opp"},
    "006Hu00001V2T24IAF": {cat:"Project Canceled", competitor:"Genesys Cloud", detail:"Project cancelled", notes:"Project cancelled"},
    "006Ui00001GQ7k6IAD": {cat:"No Decision", competitor:"Genesys Cloud", detail:"Financial Decision", notes:"Customer expected to assign opex budget starting 2026 and restrictions where applied"},
    "006Ui00001EOzszIAD": {cat:"Project Canceled", competitor:"Avaya", detail:".", notes:"."},
    "006Ui00001palydIAA": {cat:"Stayed with Vendor", competitor:"Avaya", detail:"Timing. Bank acquisition is delaying timing", notes:"They are going to do an RFP for the total solution rather than just recording."},
    "006Ui00000UKDJBIA5": {cat:"No Decision", competitor:"", detail:"Couldn't change internal mindset", notes:"no project"},
    "006Ui00001oCRLhIAO": {cat:"No Decision", competitor:"", detail:"na", notes:"Closing DHU 5 year plan with their leadership changes."},
    "006Ui00000GdUgAIAV": {cat:"Competitor / Price", competitor:"Amazon Connect", detail:"AWS Connect de facto forward strategy at Sun Life (parent company of DentaQuest)", notes:"AWS Connect de facto go forward strategy at DentaQuest with direction from parent company Sun Life who is onboarded and using AWS Connect."},
    "006Ui00001Q6YKVIA3": {cat:"Project Canceled", competitor:"Clarabridge, Inc.", detail:".", notes:"."},
    "006Ui00001nEZNlIAO": {cat:"No Decision", competitor:"", detail:"Couldn't change internal mindset", notes:"No movement"},
    "006Ui00001cSRoUIAW": {cat:"Not Logged", competitor:"", detail:"", notes:"There was a potential for the client to move to cloud in 2026"},
    "006Ui00000FpnkPIAR": {cat:"Competitor / Price", competitor:"Five9", detail:"", notes:""},
    "006Ui00001qmw01IAA": {cat:"Competitor / Price", competitor:"Genesys Cloud", detail:"NiCE was not shortlisted during the RFI process due to heritage concerns.", notes:"NiCE was not shortlisted during the RFI process due to heritage concerns."},
    "006Ui00001Ox8CxIAJ": {cat:"No Decision", competitor:"", detail:"Couldn't change internal mindset", notes:"The partner required was BT and they marked up the bid considerably which also hurt the funding of the project."},
    "006Ui00001AxAGRIA3": {cat:"Feature / Tech Gap", competitor:"Amazon Connect", detail:"They are going to move to Engage Cloud Recording due to connectivity issues", notes:"Connectivity Issues did not meet Truist Requirements"},
    "006Ui00001f4HyDIAU": {cat:"Feature / Tech Gap", competitor:"RingCentral", detail:"Couldn't change internal mindset", notes:"This opportunity's technical configuration is not going to work for NJM for their Migration."},
    "006Ui00001MZD5FIAX": {cat:"No Decision", competitor:"Genesys Cloud", detail:"Couldn't change internal mindset", notes:"DTGB proposal was not accepted by Caixa."},
    "006Ui00001RdtkbIAB": {cat:"No Decision", competitor:"", detail:"they didnt", notes:"n/a"},
    "006Ui00000sV8tRIAS": {cat:"Competitor / Price", competitor:"Google LLC", detail:"The business has contracts with the hyperscalers and is choosing only to work with them.", notes:"The Genesys decision five years ago was made entirely by IT. This time the business is choosing only to work with hyperscalers."},
    "006Ui00001eEIdRIAW": {cat:"No Decision", competitor:"", detail:"Financial Decision", notes:"no longer needed"},
    "006Ui00000KSez6IAD": {cat:"Competitor / Price", competitor:"Genesys Cloud", detail:"", notes:""},
    "006Ui00001G5KSbIAN": {cat:"Duplicate / Admin", competitor:"Verint", detail:"duplicate", notes:"Duplicate Opp"},
    "006Ui00000RDQBdIAP": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Ui00001D0oMbIAJ": {cat:"Competitor / Price", competitor:"RingCentral", detail:"", notes:""},
    "006Ui00000XGALNIA5": {cat:"Duplicate / Admin", competitor:"", detail:"Couldn't change internal mindset", notes:"This is a duplicate opportunity. This solution was included and closed on a subsequent opportunity."},
    "006Ui00000KdcZrIAJ": {cat:"Project Canceled", competitor:"", detail:"Financial Decision", notes:"No Budget"},
    "006Ui00001FQow5IAD": {cat:"Stayed with Vendor", competitor:"", detail:"no longer required", notes:"No longer required"},
    "006Ui00001Px9zdIAB": {cat:"Competitor / Price", competitor:"Avaya", detail:"", notes:""},
    "006Ui00000uwDhNIAU": {cat:"No Decision", competitor:"Cisco", detail:"Lost funding.", notes:"Federal spending was cut and org lost funding for this project."},
    "006Ui00000FVOF8IAP": {cat:"Competitor / Price", competitor:"Genesys Cloud", detail:"They will move to Genesys Cloud", notes:"ELT would not allow offering NiCE PS pricing. A subsidiary had already licensed with Genesys in early 2024."},
    "006Ui00001DMjMfIAL": {cat:"Moved Segment", competitor:"", detail:"Duplicate OPP", notes:"duplicate of another opp"},
    "006Ui00001NQuSDIA1": {cat:"Competitor / Price", competitor:"Genesys Cloud", detail:"This question is not applicable here", notes:"Current goto Government CCAAS tech in Australia is Genesys. We were late to the party with no engagement before RFP probity rules."},
    "006Ui00000mUPJtIAO": {cat:"No Decision", competitor:"Genesys Cloud", detail:"duplicate", notes:"duplicate opp-placeholder"},
    "006Ui00000bOHlZIAW": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Ui00000yagz3IAA": {cat:"Feature / Tech Gap", competitor:"Genesys Cloud", detail:"Couldn't change internal mindset", notes:"Lost to Toku due to data sovereignty. The insurers require local data residency."},
    "006Hu00001XfTBJIA3": {cat:"Feature / Tech Gap", competitor:"Calabrio", detail:"Couldn't change internal mindset", notes:"They stayed on version 6.15 because they are huge engage search users. That functionality went away with version 7.0+ so they looked for other vendors."},
    "006Ui00001AbMZaIAN": {cat:"Duplicate / Admin", competitor:"", detail:"Couldn't change internal mindset", notes:"Duplicate opportunity - deal NOT lost. New opp: 336087"},
    "0063n000011zYNjAAM": {cat:"No Decision", competitor:"Cisco", detail:"Couldn't change internal mindset", notes:"duplicate opportunity - deal NOT lost. New OPP: 336087"},
    "006Ui00000rHdhZIAS": {cat:"Duplicate / Admin", competitor:"", detail:"This omitted opp is a duplicate opp of 322438 which has already been closed-won", notes:"This omitted opp is a duplicate opp of 322438 which has already been closed-won"},
    "0063n000010nhUSAAY": {cat:"Competitor / Price", competitor:"Amazon Connect", detail:"They will be going to a cloud solution, Either AWS or Genesys", notes:"They are engineers doing the analysis and engineering was important to them"},
    "006Hu00001XhKbwIAF": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Ui00000MRi0JIAT": {cat:"Project Canceled", competitor:"", detail:"Financial Decision", notes:"No Budget"},
    "006Ui00001AasI9IAJ": {cat:"Duplicate / Admin", competitor:"", detail:"duplicate", notes:"Duplicate"},
    "006Hu00001XhJJ1IAN": {cat:"Competitor / Price", competitor:"Microsoft", detail:"Moved to cloud", notes:"Irwin Mitchell decided to replace their managed service with Natilik to go to Microsoft for all services."},
    "006Hu00001Xh6uZIAR": {cat:"Competitor / Price", competitor:"Microsoft", detail:"Moved to cloud", notes:"Duplicate to Irwin Mitchell opportunity"},
    "006Ui00001BQn9VIAT": {cat:"Competitor / Price", competitor:"", detail:"N/A", notes:"Partner SVL positioned their own storage solution at a lower price to the customer"},
    "006Ui00000lWknqIAC": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Hu00001XhOIhIAN": {cat:"Competitor / Price", competitor:"Genesys Cloud", detail:"", notes:"Genesys. Ultimately relationship/SOI - The partner told me that an alternate partner that sold Genesys was best friends with the Executive Decision Maker."},
    "006Hu00001V3mneIAB": {cat:"Competitor / Price", competitor:"Genesys Cloud", detail:"Genesys purecloud - integration into SAP on prem", notes:"Genesys purecloud - integration into SAP on prem"},
    "006Ui00000xjkEPIAY": {cat:"Project Canceled", competitor:"", detail:"The move didn't make business sense", notes:"The move didn't make business sense"},
    "006Ui00000wTsLjIAK": {cat:"Duplicate / Admin", competitor:"", detail:"duplicate", notes:"Duplicate"},
    "006Ui00000xwap7IAA": {cat:"Duplicate / Admin", competitor:"", detail:"duplicate", notes:"Duplicate"},
    "006Ui00000vLBHNIA4": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Ui00000djoLZIAY": {cat:"Competitor / Price", competitor:"Cisco", detail:"", notes:""},
    "006Ui00000HmaCIIAZ": {cat:"Competitor / Price", competitor:"Other", detail:"C1 convinced IT to migrate to C1 cloud to host alongside Avaya ACD", notes:"EOL for current version of Engage, migrated/upgrade to cloud"},
    "006Ui00000l0s5bIAA": {cat:"Moved Segment", competitor:"Avaya", detail:"Closed Duplicate", notes:"Closed Duplicate"},
    "006Hu00001V3vObIAJ": {cat:"No Decision", competitor:"Genesys Cloud", detail:"duplicate", notes:"duplicate"},
    "006Ui00000WxFlNIAV": {cat:"Duplicate / Admin", competitor:"Genesys Cloud", detail:"Duplicate opportunity", notes:"Duplicate opportunity"},
    "006Ui00000Gwsi1IAB": {cat:"Stayed with Vendor", competitor:"Cisco", detail:"Couldn't change internal mindset", notes:"Management decided to stay on prem and upgrade Engage & QM"},
    "006Ui00000RoUMjIAN": {cat:"Not Logged", competitor:"", detail:"", notes:""},
    "006Ui00000GI5GAIA1": {cat:"Duplicate / Admin", competitor:"Cisco", detail:"They are exploring CXone ACD", notes:"Added to CXone"},
};
const ADMIN_CATS = new Set(["Duplicate / Admin","Moved Segment"]);

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [section,  setSection]  = useState("intelligence");
  const [tenantDetail, setTenantDetail] = useState(null);
  const [modal,    setModal]    = useState(null);
  const [drawer,   setDrawer]   = useState(null);
  const [drawerFromModal, setDFM] = useState(false);

  // Business filters
  const [fPeriod,   setFPeriod]   = useState("All");
  const [fStatus,   setFStatus]   = useState("All");
  const [fForecast, setFForecast] = useState("All");
  const [fTerritory,setFTerr]     = useState("All");
  const [fDC,       setFDC]       = useState("All");
  const [fRegion,   setFRegion]   = useState("All");
  const [fIndustry, setFIndustry] = useState("All");
  const [fMinAmt,   setFMinAmt]   = useState(0);
  const [fSearch,   setFSearch]   = useState("");
  const [tableTab,  setTableTab]  = useState("All");
  const [sortCol,   setSortCol]   = useState("closeDate");
  const [sortDir,   setSortDir]   = useState("desc");

  // Filter panel open/closed states
  const [filterOpen,    setFilterOpen]    = useState(true);
  const [pfFilterOpen,  setPfFilterOpen]  = useState(true);
  const [engFilterOpen, setEngFilterOpen] = useState(true);
  const [jFilterOpen,   setJFilterOpen]   = useState(true);

  // ── DATA SYNC TIMESTAMP (updated by scheduled task each weekday 8am) ────
  const SYNC_DATE = '2026-07-01';
  const syncLabel = `${SYNC_DATE} · Auto-refreshes weekdays 8am`;

  // ── SYNC STATUS & HISTORY ────────────────────────────────────────────────
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [showChangelog,   setShowChangelog]   = useState(false);
  const SYNC_SOURCES = [
    { label: 'SF Opps',   count: RAW_OPPS.length,            detail: `${RAW_OPPS.filter(o=>o.isWon).length} won · ${RAW_OPPS.filter(o=>o.isClosed&&!o.isWon).length} lost · ${RAW_OPPS.filter(o=>!o.isClosed).length} open`, date: SYNC_DATE },
    { label: 'Pipeline',  count: PIPELINE_LINE_ITEMS.length,  detail: `${[...new Set(PIPELINE_LINE_ITEMS.map(i=>i.oppId))].length} opps`,  date: SYNC_DATE },
    { label: 'Jira',      count: JIRA_EPICS.length,           detail: `epics`,                                                              date: SYNC_DATE },
    { label: 'Delivery',  count: TENANTS.length,              detail: `${TENANTS.filter(t=>t.status==='Completed').length} done · ${TENANTS.filter(t=>t.status==='In Progress').length} active`, date: SYNC_DATE },
  ];

  // Effective data sources
  const LIVE_OPPS  = RAW_OPPS;
  const LIVE_EPICS = JIRA_EPICS;

  // Pipeline filters
  const [pfSearch,  setPfSearch]  = useState("");
  const [pfFY,      setPfFY]      = useState("All");
  const [pfForecast,setPfForecast]= useState("All");
  const [pfDC,      setPfDC]      = useState("All");
  const [pfRegion,  setPfRegion]  = useState("All");
  const [pfCurrency,setPfCurrency]= useState("All");
  const [pfSKU,     setPfSKU]     = useState("All");
  const [pfStage,   setPfStage]   = useState("All");
  const [pfTerritory,setPfTerritory]=useState("All");
  const [pfMinAmt,  setPfMinAmt]  = useState(0);

  // Engineering filters
  const [engTab,    setEngTab]    = useState("All");
  const [engSearch, setEngSearch] = useState("");
  const [engDcFilt, setEngDcFilt] = useState("All");
  const [engSrcFilt,setEngSrcFilt]= useState("All");
  const [engRelFilt,setEngRelFilt]= useState("All");
  const [jSearch,   setJSearch]   = useState("");
  const [jRelease,  setJRelease]  = useState("All");
  const [jStatus,   setJStatus]   = useState("All");
  const [jAssignee, setJAssignee] = useState("All");
  const [jFeature,  setJFeature]  = useState("All");
  const [pSort,     setPSort]     = useState("closeDate");
  const [pDir,      setPDir]      = useState("asc");
  const [engSort,   setEngSort]   = useState("bookingQ");
  const [engSortDir,setEngSortDir]= useState("asc");
  const [jiraSort,  setJiraSort]  = useState("status");
  const [jiraSortDir,setJiraSortDir]=useState("asc");
  const [showJira,  setShowJira]  = useState(true);

  const openModal  = useCallback((title,subtitle,deals)=>{ setDrawer(null); setDFM(false); setModal({title,subtitle,deals}); },[]);
  const openDrawer = useCallback((deal,fromModal=false)=>{ setDrawer(deal); setDFM(fromModal); },[]);
  const closeDrawer= useCallback(()=>{ setDrawer(null); setDFM(false); },[]);
  const closeModal = useCallback(()=>{ setModal(null); setDrawer(null); setDFM(false); },[]);
  const backToModal= useCallback(()=>{ setDrawer(null); setDFM(false); },[]);

  const territories= useMemo(()=>[...new Set(RAW_OPPS.map(o=>o.territory).filter(Boolean))].sort(),[]);
  const regionOpts = useMemo(()=>[...new Set(RAW_OPPS.map(o=>o.region).filter(Boolean))].sort(),[]);
  const industryOpts= useMemo(()=>[...new Set(RAW_OPPS.map(o=>(o.industry||"").replace("​","").replace("\u200b","")).filter(Boolean))].sort(),[]);

  // ── FILTERED BASE — computed first, everything below derives from this ──────
  // All KPI cards, charts, insight cards, and the table all use `filtered`
  // so every filter (Period, Status, Forecast, DC Region, Region, Territory,
  // Industry, Min $, Search) applies to the entire overview section at once.
  const filtered = useMemo(()=>LIVE_OPPS.filter(o=>{
    if(fPeriod!=="All"){
      if(fPeriod==="≤2023"){ if(o.fy>2023) return false; }
      else { if(o.fy!==+fPeriod) return false; }
    }
    if(fStatus!=="All"){
      if(fStatus==="Won"  && !o.isWon)                  return false;
      if(fStatus==="Lost" && !(o.isClosed && !o.isWon)) return false;
      if(fStatus==="Open" && o.isClosed)                return false;
    }
    if(fForecast!=="All" && o.forecast!==fForecast)   return false;
    if(fTerritory!=="All"&& o.territory!==fTerritory) return false;
    if(fDC!=="All"       && o.dcRegion!==fDC)         return false;
    if(fRegion!=="All"   && o.region!==fRegion)       return false;
    if(fIndustry!=="All" && (o.industry||"").replace("​","").replace("\u200b","")!==fIndustry) return false;
    if(fMinAmt>0 && o.amount<fMinAmt) return false;
    if(fSearch.trim()){
      const q=fSearch.trim().toLowerCase();
      if(!o.account.toLowerCase().includes(q)&&!o.name.toLowerCase().includes(q)&&!(o.owner||"").toLowerCase().includes(q)) return false;
    }
    return true;
  }),[fPeriod,fStatus,fForecast,fTerritory,fDC,fRegion,fIndustry,fMinAmt,fSearch]);

  const hasF = fPeriod!=="All"||fStatus!=="All"||fForecast!=="All"||fTerritory!=="All"||fDC!=="All"||fRegion!=="All"||fIndustry!=="All"||fMinAmt>0||fSearch.trim()!=="";

  // ── KPI data — all from filtered ──────────────────────────────────────────
  // Real commercial wins: exclude $0/negative amendments and demo/test BUs
  // amount = recurring product ACV (1448-256x SKUs only)
  // amountServices = one-time migration services (610318-256x SKUs only)
  const wonOpps  = useMemo(()=>filtered.filter(o=>o.isWon && (o.amount>0||o.amountServices>0) && !/demo/i.test(o.account)), [filtered]);
  const allWonOpps = useMemo(()=>filtered.filter(o=>o.isWon),          [filtered]); // full list for table
  const openOpps = useMemo(()=>filtered.filter(o=>!o.isClosed),        [filtered]);
  const lostOpps = useMemo(()=>filtered.filter(o=>o.isClosed&&!o.isWon),[filtered]);
  // amtTotal: combined value of a deal (recurring + one-time services) — used for deal-level metrics
  // that should match the pre-split totals (FY WON, Avg Deal Size, YoY, etc.)
  const amtTotal = o => (o.amount||0) + (o.amountServices||0);
  const totalWon    = useMemo(()=>wonOpps.reduce((s,o)=>s+toUSD(o.amount,o.currency),0),             [wonOpps]);
  const totalWonACV = useMemo(()=>wonOpps.reduce((s,o)=>s+toUSD(acvNorm(o),o.currency),0),          [wonOpps]);
  const totalWonSvc = useMemo(()=>wonOpps.reduce((s,o)=>s+toUSD(o.amountServices||0,o.currency),0),  [wonOpps]);
  const totalWonCombined = useMemo(()=>wonOpps.reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0),     [wonOpps]);
  const openAmt  = useMemo(()=>openOpps.reduce((s,o)=>s+toUSD(o.amount,o.currency),0),   [openOpps]);
  const won25    = useMemo(()=>wonOpps.filter(o=>o.fy===2025).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0),[wonOpps]);
  const won24    = useMemo(()=>wonOpps.filter(o=>o.fy===2024).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0),[wonOpps]);
  const won26    = useMemo(()=>wonOpps.filter(o=>o.fy===2026).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0),[wonOpps]);
  const yoy      = won24>0?((won25-won24)/won24*100):0;
  const winRate  = useMemo(()=>{ const cl=filtered.filter(o=>o.isClosed); return cl.length?((allWonOpps.length/cl.length)*100).toFixed(0):0; },[filtered,allWonOpps]);
  const avgDeal      = useMemo(()=>wonOpps.length>0?totalWonCombined/wonOpps.length:0,[wonOpps,totalWonCombined]);
  const realLostOpps = useMemo(()=>lostOpps.filter(o=>{ const d=LOST_DATA[o.id]; return d?!ADMIN_CATS.has(d.cat):true; }),[lostOpps]);
  const realLostAmt  = useMemo(()=>realLostOpps.reduce((s,o)=>s+(amtTotal(o)>0?toUSD(amtTotal(o),o.currency):0),0),[realLostOpps]);

  const kpiCards = useMemo(()=>[
    { l:"RECURRING ACV", v:fmt(totalWonACV),
      s:(()=>{ const hasRec=wonOpps.filter(o=>o.amount>0).length; const multi=wonOpps.filter(o=>(TERM_MONTHS[o.id]||12)>12).length; return `${hasRec} of ${wonOpps.length} won deals have recurring · ${wonOpps.length-hasRec} are migration-only (no recurring SKU) · ${multi} normalised from multi-year TCV`; })(),
      a:"#059669",
      modal:{title:"Recurring Product ACV — Won Deals (Normalised)",subtitle:`ACV = TotalPrice ÷ term × 12 · multi-year contracts annualised · placeholder rates excluded · GBP×1.26 AUD×0.64 CAD×0.74`,deals:[...wonOpps].filter(o=>o.amount>0).sort((a,b)=>acvNorm(b)-acvNorm(a))} },
    { l:"RECURRING TCV", v:fmt(totalWon),
      s:(()=>{ const hasRec=wonOpps.filter(o=>o.amount>0).length; const both=wonOpps.filter(o=>o.amount>0&&o.amountServices>0).length; return `${hasRec} of ${wonOpps.length} won deals · raw contract value incl. multi-year terms · ${both} also have migration fees`; })(),
      a:"#10b981",
      modal:{title:"Recurring Product TCV — Won Deals",subtitle:`TCV = raw TotalPrice (1448-256x) · not normalised to annual · multi-year deals inflate this figure · GBP×1.26 AUD×0.64 CAD×0.74`,deals:[...wonOpps].filter(o=>o.amount>0).sort((a,b)=>b.amount-a.amount)} },
    { l:"ONE-TIME MIGRATION FEES", v:fmt(totalWonSvc),
      s:(()=>{ const hasSvc=wonOpps.filter(o=>o.amountServices>0).length; const both=wonOpps.filter(o=>o.amount>0&&o.amountServices>0).length; const svcOnly=hasSvc-both; return `${hasSvc} of ${wonOpps.length} won deals · ${svcOnly} migration-only (no recurring SKU) · ${both} also have recurring ACV`; })(),
      a:"#0891b2",
      modal:{title:"One-Time Migration Service Fees — Won Deals",subtitle:`One-time migration fees (610318-256x) · ${fmt(totalWonSvc)} ~USD · not recurring revenue`,deals:[...wonOpps].filter(o=>o.amountServices>0).sort((a,b)=>b.amountServices-a.amountServices)} },
    { l:"FY2025 WON",         v:fmt(won25),    s:(()=>{ const c=wonOpps.filter(o=>o.fy===2025).length; return `${c} of ${wonOpps.length} won deals · vs FY2024: ${fmt(won24)}`; })(), a:"#2563eb",
      modal:{title:"FY2025 Won Deals",subtitle:`${wonOpps.filter(o=>o.fy===2025).length} of ${wonOpps.length} won deals · ${fmt(won25)} ~USD equiv.`,deals:[...wonOpps].filter(o=>o.fy===2025).sort((a,b)=>b.amount-a.amount)} },
    { l:"FY2026 WON (YTD)",   v:fmt(won26),    s:(()=>{ const c=wonOpps.filter(o=>o.fy===2026).length; return `${c} of ${wonOpps.length} won deals · YTD`; })(), a:"#38bdf8",
      modal:{title:"FY2026 Won Deals (YTD)",subtitle:`YTD FY2026 · ${wonOpps.filter(o=>o.fy===2026).length} of ${wonOpps.length} won deals · ${fmt(won26)} ~USD equiv.`,deals:[...wonOpps].filter(o=>o.fy===2026).sort((a,b)=>b.amount-a.amount)} },
    { l:"YoY GROWTH",         v:`${yoy>=0?"+":""}${yoy.toFixed(0)}%`, s:"FY2025 vs FY2024 combined value", a:yoy>=0?"#059669":"#dc2626",
      modal:{title:"YoY Comparison",subtitle:"Won deals FY2024 vs FY2025",deals:[...wonOpps].filter(o=>o.fy===2024||o.fy===2025).sort((a,b)=>b.amount-a.amount)} },
    { l:"OPEN PIPELINE",      v:fmt(openAmt),  s:`${openOpps.length} open deals · not included in the ${wonOpps.length} won`, a:"#d97706",
      modal:{title:"Open Pipeline",subtitle:`${openOpps.length} open deals · ${fmt(openAmt)}`,deals:[...openOpps].sort((a,b)=>b.amount-a.amount)} },
    { l:"WIN RATE",           v:`${winRate}%`, s:(()=>{ return `${allWonOpps.length} SF won (${wonOpps.length} commercial) · ${openOpps.length} open · ${lostOpps.length} lost`; })(), a:"#7c3aed",
      modal:{title:"All Closed Deals",subtitle:"Won vs Lost",deals:[...filtered].filter(o=>o.isClosed).map(o=>({...o,_lostData:(!o.isWon&&LOST_DATA[o.id])||null})).sort((a,b)=>b.amount-a.amount)} },
    { l:"AVG DEAL SIZE",      v:fmt(avgDeal),  s:`across all ${wonOpps.length} won deals`, a:"#0ea5e9",
      modal:{title:"Commercial Won Deals — by Size",subtitle:`Avg ${fmt(avgDeal)} · sorted largest first`,deals:[...wonOpps].sort((a,b)=>b.amount-a.amount)} },
    { l:"LOST ACV",           v:fmt(realLostAmt), s:`${realLostOpps.length} real losses · separate from ${wonOpps.length} won deals · excl. admin/dupes`, a:"#f43f5e",
      modal:{title:"Closed-Lost Deals (Real Losses)",subtitle:`${realLostOpps.length} genuine losses · ${fmt(realLostAmt)} · excludes Duplicate/Admin & Moved Segment`,deals:[...realLostOpps].map(o=>({...o,_lostData:LOST_DATA[o.id]||null})).sort((a,b)=>b.amount-a.amount)} },
  ],[wonOpps,allWonOpps,openOpps,lostOpps,realLostOpps,realLostAmt,totalWon,totalWonACV,totalWonSvc,openAmt,won25,won24,won26,yoy,winRate,avgDeal,filtered]);

  // ── Pricing model confidence breakdown ────────────────────────────────────
  const pricingModelData = useMemo(()=>{
    const isP1000 = o => { const p=o.product||''; return p.includes('Per 1000')||p.includes('1000 Interactions'); };
    const isPerBU = o => { const p=o.product||''; return (p.includes('Per BU')||p.includes('per BU'))&&!isP1000(o); };
    const hasMigSvc = o => (o.product||'').includes('Migration Services');
    const perBUDeals      = wonOpps.filter(o => isPerBU(o));
    const hybridDeals     = wonOpps.filter(o => isP1000(o) && ((o.amountServices||0) > 0 || hasMigSvc(o)));
    const per1000Est      = wonOpps.filter(o => isP1000(o) && !((o.amountServices||0) > 0) && !hasMigSvc(o) && (o.amount||0) >= 1);
    const per1000Unknown  = wonOpps.filter(o => isP1000(o) && !((o.amountServices||0) > 0) && !hasMigSvc(o) && (o.amount||0) < 1);
    const svcOnlyDeals    = wonOpps.filter(o => !isPerBU(o) && !isP1000(o));
    const acv = arr => arr.reduce((s,o)=>s+toUSD(o.amount||0,o.currency),0);
    const svc = arr => arr.reduce((s,o)=>s+toUSD(o.amountServices||0,o.currency),0);
    return { perBUDeals, per1000Est, hybridDeals, svcOnlyDeals,
      acvBU: acv(perBUDeals), acvEst: acv(per1000Est), acvHyb: acv(hybridDeals),
      svcBU: svc(perBUDeals), hybridFees: svc(hybridDeals), svcOnlyFees: svc(svcOnlyDeals) };
  },[wonOpps]);

  // ── Chart data — all from filtered/wonOpps ────────────────────────────────
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const trendData = useMemo(()=>months.map((_,i)=>({
    m: months[i],
    "2024": wonOpps.filter(o=>o.fy===2024&&new Date(o.closeDate).getMonth()===i).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)||null,
    "2025": wonOpps.filter(o=>o.fy===2025&&new Date(o.closeDate).getMonth()===i).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)||null,
    "2026": wonOpps.filter(o=>o.fy===2026&&new Date(o.closeDate).getMonth()===i).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)||null,
  })),[wonOpps]);

  const yoyData = useMemo(()=>["Q1","Q2","Q3","Q4"].map((q,qi)=>({
    q,
    "FY2024": wonOpps.filter(o=>o.fy===2024&&o.fq===qi+1).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)||0,
    "FY2025": wonOpps.filter(o=>o.fy===2025&&o.fq===qi+1).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)||0,
    "FY2026": wonOpps.filter(o=>o.fy===2026&&o.fq===qi+1).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)||0,
  })),[wonOpps]);

  const openByForecast = useMemo(()=>["Commit","Most Likely","Best Case","Long Shot"].map(f=>({
    name:f, value:openOpps.filter(o=>o.forecast===f).reduce((s,o)=>s+toUSD(o.amount,o.currency),0),
    count:openOpps.filter(o=>o.forecast===f).length,
  })).filter(d=>d.value>0||d.count>0),[openOpps]);


  const lostReasonData = useMemo(()=>{
    const counts = {};
    lostOpps.forEach(o=>{
      const d = LOST_DATA[o.id];
      const r = d ? d.cat : (o.lostReason || 'Not Logged');
      counts[r] = (counts[r]||0)+1;
    });
    return Object.entries(counts).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[lostOpps]);

  const lostOppsByReason = useMemo(()=>{
    const byReason = {};
    lostOpps.forEach(o=>{
      const d = LOST_DATA[o.id];
      const r = d ? d.cat : (o.lostReason || 'Not Logged');
      if(!byReason[r]) byReason[r]=[];
      byReason[r].push({...o, _lostData: d||{}});
    });
    return byReason;
  },[lostOpps]);

  // Win rate by territory
  const winByTerritory = useMemo(()=>{
    const terrs = [...new Set(filtered.map(o=>o.territory).filter(Boolean))];
    return terrs.map(t=>{
      const tDeals = filtered.filter(o=>o.territory===t && o.isClosed);
      const won = tDeals.filter(o=>o.isWon).length;
      const total = tDeals.length;
      return {territory:t.replace(' Territory','').replace('Premier ',''), originalTerritory:t, won, lost:total-won, total, rate:total>0?Math.round(won/total*100):0, wonAmt:tDeals.filter(o=>o.isWon).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0)};
    }).filter(d=>d.total>=1).sort((a,b)=>b.wonAmt-a.wonAmt).slice(0,8);
  },[filtered]);

  // Business model mix (contract type grouping)
  const bizModelData = useMemo(()=>{
    const groups = { "New Logo":0, "Expansion/LOB":0, "Addendum":0, "Conversion":0, "Renewal":0, "Other":0 };
    wonOpps.forEach(o=>{
      const ct = o.contractType||"";
      if(ct.includes("New Logo")||ct.includes("New OCR")||ct==="New Customer") groups["New Logo"]++;
      else if(ct.includes("New LOB")||ct.includes("Expansions")||ct.includes("New BU")||ct.includes("Expansion")) groups["Expansion/LOB"]++;
      else if(ct.includes("Addendum")) groups["Addendum"]++;
      else if(ct.includes("conversion")||ct.includes("Conversion")||ct.includes("Cloud")) groups["Conversion"]++;
      else if(ct.includes("Renewal")||ct.includes("Maintenance")) groups["Renewal"]++;
      else groups["Other"]++;
    });
    return Object.entries(groups).filter(([,v])=>v>0).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[wonOpps]);

  // Where we win — legacy incumbent on won deals (mainIncumbent only, not currentProvider)
  const SKIP_INCUMBENTS = new Set(["none","no incumbent","unknown","not applicable / no decision","n/a","na",""]);
  const normalizeInc = inc => {
    if(!inc) return "";
    // Normalize NICE variants → NICE Legacy (internal migration, not a competitor win)
    if(/^nice/i.test(inc)) return "NICE Legacy";
    // Normalize Cisco variants → Cisco
    if(/^cisco/i.test(inc)) return "Cisco";
    // Normalize Genesys variants → Genesys
    if(/^genesys/i.test(inc)) return "Genesys";
    // Normalize Avaya variants → Avaya
    if(/^avaya/i.test(inc)) return "Avaya";
    return inc.replace(" Cloud","").replace(" Engage","").replace(" PureConnect","").replace(" CX","").trim();
  };
  const incumbentWinData = useMemo(()=>{
    const counts = {};
    wonOpps.forEach(o=>{
      // Use mainIncumbent (Current_Call_Center_Provider__c) ONLY — do NOT fall back to
      // currentProvider (Call_Center_Provider__c) because for Migrated Calls that field
      // records what CXone platform the customer runs on, not the legacy system being displaced.
      const mainRaw = (o.mainIncumbent||"").trim();
      const raw = !SKIP_INCUMBENTS.has(mainRaw.toLowerCase()) && mainRaw ? mainRaw : "";
      const key = raw ? normalizeInc(raw) : "Unknown / Not Set";
      if(!key) return;
      counts[key]=(counts[key]||0)+1;
    });
    return Object.entries(counts).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8);
  },[wonOpps]);

  // QoQ momentum: last 6 quarters of won ACV
  const qoqData = useMemo(()=>{
    const quarters = [];
    for(let yr=2024;yr<=2026;yr++) for(let q=1;q<=4;q++) {
      if(yr===2026&&q>2) break;
      const label=`FY${yr} Q${q}`;
      const won=wonOpps.filter(o=>o.fy===yr&&o.fq===q).reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0);
      const cnt=wonOpps.filter(o=>o.fy===yr&&o.fq===q).length;
      quarters.push({q:label,won,cnt});
    }
    return quarters;
  },[wonOpps]);

  // Pipeline staleness: days since close date passed without closing
  const TODAY_TS = new Date();
  const pipelineWithStaleness = useMemo(()=>openOpps.map(o=>{
    const cd = new Date(o.closeDate);
    const overdueDays = Math.floor((TODAY_TS - cd) / 86400000);
    const isStale = overdueDays > 30;
    const isAtRisk = overdueDays > 0 && overdueDays <= 30;
    return {...o, overdueDays, isStale, isAtRisk};
  }),[openOpps]);

  const statusData = useMemo(()=>[
    {name:"Won",  value:wonOpps.length,  acv:totalWon},
    {name:"Lost", value:lostOpps.length, acv:0},
    {name:"Open", value:openOpps.length, acv:openAmt},
  ],[wonOpps,lostOpps,openOpps,totalWon,openAmt]);

  const industryData = useMemo(()=>Object.entries(wonOpps.reduce((a,o)=>{
    const k=(o.industry||"—").replace("​","").replace("\u200b",""); a[k]=(a[k]||0)+amtTotal(o); return a;
  },{})).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value).slice(0,7),[wonOpps]);

  const topAccts = useMemo(()=>wonOpps.reduce((a,o)=>{
    const ex=a.find(x=>x.account===o.account);
    if(ex) ex.acv+=amtTotal(o); else a.push({account:o.account,acv:amtTotal(o)});
    return a;
  },[]).sort((a,b)=>b.acv-a.acv).slice(0,8),[wonOpps]);
  const maxAcct = useMemo(()=>topAccts[0]?.acv||1,[topAccts]);

  // ── Insight card data — all from filtered ─────────────────────────────────
  const dcFull = useMemo(()=>filtered.reduce((a,o)=>{
    const dc=o.dcRegion||"—";
    if(!a[dc]) a[dc]={won:0,open:0,lost:0,wonAmt:0,deals:[]};
    if(o.isWon){a[dc].won++;if(amtTotal(o)>0)a[dc].wonAmt+=toUSD(amtTotal(o),o.currency);}
    else if(!o.isClosed) a[dc].open++;
    else a[dc].lost++;
    a[dc].deals.push(o); return a;
  },{}),[filtered]);

  const regionFull = useMemo(()=>filtered.reduce((a,o)=>{
    const k=o.region||"—"; if(!a[k])a[k]={count:0,wonAmt:0,deals:[]};
    a[k].count++; if(o.isWon&&amtTotal(o)>0)a[k].wonAmt+=toUSD(amtTotal(o),o.currency); a[k].deals.push(o); return a;
  },{}),[filtered]);

  const instFull = useMemo(()=>filtered.filter(o=>o.cxoneInstance).reduce((a,o)=>{
    const k=o.cxoneInstance; if(!a[k])a[k]={count:0,wonAmt:0,deals:[]};
    a[k].count++; if(o.isWon&&amtTotal(o)>0)a[k].wonAmt+=toUSD(amtTotal(o),o.currency); a[k].deals.push(o); return a;
  },{}),[filtered]);

  const incFull = useMemo(()=>filtered.filter(o=>o.mainIncumbent).reduce((a,o)=>{
    const k=o.mainIncumbent; if(!a[k])a[k]={count:0,wonAmt:0,deals:[]};
    a[k].count++; if(o.isWon&&amtTotal(o)>0)a[k].wonAmt+=toUSD(amtTotal(o),o.currency); a[k].deals.push(o); return a;
  },{}),[filtered]);

  // ── Table ──────────────────────────────────────────────────────────────────
  const tabFiltered = useMemo(()=>{
    if(tableTab==="All")    return filtered;
    if(tableTab==="Won")    return filtered.filter(o=>o.isWon);
    if(tableTab==="Lost")   return filtered.filter(o=>o.isClosed && !o.isWon);
    if(tableTab==="Open")   return filtered.filter(o=>!o.isClosed);
    return filtered;
  },[filtered,tableTab]);

  const sorted = useMemo(()=>[...tabFiltered].sort((a,b)=>{
    let va=a[sortCol]??0,vb=b[sortCol]??0;
    if(typeof va==="string"){va=va.toLowerCase();vb=vb.toLowerCase();}
    return sortDir==="asc"?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0);
  }),[tabFiltered,sortCol,sortDir]);

  const hs = col=>{ if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortCol(col);setSortDir("desc");} };

  // ── Pipeline filtering ────────────────────────────────────────────────────
  const pfFiltered = useMemo(()=>PIPELINE_LINE_ITEMS.filter(r=>{
    if(pfSearch.trim()){
      const q=pfSearch.trim().toLowerCase();
      if(!r.account.toLowerCase().includes(q)&&!r.oppName.toLowerCase().includes(q)&&!r.sku.toLowerCase().includes(q)) return false;
    }
    if(pfFY!=="All"){
      if(pfFY==="FY2028+"){ if(r.fy<2028) return false; }
      else { if(r.fy!==+pfFY.replace("FY","")) return false; }
    }
    if(pfForecast!=="All" && r.forecast!==pfForecast)  return false;
    if(pfDC!=="All"       && r.dcRegion!==pfDC)         return false;
    if(pfRegion!=="All"   && r.region!==pfRegion)       return false;
    if(pfCurrency!=="All" && r.currency!==pfCurrency)   return false;
    if(pfSKU!=="All"      && r.sku!==pfSKU)             return false;
    if(pfStage!=="All"    && r.stage!==pfStage)         return false;
    if(pfTerritory!=="All"&& r.territory!==pfTerritory) return false;
    if(pfMinAmt>0         && r.totalPrice<pfMinAmt)     return false;
    return true;
  }),[pfSearch,pfFY,pfForecast,pfDC,pfRegion,pfCurrency,pfSKU,pfStage,pfTerritory,pfMinAmt]);

  const pfHasF = pfSearch.trim()!==""||pfFY!=="All"||pfForecast!=="All"||pfDC!=="All"||pfRegion!=="All"||pfCurrency!=="All"||pfSKU!=="All"||pfStage!=="All"||pfTerritory!=="All"||pfMinAmt>0;

  // Dropdown options for pipeline filters (derived from full dataset)
  const pfFYOpts       = [...new Set(PIPELINE_LINE_ITEMS.map(r=>`FY${r.fy}`))].sort();
  const pfForecastOpts = [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.forecast).filter(Boolean))];
  const pfDCOpts       = [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.dcRegion).filter(Boolean))].sort();
  const pfRegionOpts   = [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.region).filter(Boolean))].sort();
  const pfCurrencyOpts = [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.currency).filter(Boolean))].sort();
  const pfSKUOpts      = [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.sku).filter(Boolean))].sort();
  const pfStageOpts    = [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.stage).filter(Boolean))].sort();
  const pfTerritoryOpts= [...new Set(PIPELINE_LINE_ITEMS.map(r=>r.territory).filter(Boolean))].sort();

  // ── Jira epics filtering ──────────────────────────────────────────────────
  const jiraFiltered = useMemo(()=>LIVE_EPICS.filter(e=>{
    if(jSearch.trim() && !e.key.toLowerCase().includes(jSearch.toLowerCase()) && !e.title.toLowerCase().includes(jSearch.toLowerCase()) && !e.feature.toLowerCase().includes(jSearch.toLowerCase())) return false;
    if(jRelease!=="All" && e.release!==jRelease) return false;
    if(jStatus!=="All"  && e.status!==jStatus)   return false;
    if(jAssignee!=="All"&& e.assignee!==jAssignee)return false;
    if(jFeature!=="All" && e.feature!==jFeature)  return false;
    return true;
  }),[jSearch,jRelease,jStatus,jAssignee,jFeature]);
  const jHasF = jSearch.trim()!==""||jRelease!=="All"||jStatus!=="All"||jAssignee!=="All"||jFeature!=="All";
  const jReleaseOpts = [...new Set(LIVE_EPICS.map(e=>e.release))].sort();
  const jStatusOpts  = [...new Set(LIVE_EPICS.map(e=>e.status))];
  const jAssigneeOpts= [...new Set(LIVE_EPICS.map(e=>e.assignee))].filter(Boolean).sort();
  const jFeatureOpts = [...new Set(LIVE_EPICS.map(e=>e.feature))].sort();

  // ── Engineering ────────────────────────────────────────────────────────────
  // Booking → GoLive gap (completed customers)
  const bookingToLiveGap = useMemo(()=>{
    const bqMonth = (bq) => {
      if(!bq) return null;
      const [q, y] = bq.split(' ');
      const qNum = parseInt(q.replace('Q',''));
      const yr = parseInt(y);
      return new Date(yr, (qNum-1)*3, 1);
    };
    const goLiveMonth = (gl) => {
      if(!gl || gl==='—') return null;
      if(gl.includes('/')) {
        const [m,y] = gl.split('/');
        return new Date(parseInt(y), parseInt(m)-1, 1);
      }
      if(gl.startsWith('Q')) {
        const [q,y] = gl.split(' ');
        return new Date(parseInt(y), (parseInt(q.replace('Q',''))-1)*3, 1);
      }
      return null;
    };
    const gaps = TENANTS.filter(t=>t.status==='Completed' && t.bookingQ && t.goLive && t.goLive!=='—').map(t=>{
      const bDate = bqMonth(t.bookingQ);
      const gDate = goLiveMonth(t.goLive);
      if(!bDate || !gDate) return null;
      return Math.round((gDate - bDate) / (1000*60*60*24*30));
    }).filter(n=>n!==null && n>=0 && n<=36);
    if(!gaps.length) return null;
    const avg = Math.round(gaps.reduce((s,n)=>s+n,0)/gaps.length);
    const min = Math.min(...gaps);
    const max = Math.max(...gaps);
    return {avg, min, max, n:gaps.length};
  },[]);

  // Total call scope breakdown for KPIs
  const callsCompleted  = TENANTS.filter(t=>t.status==='Completed').reduce((s,t)=>s+(t.calls||0),0);
  const callsInProgress = TENANTS.filter(t=>t.status==='In Progress').reduce((s,t)=>s+(t.calls||0)+(t.pendingCalls||0),0);
  const callsNotStarted = TENANTS.filter(t=>t.status==='Not Started').reduce((s,t)=>s+(t.pendingCalls||0),0);
  const totalCallScope  = TENANTS.reduce((s,t)=>s+(t.calls||0)+(t.pendingCalls||0),0);
  const callScopePct    = totalCallScope>0?Math.round(callsCompleted/totalCallScope*100):0;
  const totalStorageTB  = TENANTS.filter(t=>t.storageTB).reduce((s,t)=>s+t.storageTB,0);
  const storageKnown    = TENANTS.filter(t=>t.storageTB).length;

  const bqToRel = (bq) => { if(!bq) return "—"; const [q,y]=bq.split(" "); const qn=q.replace("Q",""); return `${y.slice(2)}.${qn}`; };
  const engRows = TENANTS.map(t=>({...t, release: bqToRel(t.bookingQ)}));
  const engDcOpts  = [...new Set(TENANTS.map(t=>t.dcRegion).filter(Boolean))].sort();
  const engSrcOpts = [...new Set(TENANTS.map(t=>t.source).filter(Boolean))].sort();
  // Epic health per release
  const epicHealthByRelease = useMemo(()=>{
    const order = ["25.4","26.1","26.2","26.3","26.4","27.1","27.2"];
    return order.map(rv=>{
      const epics = LIVE_EPICS.filter(j=>j.release===rv);
      if(!epics.length) return null;
      const done  = epics.filter(j=>j.status==="Done").length;
      const active= epics.filter(j=>["In Progress","In Definition","Ready for Dev"].includes(j.status)).length;
      const open  = epics.filter(j=>j.status==="New").length;
      return {rv, total:epics.length, done, active, open, pct:Math.round(done/epics.length*100)};
    }).filter(Boolean);
  },[]);

  // Assignee concentration risk
  const assigneeRisk = useMemo(()=>{
    const counts = {};
    LIVE_EPICS.forEach(j=>{ if(j.assignee&&j.assignee!=="—"&&j.assignee!=="unassigned") counts[j.assignee]=(counts[j.assignee]||0)+1; });
    const total = JIRA_EPICS.length;
    return Object.entries(counts).map(([name,cnt])=>({name,cnt,pct:Math.round(cnt/total*100)})).sort((a,b)=>b.cnt-a.cnt).slice(0,6);
  },[]);

  // Delivery backlog — includes "Not Started" + "In POC" (both are pending migration)
  const notStartedCalls = TENANTS.filter(t=>t.status==="Not Started"||t.status==="In POC").reduce((s,t)=>s+(t.pendingCalls||0),0);
  const notStartedCount = TENANTS.filter(t=>t.status==="Not Started").length;

  const sourceSystemData = useMemo(()=>{
    const counts = { "Unknown / Not Set": 0 };
    RAW_OPPS.filter(o=>o.isWon && o.amount>0 && !/demo/i.test(o.account)).forEach(o=>{
      // Use mainIncumbent only — currentProvider is the CXone platform, not the legacy incumbent
      const SKIP = new Set(["none","no incumbent","unknown","not applicable / no decision","n/a","na","—",""]);
      const raw = (o.mainIncumbent||"").trim();
      const s = (!SKIP.has(raw.toLowerCase()) && raw) ? raw : null;
      if(s) { counts[s]=(counts[s]||0)+1; }
      else { counts["Unknown / Not Set"]++; }
    });
    return Object.entries(counts).filter(([,v])=>v>0).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[]);
  const engRelOpts = [...new Set(TENANTS.map(t=>bqToRel(t.bookingQ)).filter(r=>r!=="—"))].sort();
  const engFiltered = engRows.filter(t=>{
    if(engTab!=="All" && engTab!=="In Discussion / In POC" && t.status!==engTab) return false;
    if(engTab==="In Discussion / In POC" && t.status!=="In Progress" && t.status!=="In POC") return false;
    if(engSearch.trim() && !t.customer.toLowerCase().includes(engSearch.toLowerCase()) && !t.source.toLowerCase().includes(engSearch.toLowerCase())) return false;
    if(engDcFilt!=="All" && t.dcRegion!==engDcFilt) return false;
    if(engSrcFilt!=="All"&& t.source!==engSrcFilt) return false;
    if(engRelFilt!=="All"&& t.release!==engRelFilt) return false;
    return true;
  });
  const engHasF = engSearch.trim()!==""||engDcFilt!=="All"||engSrcFilt!=="All"||engRelFilt!=="All"||engTab!=="All";
  const engDone  = TENANTS.filter(t=>t.status==="Completed").length;
  const engProg  = TENANTS.filter(t=>t.status==="In Progress").length;
  const engPOC   = TENANTS.filter(t=>t.status==="In POC").length;
  const engDiscussion = engProg + engPOC;
  const engNS    = TENANTS.filter(t=>t.status==="Not Started").length;
  const totalMig = TENANTS.reduce((s,t)=>s+(t.calls||0),0);

  return (<>
    <style>{CSS}</style>

    {/* ── HEADER ─────────────────────────────────────────────────────────── */}
    <div style={{background:"var(--card)",borderBottom:"1px solid var(--bdr)",
      padding:"0 28px",position:"sticky",top:0,zIndex:100,
      boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
      <div style={{maxWidth:1600,margin:"0 auto",height:60,
        display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:20}}>

        {/* LEFT — Logo + branding */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:12,color:"#fff",fontFamily:"'Sora',sans-serif",
            letterSpacing:"-.2px"}}>MC</div>
          <div>
            <div style={{fontWeight:700,fontSize:13,letterSpacing:"-.3px",color:"var(--txt)",
              whiteSpace:"nowrap"}}>
              Migrated Calls Intelligence
            </div>
            <div style={{fontSize:10,color:"var(--sub)",marginTop:1,whiteSpace:"nowrap"}}>
              Chetan Kulkarni · Interactions Hub
            </div>
          </div>
        </div>

        {/* CENTER — Underline tabs, truly centered in the 1fr cell */}
        <div style={{display:"flex",alignItems:"stretch",height:60,justifyContent:"center",marginBottom:"-1px"}}>
          {[
            ["intelligence","📊 Intelligence","Revenue, deals & win/loss"],
            ["pipeline",    "🔭 Pipeline",    "Open opportunities & forecast"],
            ["delivery",    "🚚 Delivery",    "Customer migration status"],
            ["epics",       "⚙️ Epics",       "Engineering roadmap & CXREC"],
          ].map(([key,label,desc])=>(
            <button key={key} onClick={()=>setSection(key)} title={desc}
              style={{
                height:"100%",padding:"0 18px",border:"none",
                borderBottom:section===key?"2px solid var(--teal)":"2px solid transparent",
                background:"transparent",cursor:"pointer",
                fontSize:12,fontWeight:section===key?700:500,
                color:section===key?"var(--teal)":"var(--sub)",
                fontFamily:"'Outfit',sans-serif",
                transition:"color .15s,border-color .15s",
                whiteSpace:"nowrap",flexShrink:0,
              }}
              onMouseEnter={e=>{ if(section!==key){ e.currentTarget.style.color="var(--txt)"; }}}
              onMouseLeave={e=>{ if(section!==key){ e.currentTarget.style.color="var(--sub)"; }}}
            >{label}</button>
          ))}
        </div>

        {/* RIGHT — Sync status bar + history button */}
        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",minWidth:0,flexWrap:"wrap"}}>
          {SYNC_SOURCES.map(src=>(
            <span key={src.label} title={`${src.label}: ${src.count} ${src.detail} · last sync ${src.date}`}
              style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--sub)",flexShrink:0,
                      background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:99,
                      padding:"2px 8px",cursor:"default"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"#059669",flexShrink:0}}/>
              <span style={{fontWeight:600,color:"var(--txt)"}}>{src.label}</span>
              <span style={{color:"var(--mut)"}}>{src.count}</span>
            </span>
          ))}
          <button onClick={()=>setShowSyncHistory(true)}
            title="View sync history"
            style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--teal)",background:"transparent",
                    border:"1px solid var(--bdr)",borderRadius:99,padding:"2px 10px",cursor:"pointer",fontFamily:"inherit",
                    whiteSpace:"nowrap",flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(20,184,166,.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            🕐 {SYNC_DATE}
          </button>
          {/* Changes button — shows badge if changelog has entries */}
          <button onClick={()=>setShowChangelog(true)}
            title={CHANGELOG.length ? `${CHANGELOG.length} changes tracked` : "No changes tracked yet — starts after next sync"}
            style={{display:"flex",alignItems:"center",gap:4,fontSize:9,
                    color: CHANGELOG.length ? "#f59e0b" : "var(--mut)",
                    background:"transparent",
                    border:`1px solid ${CHANGELOG.length ? "rgba(245,158,11,.35)" : "var(--bdr)"}`,
                    borderRadius:99,padding:"2px 10px",cursor:"pointer",fontFamily:"inherit",
                    whiteSpace:"nowrap",flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {CHANGELOG.length ? `🔔 ${CHANGELOG.length} changes` : "🔔 Changes"}
          </button>
        </div>

        {/* ── Changelog Modal ── */}
        {showChangelog && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setShowChangelog(false)}>
            <div style={{background:"var(--bg)",border:"1px solid var(--bdr)",borderRadius:16,padding:28,
                         minWidth:500,maxWidth:580,maxHeight:"80vh",overflowY:"auto",
                         boxShadow:"0 24px 64px rgba(0,0,0,.35)",position:"relative"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--txt)"}}>What Changed</div>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:2}}>Tracked automatically on each weekday sync</div>
                </div>
                <button onClick={()=>setShowChangelog(false)}
                  style={{background:"transparent",border:"none",fontSize:18,cursor:"pointer",color:"var(--sub)",padding:"4px 8px",lineHeight:1}}>✕</button>
              </div>

              {CHANGELOG.length === 0 ? (
                <div style={{textAlign:"center",padding:"32px 0",color:"var(--mut)"}}>
                  <div style={{fontSize:28,marginBottom:12}}>🔔</div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",marginBottom:6}}>No changes recorded yet</div>
                  <div style={{fontSize:11,color:"var(--mut)"}}>Change tracking starts from the next scheduled sync.<br/>Check back after the next weekday 8am run.</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {CHANGELOG.map((entry,i)=>{
                    const iconMap = {"new_tenant":"🆕","status_change":"✅","new_win":"🏆","new_deal":"📋","new_loss":"❌"};
                    const colMap  = {"new_tenant":"rgba(20,184,166,.12)","status_change":"rgba(5,150,105,.12)","new_win":"rgba(234,179,8,.12)","new_deal":"rgba(99,102,241,.12)","new_loss":"rgba(239,68,68,.1)"};
                    const bdrMap  = {"new_tenant":"rgba(20,184,166,.3)","status_change":"rgba(5,150,105,.3)","new_win":"rgba(234,179,8,.3)","new_deal":"rgba(99,102,241,.3)","new_loss":"rgba(239,68,68,.25)"};
                    return (
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
                                           background: colMap[entry.type]||"var(--card)",
                                           border:`1px solid ${bdrMap[entry.type]||"var(--bdr)"}`,
                                           borderRadius:8,padding:"10px 12px"}}>
                        <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{iconMap[entry.type]||"•"}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{entry.title}</div>
                          {entry.detail && <div style={{fontSize:11,color:"var(--sub)",marginTop:2}}>{entry.detail}</div>}
                          <div style={{fontSize:10,color:"var(--mut)",marginTop:4}}>{entry.date}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Sync History Modal ── */}
        {showSyncHistory && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setShowSyncHistory(false)}>
            <div style={{background:"var(--bg)",border:"1px solid var(--bdr)",borderRadius:16,padding:28,
                         minWidth:480,maxWidth:560,boxShadow:"0 24px 64px rgba(0,0,0,.35)",position:"relative"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--txt)"}}>Sync Status</div>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:2}}>Last updated: {SYNC_DATE} · Auto-refreshes weekdays 8am</div>
                </div>
                <button onClick={()=>setShowSyncHistory(false)}
                  style={{background:"transparent",border:"none",fontSize:18,cursor:"pointer",color:"var(--sub)",padding:"4px 8px",lineHeight:1}}>✕</button>
              </div>

              {/* Source breakdown */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {SYNC_SOURCES.map(src=>(
                  <div key={src.label} style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:"#059669",flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:700,color:"var(--sub)",letterSpacing:".6px"}}>{src.label.toUpperCase()}</span>
                    </div>
                    <div style={{fontSize:22,fontWeight:800,color:"var(--txt)",lineHeight:1}}>{src.count}</div>
                    <div style={{fontSize:10,color:"var(--mut)",marginTop:3}}>{src.detail}</div>
                    <div style={{fontSize:9,color:"var(--mut)",marginTop:6,borderTop:"1px solid var(--bdr)",paddingTop:6}}>synced {src.date}</div>
                  </div>
                ))}
              </div>

              {/* What was updated today */}
              <div style={{background:"rgba(20,184,166,.07)",border:"1px solid rgba(20,184,166,.2)",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--teal)",marginBottom:8}}>✅ What was updated on {SYNC_DATE}</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {[
                    {src:"Salesforce",  detail:`${RAW_OPPS.length} opportunities · ${RAW_OPPS.filter(o=>o.isWon).length} won · ${RAW_OPPS.filter(o=>!o.isClosed).length} open`},
                    {src:"Salesforce",  detail:`${PIPELINE_LINE_ITEMS.length} pipeline line items across ${[...new Set(PIPELINE_LINE_ITEMS.map(i=>i.oppId))].length} open opps`},
                    {src:"Jira",        detail:`${JIRA_EPICS.length} epics refreshed`},
                    {src:"Confluence",  detail:`${TENANTS.length} delivery tenants · ${TENANTS.filter(t=>t.status==='Completed').length} completed · ${TENANTS.filter(t=>t.status==='In Progress').length} in progress`},
                  ].map((r,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:11}}>
                      <span style={{color:"#059669",flexShrink:0}}>•</span>
                      <span style={{color:"var(--sub)"}}><span style={{fontWeight:600,color:"var(--txt)"}}>{r.src}:</span> {r.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{fontSize:10,color:"var(--mut)",textAlign:"center"}}>
                Sync runs automatically Mon–Fri at 8am · history accumulates each run
              </div>
            </div>
          </div>
        )}

      </div>
    </div>

    <div style={{maxWidth:1600,margin:"0 auto",padding:"22px 28px 60px"}}>

    {/* ════════════════════════════════════════════════════════════════════ */}
    {/*  BUSINESS TAB                                                       */}
    {/* ════════════════════════════════════════════════════════════════════ */}

    {/* ════════════════════════════════════════════════════════════════════ */}
    {/*  INTELLIGENCE TAB                                                   */}
    {/* ════════════════════════════════════════════════════════════════════ */}
    {section==="intelligence" && (<>


      {/* ── FILTER BAR ─────────────────────────────────────────────────── */}
      <div style={{background:"var(--card)",border:`1px solid ${hasF?"rgba(37,99,235,.35)":"var(--bdr)"}`,borderRadius:12,marginBottom:18,transition:"border-color .2s,box-shadow .2s",boxShadow:hasF?"0 0 0 1px rgba(37,99,235,.12)":"none"}}>
        {/* ── Toggle header — always visible ── */}
        <div onClick={()=>setFilterOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",cursor:"pointer",borderBottom:filterOpen?"1px solid var(--bdr)":"none",userSelect:"none"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.04)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:".8px",color:hasF?"var(--teal)":"var(--sub)"}}>⚙ FILTERS</span>
          {hasF&&<span style={{fontSize:9,fontWeight:700,background:"rgba(37,99,235,.12)",color:"var(--teal)",borderRadius:99,padding:"1px 8px",border:"1px solid rgba(37,99,235,.25)"}}>
            {[fSearch.trim(),fPeriod!=="All"&&fPeriod,fStatus!=="All"&&fStatus,fForecast!=="All"&&fForecast,fDC!=="All"&&fDC,fRegion!=="All"&&fRegion,fTerritory!=="All"&&fTerritory,fIndustry!=="All"&&fIndustry,fMinAmt>0&&`$${fMinAmt}`].filter(Boolean).length} active
          </span>}
          {!filterOpen&&hasF&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
              {[fSearch.trim()&&`"${fSearch.trim()}"`,fPeriod!=="All"&&fPeriod,fStatus!=="All"&&fStatus,fForecast!=="All"&&fForecast,fDC!=="All"&&fDC,fRegion!=="All"&&fRegion,fTerritory!=="All"&&fTerritory,fIndustry!=="All"&&fIndustry,fMinAmt>0&&`≥$${fMinAmt}`].filter(Boolean).map((chip,i)=>(
                <span key={i} style={{fontSize:9,background:"rgba(37,99,235,.08)",color:"var(--teal)",borderRadius:99,padding:"1px 7px",border:"1px solid rgba(37,99,235,.2)"}}>{chip}</span>
              ))}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {hasF&&<button onClick={e=>{e.stopPropagation();setFPeriod("All");setFStatus("All");setFForecast("All");setFTerr("All");setFDC("All");setFRegion("All");setFIndustry("All");setFMinAmt(0);setFSearch("");}}
              style={{fontSize:9,fontWeight:700,color:"var(--red)",background:"rgba(244,63,94,.1)",border:"1px solid rgba(244,63,94,.3)",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕ Clear</button>}
            <span style={{fontSize:11,color:"var(--sub)",transform:filterOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block"}}>▾</span>
          </div>
        </div>
        {filterOpen&&<div style={{padding:"12px 16px 14px"}}>
        {/* Row 1 — dropdowns + search */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginBottom: hasF?10:0}}>
          <span style={{fontSize:10,color:"var(--mut)",marginRight:4}}>All active filters apply together (AND)</span>

          {/* Search */}
          <div style={{display:"flex",alignItems:"center",gap:6,flex:"1 1 180px",minWidth:160,maxWidth:240}}>
            <span style={{fontSize:11,color:"#64748b"}}>🔍</span>
            <input type="text" value={fSearch} onChange={e=>setFSearch(e.target.value)}
              placeholder="Search account / deal / owner…"
              style={{flex:1,fontSize:11,padding:"4px 8px",minWidth:0}}/>
            {fSearch&&<button onClick={()=>setFSearch("")} style={{background:"transparent",border:"none",color:"var(--mut)",cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button>}
          </div>

          {/* Dropdowns */}
          {[
            ["Period",   fPeriod,   setFPeriod,   ["All","2026","2025","2024","≤2023"]],
            ["Status",   fStatus,   setFStatus,   ["All","Won","Lost","Open"]],
            ["Forecast", fForecast, setFForecast, ["All","Commit","Most Likely","Best Case","Long Shot"]],
            ["DC Region",fDC,       setFDC,       ["All","NA1","NA2","CA1","SA1","AU1","EU1","EU2","UK1","JP1","UAE"]],
          ].map(([l,v,s,opts])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:v!=="All"?"var(--teal)":"var(--sub)",fontWeight:v!=="All"?700:400,whiteSpace:"nowrap"}}>{l}</span>
              <select value={v} onChange={e=>s(e.target.value)}
                style={{borderColor:v!=="All"?"var(--teal)":"var(--bdr)",color:v!=="All"?"var(--teal)":"var(--txt)",fontWeight:v!=="All"?700:400}}>
                {opts.map(x=><option key={x}>{x}</option>)}
              </select>
            </div>
          ))}

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:fRegion!=="All"?"var(--teal)":"var(--sub)",fontWeight:fRegion!=="All"?700:400}}>Region</span>
            <select value={fRegion} onChange={e=>setFRegion(e.target.value)}
              style={{borderColor:fRegion!=="All"?"var(--teal)":"var(--bdr)",color:fRegion!=="All"?"var(--teal)":"var(--txt)",fontWeight:fRegion!=="All"?700:400}}>
              <option>All</option>{regionOpts.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:fTerritory!=="All"?"var(--teal)":"var(--sub)",fontWeight:fTerritory!=="All"?700:400}}>Territory</span>
            <select value={fTerritory} onChange={e=>setFTerr(e.target.value)}
              style={{borderColor:fTerritory!=="All"?"var(--teal)":"var(--bdr)",color:fTerritory!=="All"?"var(--teal)":"var(--txt)",fontWeight:fTerritory!=="All"?700:400}}>
              <option>All</option>{territories.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:fIndustry!=="All"?"var(--teal)":"var(--sub)",fontWeight:fIndustry!=="All"?700:400}}>Industry</span>
            <select value={fIndustry} onChange={e=>setFIndustry(e.target.value)}
              style={{borderColor:fIndustry!=="All"?"var(--teal)":"var(--bdr)",color:fIndustry!=="All"?"var(--teal)":"var(--txt)",fontWeight:fIndustry!=="All"?700:400}}>
              <option>All</option>{industryOpts.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:fMinAmt>0?"var(--teal)":"var(--sub)",fontWeight:fMinAmt>0?700:400}}>Min $</span>
            <input type="number" value={fMinAmt} onChange={e=>setFMinAmt(+e.target.value)}
              style={{width:72,borderColor:fMinAmt>0?"var(--teal)":"var(--bdr)",color:fMinAmt>0?"var(--teal)":"var(--txt)",fontWeight:fMinAmt>0?700:400}} placeholder="0"/>
          </div>
        </div>

        {/* Row 2 — active filter chips + result count */}
        {hasF && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",paddingTop:10,borderTop:"1px solid var(--bdr)"}}>
            <span style={{fontSize:10,color:"var(--sub)",marginRight:2}}>Active:</span>
            {[
              fSearch.trim()   && { label:`Search: "${fSearch.trim()}"`,   clear:()=>setFSearch("") },
              fPeriod!=="All"  && { label:`Period: ${fPeriod}`,            clear:()=>setFPeriod("All") },
              fStatus!=="All"  && { label:`Status: ${fStatus}`,            clear:()=>setFStatus("All") },
              fForecast!=="All"&& { label:`Forecast: ${fForecast}`,        clear:()=>setFForecast("All") },
              fDC!=="All"      && { label:`DC Region: ${fDC}`,             clear:()=>setFDC("All") },
              fRegion!=="All"  && { label:`Region: ${fRegion}`,            clear:()=>setFRegion("All") },
              fTerritory!=="All"&&{ label:`Territory: ${fTerritory}`,      clear:()=>setFTerr("All") },
              fIndustry!=="All"&& { label:`Industry: ${fIndustry}`,        clear:()=>setFIndustry("All") },
              fMinAmt>0        && { label:`Min $: ${fMinAmt.toLocaleString()}`, clear:()=>setFMinAmt(0) },
            ].filter(Boolean).map((chip,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.25)",borderRadius:99,padding:"2px 8px 2px 10px",fontSize:10,color:"var(--teal)",fontWeight:600}}>
                {chip.label}
                <button onClick={chip.clear} style={{background:"transparent",border:"none",color:"var(--teal)",cursor:"pointer",fontSize:12,padding:0,lineHeight:1,opacity:.7}}>✕</button>
              </span>
            ))}
            {/* AND indicator between chips */}
            <span style={{fontSize:9,color:"var(--mut)",padding:"2px 6px",background:"rgba(255,255,255,.04)",borderRadius:4,border:"1px solid var(--bdr)"}}>AND</span>
            <span style={{fontSize:11,color:"var(--teal)",fontWeight:700,marginLeft:4}}>{filtered.length} of {LIVE_OPPS.length} deals match</span>
            <button onClick={()=>{setFPeriod("All");setFStatus("All");setFForecast("All");setFTerr("All");setFDC("All");setFRegion("All");setFIndustry("All");setFMinAmt(0);setFSearch("");}}
              style={{marginLeft:"auto",background:"transparent",border:"1px solid var(--red)",color:"var(--red)",borderRadius:6,padding:"3px 11px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              ✕ Clear all filters
            </button>
          </div>
        )}
        </div>}{/* end filterOpen */}
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {kpiCards.map((k,i)=>(
          <div key={i} className="kpi-card fade" style={{background:"var(--card)",borderRadius:14,boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",padding:"16px 18px",animationDelay:`${i*50}ms`}} onClick={()=>openModal(k.modal.title,k.modal.subtitle,k.modal.deals)}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".5px",color:"var(--sub)",marginBottom:8}}>{k.l}</div>
            <div className="mono" style={{fontSize:22,fontWeight:800,color:k.a,letterSpacing:"-1px",marginBottom:4}}>{k.v}</div>
            <div style={{fontSize:10,color:"var(--mut)",marginBottom:7}}>{k.s}</div>
            <div style={{fontSize:9,color:"var(--teal)",opacity:.7}}>☰ {k.modal.deals.length} deals</div>
          </div>
        ))}
      </div>

      {/* ── PRICING MODEL CONFIDENCE ──────────────────────────────────── */}
      {(()=>{
        const { perBUDeals, per1000Est, hybridDeals, svcOnlyDeals, acvBU, acvEst, acvHyb, svcBU, hybridFees, svcOnlyFees } = pricingModelData;
        const totalWithRecurring = perBUDeals.length + per1000Est.length + hybridDeals.length;
        const grandTotal = totalWithRecurring + svcOnlyDeals.length;
        const pBU  = grandTotal ? (perBUDeals.length/grandTotal*100).toFixed(1) : 0;
        const pEst = grandTotal ? (per1000Est.length/grandTotal*100).toFixed(1) : 0;
        const pHyb = grandTotal ? (hybridDeals.length/grandTotal*100).toFixed(1) : 0;
        const pSvc = grandTotal ? (svcOnlyDeals.length/grandTotal*100).toFixed(1) : 0;
        const seg = [
          { pct:pBU,  color:'#059669', label:'Per BU — Fixed Price' },
          { pct:pEst, color:'#d97706', label:'Per 1000 Interactions — Estimated' },
          { pct:pHyb, color:'#8b5cf6', label:'Migration + Per 1000 Hybrid' },
          { pct:pSvc, color:'#94a3b8', label:'Migration Services Only — No Recurring Product' },
        ];
        const rows = [
          {
            color:'#059669',
            count: perBUDeals.length, pct: pBU,
            label: 'Per BU — Fixed Price + Migration Services',
            valueLabel: 'one-time migration fees', value: fmt(svcBU),
            desc: `Flat annual fee per business unit · ACV is exact and confirmed in Salesforce · ${perBUDeals.filter(o=>(o.amountServices||0)>0).length} of ${perBUDeals.length} deals also carried a one-time migration services fee`,
            value2: fmt(acvBU), valueLabel2: 'recurring ACV',
            deals: [...perBUDeals].sort((a,b)=>b.amount-a.amount),
            modalTitle: 'Per BU — Fixed Price + Migration Services',
            modalSub: `${perBUDeals.length} deals · ${fmt(acvBU)} recurring ACV · ${fmt(svcBU)} one-time migration fees · ${perBUDeals.filter(o=>(o.amountServices||0)>0).length} of ${perBUDeals.length} deals have migration fees`,
          },
          {
            color:'#d97706',
            count: per1000Est.length, pct: pEst,
            label: 'Per 1000 Interactions — Usage-Based',
            valueLabel: 'committed min. ACV', value: fmt(acvEst),
            desc: 'Usage-based pricing — rate is contracted (e.g. $0.16–$0.20 per 1,000 interactions) but actual revenue depends on call volume · Committed minimum ACV shown · actual billed amount tracked in Billing Stream (Power BI)',
            deals: [...per1000Est].sort((a,b)=>b.amount-a.amount),
            modalTitle: 'Per 1000 Interactions — Usage-Based',
            modalSub: `${per1000Est.length} deals · ${fmt(acvEst)} committed minimum ACV · actual revenue is usage-based and tracked in Billing Stream`,
          },
          {
            color:'#8b5cf6',
            count: hybridDeals.length, pct: pHyb,
            label: 'Migration + Per 1000 Hybrid',
            valueLabel: 'one-time migration fees', value: fmt(hybridFees),
            desc: 'Fixed migration services fee (610318 SKU) PLUS a Per 1000 Interactions recurring SKU (1448) · The migration fee covers platform onboarding; the Per 1000 component bills actual call volume · Recurring ACV varies by usage',
            value2: fmt(acvHyb), valueLabel2: 'recurring ACV (TCV)',
            deals: [...hybridDeals].sort((a,b)=>(b.amountServices||0)-(a.amountServices||0)),
            modalTitle: 'Migration + Per 1000 Hybrid',
            modalSub: `${hybridDeals.length} deals · ${fmt(hybridFees)} migration fees · ${fmt(acvHyb)} recurring ACV · Per 1000 recurring billing active · actual ACV tracked in Billing Stream`,
          },
          {
            color:'#94a3b8',
            count: svcOnlyDeals.length, pct: pSvc,
            label: 'Migration Services Only — No Recurring Product',
            valueLabel: 'one-time migration fees', value: fmt(svcOnlyFees),
            desc: 'No recurring iHub product SKU on these deals · One-time migration services only (610318-256x) · These are already counted in the One-Time Migration Fees card above — not part of recurring ACV',
            deals: [...svcOnlyDeals].sort((a,b)=>(b.amountServices||0)-(a.amountServices||0)),
            modalTitle: 'Migration Services Only — No Recurring Product',
            modalSub: `${svcOnlyDeals.length} deals · ${fmt(svcOnlyFees)} one-time migration fees · no recurring iHub product line item`,
          },
        ];
        return (
          <div style={{background:'var(--card)',borderRadius:14,padding:'18px 22px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',marginBottom:18}}>
            {/* Header */}
            <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:4,flexWrap:'wrap'}}>
              <div className="stitle" style={{margin:0}}>Pricing Model Breakdown — Recurring ACV Confidence</div>
              <div style={{fontSize:10,color:'var(--mut)'}}>
                {grandTotal} won deals total · {totalWithRecurring} have a recurring product · <span style={{color:'#8b5cf6',fontWeight:600}}>{hybridDeals.length} are migration + per 1000 hybrid</span> · <span style={{color:'#94a3b8',fontWeight:600}}>{svcOnlyDeals.length} are migration services only</span>
              </div>
            </div>
            <div style={{fontSize:10,color:'var(--mut)',marginBottom:12}}>
              Shows how reliably recurring ACV can be calculated — click any row to see the deals
            </div>

            {/* Segmented bar */}
            <div style={{display:'flex',height:14,borderRadius:99,overflow:'hidden',gap:2,marginBottom:16}}>
              {seg.map((s,i)=>(
                <div key={i} style={{width:`${s.pct}%`,background:s.color,borderRadius:i===0?'99px 0 0 99px':i===seg.length-1?'0 99px 99px 0':'0',transition:'width .4s',minWidth:s.pct>0?4:0}} title={`${s.label}: ${s.pct}%`}/>
              ))}
            </div>
            {/* Bar labels */}
            <div style={{display:'flex',gap:16,marginBottom:14,flexWrap:'wrap'}}>
              {seg.map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0}}/>
                  <span style={{fontSize:9,color:'var(--mut)'}}>{s.label} ({s.pct}%)</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {rows.map((r,i)=>(
                <div key={i} onClick={()=>openModal(r.modalTitle, r.modalSub, r.deals)}
                  style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 14px',borderRadius:10,border:`1px solid ${r.color}33`,background:`${r.color}08`,cursor:'pointer',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background=`${r.color}15`}
                  onMouseLeave={e=>e.currentTarget.style.background=`${r.color}08`}>
                  {/* Count */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:48}}>
                    <div style={{width:9,height:9,borderRadius:'50%',background:r.color,marginTop:3}}/>
                    <div className="mono" style={{fontSize:20,fontWeight:800,color:r.color,lineHeight:1}}>{r.count}</div>
                    <div style={{fontSize:9,color:'var(--mut)'}}>deals · {r.pct}%</div>
                  </div>
                  {/* Label + desc */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:r.color,marginBottom:3}}>{r.label}</div>
                    <div style={{fontSize:10,color:'var(--mut)',lineHeight:1.55}}>{r.desc}</div>
                  </div>
                  {/* Value */}
                  <div style={{textAlign:'right',minWidth:80,flexShrink:0}}>
                    <div className="mono" style={{fontSize:14,fontWeight:800,color:r.color}}>{r.value}</div>
                    <div style={{fontSize:9,color:'var(--mut)',marginTop:1}}>{r.valueLabel}</div>
                    {r.value2 && <>
                      <div className="mono" style={{fontSize:12,fontWeight:700,color:r.color,marginTop:6,opacity:.75}}>{r.value2}</div>
                      <div style={{fontSize:9,color:'var(--mut)',marginTop:1}}>{r.valueLabel2}</div>
                    </>}
                    <div style={{fontSize:9,color:'var(--teal)',marginTop:5,opacity:.8}}>☰ view deals</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── CHARTS ROW 1: Trend + Status Donut ─────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:18,marginBottom:18}}>
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Revenue Trend — Won ACV by Month</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any data point to drill into deals for that month</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={trendData} onClick={(data)=>{
              if(!data||!data.activePayload||!data.activePayload[0]) return;
              const point=data.activePayload[0].payload;
              const monthIdx=months.indexOf(point.m);
              const yr=data.activePayload[0].dataKey;
              const deals=wonOpps.filter(o=>String(o.fy)===yr&&new Date(o.closeDate).getMonth()===monthIdx);
              if(deals.length) openModal(`Won — ${point.m} ${yr}`,`${deals.length} deals · ${fmt(deals.reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0))} ACV`,deals.sort((a,b)=>amtTotal(b)-amtTotal(a)));
            }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="m" tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmt} tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} width={52}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:11,color:"#64748b"}}/>
              <Line type="monotone" dataKey="2024" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls/>
              <Line type="monotone" dataKey="2025" stroke="#2563eb" strokeWidth={2.5} dot={{r:4,fill:"#2563eb",cursor:"pointer"}} connectNulls activeDot={{r:6,cursor:"pointer"}}/>
              <Line type="monotone" dataKey="2026" stroke="#d97706" strokeWidth={2} strokeDasharray="4 3" dot={{r:3,fill:"#d97706",cursor:"pointer"}} connectNulls activeDot={{r:6,cursor:"pointer"}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          {/* Status Donut */}
          <div className="stitle">Deal Status Breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="45%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" onClick={d=>openModal(`${d.name} Deals`,`${d.value} deals`,filtered.filter(o=>d.name==="Open"?!o.isClosed:statusOf(o)===d.name))}>
                {statusData.map((e,i)=><Cell key={i} fill={SC[e.name]||"#6b7280"} style={{cursor:"pointer"}}/>)}
              </Pie>
              <Tooltip formatter={(v,n,p)=>[`${v} deals`,p.payload.name]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
            {statusData.map(d=>(
              <span key={d.name} className="chip" style={{color:SC[d.name],cursor:"pointer",fontSize:9}} onClick={()=>openModal(`${d.name} Deals`,`${d.value} deals`,filtered.filter(o=>d.name==="Open"?!o.isClosed:statusOf(o)===d.name))}>
                <span style={{width:5,height:5,borderRadius:"50%",background:SC[d.name]}}/>{d.name} {d.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2: YoY Bar + Forecast Pipeline ───────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Year-over-Year Comparison — Won ACV</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any bar to drill into deals for that quarter</div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={yoyData} barGap={3} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
              <XAxis dataKey="q" tick={{fontSize:11,fill:"#64748b"}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmt} tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} width={52}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="FY2024" fill="#64748b" radius={[3,3,0,0]} cursor="pointer" onClick={d=>{const deals=wonOpps.filter(o=>o.fy===2024&&o.fq===["Q1","Q2","Q3","Q4"].indexOf(d.q)+1);if(deals.length)openModal(`FY2024 ${d.q} Won`,`${deals.length} deals`,deals.sort((a,b)=>b.amount-a.amount));}}/>
              <Bar dataKey="FY2025" fill="#2563eb" radius={[3,3,0,0]} cursor="pointer" onClick={d=>{const deals=wonOpps.filter(o=>o.fy===2025&&o.fq===["Q1","Q2","Q3","Q4"].indexOf(d.q)+1);if(deals.length)openModal(`FY2025 ${d.q} Won`,`${deals.length} deals`,deals.sort((a,b)=>b.amount-a.amount));}}/>
              <Bar dataKey="FY2026" fill="#d97706" radius={[3,3,0,0]} cursor="pointer" onClick={d=>{const deals=wonOpps.filter(o=>o.fy===2026&&o.fq===["Q1","Q2","Q3","Q4"].indexOf(d.q)+1);if(deals.length)openModal(`FY2026 ${d.q} Won`,`${deals.length} deals`,deals.sort((a,b)=>b.amount-a.amount));}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Lost Deal Analysis</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:10,marginTop:2}}>
            {lostOpps.length} lost deals · click any bar to drill into deals
          </div>
          {lostReasonData.length===0
            ? <div style={{fontSize:11,color:"var(--mut)",fontStyle:"italic",marginTop:8}}>No lost deals in current filter</div>
            : (()=>{
                const REASON_COLOR = {
                  "Duplicate / Admin":   "#475569",
                  "No Decision":         "#d97706",
                  "Competitor / Price":  "#dc2626",
                  "Project Canceled":    "#7c3aed",
                  "Feature / Tech Gap":  "#fb923c",
                  "Stayed with Vendor":  "#3b82f6",
                  "Moved Segment":       "#6b7280",
                  "Not Logged":          "#94a3b8",
                };
                return (
                  <ResponsiveContainer width="100%" height={Math.max(180, lostReasonData.length * 32 + 20)}>
                    <BarChart data={lostReasonData} layout="vertical" margin={{left:0,right:36,top:4,bottom:4}}
                      onClick={(data)=>{ if(data&&data.activePayload&&data.activePayload[0]){
                        const reason=data.activePayload[0].payload.name;
                        const deals=(lostOppsByReason[reason]||[]).sort((a,b)=>b.amount-a.amount);
                        openModal(`Lost — ${reason}`,
                          `${deals.length} deals · click any row for full details`,
                          deals.map(d=>({...d,
                            _extraRows:[
                              d._lostData.competitor ? `Competitor: ${d._lostData.competitor}` : null,
                              d._lostData.detail || null,
                            ].filter(Boolean).join(' · ')
                          }))
                        );
                      }}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <YAxis type="category" dataKey="name"
                        tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} width={140}/>
                      <Tooltip content={<TT/>}/>
                      <Bar dataKey="value" name="Deals" radius={[0,4,4,0]} maxBarSize={22} cursor="pointer">
                        {lostReasonData.map((e,i)=>(
                          <Cell key={i} fill={REASON_COLOR[e.name]||"#475569"}/>
                        ))}
                        <LabelList dataKey="value" position="right"
                          style={{fontSize:10,fill:"#64748b",fontWeight:600}}
                          formatter={v=>`${v}`}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()
          }
          {/* Legend */}
          {lostReasonData.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10,paddingTop:10,borderTop:"1px solid var(--bdr)"}}>
              {[
                ["Duplicate / Admin","#475569","Not a real loss — admin entry"],
                ["No Decision",      "#d97706","No compelling event to change"],
                ["Competitor / Price","#dc2626","Lost to competitor or price"],
                ["Project Canceled", "#7c3aed","Customer project shelved"],
                ["Feature / Tech Gap","#fb923c","Product didn't fit requirements"],
                ["Stayed with Vendor","#3b82f6","Renewed existing contract"],
                ["Moved Segment",     "#6b7280","Customer moved to different segment"],
                ["Not Logged",        "#94a3b8","No reason logged in SF"],
              ].map(([label,color,tip])=>(
                <div key={label} title={tip}
                  style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--sub)",cursor:"default"}}>
                  <span style={{width:8,height:8,borderRadius:2,background:color,flexShrink:0}}/>
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── WIN RATE BY TERRITORY + FORECAST PIPELINE ──────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>

        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Win Rate by Territory</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:8,marginTop:2}}>Closed deals: won (teal) vs lost (red) · click to drill in</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={winByTerritory} margin={{left:0,right:10,top:4,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
              <XAxis dataKey="territory" tick={{fontSize:9,fill:"#64748b",angle:-30,textAnchor:"end"}} axisLine={false} tickLine={false} interval={0}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="won"  name="Won"  fill="#059669" radius={[3,3,0,0]} stackId="a"
                onClick={d=>openModal(`${d.territory} — Won`,`${d.won} won deals`,filtered.filter(o=>o.territory===d.originalTerritory&&o.isWon))}/>
              <Bar dataKey="lost" name="Lost" fill="#dc2626" radius={[3,3,0,0]} stackId="a"
                onClick={d=>openModal(`${d.territory} — Lost`,`${d.lost} lost deals`,filtered.filter(o=>o.territory===d.originalTerritory&&o.isClosed&&!o.isWon).map(o=>({...o,_lostData:LOST_DATA[o.id]||null})))}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Open Pipeline — Forecast Breakdown</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={openByForecast} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false}/>
              <XAxis type="number" tickFormatter={fmt} tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"#64748b"}} axisLine={false} tickLine={false} width={75}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="value" radius={[0,4,4,0]} name="ACV" onClick={d=>openModal(`${d.name} Deals`,`${d.count} deal${d.count!==1?"s":""}`,openOpps.filter(o=>o.forecast===d.name))}>
                {openByForecast.map((e,i)=><Cell key={i} fill={FC[e.name]||"#6b7280"}/>)}
                <LabelList dataKey="count" position="right" style={{fontSize:10,fill:"#64748b"}} formatter={v=>`${v}`}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* ── CHARTS ROW 3: Industry + Top Accounts ───────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Won ACV by Industry</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
            {industryData.map((d,i)=>{
              const color = ["#2563eb","#3b82f6","#7c3aed","#d97706","#fb923c","#f472b6","#059669"][i%7];
              const pct = Math.max(4,(d.value/industryData[0].value)*100);
              return (
                <div key={i} style={{cursor:"pointer"}} onClick={()=>openModal(`${d.name} Won Deals`,`Won deals in ${d.name}`,wonOpps.filter(o=>(o.industry||"—").replace("\u200b","").replace("​","")===d.name))}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  {/* Label row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                    <span style={{fontSize:10,color:"var(--txt)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{d.name.replace("\u200b","").replace("​","")}</span>
                    <span className="mono" style={{fontSize:10,color,fontWeight:600,flexShrink:0,marginLeft:8}}>{fmt(d.value)}</span>
                  </div>
                  {/* Bar */}
                  <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,.06)"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width .4s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Top Accounts by Revenue</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {topAccts.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>openModal(a.account,`Won deals · ${fmt(a.acv)}`,wonOpps.filter(o=>o.account===a.account))}>
                <span style={{fontSize:10,color:"var(--mut)",width:14,textAlign:"right"}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:3}}>{a.account}</div>
                  <div style={{height:3,borderRadius:99,background:"var(--bdr)"}}>
                    <div style={{height:"100%",width:`${(a.acv/maxAcct)*100}%`,background:"linear-gradient(90deg,var(--teal),#3b82f6)",borderRadius:99}}/>
                  </div>
                </div>
                <span className="mono" style={{fontSize:11,color:"var(--teal)",fontWeight:600,minWidth:52,textAlign:"right"}}>{fmt(a.acv)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BUSINESS MODEL + WHERE WE WIN + QoQ MOMENTUM ─────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:18}}>

        {/* Business Model Mix — PieChart donut */}
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Business Model Mix</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Won deals by contract type</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={bizModelData} cx="40%" cy="50%" innerRadius={52} outerRadius={78}
                paddingAngle={3} dataKey="value"
                cursor="pointer"
                onClick={(d)=>{
                  const name=d.name;
                  const deals=wonOpps.filter(o=>{
                    const ct=o.contractType||"";
                    if(name==="New Logo")      return ct.includes("New Logo")||ct.includes("New OCR")||ct==="New Customer";
                    if(name==="Expansion/LOB") return ct.includes("New LOB")||ct.includes("Expansions")||ct.includes("New BU")||ct.includes("Expansion");
                    if(name==="Addendum")      return ct.includes("Addendum");
                    if(name==="Conversion")    return ct.includes("conversion")||ct.includes("Conversion")||ct.includes("Cloud");
                    if(name==="Renewal")       return ct.includes("Renewal")||ct.includes("Maintenance");
                    return !ct.includes("New Logo")&&!ct.includes("New OCR")&&ct!=="New Customer"&&!ct.includes("New LOB")&&!ct.includes("Expansions")&&!ct.includes("New BU")&&!ct.includes("Expansion")&&!ct.includes("Addendum")&&!ct.includes("conversion")&&!ct.includes("Conversion")&&!ct.includes("Cloud")&&!ct.includes("Renewal")&&!ct.includes("Maintenance");
                  });
                  openModal(`${name} Deals`,`${deals.length} won deals · contract type: ${name}`,deals);
                }}>
                {bizModelData.map((e,i)=>{
                  const colors=["#2563eb","#7c3aed","#d97706","#3b82f6","#dc2626","#10b981"];
                  const name=e.name;
                  return <Cell key={i} fill={colors[i%colors.length]} style={{cursor:"pointer"}}
                    onClick={()=>{
                      const deals=wonOpps.filter(o=>{
                        const ct=o.contractType||"";
                        if(name==="New Logo")      return ct.includes("New Logo")||ct.includes("New OCR")||ct==="New Customer";
                        if(name==="Expansion/LOB") return ct.includes("New LOB")||ct.includes("Expansions")||ct.includes("New BU")||ct.includes("Expansion");
                        if(name==="Addendum")      return ct.includes("Addendum");
                        if(name==="Conversion")    return ct.includes("conversion")||ct.includes("Conversion")||ct.includes("Cloud");
                        if(name==="Renewal")       return ct.includes("Renewal")||ct.includes("Maintenance");
                        return !ct.includes("New Logo")&&!ct.includes("New OCR")&&ct!=="New Customer"&&!ct.includes("New LOB")&&!ct.includes("Expansions")&&!ct.includes("New BU")&&!ct.includes("Expansion")&&!ct.includes("Addendum")&&!ct.includes("conversion")&&!ct.includes("Conversion")&&!ct.includes("Cloud")&&!ct.includes("Renewal")&&!ct.includes("Maintenance");
                      });
                      openModal(`${name} Deals`,`${deals.length} won deals · contract type: ${name}`,deals);
                    }}/>;
                })}
              </Pie>
              <Tooltip formatter={(v,n,p)=>[`${v} deals`,p.payload.name]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:2}}>
            {bizModelData.map((d,i)=>{
              const colors=["#2563eb","#7c3aed","#d97706","#3b82f6","#dc2626","#10b981"];
              const total=bizModelData.reduce((s,x)=>s+x.value,0);
              const name=d.name;
              return <span key={i} className="chip" style={{color:colors[i%colors.length],fontSize:9,cursor:"pointer"}}
                onClick={()=>{
                  const deals=wonOpps.filter(o=>{
                    const ct=o.contractType||"";
                    if(name==="New Logo")      return ct.includes("New Logo")||ct.includes("New OCR")||ct==="New Customer";
                    if(name==="Expansion/LOB") return ct.includes("New LOB")||ct.includes("Expansions")||ct.includes("New BU")||ct.includes("Expansion");
                    if(name==="Addendum")      return ct.includes("Addendum");
                    if(name==="Conversion")    return ct.includes("conversion")||ct.includes("Conversion")||ct.includes("Cloud");
                    if(name==="Renewal")       return ct.includes("Renewal")||ct.includes("Maintenance");
                    return !ct.includes("New Logo")&&!ct.includes("New OCR")&&ct!=="New Customer"&&!ct.includes("New LOB")&&!ct.includes("Expansions")&&!ct.includes("New BU")&&!ct.includes("Expansion")&&!ct.includes("Addendum")&&!ct.includes("conversion")&&!ct.includes("Conversion")&&!ct.includes("Cloud")&&!ct.includes("Renewal")&&!ct.includes("Maintenance");
                  });
                  openModal(`${name} Deals`,`${deals.length} won deals · contract type: ${name}`,deals);
                }}>
                <span style={{width:5,height:5,borderRadius:"50%",background:colors[i%colors.length],display:"inline-block",marginRight:3}}/>
                {d.name} {Math.round(d.value/total*100)}%
              </span>;
            })}
          </div>
        </div>

        {/* Where We Win — horizontal BarChart */}
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Where We Win</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:8,marginTop:2}}>Incumbent on {wonOpps.length} commercial won deals</div>
          {incumbentWinData.length===0
            ? <div style={{fontSize:11,color:"var(--mut)",fontStyle:"italic"}}>No incumbent data available</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={incumbentWinData} layout="vertical" margin={{left:0,right:32,top:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} width={90}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="value" name="Won deals" radius={[0,4,4,0]} cursor="pointer"
                    onClick={d=>openModal(
                      `Won vs ${d.name}`,
                      `${d.value} deal${d.value!==1?"s":""} won where incumbent was ${d.name}`,
                      wonOpps.filter(o=>{
                        const mainRaw = (o.mainIncumbent||"").trim();
                        const raw = !SKIP_INCUMBENTS.has(mainRaw.toLowerCase()) && mainRaw ? mainRaw : "";
                        const key = raw ? normalizeInc(raw) : "Unknown / Not Set";
                        return key===d.name;
                      })
                    )}>
                    {incumbentWinData.map((e,i)=>{
                      const colors=["#059669","#3b82f6","#7c3aed","#d97706","#fb923c","#dc2626","#10b981"];
                      return <Cell key={i} fill={colors[i%colors.length]}/>;
                    })}
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fill:"#64748b"}} formatter={v=>`${v}`}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* QoQ Momentum — ComposedChart: bars = ACV, line = deal count */}
        <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px 16px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">QoQ Won ACV Momentum</div>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:8,marginTop:2}}>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--sub)"}}>
              <span style={{width:10,height:10,borderRadius:2,background:"#3b82f6",display:"inline-block"}}/>Won ACV</span>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--sub)"}}>
              <span style={{width:10,height:2,background:"#f59e0b",display:"inline-block"}}/>Deal count</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={qoqData} margin={{left:2,right:28,top:16,bottom:44}} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
              <XAxis dataKey="q"
                tickFormatter={v=>{const m=v.match(/FY(\d{4}) Q(\d)/);return m?`'${m[1].slice(2)} Q${m[2]}`:v;}}
                tick={{fontSize:9,fill:"#94a3b8",angle:-40,textAnchor:"end"}}
                axisLine={false} tickLine={false} interval={0} height={50}/>
              <YAxis yAxisId="acv" tickFormatter={fmt} tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false} width={44}/>
              <YAxis yAxisId="cnt" orientation="right" tick={{fontSize:9,fill:"#f59e0b"}} axisLine={false} tickLine={false} width={20} allowDecimals={false}/>
              <Tooltip content={({active,payload,label})=>{
                if(!active||!payload?.length) return null;
                const won=payload.find(p=>p.dataKey==="won");
                const cnt=payload.find(p=>p.dataKey==="cnt");
                return <div style={{background:"#1e293b",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,.25)"}}>
                  <div style={{color:"#94a3b8",fontSize:10,marginBottom:4,fontWeight:600}}>{label}</div>
                  {won&&<div style={{color:"#60a5fa",fontSize:11}}>{fmt(won.value)} ACV</div>}
                  {cnt&&<div style={{color:"#fbbf24",fontSize:11}}>{cnt.value} deal{cnt.value!==1?"s":""}</div>}
                </div>;
              }}/>
              <Bar yAxisId="acv" dataKey="won" name="Won ACV" radius={[4,4,0,0]}
                onClick={d=>openModal(d.q,`Won deals in ${d.q}`,wonOpps.filter(o=>`FY${o.fy} Q${o.fq}`===d.q))}>
                {qoqData.map((e,i)=>{
                  const lastWon=[...qoqData].reverse().find(q=>q.won>0);
                  const isLatest=lastWon&&e.q===lastWon.q;
                  return <Cell key={i} fill={isLatest?"#2563eb":e.won>0?"#3b82f6":"#e2e8f0"}/>;
                })}
                <LabelList dataKey="won" position="top" style={{fontSize:9,fill:"#475569",fontWeight:600}}
                  formatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v>0?`${v.toFixed(0)}`:""}/>
              </Bar>
              <Line yAxisId="cnt" dataKey="cnt" name="Deals" type="monotone"
                stroke="#f59e0b" strokeWidth={2} dot={{r:3,fill:"#f59e0b",strokeWidth:0}}
                activeDot={{r:4}} connectNulls/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>
      {/* ── 5 INSIGHT CARDS ─────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:18}}>

        {/* DC REGION */}
        <div style={{background:"var(--card)",border:"1px solid rgba(37,99,235,.2)",borderRadius:12,padding:"15px 16px"}}>
          <div className="stitle" style={{color:"var(--teal)"}}>📡 Data Centre Region</div>
          {Object.entries(dcFull).sort((a,b)=>b[1].won-a[1].won).map(([dc,d],i)=>(
            <div key={i} onClick={()=>openModal(`DC Region: ${dc}`,`${DC_LABEL[dc]||dc} · ${d.won} won · ${d.open} open · ${fmt(d.wonAmt)}`,d.deals)} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderBottom:"1px solid rgba(226,232,240,1)",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{minWidth:28,height:16,borderRadius:3,background:DC_COLORS[dc]||"#64748b",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
                <span style={{fontSize:8,fontWeight:800,color:"#f8fafc"}}>{dc}</span>
              </span>
              <span style={{fontSize:10,color:"var(--txt)",flex:1,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={DC_LABEL[dc]||dc}>{DC_LABEL[dc]||dc}</span>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:9,color:"var(--grn)",fontWeight:600}}>{d.won}W {d.open>0?<span style={{color:"var(--amb)"}}>{d.open}O</span>:""}</div>
                {d.wonAmt>0&&<div className="mono" style={{fontSize:9,color:"var(--teal)"}}>{fmt(d.wonAmt)}</div>}
              </div>
            </div>
          ))}
          <div style={{fontSize:9,color:"var(--mut)",marginTop:6}}>{filtered.filter(o=>o.dcSource==="inferred").length} inferred from territory ~ · {filtered.filter(o=>!o.dcRegion).length} no data</div>
        </div>

        {/* FISCAL YEAR */}
        <div style={{background:"var(--card)",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Fiscal Year</div>
          {[...new Set(filtered.map(o=>o.fy))].sort((a,b)=>b-a).slice(0,8).map(fy=>{
            const fyD=filtered.filter(o=>o.fy===fy);
            const fyW=fyD.filter(o=>o.isWon&&amtTotal(o)>0&&!/demo/i.test(o.account));
            const wa=fyW.reduce((s,o)=>s+toUSD(amtTotal(o),o.currency),0);
            return <div key={fy} onClick={()=>openModal(`FY${fy} Deals`,`${fyD.length} deals · ${fmt(wa)} won`,fyD)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(226,232,240,1)",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span className="mono" style={{fontSize:11,fontWeight:700,color:fy===2026?"var(--teal)":"var(--txt)",width:36}}>FY{fy}</span>
              <div style={{flex:1,height:3,borderRadius:99,background:"var(--bdr)"}}>
                <div style={{height:"100%",width:`${Math.min(100,(wa/totalWonCombined)*100)}%`,background:"var(--teal)",borderRadius:99}}/>
              </div>
              <span className="mono" style={{fontSize:10,color:"var(--teal)",minWidth:44,textAlign:"right"}}>{fmt(wa)}</span>
            </div>;
          })}
        </div>

        {/* MAIN INCUMBENT */}
        <div style={{background:"var(--card)",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle">Main Incumbent</div>
          <div style={{overflowY:"auto",maxHeight:270}}>
          {(()=>{
            const NOISE = new Set(["not applicable / no decision","none","unknown","n/a","na","no decision","no incumbent","—",""]);
            const entries = Object.entries(incFull)
              .filter(([inc]) => !NOISE.has(inc.toLowerCase().trim()))
              .sort((a,b) => b[1].count - a[1].count)
              .slice(0, 12);
            const maxCount = entries[0]?.[1]?.count || 1;
            return entries.length ? entries.map(([inc,d],i)=>(
              <div key={i} onClick={()=>openModal(`Incumbent: ${inc}`,`${d.count} deals · ${d.wonAmt>0?fmt(d.wonAmt)+" won":"no wins yet"}`,d.deals)}
                style={{padding:"7px 0",borderBottom:"1px solid rgba(226,232,240,.8)",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.05)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,minWidth:0}}>
                  <span style={{fontSize:11,color:"var(--txt)",fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={inc}>{inc}</span>
                  <span style={{fontSize:10,color:"var(--sub)",fontWeight:600,flexShrink:0}}>{d.count}</span>
                  {d.wonAmt>0&&<span className="mono" style={{fontSize:9,color:"var(--grn)",marginLeft:4,flexShrink:0}}>{fmt(d.wonAmt)}</span>}
                </div>
                <div style={{height:2,borderRadius:99,background:"rgba(255,255,255,.06)"}}>
                  <div style={{height:"100%",width:`${(d.count/maxCount)*100}%`,background:"var(--pur)",opacity:.7,borderRadius:99}}/>
                </div>
              </div>
            )) : <div style={{fontSize:11,color:"var(--mut)",padding:"8px 0"}}>No competitor data in current filter</div>;
          })()}
          </div>
          {(()=>{
            const NOISE = new Set(["not applicable / no decision","none","unknown","n/a","na","no decision","no incumbent","—",""]);
            const noiseCount = Object.entries(incFull).filter(([inc])=>NOISE.has(inc.toLowerCase().trim())).reduce((s,[,d])=>s+d.count,0);
            return noiseCount>0&&<div style={{fontSize:9,color:"var(--mut)",marginTop:6,paddingTop:6,borderTop:"1px solid rgba(30,51,82,.3)"}}>{noiseCount} deals marked "N/A" or "No Decision" — excluded</div>;
          })()}
        </div>
      </div>

      {/* ── ALL DEALS TABLE ─────────────────────────────────────────────── */}
      <div style={{background:"var(--card)",border:`1px solid ${hasF?"rgba(37,99,235,.25)":"var(--bdr)"}`,borderRadius:12,overflow:"hidden",transition:"border-color .2s"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
              All Deals — Complete History
              <span className="mono" style={{color:"var(--teal)",fontWeight:700}}>{sorted.length}</span>
              {hasF && <span style={{fontSize:10,color:"var(--sub)"}}>of {LIVE_OPPS.length} total</span>}
            </div>
            <div style={{fontSize:10,color:"var(--mut)",marginTop:3}}>
              {hasF
                ? <span style={{color:"var(--teal)"}}>✓ Filters active — showing {filtered.length} deals matching current filters</span>
                : <span>Won + Open + Closed/Lost · {LIVE_OPPS.length} total deals · no filters active</span>
              }
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>
            {[
              ["All",    `All (${filtered.length})`,          "Every deal — won, lost & open"],
              ["Won",    `Won (${filtered.filter(o=>o.isWon).length})`,              "Closed Won deals only"],
              ["Lost",   `Lost (${filtered.filter(o=>o.isClosed&&!o.isWon).length})`, "Closed Lost / No Opportunity"],
              ["Open",   `Open (${filtered.filter(o=>!o.isClosed).length})`,          "Active + future pipeline"],
            ].map(([key,label,desc])=>(
              <button key={key} title={desc} className={`tab${tableTab===key?" active":""}`}
                onClick={()=>setTableTab(key)}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{overflowX:"auto",maxHeight:480,overflowY:"auto"}}>
          <table>
            <thead style={{position:"sticky",top:0,background:"var(--bg)",zIndex:1}}>
              <tr>
                {[["account","Account"],["amount","Line Item Amt"],["stage","Stage"],["closeDate","Close Date"],["dcRegion","DC Region"],["cxoneInstance","Cluster"],["forecast","Forecast"],["territory","Territory"],["owner","Owner"]].map(([c,l])=>(
                  <th key={c} onClick={()=>hs(c)}>{l}{sortCol===c?sortDir==="asc"?" ↑":" ↓":""}</th>
                ))}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(o=>{
                const st=statusOf(o);
                return <tr key={o.id} className="hover-row" onClick={()=>openDrawer(o)}>
                  <td style={{fontWeight:600,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.account}</td>
                  <td className="mono" style={{color:o.amount>0?"var(--teal)":"var(--mut)",fontWeight:600}}>{fmt(o.amount)}{o.currency!=="USD"?<span style={{fontSize:9,color:"var(--mut)",marginLeft:3}}>{o.currency}</span>:""}</td>
                  <td style={{fontSize:11,color:"var(--sub)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.stage}</td>
                  <td className="mono" style={{fontSize:11,color:"var(--sub)"}}>{o.closeDate}</td>
                  <td>{o.dcRegion?<span className="chip" style={{color:DC_COLORS[o.dcRegion]||"#64748b",fontSize:9}} title={o.dcSource==="inferred"?`Inferred from territory: ${o.territory}`:(o.cxoneInstance?`Cluster: ${o.cxoneInstance}`:"DC Region")}>{o.dcRegion}{o.dcSource==="inferred"&&<span style={{fontSize:7,opacity:.7}}> ~</span>}</span>:<span style={{color:"var(--mut)"}}>—</span>}</td>
                  <td className="mono" style={{fontSize:10,color:"var(--teal)"}}>{o.cxoneInstance||"—"}</td>
                  <td><span className="chip" style={{color:FC[o.forecast]||"var(--mut)",fontSize:9}}>{o.forecast||"—"}</span></td>
                  <td style={{fontSize:11,color:"var(--sub)",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.territory||"—"}</td>
                  <td style={{fontSize:11,color:"var(--sub)"}}>{o.owner}</td>
                  <td><span className="chip" style={{color:SC[st],fontSize:9}}>{st}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"10px 20px",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--mut)"}}>
          <span>{hasF ? `${filtered.length} of ${LIVE_OPPS.length} deals match filters` : `${LIVE_OPPS.length} total`} · {wonOpps.length} commercial wins ({allWonOpps.length} SF won total) · {lostOpps.length} lost · {openOpps.length} open · Source: SF OpportunityLineItem "CXone Interactions Hub Migrat*"</span>
          <a href="https://nice.lightning.force.com/lightning/r/Report/00OUi000000dUkbMAE/view" target="_blank" rel="noreferrer" style={{color:"var(--teal)",textDecoration:"none"}}>↗ SF Report</a>
        </div>
        {(()=>{
          const sfWon = LIVE_OPPS.filter(o=>o.isWon);
          const excluded = sfWon.filter(o=>!(o.amount>0) || /demo/i.test(o.account));
          if(!excluded.length) return null;
          const zeroAmt  = excluded.filter(o=>o.amount===0);
          const negAmt   = excluded.filter(o=>o.amount<0);
          const demoAcct = excluded.filter(o=>/demo/i.test(o.account)&&o.amount>0);
          return (
            <div style={{padding:"10px 20px",borderTop:"1px solid rgba(30,51,82,.2)",background:"rgba(203,213,225,.06)",fontSize:10,color:"var(--mut)",lineHeight:1.7}}>
              <span style={{color:"var(--sub)",fontWeight:600}}>ℹ️ Why the "Won" tab shows {sfWon.length} but KPI cards count {wonOpps.length}:</span>
              {" "}This table includes <strong style={{color:"var(--txt)"}}>all {sfWon.length} Salesforce Closed-Won records</strong>, while KPI cards apply a commercial filter
              (<code style={{fontSize:9,background:"rgba(0,0,0,.12)",padding:"1px 4px",borderRadius:3}}>amount &gt; 0 · no demo account</code>)
              that excludes <strong style={{color:"var(--rose)"}}>{excluded.length} non-commercial wins</strong>:
              {zeroAmt.length>0 && <span> · <strong>{zeroAmt.length} $0 deal{zeroAmt.length>1?"s":""}</strong> ({zeroAmt.map(o=>o.account).join(", ")})</span>}
              {negAmt.length>0  && <span> · <strong>{negAmt.length} negative-amount deal{negAmt.length>1?"s":""}</strong> ({negAmt.map(o=>o.account).join(", ")})</span>}
              {demoAcct.length>0 && <span> · <strong>{demoAcct.length} demo/test account{demoAcct.length>1?"s":""}</strong> ({demoAcct.map(o=>o.account).join(", ")})</span>}
              .
            </div>
          );
        })()}
      </div>

    </>)}

    {/* ════════════════════════════════════════════════════════════════════ */}
    {/*  PIPELINE TAB                                                        */}
    {/* ════════════════════════════════════════════════════════════════════ */}
    {section==="pipeline" && (<>


      {/* ── PIPELINE SECTION HEADER ─────────────────────────────────────── */}
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:800,fontSize:18,letterSpacing:"-.3px",marginBottom:6}}>
          🔭 Migrated Calls Pipeline
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:"var(--sub)"}}>Report: <span style={{color:"var(--teal)",fontWeight:600}}>Migrated Calls Pipeline Report</span></span>
          <span className="mono" style={{fontSize:10,color:"var(--mut)"}}>ID: 00OUi000001SyblMAC</span>
          <span style={{fontSize:11,color:"var(--sub)"}}>·</span>
          <span style={{fontSize:11,color:"var(--sub)"}}><strong style={{color:"var(--teal)"}}>{PIPELINE_LINE_ITEMS.length}</strong> line items · <strong style={{color:"var(--txt)"}}>{[...new Set(PIPELINE_LINE_ITEMS.map(r=>r.oppId))].length}</strong> opportunities</span>
          <span style={{fontSize:11,color:"var(--sub)"}}>· Synced 2026-05-09</span>
          <a href="https://nice.lightning.force.com/lightning/r/Report/00OUi000001SyblMAC/view" target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--teal)",textDecoration:"none"}}>↗ Open in Salesforce</a>
        </div>
      </div>

      {/* ── PIPELINE FILTER BAR ────────────────────────────────────────────── */}
      <div style={{background:"var(--card)",border:`1px solid ${pfHasF?"rgba(37,99,235,.35)":"var(--bdr)"}`,borderRadius:12,marginBottom:14,transition:"border-color .2s",boxShadow:pfHasF?"0 0 0 1px rgba(37,99,235,.12)":"none"}}>
        {/* Toggle header */}
        <div onClick={()=>setPfFilterOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",cursor:"pointer",borderBottom:pfFilterOpen?"1px solid var(--bdr)":"none",userSelect:"none"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.04)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:".8px",color:pfHasF?"var(--teal)":"var(--sub)"}}>⚙ PIPELINE FILTERS</span>
          {pfHasF&&<span style={{fontSize:9,fontWeight:700,background:"rgba(37,99,235,.12)",color:"var(--teal)",borderRadius:99,padding:"1px 8px",border:"1px solid rgba(37,99,235,.25)"}}>
            {[pfSearch.trim(),pfFY!=="All"&&pfFY,pfForecast!=="All"&&pfForecast,pfDC!=="All"&&pfDC,pfRegion!=="All"&&pfRegion,pfCurrency!=="All"&&pfCurrency,pfSKU!=="All"&&pfSKU,pfStage!=="All"&&pfStage,pfTerritory!=="All"&&pfTerritory,pfMinAmt>0&&`$${pfMinAmt}`].filter(Boolean).length} active
          </span>}
          {!pfFilterOpen&&pfHasF&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
              {[pfSearch.trim()&&`"${pfSearch.trim()}"`,pfFY!=="All"&&pfFY,pfForecast!=="All"&&pfForecast,pfDC!=="All"&&pfDC,pfRegion!=="All"&&pfRegion,pfCurrency!=="All"&&pfCurrency,pfSKU!=="All"&&`SKU:${pfSKU.slice(0,20)}`,pfStage!=="All"&&pfStage.replace(/^\d+ - /,""),pfTerritory!=="All"&&pfTerritory,pfMinAmt>0&&`≥$${pfMinAmt}`].filter(Boolean).map((chip,i)=>(
                <span key={i} style={{fontSize:9,background:"rgba(37,99,235,.08)",color:"var(--teal)",borderRadius:99,padding:"1px 7px",border:"1px solid rgba(37,99,235,.2)"}}>{chip}</span>
              ))}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {pfHasF&&<button onClick={e=>{e.stopPropagation();setPfSearch("");setPfFY("All");setPfForecast("All");setPfDC("All");setPfRegion("All");setPfCurrency("All");setPfSKU("All");setPfStage("All");setPfTerritory("All");setPfMinAmt(0);}}
              style={{fontSize:9,fontWeight:700,color:"var(--red)",background:"rgba(244,63,94,.1)",border:"1px solid rgba(244,63,94,.3)",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕ Clear</button>}
            <span style={{fontSize:11,color:"var(--sub)",transform:pfFilterOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block"}}>▾</span>
          </div>
        </div>
        {pfFilterOpen&&<div style={{padding:"12px 16px 14px"}}>
        {/* Row 1 — controls */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginBottom:pfHasF?10:0}}>
          <span style={{fontSize:10,color:"var(--mut)"}}>All filters apply with AND logic</span>

          {/* Search */}
          <div style={{display:"flex",alignItems:"center",gap:6,flex:"1 1 180px",minWidth:160,maxWidth:240}}>
            <span style={{fontSize:11,color:"#64748b"}}>🔍</span>
            <input type="text" value={pfSearch} onChange={e=>setPfSearch(e.target.value)}
              placeholder="Account / opportunity / SKU…"
              style={{flex:1,fontSize:11,padding:"4px 8px",minWidth:0}}/>
            {pfSearch&&<button onClick={()=>setPfSearch("")} style={{background:"transparent",border:"none",color:"var(--mut)",cursor:"pointer",fontSize:12,padding:0}}>✕</button>}
          </div>

          {/* Dropdowns */}
          {[
            ["FY",       pfFY,        setPfFY,        ["All",...pfFYOpts,"FY2028+"]],
            ["Forecast", pfForecast,  setPfForecast,  ["All",...pfForecastOpts]],
            ["DC Region",pfDC,        setPfDC,        ["All",...pfDCOpts]],
            ["Region",   pfRegion,    setPfRegion,    ["All",...pfRegionOpts]],
            ["Currency", pfCurrency,  setPfCurrency,  ["All",...pfCurrencyOpts]],
          ].map(([lbl,val,setter,opts])=>(
            <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:val!=="All"?"var(--teal)":"var(--sub)",fontWeight:val!=="All"?700:400,whiteSpace:"nowrap"}}>{lbl}</span>
              <select value={val} onChange={e=>setter(e.target.value)}
                style={{borderColor:val!=="All"?"var(--teal)":"var(--bdr)",color:val!=="All"?"var(--teal)":"var(--txt)",fontWeight:val!=="All"?700:400}}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:pfStage!=="All"?"var(--teal)":"var(--sub)",fontWeight:pfStage!=="All"?700:400,whiteSpace:"nowrap"}}>Stage</span>
            <select value={pfStage} onChange={e=>setPfStage(e.target.value)}
              style={{borderColor:pfStage!=="All"?"var(--teal)":"var(--bdr)",color:pfStage!=="All"?"var(--teal)":"var(--txt)",fontWeight:pfStage!=="All"?700:400,maxWidth:160}}>
              <option>All</option>{pfStageOpts.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:pfSKU!=="All"?"var(--teal)":"var(--sub)",fontWeight:pfSKU!=="All"?700:400,whiteSpace:"nowrap"}}>SKU</span>
            <select value={pfSKU} onChange={e=>setPfSKU(e.target.value)}
              style={{borderColor:pfSKU!=="All"?"var(--teal)":"var(--bdr)",color:pfSKU!=="All"?"var(--teal)":"var(--txt)",fontWeight:pfSKU!=="All"?700:400,maxWidth:200}}>
              <option>All</option>{pfSKUOpts.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:pfTerritory!=="All"?"var(--teal)":"var(--sub)",fontWeight:pfTerritory!=="All"?700:400,whiteSpace:"nowrap"}}>Territory</span>
            <select value={pfTerritory} onChange={e=>setPfTerritory(e.target.value)}
              style={{borderColor:pfTerritory!=="All"?"var(--teal)":"var(--bdr)",color:pfTerritory!=="All"?"var(--teal)":"var(--txt)",fontWeight:pfTerritory!=="All"?700:400}}>
              <option>All</option>{pfTerritoryOpts.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10,color:pfMinAmt>0?"var(--teal)":"var(--sub)",fontWeight:pfMinAmt>0?700:400}}>Min $</span>
            <input type="number" value={pfMinAmt} onChange={e=>setPfMinAmt(+e.target.value)}
              style={{width:72,borderColor:pfMinAmt>0?"var(--teal)":"var(--bdr)",color:pfMinAmt>0?"var(--teal)":"var(--txt)",fontWeight:pfMinAmt>0?700:400}} placeholder="0"/>
          </div>
        </div>

        {/* Row 2 — active chips */}
        {pfHasF && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",paddingTop:10,borderTop:"1px solid var(--bdr)"}}>
            <span style={{fontSize:10,color:"var(--sub)",marginRight:2}}>Active:</span>
            {[
              pfSearch.trim()     && { label:`Search: "${pfSearch.trim()}"`,       clear:()=>setPfSearch("") },
              pfFY!=="All"        && { label:`FY: ${pfFY}`,                         clear:()=>setPfFY("All") },
              pfForecast!=="All"  && { label:`Forecast: ${pfForecast}`,             clear:()=>setPfForecast("All") },
              pfDC!=="All"        && { label:`DC Region: ${pfDC}`,                  clear:()=>setPfDC("All") },
              pfRegion!=="All"    && { label:`Region: ${pfRegion}`,                 clear:()=>setPfRegion("All") },
              pfCurrency!=="All"  && { label:`Currency: ${pfCurrency}`,             clear:()=>setPfCurrency("All") },
              pfSKU!=="All"       && { label:`SKU: ${pfSKU.slice(0,30)}${pfSKU.length>30?"…":""}`, clear:()=>setPfSKU("All") },
              pfStage!=="All"     && { label:`Stage: ${pfStage.replace(/^\d+ - /,"")}`, clear:()=>setPfStage("All") },
              pfTerritory!=="All" && { label:`Territory: ${pfTerritory}`,           clear:()=>setPfTerritory("All") },
              pfMinAmt>0          && { label:`Min $: ${pfMinAmt.toLocaleString()}`, clear:()=>setPfMinAmt(0) },
            ].filter(Boolean).map((chip,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.25)",borderRadius:99,padding:"2px 8px 2px 10px",fontSize:10,color:"var(--teal)",fontWeight:600}}>
                {chip.label}
                <button onClick={chip.clear} style={{background:"transparent",border:"none",color:"var(--teal)",cursor:"pointer",fontSize:12,padding:0,lineHeight:1,opacity:.7}}>✕</button>
              </span>
            ))}
            <span style={{fontSize:9,color:"var(--mut)",padding:"2px 6px",background:"rgba(255,255,255,.04)",borderRadius:4,border:"1px solid var(--bdr)"}}>AND</span>
            <span style={{fontSize:11,color:"var(--teal)",fontWeight:700,marginLeft:4}}>
              {pfFiltered.length} of {PIPELINE_LINE_ITEMS.length} line items · {[...new Set(pfFiltered.map(r=>r.oppId))].length} of {[...new Set(PIPELINE_LINE_ITEMS.map(r=>r.oppId))].length} opps
            </span>
            <button onClick={()=>{setPfSearch("");setPfFY("All");setPfForecast("All");setPfDC("All");setPfRegion("All");setPfCurrency("All");setPfSKU("All");setPfStage("All");setPfTerritory("All");setPfMinAmt(0);}}
              style={{marginLeft:"auto",background:"transparent",border:"1px solid var(--red)",color:"var(--red)",borderRadius:6,padding:"3px 11px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              ✕ Clear all
            </button>
          </div>
        )}
        </div>}{/* end pfFilterOpen */}
      </div>

      {/* ── PIPELINE KPI CARDS ───────────────────────────────────────────── */}
      {(()=>{
        const total   = pfFiltered.reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0);
        const commit  = pfFiltered.filter(r=>r.forecast==="Commit");
        const ml      = pfFiltered.filter(r=>r.forecast==="Most Likely");
        const bc      = pfFiltered.filter(r=>r.forecast==="Best Case");
        const ls      = pfFiltered.filter(r=>r.forecast==="Long Shot");
        const highPRows = pfFiltered.filter(r=>r.probability>=75);
        const highP   = [...new Set(highPRows.map(r=>r.oppId))].length;
        // Stale: unique opps whose close date is >30 days in the past
        const staleOppIds = [...new Set(pfFiltered.filter(r=>(TODAY_TS-new Date(r.closeDate))/86400000>30).map(r=>r.oppId))];
        const staleRows   = pfFiltered.filter(r=>staleOppIds.includes(r.oppId));
        const staleAmt    = staleRows.reduce((s,r)=>s+(r.totalPrice>0?toUSD(r.totalPrice,r.currency):0),0);
        // Interaction scope: sum migrations services SKU call volumes
        const interRows   = pfFiltered.filter(r=>r.skuFull&&r.skuFull.includes("Migration Services"));
        const totalInter  = interRows.reduce((s,r)=>{
          const m=r.skuFull.match(/Up to ([\d,]+) interactions/);
          return s+(m?parseInt(m[1].replace(/,/g,"")):0);
        },0);
        const fmtI = v=>v>=1e9?`${(v/1e9).toFixed(1)}B`:v>=1e6?`${(v/1e6).toFixed(0)}M`:v.toLocaleString();
        const cards = [
          { l:"TOTAL PIPELINE",    v:fmt(total),                              s:`${pfFiltered.length} SKUs · ${[...new Set(pfFiltered.map(r=>r.oppId))].length} opps · mixed currencies`, a:"#d97706", rows:pfFiltered },
          { l:"COMMIT",            v:fmt(commit.reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)),  s:`${commit.length} line items · ${[...new Set(commit.map(r=>r.oppId))].length} opps`,  a:"#059669", rows:commit },
          { l:"MOST LIKELY",       v:fmt(ml.reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)),      s:`${ml.length} line items · ${[...new Set(ml.map(r=>r.oppId))].length} opps`,          a:"#3b82f6", rows:ml },
          { l:"BEST CASE",         v:fmt(bc.reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)),      s:`${bc.length} line items · ${[...new Set(bc.map(r=>r.oppId))].length} opps`,          a:"#d97706", rows:bc },
          { l:"LONG SHOT",         v:fmt(ls.reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)),      s:`${ls.length} line items · ${[...new Set(ls.map(r=>r.oppId))].length} opps`,          a:"#dc2626", rows:ls },
          { l:"HIGH PROBABILITY",   v:fmt(highPRows.reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)), s:`${highP} opps ≥75% prob (~USD equiv.)`,                                            a:"#7c3aed", rows:highPRows },
          { l:"STALE PIPELINE",    v:fmt(staleAmt),   s:`${staleOppIds.length} opps past close date >30d`,                a:"#f43f5e", rows:staleRows },
          { l:"INTERACTION SCOPE", v:fmtI(totalInter),s:`calls to migrate across ${[...new Set(interRows.map(r=>r.oppId))].length} opps`, a:"#0ea5e9", rows:interRows },
        ];
        return (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18,marginBottom:18}}>
            {cards.map((k,i)=>(
              <div key={i} className="kpi-card fade" style={{background:"var(--card)",borderRadius:14,boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",padding:"14px 16px",animationDelay:`${i*50}ms`}}
                onClick={()=>openModal(k.l,`${k.rows.length} line items · click any row for deal detail`,k.rows.map(r=>({...r, id:r.oppId, name:r.oppName, amount:r.totalPrice, isWon:false, isClosed:false, closeDate:r.closeDate, fy:r.fy, fq:r.fq})))}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:".5px",color:"var(--sub)",marginBottom:8}}>{k.l}</div>
                <div className="mono" style={{fontSize:20,fontWeight:800,color:k.a,letterSpacing:"-1px",marginBottom:3}}>{k.v}</div>
                <div style={{fontSize:10,color:"var(--mut)",marginBottom:5}}>{k.s}</div>
                <div style={{fontSize:9,color:"var(--teal)",opacity:.7}}>☰ view line items</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── FX DISCLAIMER ────────────────────────────────────────────────── */}
      <div style={{fontSize:10,color:"var(--mut)",marginBottom:14,padding:"6px 10px",background:"rgba(203,213,225,.12)",borderRadius:6,borderLeft:"3px solid var(--teal)"}}>
        💱 <strong>KPI cards</strong> show approximate USD equivalents (GBP×1.26 · AUD×0.64 · CAD×0.74 · EUR×1.08). <strong>Table rows</strong> show original local currency — summing rows will differ from card totals for non-USD deals.
      </div>

      {/* ── PIPELINE CHARTS ──────────────────────────────────────────────── */}
      {(()=>{
        const byQ = ["Q1","Q2","Q3","Q4"].map((q,qi)=>({
          q,
          "FY2025": pfFiltered.filter(r=>r.fy===2025&&r.fq===qi+1).reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)||0,
          "FY2026": pfFiltered.filter(r=>r.fy===2026&&r.fq===qi+1).reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)||0,
          "FY2027+":pfFiltered.filter(r=>r.fy>=2027&&r.fq===qi+1).reduce((s,r)=>s+toUSD(r.totalPrice,r.currency),0)||0,
        }));
        const byDC = Object.entries(
          pfFiltered.reduce((a,r)=>{const dc=r.dcRegion||"—";a[dc]=(a[dc]||0)+toUSD(r.totalPrice,r.currency);return a;},{})
        ).map(([dc,value])=>({dc,value})).sort((a,b)=>b.value-a.value).filter(d=>d.value>0);
        const bySKU = Object.entries(
          pfFiltered.reduce((a,r)=>{a[r.sku]=(a[r.sku]||0)+toUSD(r.totalPrice,r.currency);return a;},{})
        ).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
        const byStage = Object.entries(
          pfFiltered.reduce((a,r)=>{const k=r.stage;a[k]=(a[k]||0)+1;return a;},{})
        ).map(([name,value])=>({name:name.replace(/^\d+ - /,''),full:name,value})).sort((a,b)=>b.value-a.value);
        const byInc = Object.entries(
          pfFiltered.filter(r=>r.incumbent).reduce((a,r)=>{a[r.incumbent]=(a[r.incumbent]||0)+1;return a;},{})
        ).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8);
        return (<>
          <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:18,marginBottom:18}}>
            <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
              <div className="stitle">Pipeline by Quarter</div>
              <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any bar to view deals</div>
              <ResponsiveContainer width="100%" height={183}>
                <BarChart data={byQ} barGap={3} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
                  <XAxis dataKey="q" tick={{fontSize:11,fill:"#64748b"}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmt} tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} width={52}/>
                  <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="FY2025" fill="#64748b" radius={[3,3,0,0]} cursor="pointer" onClick={d=>{const qi=["Q1","Q2","Q3","Q4"].indexOf(d.q)+1;const deals=openOpps.filter(o=>o.fy===2025&&o.fq===qi);if(deals.length)openModal(`Pipeline FY2025 ${d.q}`,`${deals.length} open deals`,deals.sort((a,b)=>b.amount-a.amount));}}/>
                  <Bar dataKey="FY2026" fill="#d97706" radius={[3,3,0,0]} cursor="pointer" onClick={d=>{const qi=["Q1","Q2","Q3","Q4"].indexOf(d.q)+1;const deals=openOpps.filter(o=>o.fy===2026&&o.fq===qi);if(deals.length)openModal(`Pipeline FY2026 ${d.q}`,`${deals.length} open deals`,deals.sort((a,b)=>b.amount-a.amount));}}/>
                  <Bar dataKey="FY2027+" fill="#7c3aed" radius={[3,3,0,0]} cursor="pointer" onClick={d=>{const qi=["Q1","Q2","Q3","Q4"].indexOf(d.q)+1;const deals=openOpps.filter(o=>o.fy>=2027&&o.fq===qi);if(deals.length)openModal(`Pipeline FY2027+ ${d.q}`,`${deals.length} open deals`,deals.sort((a,b)=>b.amount-a.amount));}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
              <div className="stitle">Pipeline by DC Region</div>
              <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any row to view deals</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
                {byDC.map((d,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}
                    onClick={()=>{const deals=openOpps.filter(o=>o.dcRegion===d.dc);if(deals.length)openModal(`Pipeline — ${d.dc}`,`${deals.length} open deals in ${d.dc}`,deals.sort((a,b)=>b.amount-a.amount));}}>
                    <span style={{minWidth:28,height:16,borderRadius:3,background:DC_COLORS[d.dc]||"#64748b",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
                      <span style={{fontSize:8,fontWeight:800,color:"#f8fafc"}}>{d.dc}</span>
                    </span>
                    <div style={{flex:1,height:4,borderRadius:99,background:"var(--bdr)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(100,(d.value/byDC[0].value)*100)}%`,background:DC_COLORS[d.dc]||"#64748b",borderRadius:99}}/>
                    </div>
                    <span className="mono" style={{fontSize:10,color:"var(--txt)",minWidth:52,textAlign:"right"}}>{fmt(d.value)}</span>
                    <span style={{fontSize:9,color:"var(--mut)",minWidth:20}}>{pfFiltered.filter(r=>r.dcRegion===d.dc).length}×</span>
                  </div>
                ))}
                {pfFiltered.filter(r=>!r.dcRegion).length>0&&<div style={{fontSize:9,color:"var(--mut)",marginTop:2}}>{pfFiltered.filter(r=>!r.dcRegion).length} items without DC region</div>}
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:18}}>
            {/* SKU breakdown */}
            <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
              <div className="stitle">Pipeline by SKU</div>
              <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any row to view deals</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {bySKU.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}
                    onClick={()=>{const deals=openOpps.filter(o=>(o.product||"").includes(s.name.replace(/\s*–.*$/,"")));openModal(`Pipeline — ${s.name}`,`${deals.length} open deals`,deals.sort((a,b)=>b.amount-a.amount));}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:"var(--txt)",fontWeight:500,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                      <div style={{height:3,borderRadius:99,background:"var(--bdr)"}}>
                        <div style={{height:"100%",width:`${(s.value/bySKU[0].value)*100}%`,background:"linear-gradient(90deg,var(--teal),var(--pur))",borderRadius:99}}/>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div className="mono" style={{fontSize:10,color:"var(--teal)",fontWeight:600}}>{fmt(s.value)}</div>
                      <div style={{fontSize:9,color:"var(--mut)"}}>{pfFiltered.filter(r=>r.sku===s.name).length}×</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Stage */}
            <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
              <div className="stitle">By Sales Stage</div>
              <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any row to view deals</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {byStage.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}
                    onClick={()=>{const deals=openOpps.filter(o=>o.stage===s.full);if(deals.length)openModal(`Stage — ${s.name}`,`${deals.length} open deals`,deals.sort((a,b)=>b.amount-a.amount));}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:"var(--txt)",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{s.name}</div>
                      <div style={{height:3,borderRadius:99,background:"var(--bdr)"}}>
                        <div style={{height:"100%",width:`${(s.value/byStage[0].value)*100}%`,background:"var(--teal)",borderRadius:99}}/>
                      </div>
                    </div>
                    <span className="mono" style={{fontSize:11,color:"var(--teal)",width:20,textAlign:"right",fontWeight:600,flexShrink:0}}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Incumbent */}
            <div style={{background:"var(--card)",borderRadius:14,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
              <div className="stitle">Incumbents in Pipeline</div>
              <div style={{fontSize:10,color:"var(--mut)",marginBottom:4,marginTop:2}}>Click any row to view deals</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {byInc.map((d,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}
                    onClick={()=>{const deals=openOpps.filter(o=>o.mainIncumbent===d.name||o.currentProvider===d.name);if(deals.length)openModal(`Pipeline vs ${d.name}`,`${deals.length} open deals with ${d.name} as incumbent`,deals.sort((a,b)=>b.amount-a.amount));}}>
                    <span style={{fontSize:11,flex:1,color:"var(--txt)",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.name}</span>
                    <div style={{width:60,height:3,borderRadius:99,background:"var(--bdr)"}}>
                      <div style={{height:"100%",width:`${(d.value/byInc[0].value)*100}%`,background:"var(--pur)",borderRadius:99}}/>
                    </div>
                    <span className="mono" style={{fontSize:10,color:"var(--sub)",width:18,textAlign:"right",flexShrink:0}}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>);
      })()}

      {/* ── PIPELINE TABLE — ONE ROW PER SKU / LINE ITEM ─────────────────── */}
      <div style={{background:"var(--card)",border:"1px solid rgba(245,158,11,.25)",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{fontWeight:700,fontSize:13}}>Pipeline — Line Items</div>
          <span className="mono" style={{color:"#d97706",fontWeight:600}}>{pfFiltered.length}</span>
          {pfHasF&&<span style={{fontSize:10,color:"var(--sub)"}}>of {PIPELINE_LINE_ITEMS.length} total</span>}
          <span style={{fontSize:11,color:"var(--mut)"}}>one row per SKU · matches SF report</span>
          {pfHasF&&<span style={{fontSize:10,color:"var(--teal)"}}>✓ {pfFiltered.length} match filters</span>}
          <div style={{flex:1}}/>
          <span style={{fontSize:10,color:"var(--sub)"}}>Click any row to view opportunity details</span>
        </div>
        <div style={{overflowX:"auto",maxHeight:540,overflowY:"auto"}}>
          <table>
            <thead style={{position:"sticky",top:0,background:"var(--bg)",zIndex:1}}>
              <tr>
                {[["account","Account"],["oppName","Opportunity"],["sku","SKU / Product"],
                  ["totalPrice","Total Price"],["listPrice","List Price"],["unitPrice","Unit Price"],["quantity","Qty"],
                  ["expRevenue","Exp. Revenue"],["closeDate","Close Date"],["fy","FY · Q"],
                  ["forecast","Forecast"],["forecastCat","Forecast Cat."],["dcRegion","DC Region"],
                  ["cluster","Cluster"],["region","Region"],["segment","Segment"],["territory","Territory"],
                  ["currency","Currency"],["industry","Industry"],["contractType","Contract Type"],
                  ["incumbent","Incumbent"],["probability","Prob %"],["stage","Stage"],["nextStep","Next Step"],
                ].map(([col,lbl])=>(
                  <th key={col} onClick={()=>{setPSort(col);setPDir(d=>pSort===col?(d==="asc"?"desc":"asc"):"asc");}}
                    style={{color:pSort===col?"var(--teal)":"var(--sub)",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {lbl}{pSort===col?(pDir==="asc"?" ↑":" ↓"):""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...pfFiltered].sort((a,b)=>{
                let va=a[pSort]??0,vb=b[pSort]??0;
                if(typeof va==="string"){va=va.toLowerCase();vb=vb.toLowerCase();}
                return pDir==="asc"?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0);
              }).map((r,i)=>(
                <tr key={r.lineItemId} className="hover-row"
                  style={{background: (()=>{const od=Math.floor((TODAY_TS-new Date(r.closeDate))/86400000);return od>30?"rgba(244,63,94,.05)":i>0&&pfFiltered[i-1].oppId===r.oppId?"rgba(37,99,235,.02)":"transparent";})()}}
                  onClick={()=>openModal(r.account, r.oppName, [{ id:r.oppId, name:r.oppName, account:r.account, stage:r.stage, isWon:false, isClosed:false, amount:r.totalPrice, oppAmount:r.oppAmount, closeDate:r.closeDate, fy:r.fy, fq:r.fq, forecast:r.forecast, territory:r.territory, region:r.region, cxoneInstance:r.cluster, dcRegion:r.dcRegion, currency:r.currency, industry:r.industry, contractType:r.contractType, mainIncumbent:r.incumbent, probability:r.probability, nextStep:r.nextStep, product:r.sku }])}>
                  <td style={{fontWeight:600,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.account}</td>
                  <td style={{fontSize:10,color:"var(--sub)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.oppName}</td>
                  <td style={{fontSize:11,color:"var(--teal)",fontWeight:500,maxWidth:220,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={r.skuFull}>{r.sku}</td>
                  <td className="mono" style={{color:r.totalPrice>0?"var(--teal)":r.totalPrice<0?"var(--red)":"var(--mut)",fontWeight:600,whiteSpace:"nowrap"}}>
                    {fmt(r.totalPrice)}{r.currency!=="USD"?<span style={{fontSize:9,color:"var(--mut)",marginLeft:2}}>{r.currency}</span>:""}
                  </td>
                  <td className="mono" style={{fontSize:11,color:"var(--sub)"}}>{fmt(r.listPrice)}</td>
                  <td className="mono" style={{fontSize:10,color:"var(--sub)"}}>{r.unitPrice > 1 ? fmt(r.unitPrice) : r.unitPrice.toFixed(4)}</td>
                  <td className="mono" style={{fontSize:10,color:"var(--sub)",textAlign:"right"}}>{r.quantity > 1 ? r.quantity.toLocaleString() : r.quantity}</td>
                  <td className="mono" style={{fontSize:11,color:r.expRevenue>0?"var(--grn)":"var(--mut)"}}>{r.expRevenue>0?fmt(r.expRevenue):"—"}</td>
                  <td className="mono" style={{fontSize:11,color:"var(--sub)",whiteSpace:"nowrap"}}>
                      {r.closeDate}
                      {(()=>{
                        const od=Math.floor((TODAY_TS-new Date(r.closeDate))/86400000);
                        if(od>30) return <span style={{marginLeft:6,fontSize:9,fontWeight:700,color:"#dc2626",background:"rgba(244,63,94,.15)",borderRadius:3,padding:"1px 5px"}}>⚠ {od}d overdue</span>;
                        if(od>0)  return <span style={{marginLeft:6,fontSize:9,color:"#d97706",background:"rgba(245,158,11,.12)",borderRadius:3,padding:"1px 5px"}}>⚡ due soon</span>;
                        return null;
                      })()}</td>
                  <td className="mono" style={{fontSize:10,color:"var(--sub)",whiteSpace:"nowrap"}}>FY{r.fy} Q{r.fq}</td>
                  <td><span className="chip" style={{color:FC[r.forecast]||"var(--mut)",fontSize:9}}>{r.forecast}</span></td>
                  <td style={{fontSize:10,color:"var(--sub)",whiteSpace:"nowrap"}}>{r.forecastCat}</td>
                  <td>{r.dcRegion?<span className="chip" style={{color:DC_COLORS[r.dcRegion]||"#64748b",fontSize:9}} title={r.dcSource==="inferred"?`Inferred from territory: ${r.territory}`:(r.cluster?`Cluster: ${r.cluster}`:"DC Region")}>{r.dcRegion}{r.dcSource==="inferred"&&<span style={{fontSize:7,opacity:.7}}> ~</span>}</span>:<span style={{color:"var(--mut)"}}>—</span>}</td>
                  <td className="mono" style={{fontSize:10,color:"var(--teal)"}}>{r.cluster||"—"}</td>
                  <td style={{fontSize:11,color:"var(--sub)"}}>{r.region||"—"}</td>
                  <td style={{fontSize:10,color:"var(--sub)"}}>{r.segment||"—"}</td>
                  <td style={{fontSize:11,color:"var(--sub)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.territory||"—"}</td>
                  <td className="mono" style={{fontSize:10,color:"var(--sub)"}}>{r.currency}</td>
                  <td style={{fontSize:10,color:"var(--sub)",whiteSpace:"nowrap"}}>{r.industry||"—"}</td>
                  <td style={{fontSize:10,color:"var(--sub)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.contractType||"—"}</td>
                  <td style={{fontSize:11,color:"var(--sub)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.incumbent||"—"}</td>
                  <td className="mono" style={{color:r.probability>=75?"var(--grn)":r.probability>=50?"var(--amb)":r.probability>0?"var(--sub)":"var(--mut)",fontWeight:r.probability>=75?700:400}}>{r.probability>0?`${r.probability}%`:"—"}</td>
                  <td style={{fontSize:10,color:"var(--sub)",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.stage}</td>
                  <td style={{fontSize:10,color:"var(--sub)",maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={r.nextStep}>{r.nextStep||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:"10px 20px",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--mut)"}}>
          <span>{pfHasF?`${pfFiltered.length} of ${PIPELINE_LINE_ITEMS.length} line items match filters`:`${PIPELINE_LINE_ITEMS.length} total line items`} · {[...new Set(pfFiltered.map(r=>r.oppId))].length} opportunities · Source: SF OpportunityLineItem IsClosed=false · Synced 2026-05-09</span>
          <a href="https://nice.lightning.force.com/lightning/r/Report/00OUi000001SyblMAC/view" target="_blank" rel="noreferrer" style={{color:"var(--teal)",textDecoration:"none"}}>↗ SF Report</a>
        </div>
      </div>
    </>)}

    {/* ════════════════════════════════════════════════════════════════════ */}
    {/*  DELIVERY TAB                                                        */}
    {/* ════════════════════════════════════════════════════════════════════ */}
    {section==="delivery" && (<>

      {/* ── DELIVERY HEADER ─────────────────────────────────────────────── */}
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:800,fontSize:18,letterSpacing:"-.3px",marginBottom:6}}>🚚 Customer Migration Delivery</div>
        <div style={{fontSize:12,color:"var(--sub)"}}>Tracked delivery for {TENANTS.length} booked customers · Source: Confluence MCR</div>
      </div>




      {/* ── DELIVERY KPIs ───────────────────────────────────────────────── */}
      {/* Row A — delivery status */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:16}}>
        {[
          { l:"COMPLETED",             v:engDone,       s:`${Math.round((engDone/TENANTS.length)*100)}% of ${TENANTS.length} customers`, a:"#059669", status:"Completed" },
          { l:"IN DISCUSSION / IN POC",v:engDiscussion, s:"Migrations underway or in evaluation",                                        a:"#d97706", status:"In Discussion / In POC" },
          { l:"NOT STARTED",           v:engNS,         s:"Booked, delivery pending",                                                    a:"#64748b", status:"Not Started" },
          { l:"CALLS MIGRATED",        v:callsCompleted>=1e6?`${(callsCompleted/1e6).toFixed(0)}M`:callsCompleted.toLocaleString(),      s:`${engDone} customers completed`, a:"#059669", status:null },
        ].map((k,i)=>(
          <div key={i} style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:14,padding:"22px 24px",cursor:k.status?"pointer":"default",transition:"border-color .15s"}}
            onClick={()=>k.status&&setEngTab(k.status)}
            onMouseEnter={e=>{if(k.status)e.currentTarget.style.borderColor="var(--teal)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bdr)";}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".5px",color:"var(--sub)",marginBottom:8}}>{k.l}</div>
            <div style={{fontSize:40,fontWeight:800,color:k.a,letterSpacing:"-2px",marginBottom:6,fontFamily:"'Sora',sans-serif"}}>{k.v}</div>
            {k.status&&<div style={{height:3,borderRadius:99,background:"var(--bdr)",marginBottom:6}}>
              <div style={{height:"100%",width:`${Math.min(100,(k.v/(TENANTS.length||1))*100)}%`,background:k.a,borderRadius:99}}/>
            </div>}
            <div style={{fontSize:10,color:"var(--mut)"}}>{k.s}</div>
          </div>
        ))}
      </div>
      {/* Row B — calls metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:20}}>
        {[
          { l:"CALLS IN FLIGHT",    v:callsInProgress>=1e6?`${(callsInProgress/1e6).toFixed(0)}M`:callsInProgress.toLocaleString(), s:`${engProg} customer${engProg!==1?"s":""} in progress`, a:"#d97706" },
          { l:"AVG DELIVERY",       v:bookingToLiveGap?`${bookingToLiveGap.avg} mo`:"—", s:bookingToLiveGap?`Range: ${bookingToLiveGap.min}–${bookingToLiveGap.max} mo`:"No data", a:"#7c3aed" },
          { l:"CALLS BACKLOG",      v:notStartedCalls>=1e6?`${(notStartedCalls/1e6).toFixed(0)}M`:(notStartedCalls>0?notStartedCalls.toLocaleString():"TBD"), s:`Not started customers`, a:"#dc2626" },
          { l:"SCOPE MIGRATED",     v:`${callScopePct}%`, s:`${callsCompleted>=1e6?(callsCompleted/1e6).toFixed(0)+"M":callsCompleted.toLocaleString()} of ${totalCallScope>=1e6?(totalCallScope/1e6).toFixed(0)+"M":totalCallScope.toLocaleString()} calls`, a:callScopePct>=75?"#059669":callScopePct>=40?"#d97706":"#f43f5e" },
          { l:"STORAGE COMMITTED",  v:`${totalStorageTB} TB`, s:`across ${storageKnown} of ${TENANTS.length} customers`, a:"#64748b" },
        ].map((k,i)=>(
          <div key={i} style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:14,padding:"22px 24px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".5px",color:"var(--sub)",marginBottom:8}}>{k.l}</div>
            <div style={{fontSize:40,fontWeight:800,color:k.a,letterSpacing:"-2px",marginBottom:6,fontFamily:"'Sora',sans-serif"}}>{k.v}</div>
            <div style={{fontSize:10,color:"var(--mut)"}}>{k.s}</div>
          </div>
        ))}
      </div>

      {/* ── MIGRATION PROGRESS FUNNEL ──────────────────────────────────────── */}
      <div style={{background:"var(--card)",borderRadius:14,padding:"18px 22px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",marginBottom:14}}>
        <div className="stitle" style={{marginBottom:12}}>Migration Progress — Booking to Delivery</div>
        <div style={{display:"flex",alignItems:"stretch",gap:0}}>
          {[
            { label:"Booked",     value:TENANTS.length,                                   color:"#3b82f6", pct:100 },
            { label:"Completed",  value:TENANTS.filter(t=>t.status==="Completed").length,  color:"#059669", pct:Math.round(TENANTS.filter(t=>t.status==="Completed").length/TENANTS.length*100) },
            { label:"In Discussion / In POC", value:TENANTS.filter(t=>t.status==="In Progress"||t.status==="In POC").length, color:"#d97706", pct:Math.round(TENANTS.filter(t=>t.status==="In Progress"||t.status==="In POC").length/TENANTS.length*100) },
            { label:"Not Started",value:TENANTS.filter(t=>t.status==="Not Started").length, color:"#64748b", pct:Math.round(TENANTS.filter(t=>t.status==="Not Started").length/TENANTS.length*100) },
          ].map((s,i,arr)=>(
            <div key={i} style={{flex:1,position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              {/* Arrow connector */}
              {i>0&&<div style={{position:"absolute",left:-1,top:"28%",width:2,height:"44%",background:"var(--bdr)",zIndex:1}}/>}
              <div style={{width:"100%",padding:"10px 12px",background:`${s.color}18`,border:`1px solid ${s.color}44`,borderRadius:8,textAlign:"center",cursor:"pointer",transition:"border-color .15s"}}
                onClick={()=>setEngTab(s.label==="Booked"?"All":s.label==="In Discussion / In POC"?"In Discussion / In POC":s.label)}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=`${s.color}44`;}}>
                <div className="mono" style={{fontSize:24,fontWeight:800,color:s.color,letterSpacing:"-1px"}}>{s.value}</div>
                <div style={{fontSize:10,fontWeight:600,color:s.color,marginTop:2}}>{s.label}</div>
                <div style={{fontSize:9,color:"var(--mut)",marginTop:1}}>{s.pct}% of booked</div>
              </div>
              {/* Progress bar under each stage */}
              <div style={{width:"80%",height:4,background:"var(--bdr)",borderRadius:99}}>
                <div style={{height:"100%",width:`${s.pct}%`,background:s.color,borderRadius:99,transition:"width .4s"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CUSTOMER MIGRATION DELIVERY ─────────────────────────────────── */}
      {/* Filter bar */}
      <div style={{background:"var(--card)",border:`1px solid ${engHasF?"rgba(37,99,235,.35)":"var(--bdr)"}`,borderRadius:12,marginBottom:10,transition:"border-color .2s",boxShadow:engHasF?"0 0 0 1px rgba(37,99,235,.12)":"none"}}>
        {/* Toggle header */}
        <div onClick={()=>setEngFilterOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",cursor:"pointer",borderBottom:engFilterOpen?"1px solid var(--bdr)":"none",userSelect:"none"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.04)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:".8px",color:engHasF?"var(--teal)":"var(--sub)"}}>⚙ DELIVERY FILTERS</span>
          {engHasF&&<span style={{fontSize:9,fontWeight:700,background:"rgba(37,99,235,.12)",color:"var(--teal)",borderRadius:99,padding:"1px 8px",border:"1px solid rgba(37,99,235,.25)"}}>
            {[engSearch.trim(),engTab!=="All"&&engTab,engDcFilt!=="All"&&engDcFilt,engSrcFilt!=="All"&&engSrcFilt,engRelFilt!=="All"&&engRelFilt].filter(Boolean).length} active
          </span>}
          {!engFilterOpen&&engHasF&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
              {[engSearch.trim()&&`"${engSearch.trim()}"`,engTab!=="All"&&engTab,engDcFilt!=="All"&&engDcFilt,engSrcFilt!=="All"&&engSrcFilt,engRelFilt!=="All"&&engRelFilt].filter(Boolean).map((chip,i)=>(
                <span key={i} style={{fontSize:9,background:"rgba(37,99,235,.08)",color:"var(--teal)",borderRadius:99,padding:"1px 7px",border:"1px solid rgba(37,99,235,.2)"}}>{chip}</span>
              ))}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {engHasF&&<button onClick={e=>{e.stopPropagation();setEngSearch("");setEngTab("All");setEngDcFilt("All");setEngSrcFilt("All");setEngRelFilt("All");}}
              style={{fontSize:9,fontWeight:700,color:"var(--red)",background:"rgba(244,63,94,.1)",border:"1px solid rgba(244,63,94,.3)",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕ Clear</button>}
            <span style={{fontSize:11,color:"var(--sub)",transform:engFilterOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block"}}>▾</span>
          </div>
        </div>
        {engFilterOpen&&<div style={{padding:"10px 16px 12px"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginBottom:engHasF?10:0}}>
          <span style={{fontSize:10,color:"var(--teal)",fontWeight:700,letterSpacing:".8px"}}>DELIVERY FILTERS</span>
          <div style={{display:"flex",alignItems:"center",gap:5,flex:"1 1 150px",minWidth:130,maxWidth:210}}>
            <span style={{fontSize:11,color:"#64748b",flexShrink:0}}>🔍</span>
            <input type="text" value={engSearch} onChange={e=>setEngSearch(e.target.value)} placeholder="Customer / source…" style={{flex:1,fontSize:11,padding:"4px 8px",minWidth:0}}/>
            {engSearch&&<button onClick={()=>setEngSearch("")} style={{background:"transparent",border:"none",color:"var(--mut)",cursor:"pointer",fontSize:12,padding:0}}>✕</button>}
          </div>
          {[["Release",engRelFilt,setEngRelFilt,["All",...engRelOpts]],
            ["DC Region",engDcFilt,setEngDcFilt,["All",...engDcOpts]],
            ["Source",engSrcFilt,setEngSrcFilt,["All",...engSrcOpts]],
          ].map(([lbl,val,setter,opts])=>(
            <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:val!=="All"?"var(--teal)":"var(--sub)",fontWeight:val!=="All"?700:400,whiteSpace:"nowrap"}}>{lbl}</span>
              <select value={val} onChange={e=>setter(e.target.value)} style={{borderColor:val!=="All"?"var(--teal)":"var(--bdr)",color:val!=="All"?"var(--teal)":"var(--txt)",fontWeight:val!=="All"?700:400,maxWidth:140}}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {engHasF&&<button onClick={()=>{setEngSearch("");setEngTab("All");setEngDcFilt("All");setEngSrcFilt("All");setEngRelFilt("All");}}
            style={{marginLeft:"auto",background:"transparent",border:"1px solid var(--red)",color:"var(--red)",borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕ Clear</button>}
        </div>
        {engHasF&&<div style={{fontSize:10,color:"var(--teal)",paddingTop:8,borderTop:"1px solid var(--bdr)"}}>
          <strong>{engFiltered.length}</strong> of {TENANTS.length} customers match
        </div>}
        </div>}{/* end engFilterOpen */}
      </div>

      {/* Customer delivery table */}
      <div style={{background:"var(--card)",borderRadius:14,boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <span style={{fontWeight:700,fontSize:13}}>Customer Migration Delivery</span>
            <span style={{fontSize:11,color:"var(--sub)",marginLeft:10}}>{engFiltered.length}{engHasF?<span style={{color:"var(--mut)"}}> of {TENANTS.length}</span>:""} customers</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {["All","Completed","In Discussion / In POC","Not Started"].map(f=>(
              <button key={f} onClick={()=>setEngTab(f)} style={{
                padding:"4px 11px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",
                fontFamily:"'Outfit',sans-serif",border:"1px solid",
                borderColor:engTab===f?"var(--teal)":"var(--bdr)",
                background:engTab===f?"var(--teal)":"transparent",
                color:engTab===f?"#f8fafc":"var(--sub)",transition:"all .15s"
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{overflowX:"auto",maxHeight:420,overflowY:"auto"}}>
          <table>
            <thead style={{position:"sticky",top:0,background:"var(--bg)",zIndex:1}}>
              <tr>
                {[["customer","Customer"],["dcRegion","DC Region"],["bookingQ","Booking Q"],["source","Source"],["sku","SKU"],["storageTB","TB"],["calls","Migrated Calls"],["goLive","Go Live"],["status","Status"]].map(([col,lbl])=>(
                  <th key={col} onClick={()=>{setEngSort(col);setEngSortDir(d=>engSort===col?(d==="asc"?"desc":"asc"):"asc");}}
                    style={{color:engSort===col?"var(--teal)":"var(--sub)"}}>
                    {lbl}{engSort===col?(engSortDir==="asc"?" ↑":" ↓"):""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...engFiltered].sort((a,b)=>{
                let va=a[engSort]??"",vb=b[engSort]??"";
                if(typeof va==="string"){va=va.toLowerCase();vb=vb.toLowerCase();}
                return engSortDir==="asc"?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0);
              }).map((t,i)=>{
                const SC2 = {Completed:"var(--grn)","In Progress":"var(--amb)","In POC":"var(--amb)","Not Started":"var(--sub)"};
                return (
                  <tr key={i} className="hover-row" onClick={()=>setTenantDetail(t)} style={{cursor:"pointer"}}>
                    <td style={{fontWeight:600,color:"var(--txt)"}}>{t.customer}</td>
                    <td><span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:3,background:"rgba(37,99,235,.1)",color:"var(--teal)"}}>{t.dcRegion||"—"}</span></td>
                    <td className="mono" style={{fontSize:11,color:"var(--sub)"}}>{t.bookingQ}</td>
                    <td style={{fontSize:11,color:"var(--sub)",maxWidth:140,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={t.source}>{t.source||"—"}</td>
                    <td style={{fontSize:11,color:"var(--sub)"}}>{t.sku||"—"}</td>
                    <td className="mono" style={{fontSize:11,color:"var(--sub)"}}>{t.storageTB!=null?`${t.storageTB} TB`:"—"}</td>
                    <td>
                      <div style={{fontSize:11,color:t.calls?"var(--teal)":"var(--mut)",fontWeight:t.calls?600:400,marginBottom:2}}>{t.calls?`${(t.calls/1e6).toFixed(1)}M`:"—"}</div>
                      {t.calls&&<div style={{width:64,height:3,borderRadius:99,background:"var(--bdr)"}}>
                        <div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,var(--teal),var(--pur))",width:`${Math.min(100,Math.round(t.calls/Math.max(...TENANTS.map(x=>x.calls||0))*100))}%`}}/>
                      </div>}
                    </td>
                    <td>{t.goLive && t.goLive!=="—"
                      ? <span className="mono" style={{fontSize:11,fontWeight:700,color:"#059669",background:"rgba(34,211,164,.1)",padding:"2px 7px",borderRadius:4}}>{t.goLive}</span>
                      : t.status==="Completed"
                        ? <span style={{fontSize:10,color:"var(--mut)"}}>—</span>
                        : t.status==="In Progress"
                          ? <span style={{fontSize:10,color:"var(--amb)",fontStyle:"italic"}}>In flight</span>
                          : <span style={{fontSize:10,color:"var(--mut)"}}>Not scheduled</span>
                    }</td>
                    <td><span className="chip" style={{color:SC2[t.status]||"var(--sub)",fontSize:9}}>{t.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"10px 20px",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--mut)"}}>
          <span>Source: Confluence "Hybrid-Recording tenants summary" · Last updated 2026-05-07</span>
          <a href="https://nice-ce-cxone-prod.atlassian.net/wiki/spaces/MCR/pages/1677295668" target="_blank" rel="noreferrer" style={{color:"var(--teal)",textDecoration:"none"}}>↗ Confluence</a>
        </div>
      </div>

      {/* ── SOURCE SYSTEM BREAKDOWN ────────────────────────────────────────── */}
      <div style={{background:"var(--card)",borderRadius:14,padding:"18px 22px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",marginBottom:14}}>
        <div className="stitle" style={{marginBottom:4}}>Migration Source Systems</div>
        <div style={{fontSize:10,color:"var(--mut)",marginBottom:10}}>Incumbent on {wonOpps.length} commercial won deals (excl. $0 & demo)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={sourceSystemData} margin={{left:0,right:20,top:4,bottom:36}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:"#64748b",angle:-30,textAnchor:"end"}} axisLine={false} tickLine={false} interval={0}/>
            <YAxis tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="value" name="Customers" radius={[4,4,0,0]}>
              {sourceSystemData.map((e,i)=>{
                const colors=["#2563eb","#7c3aed","#d97706","#3b82f6","#dc2626","#10b981","#fb923c"];
                return <Cell key={i} fill={colors[i%colors.length]}/>;
              })}
              <LabelList dataKey="value" position="top" style={{fontSize:10,fill:"#64748b"}}/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>)}

    {/* ════════════════════════════════════════════════════════════════════ */}
    {/*  EPICS TAB                                                           */}
    {/* ════════════════════════════════════════════════════════════════════ */}
    {section==="epics" && (<>

      {/* ── EPICS HEADER ──────────────────────────────────────────────────── */}
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:800,fontSize:18,letterSpacing:"-.3px",marginBottom:6}}>⚙️ Engineering Epics — CXREC Project</div>
        <div style={{fontSize:12,color:"var(--sub)"}}>{LIVE_EPICS.length} epics across {RELEASES.length} releases · Live from Jira · <a href="https://nice-ce-cxone-prod.atlassian.net/jira/software/c/projects/CXREC/boards" target="_blank" rel="noreferrer" style={{color:"var(--teal)",textDecoration:"none"}}>↗ Open Board</a></div>
      </div>



      {/* ── EPIC HEALTH + ASSIGNEE RISK ────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18,marginBottom:16}}>

        {/* Epic Health per Release */}
        <div style={{background:"var(--card)",borderRadius:14,padding:"18px 22px",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"}}>
          <div className="stitle" style={{marginBottom:12}}>Epic Delivery Health</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {epicHealthByRelease.map((r,i)=>{
              const col=r.pct===100?"#059669":r.pct>0?"#d97706":"#64748b";
              const relStatus=RELEASES.find(x=>x.v===r.rv);
              const rsColor={"Released":"#059669","In Progress":"#d97706","Planned":"#7c3aed"}[relStatus?.status]||"#64748b";
              return <div key={i}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span className="mono" style={{fontSize:12,fontWeight:800,color:rsColor,minWidth:36}}>{r.rv}</span>
                  <div style={{flex:1,height:8,background:"var(--bdr)",borderRadius:99,overflow:"hidden",display:"flex"}}>
                    <div style={{width:`${r.pct}%`,background:"#059669",transition:"width .4s",borderRadius:99}}/>
                    <div style={{width:`${Math.round(r.active/r.total*100)}%`,background:"#d97706",transition:"width .4s"}}/>
                  </div>
                  <span className="mono" style={{fontSize:10,fontWeight:700,color:col,minWidth:30,textAlign:"right"}}>{r.pct}%</span>
                  <span style={{fontSize:9,color:"var(--mut)",minWidth:60}}>
                    {r.done>0&&<span style={{color:"#059669"}}>✓{r.done} </span>}
                    {r.active>0&&<span style={{color:"#d97706"}}>◉{r.active} </span>}
                    {r.open>0&&<span style={{color:"#64748b"}}>○{r.open}</span>}
                  </span>
                </div>
              </div>;
            })}
          </div>
          <div style={{marginTop:10,display:"flex",gap:12,fontSize:9,color:"var(--mut)"}}>
            <span><span style={{color:"#059669"}}>■</span> Done</span>
            <span><span style={{color:"#d97706"}}>■</span> In Progress / In Definition</span>
            <span><span style={{color:"#64748b"}}>■</span> Not Started</span>
          </div>
        </div>

        {/* Assignee Concentration Risk */}
        <div style={{background:"var(--card)",border:`1px solid ${assigneeRisk[0]?.pct>=40?"rgba(244,63,94,.4)":"var(--bdr)"}`,borderRadius:12,padding:"16px 20px"}}>
          <div className="stitle" style={{marginBottom:4}}>Assignee Concentration</div>
          <div style={{fontSize:10,color:"var(--mut)",marginBottom:12}}>Epic ownership risk across {JIRA_EPICS.length} epics</div>
          {assigneeRisk[0]?.pct>=40&&(
            <div style={{background:"rgba(244,63,94,.08)",border:"1px solid rgba(244,63,94,.25)",borderRadius:7,padding:"7px 10px",marginBottom:10,fontSize:10}}>
              <span style={{color:"#dc2626",fontWeight:700}}>⚠ Concentration Risk: </span>
              <span style={{color:"var(--sub)"}}>{assigneeRisk[0].name} owns {assigneeRisk[0].pct}% of all epics</span>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {assigneeRisk.map((a,i)=>{
              const isRisk=a.pct>=40;
              return <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:isRisk?"#dc2626":i===1?"#d97706":"#3b82f6",flexShrink:0}}/>
                <span style={{fontSize:10,flex:1,color:"var(--txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>
                <div style={{width:60,height:5,background:"var(--bdr)",borderRadius:99,flexShrink:0}}>
                  <div style={{height:"100%",borderRadius:99,background:isRisk?"#dc2626":i===1?"#d97706":"#3b82f6",width:`${a.pct}%`}}/>
                </div>
                <span className="mono" style={{fontSize:10,color:isRisk?"#dc2626":"var(--sub)",fontWeight:isRisk?700:400,minWidth:28,textAlign:"right"}}>{a.pct}%</span>
                <span style={{fontSize:9,color:"var(--mut)",minWidth:16,textAlign:"right"}}>{a.cnt}</span>
              </div>;
            })}
          </div>
        </div>
      </div>

      {/* ── RELEASE STATUS STRIP (replaces full roadmap) ─────────────────── */}
      <div style={{background:"var(--card)",borderRadius:14,boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",padding:"12px 20px",marginBottom:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:".8px",color:"var(--sub)",marginRight:4}}>RELEASES</span>
        {RELEASES.map(r=>{
          const col = RC[r.status]||"#64748b";
          const cnt = JIRA_EPICS.filter(j=>j.release===r.v).length;
          if(cnt===0) return null;
          return <div key={r.v} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.03)",borderRadius:7,padding:"5px 10px",border:`1px solid ${col}44`,cursor:"pointer"}}
            onClick={()=>{setJRelease(r.v); setShowJira(true);}}>
            <span className="mono" style={{fontSize:12,fontWeight:800,color:col}}>{r.v}</span>
            <span className="chip" style={{color:col,fontSize:8,display:"inline-flex",alignItems:"center",gap:3}}>
              {r.status==="In Progress"&&<span className="live" style={{width:4,height:4,borderRadius:"50%",background:col,display:"inline-block"}}/>}{r.status}
            </span>
            <span style={{fontSize:9,color:"var(--mut)"}}>{cnt} epic{cnt!==1?"s":""}</span>
          </div>;
        })}
        <span style={{marginLeft:"auto",fontSize:10,color:"var(--mut)"}}>Click a release to filter epics below</span>
      </div>

      {/* ── JIRA EPIC FILTER BAR ───────────────────────────────────────────── */}
      <div style={{background:"var(--card)",border:`1px solid ${jHasF?"rgba(37,99,235,.35)":"var(--bdr)"}`,borderRadius:12,marginBottom:14,transition:"border-color .2s",boxShadow:jHasF?"0 0 0 1px rgba(37,99,235,.12)":"none"}}>
        {/* Toggle header */}
        <div onClick={()=>setJFilterOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",cursor:"pointer",borderBottom:jFilterOpen?"1px solid var(--bdr)":"none",userSelect:"none"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.04)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:".8px",color:jHasF?"var(--teal)":"var(--sub)"}}>⚙ EPIC FILTERS</span>
          {jHasF&&<span style={{fontSize:9,fontWeight:700,background:"rgba(37,99,235,.12)",color:"var(--teal)",borderRadius:99,padding:"1px 8px",border:"1px solid rgba(37,99,235,.25)"}}>
            {[jSearch.trim(),jRelease!=="All"&&jRelease,jStatus!=="All"&&jStatus,jAssignee!=="All"&&jAssignee,jFeature!=="All"&&jFeature].filter(Boolean).length} active
          </span>}
          {!jFilterOpen&&jHasF&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
              {[jSearch.trim()&&`"${jSearch.trim()}"`,jRelease!=="All"&&`v${jRelease}`,jStatus!=="All"&&jStatus,jAssignee!=="All"&&jAssignee.split(" ")[0],jFeature!=="All"&&jFeature].filter(Boolean).map((chip,i)=>(
                <span key={i} style={{fontSize:9,background:"rgba(37,99,235,.08)",color:"var(--teal)",borderRadius:99,padding:"1px 7px",border:"1px solid rgba(37,99,235,.2)"}}>{chip}</span>
              ))}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {jHasF&&<button onClick={e=>{e.stopPropagation();setJSearch("");setJRelease("All");setJStatus("All");setJAssignee("All");setJFeature("All");}}
              style={{fontSize:9,fontWeight:700,color:"var(--red)",background:"rgba(244,63,94,.1)",border:"1px solid rgba(244,63,94,.3)",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕ Clear</button>}
            <span style={{fontSize:11,color:"var(--sub)",transform:jFilterOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block"}}>▾</span>
          </div>
        </div>
        {jFilterOpen&&<div style={{padding:"10px 16px 12px",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          {/* Search */}
          <div style={{display:"flex",alignItems:"center",gap:6,flex:"1 1 180px",minWidth:160,maxWidth:260}}>
            <span style={{fontSize:11,color:"#64748b",flexShrink:0}}>🔍</span>
            <input type="text" value={jSearch} onChange={e=>setJSearch(e.target.value)}
              placeholder="Search epic title or key…"
              style={{flex:1,fontSize:11,padding:"4px 8px",minWidth:0}}/>
            {jSearch&&<button onClick={()=>setJSearch("")} style={{background:"transparent",border:"none",color:"var(--mut)",cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button>}
          </div>
          {/* Dropdowns */}
          {[["Release",jRelease,setJRelease,["All",...jReleaseOpts]],
            ["Status",  jStatus, setJStatus, ["All",...jStatusOpts]],
            ["Feature", jFeature,setJFeature,["All",...jFeatureOpts]],
            ["Assignee",jAssignee,setJAssignee,["All",...jAssigneeOpts]],
          ].map(([lbl,val,setter,opts])=>(
            <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:val!=="All"?"var(--teal)":"var(--sub)",fontWeight:val!=="All"?700:400,whiteSpace:"nowrap"}}>{lbl}</span>
              <select value={val} onChange={e=>setter(e.target.value)}
                style={{borderColor:val!=="All"?"var(--teal)":"var(--bdr)",color:val!=="All"?"var(--teal)":"var(--txt)",fontWeight:val!=="All"?700:400}}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {jHasF&&<div style={{fontSize:10,color:"var(--teal)",marginLeft:8}}>
            <strong>{jiraFiltered.length}</strong> of {JIRA_EPICS.length} epics match
          </div>}
        </div>}
      </div>

      {/* ── JIRA EPICS GROUPED BY RELEASE ───────────────────────────────────── */}
      <div style={{background:"var(--card)",borderRadius:14,boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",marginBottom:12,overflow:"hidden"}}>
        <div onClick={()=>setShowJira(v=>!v)} style={{padding:"14px 20px",borderBottom:showJira?"1px solid var(--bdr)":"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background .15s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(37,99,235,.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontWeight:700,fontSize:13}}>Engineering Epics — CXREC Project</span>
            <span style={{fontSize:11,color:"var(--sub)"}}>{jiraFiltered.length} of {JIRA_EPICS.length} epics</span>
            {jHasF&&<span style={{fontSize:10,color:"var(--teal)",background:"rgba(37,99,235,.08)",borderRadius:4,padding:"2px 7px",border:"1px solid rgba(37,99,235,.2)"}}>filtered</span>}
          </div>
          <span style={{color:"var(--sub)",fontSize:13}}>{showJira?"▲":"▼"}</span>
        </div>
        {showJira&&<div style={{padding:"0 0 0 0"}}>
          {(()=>{
            const REL_ORDER = ["26.3","26.4","27.1","27.2","26.2","26.1","25.4","25.3","25.1"];
            const grouped = {};
            jiraFiltered.forEach(j=>{ if(!grouped[j.release]) grouped[j.release]=[]; grouped[j.release].push(j); });
            const rvList = REL_ORDER.filter(r=>grouped[r]?.length>0);
            const extraRvs = Object.keys(grouped).filter(r=>!REL_ORDER.includes(r)).sort();
            const allRvs = [...rvList, ...extraRvs];
            const RLS = {Released:"#059669","In Progress":"#d97706",Planned:"#7c3aed"};
            const relStatus = rv => { const f=RELEASES.find(r=>r.v===rv); return f?f.status:rv>="27"?"Planned":"Released"; };
            return allRvs.map((rv,gi)=>{
              const epics = grouped[rv];
              const rs = relStatus(rv);
              const rc = RLS[rs]||"#64748b";
              const doneCount = epics.filter(j=>j.status==="Done").length;
              const openCount = epics.length - doneCount;
              return (
                <div key={rv} style={{borderBottom:gi<allRvs.length-1?"1px solid var(--bdr)":"none"}}>
                  <div style={{padding:"10px 20px",display:"flex",alignItems:"center",gap:12,background:"rgba(0,0,0,.06)"}}>
                    <span className="mono" style={{fontSize:17,fontWeight:800,color:rc,minWidth:40}}>{rv}</span>
                    <span className="chip" style={{color:rc,fontSize:9,display:"inline-flex",alignItems:"center",gap:4}}>
                      {rs==="In Progress"&&<span className="live" style={{width:5,height:5,borderRadius:"50%",background:rc,display:"inline-block"}}/>}{rs}
                    </span>
                    <span style={{fontSize:11,color:"var(--sub)"}}>{epics.length} epic{epics.length!==1?"s":""}</span>
                    {doneCount>0&&<span style={{fontSize:10,color:"#059669",background:"rgba(34,211,164,.08)",borderRadius:4,padding:"1px 7px"}}>✓ {doneCount} done</span>}
                    {openCount>0&&<span style={{fontSize:10,color:"var(--amb)",background:"rgba(245,158,11,.08)",borderRadius:4,padding:"1px 7px"}}>{openCount} open</span>}
                  </div>
                  <div style={{padding:"4px 12px 8px 20px"}}>
                    {epics.map((j,ji)=>(
                      <div key={ji} onClick={()=>window.open(j.url,"_blank")}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:7,cursor:"pointer",border:"1px solid transparent",transition:"all .12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="rgba(37,99,235,.05)";e.currentTarget.style.borderColor="rgba(37,99,235,.15)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:JC[j.status]||"#64748b",flexShrink:0}}/>
                        <span className="mono" style={{fontSize:10,fontWeight:700,color:"var(--teal)",whiteSpace:"nowrap",minWidth:88,flexShrink:0}}>{j.key}</span>
                        <span style={{fontSize:11,flex:1,color:"var(--txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}} title={j.title}>{j.title}</span>
                        <span style={{fontSize:9,color:"var(--sub)",background:"rgba(255,255,255,.04)",borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap",flexShrink:0,border:"1px solid var(--bdr)"}}>{j.feature}</span>
                        {j.priority&&j.priority!=="None"&&<span style={{fontSize:9,fontWeight:700,minWidth:18,textAlign:"center",flexShrink:0,color:j.priority==="P1"?"var(--red)":j.priority==="P2"?"var(--amb)":"var(--sub)"}}>{j.priority}</span>}
                        <span className="chip" style={{color:JC[j.status]||"var(--sub)",fontSize:9,whiteSpace:"nowrap",flexShrink:0}}>{j.status}</span>
                        <span style={{fontSize:10,color:"var(--mut)",whiteSpace:"nowrap",minWidth:100,textAlign:"right",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis"}}>{j.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
          <div style={{padding:"10px 20px",fontSize:10,color:"var(--mut)",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between"}}>
            <span>Source: Jira CXREC · JQL: summary ~ "Historical" OR component = "Historical" OR summary ~ "migrated calls"</span>
            <a href="https://nice-ce-cxone-prod.atlassian.net" target="_blank" rel="noreferrer" style={{color:"var(--teal)",textDecoration:"none",flexShrink:0}}>↗ Open Jira</a>
          </div>
        </div>}
      </div>
    </>)}


    </div>

    {/* ── MODAL + DRAWER ─────────────────────────────────────────────────── */}
    <Modal modal={modal} onClose={closeModal} onDeal={d=>{openDrawer(d,true);}}/>
    <TenantDrawer tenant={tenantDetail} onClose={()=>setTenantDetail(null)}/>
    <Drawer deal={drawer} onClose={closeDrawer} onBack={drawerFromModal?backToModal:null}/>
  </>);
}
