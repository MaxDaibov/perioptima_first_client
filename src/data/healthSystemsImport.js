export const importedHealthSystems = [
  {
    name: 'Kaiser Permanente',
    website: 'https://www.kaiserpermanente.org',
    city: 'Oakland',
    state: 'CA',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Integrated surgical service lines, perioperative care, complex health system operations',
    size_estimate: '12.5M+ members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'A fully integrated surgical delivery model still faces major complexity in discharge, recovery tracking, and perioperative coordination across a massive member base.',
    why_us:
      'PeriOptima can support Kaiser with standardized perioperative workflow visibility, recovery monitoring, and escalation logic at system scale.',
    notes:
      'Tier 1 from health systems list. Geography: National (CA-focused). Epic: Yes. Value-based orientation: Very High. Notes: Active target; KP Northern California is current beachhead; team has direct KP connections; Risant Health parent acquiring more systems.',
    tier: 'A',
  },
  {
    name: 'Geisinger Health',
    website: 'https://www.geisinger.org',
    city: 'Danville',
    state: 'PA',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Integrated surgical programs, value-based perioperative care, complex health system workflows',
    size_estimate: '~600K plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'A value-based integrated system still needs stronger perioperative coordination and more consistent post-discharge visibility across surgery episodes.',
    why_us:
      'PeriOptima aligns with Geisinger’s value-based operating model by improving recovery adherence, surgical workflow execution, and complication visibility.',
    notes:
      'Tier 1 from health systems list. Geography: Pennsylvania. Epic: Yes. Value-based orientation: Very High. Notes: Now part of Risant Health; innovation-friendly; mid-sized and potentially faster decision cycles.',
    tier: 'A',
  },
  {
    name: 'Intermountain Health',
    website: 'https://intermountainhealthcare.org',
    city: 'Salt Lake City',
    state: 'UT',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Large integrated surgical programs, perioperative operations, value-based system workflows',
    size_estimate: '1M+ plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'A large integrated system with significant surgical volume likely struggles with consistent home recovery tracking across varied care settings.',
    why_us:
      'PeriOptima can strengthen perioperative engagement and monitoring inside a system already oriented toward technology adoption and coordinated care.',
    notes:
      'Tier 1 from health systems list. Geography: UT / Mountain West. Epic: Yes. Value-based orientation: Very High. Notes: Owns SelectHealth plan; strong technology adoption reputation; significant surgical volume.',
    tier: 'A',
  },
  {
    name: 'UPMC',
    website: 'https://www.upmc.com',
    city: 'Pittsburgh',
    state: 'PA',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Large academic and health-system surgical programs, complex perioperative coordination',
    size_estimate: '4.16M plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'Extensive hospital and outpatient scale creates major variation and fragmentation in perioperative follow-up and recovery operations.',
    why_us:
      'PeriOptima can help UPMC standardize recovery monitoring and patient adherence across high-volume surgical pathways.',
    notes:
      'Tier 1 from health systems list. Geography: Pittsburgh PA / National. Epic: Yes. Value-based orientation: High. Notes: 40 hospitals; 800+ outpatient sites; 16,500+ physicians; strong surgical program.',
    tier: 'A',
  },
  {
    name: 'Mayo Clinic',
    website: 'https://www.mayoclinic.org',
    city: 'Rochester',
    state: 'MN',
    type: 'Academic Medical Center',
    specialty_focus: 'Hepatobiliary surgery, transplant, complex academic surgical programs',
    size_estimate: 'Large surgical volume',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'Complex academic surgical pathways create major needs around discharge execution, symptom tracking, and coordinated recovery at home.',
    why_us:
      'PeriOptima extends structured perioperative workflows beyond the hospital and fits a system already focused on innovation and ERAS-style improvement.',
    notes:
      'Tier 1 from health systems list. Geography: MN / AZ / FL. Epic: Yes. Value-based orientation: High. Notes: Strong HPB surgical program; ERAS adoption; innovation-friendly; not insurance-integrated.',
    tier: 'A',
  },
  {
    name: 'Cleveland Clinic',
    website: 'https://my.clevelandclinic.org',
    city: 'Cleveland',
    state: 'OH',
    type: 'Academic Medical Center',
    specialty_focus: 'Complex abdominal surgery, advanced academic surgical pathways, digital-health-ready operations',
    size_estimate: 'Large surgical volume',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'High-acuity surgical care at Cleveland Clinic likely creates strong demand for better recovery visibility and coordinated discharge support.',
    why_us:
      'PeriOptima is well aligned to complex academic surgical environments that need scalable postoperative monitoring and workflow consistency.',
    notes:
      'Tier 1 from health systems list. Geography: OH (+ national). Epic: Yes. Value-based orientation: High. Notes: Major complex abdominal and cardiac surgical center; active in digital health partnerships.',
    tier: 'A',
  },
  {
    name: 'Sentara Health',
    website: 'https://www.sentara.com',
    city: 'Norfolk',
    state: 'VA',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Integrated perioperative care, telehealth-forward surgical system operations',
    size_estimate: '1M+ plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'An integrated delivery network still faces workflow gaps between surgery, discharge planning, and home recovery follow-up.',
    why_us:
      'PeriOptima can add a stronger digital perioperative layer to a system already accustomed to Epic/MyChart and telehealth workflows.',
    notes:
      'Tier 2 from health systems list. Geography: VA / NC. Epic: Yes. Value-based orientation: High. Notes: Owns Sentara Health Plans; integrated delivery network; telehealth-forward.',
    tier: 'B',
  },
  {
    name: 'Johns Hopkins Health System',
    website: 'https://www.hopkinsmedicine.org',
    city: 'Baltimore',
    state: 'MD',
    type: 'Fully Integrated Academic Health System',
    specialty_focus: 'HPB surgery, complex academic surgery, integrated surgical system operations',
    size_estimate: '700K+ plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'A major academic surgical system still likely struggles to maintain clean postoperative visibility and standardized recovery pathways across complex cases.',
    why_us:
      'PeriOptima fits a system where surgical excellence is already high but perioperative workflow standardization and home recovery visibility remain hard to scale.',
    notes:
      'Tier 2 from health systems list. Geography: Baltimore MD. Epic: Yes. Value-based orientation: High. Notes: Owns JHHC plan; strong academic surgical program; excellent HPB and complex surgery center.',
    tier: 'B',
  },
  {
    name: 'Corewell Health',
    website: 'https://corewellhealth.org',
    city: 'Grand Rapids',
    state: 'MI',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Large merged surgical network, integrated perioperative operations',
    size_estimate: '1.3M plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'A recently merged system likely faces standardization challenges across perioperative workflows, discharge, and post-op monitoring.',
    why_us:
      'PeriOptima can help Corewell unify perioperative execution across a large integrated network with significant surgical volume.',
    notes:
      'Tier 2 from health systems list. Geography: Michigan. Epic: Yes. Value-based orientation: High. Notes: Formed from Spectrum Health + Beaumont merger; owns Priority Health plan; large surgical volume.',
    tier: 'B',
  },
  {
    name: 'Jefferson Health',
    website: 'https://www.jeffersonhealth.org',
    city: 'Philadelphia',
    state: 'PA',
    type: 'Fully Integrated Academic Health System',
    specialty_focus: 'Academic surgical programs, regional perioperative care, integrated system workflows',
    size_estimate: '~300K plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'A multi-state academic system likely experiences coordination gaps across pre-op, inpatient, and recovery phases of surgery.',
    why_us:
      'PeriOptima can support stronger workflow continuity and recovery monitoring across Jefferson’s surgical programs.',
    notes:
      'Tier 2 from health systems list. Geography: Philadelphia PA / NJ. Epic: Yes. Value-based orientation: High. Notes: Academic system; strong surgical programs in PA and NJ markets.',
    tier: 'B',
  },
  {
    name: 'Presbyterian Healthcare Services',
    website: 'https://www.phs.org',
    city: 'Albuquerque',
    state: 'NM',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Integrated regional surgical system, perioperative operations, coordinated care delivery',
    size_estimate: '~600K plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 8,
    pain_hypothesis:
      'A dominant regional integrated system likely needs more structured perioperative monitoring and follow-up consistency.',
    why_us:
      'PeriOptima can help Presbyterian strengthen surgical recovery workflows and adherence across a broad regional footprint.',
    notes:
      'Tier 2 from health systems list. Geography: New Mexico. Epic: Yes. Value-based orientation: High. Notes: Fully integrated nonprofit; 9 hospitals; dominant in New Mexico market.',
    tier: 'B',
  },
  {
    name: 'Cone Health',
    website: 'https://www.conehealth.com',
    city: 'Greensboro',
    state: 'NC',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Regional surgical system operations, integrated perioperative workflows',
    size_estimate: 'Regional',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 8,
    pain_hypothesis:
      'As Cone becomes part of a broader integrated expansion network, perioperative workflows and discharge support may need cleaner systemization.',
    why_us:
      'PeriOptima can fit a regional system that may want lightweight but measurable surgical workflow improvement.',
    notes:
      'Tier 2 from health systems list. Geography: Greensboro NC. Epic: Yes. Value-based orientation: High. Notes: Acquired by Risant Health in Dec 2024; becoming part of Kaiser’s expansion network.',
    tier: 'B',
  },
  {
    name: 'Mass General Brigham',
    website: 'https://www.massgeneralbrigham.org',
    city: 'Boston',
    state: 'MA',
    type: 'Academic Medical Center',
    specialty_focus: 'Large academic surgical network, multidisciplinary perioperative workflows',
    size_estimate: 'One of largest academic systems',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'Enormous surgical volume across specialties makes it difficult to maintain consistent home recovery monitoring and perioperative follow-through.',
    why_us:
      'PeriOptima can provide structured recovery operations in a complex research-heavy academic environment.',
    notes:
      'Tier 2 from health systems list. Geography: Boston MA. Epic: Yes. Value-based orientation: Medium. Notes: Enormous surgical volume across specialties; strong research culture.',
    tier: 'B',
  },
  {
    name: 'Northwestern Medicine',
    website: 'https://www.nm.org',
    city: 'Chicago',
    state: 'IL',
    type: 'Academic Medical Center',
    specialty_focus: 'Large regional academic surgical programs, digital-health-ready perioperative operations',
    size_estimate: 'Large regional academic',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'A large academic system with strong surgical programs likely still faces gaps in standardized recovery monitoring and workflow continuity.',
    why_us:
      'PeriOptima can complement Northwestern’s digital partnership posture with a focused perioperative execution layer.',
    notes:
      'Tier 2 from health systems list. Geography: Chicago IL. Epic: Yes. Value-based orientation: Medium. Notes: Strong surgical programs; actively building digital health partnerships.',
    tier: 'B',
  },
  {
    name: 'Vanderbilt University Medical Center',
    website: 'https://www.vumc.org',
    city: 'Nashville',
    state: 'TN',
    type: 'Academic Medical Center',
    specialty_focus: 'Academic surgery, health IT-forward perioperative programs',
    size_estimate: 'Large academic system',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'Even health IT-strong academic centers can struggle with reliable home recovery visibility after complex surgery.',
    why_us:
      'PeriOptima aligns with Vanderbilt’s innovation posture while targeting a concrete perioperative workflow problem.',
    notes:
      'Tier 2 from health systems list. Geography: Nashville TN. Epic: Yes. Value-based orientation: Medium. Notes: Known for health IT innovation; strong surgical program.',
    tier: 'B',
  },
  {
    name: 'Sharp HealthCare',
    website: 'https://www.sharp.com',
    city: 'San Diego',
    state: 'CA',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Regional integrated surgical system, perioperative workflows, California market expansion',
    size_estimate: '~140K plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 8,
    pain_hypothesis:
      'A regionally focused integrated system may still lack a dedicated layer for perioperative workflow execution and post-op engagement.',
    why_us:
      'PeriOptima is a strong fit for Sharp if we want a California system with relevant surgical scale and more accessible procurement than the biggest national players.',
    notes:
      'Tier 3 from health systems list. Geography: San Diego CA. Epic: Yes. Value-based orientation: High. Notes: Owns Sharp Health Plan; relevant for CA expansion strategy.',
    tier: 'C',
  },
  {
    name: 'CoxHealth',
    website: 'https://www.coxhealth.com',
    city: 'Springfield',
    state: 'MO',
    type: 'Fully Integrated Health System',
    specialty_focus: 'Regional surgical system operations, community-integrated perioperative care',
    size_estimate: '~45K plan members',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'A regional hospital system may need a lighter-weight way to manage surgical follow-up and recovery adherence more consistently.',
    why_us:
      'PeriOptima could help CoxHealth create a repeatable digital perioperative workflow without requiring enterprise-scale complexity.',
    notes:
      'Tier 3 from health systems list. Geography: Springfield MO. Epic: Yes. Value-based orientation: Moderate. Notes: 5-hospital system with Cox HealthPlans affiliate; regional Midwest market.',
    tier: 'C',
  },
  {
    name: 'Advocate Health',
    website: 'https://www.advocatehealth.com',
    city: 'Charlotte',
    state: 'NC',
    type: 'Large Nonprofit Health System',
    specialty_focus: 'National surgical system operations, large-scale perioperative coordination',
    size_estimate: 'National footprint',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'One of the largest nonprofit systems in the country likely has major workflow fragmentation across surgery, discharge, and recovery across markets.',
    why_us:
      'PeriOptima could eventually support large-scale perioperative standardization here, though procurement complexity is likely high.',
    notes:
      'Tier 3 from health systems list. Geography: IL / NC / SE US. Epic: Yes. Value-based orientation: Medium. Notes: One of largest nonprofits in US; large surgical volume; complex procurement.',
    tier: 'C',
  },
  {
    name: 'CommonSpirit Health',
    website: 'https://www.commonspirit.org',
    city: 'Chicago',
    state: 'IL',
    type: 'Large Catholic Nonprofit Health System',
    specialty_focus: 'National perioperative operations, distributed surgical network',
    size_estimate: 'Very large national footprint',
    has_rpm_signals: false,
    has_nurse_navigator_program: false,
    strategic_fit_score: 6,
    pain_hypothesis:
      'A very large distributed system likely has perioperative workflow inconsistency, but procurement friction may outweigh short-term pilot feasibility.',
    why_us:
      'PeriOptima could be relevant long term, but CommonSpirit is likely lower priority until the product and sales motion mature further.',
    notes:
      'Tier 3 from health systems list. Geography: National. Epic: Mixed. Value-based orientation: Low-Medium. Notes: Enormous scale but slower procurement; lower near-term priority.',
    tier: 'C',
  },
  {
    name: 'John Muir Health',
    website: 'https://www.johnmuirhealth.com',
    city: 'Walnut Creek',
    state: 'CA',
    type: 'Regional Community Health System',
    specialty_focus: 'Regional surgical operations, Bay Area perioperative workflows',
    size_estimate: 'Regional',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 8,
    pain_hypothesis:
      'A regional Bay Area system may have enough surgical workflow complexity to need stronger recovery tracking without the full procurement drag of a national integrated giant.',
    why_us:
      'PeriOptima could be a strong fit if we want a reachable Bay Area target with relevant scale and a more accessible path to experimentation.',
    notes:
      'Tier 3 from health systems list. Geography: Bay Area CA. Epic: Yes. Value-based orientation: Medium. Notes: Named in GTM docs as a target; more accessible procurement than Kaiser.',
    tier: 'C',
  },
]
