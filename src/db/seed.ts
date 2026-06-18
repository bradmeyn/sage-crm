import { config } from 'dotenv'
config({ path: ['.env.local', '.env'] })
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'
import { eq } from 'drizzle-orm'

const db = drizzle(process.env.DATABASE_URL!, { schema })

const ORG_ID = 'e50194a4-741d-45f6-95c5-541a841f8e9b'
const USER_ID = 'OsimY6h8pDmc1QYGBXkOvjWkKejY5rzv'

const clients = [
  {
    title: 'Mr' as const,
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'michael.thompson@gmail.com',
    phone: '0412 345 678',
    dateOfBirth: '1978-03-14',
    occupation: 'Senior Engineer',
    employer: 'BHP Billiton',
    streetAddress: '14 Eucalyptus Drive',
    suburb: 'Caulfield North',
    state: 'VIC',
    postcode: '3161',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Long-term client, very engaged with retirement planning',
  },
  {
    title: 'Mrs' as const,
    firstName: 'Sarah',
    lastName: 'Thompson',
    email: 'sarah.thompson@gmail.com',
    phone: '0412 345 679',
    dateOfBirth: '1980-07-22',
    occupation: 'Nurse',
    employer: 'Alfred Health',
    streetAddress: '14 Eucalyptus Drive',
    suburb: 'Caulfield North',
    state: 'VIC',
    postcode: '3161',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Michael\'s wife, joint client',
  },
  {
    title: 'Mr' as const,
    firstName: 'David',
    lastName: 'Nguyen',
    email: 'd.nguyen@hotmail.com',
    phone: '0423 567 890',
    dateOfBirth: '1965-11-08',
    occupation: 'Business Owner',
    employer: 'Nguyen Accounting Pty Ltd',
    streetAddress: '7 Banksia Court',
    suburb: 'Box Hill',
    state: 'VIC',
    postcode: '3128',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Owns small accounting firm, SMSF client',
  },
  {
    title: 'Ms' as const,
    firstName: 'Emily',
    lastName: 'Patel',
    email: 'emily.patel@outlook.com',
    phone: '0434 789 012',
    dateOfBirth: '1990-05-30',
    occupation: 'Marketing Manager',
    employer: 'CommBank',
    streetAddress: '22 Grevillea Way',
    suburb: 'Fitzroy',
    state: 'VIC',
    postcode: '3065',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'First home buyer, looking to get into property',
  },
  {
    title: 'Mr' as const,
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'rob.wilson@icloud.com',
    phone: '0456 234 567',
    dateOfBirth: '1955-09-19',
    occupation: 'Retired',
    employer: '',
    streetAddress: '3 Protea Street',
    suburb: 'Brighton',
    state: 'VIC',
    postcode: '3186',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Retired GP, managing pension drawdown',
  },
  {
    title: 'Mrs' as const,
    firstName: 'Jennifer',
    lastName: 'Wilson',
    email: 'jen.wilson@icloud.com',
    phone: '0456 234 568',
    dateOfBirth: '1958-04-12',
    occupation: 'Retired',
    employer: '',
    streetAddress: '3 Protea Street',
    suburb: 'Brighton',
    state: 'VIC',
    postcode: '3186',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Robert\'s wife, co-investment portfolio',
  },
  {
    title: 'Dr' as const,
    firstName: 'James',
    lastName: 'Chen',
    email: 'james.chen@monash.edu',
    phone: '0401 123 456',
    dateOfBirth: '1982-12-01',
    occupation: 'University Lecturer',
    employer: 'Monash University',
    streetAddress: '88 Wattle Avenue',
    suburb: 'Glen Waverley',
    state: 'VIC',
    postcode: '3150',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Investment property owner, high income earner',
  },
  {
    title: 'Ms' as const,
    firstName: 'Amanda',
    lastName: 'Rodriguez',
    email: 'amanda.r@gmail.com',
    phone: '0488 901 234',
    dateOfBirth: '1994-02-17',
    occupation: 'Software Developer',
    employer: 'Seek Ltd',
    streetAddress: '15 Acacia Lane',
    suburb: 'Richmond',
    state: 'VIC',
    postcode: '3121',
    country: 'Australia',
    status: 'PROSPECT',
    quickNote: 'Referral from James Chen, interested in starting investments',
  },
  {
    title: 'Mr' as const,
    firstName: 'Thomas',
    lastName: 'Murphy',
    email: 'tmurphy@bigpond.com',
    phone: '0413 456 789',
    dateOfBirth: '1972-06-25',
    occupation: 'Construction Manager',
    employer: 'Lendlease',
    streetAddress: '41 Bottlebrush Close',
    suburb: 'Doncaster',
    state: 'VIC',
    postcode: '3108',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Redundancy payout to invest, very motivated',
  },
  {
    title: 'Mrs' as const,
    firstName: 'Lisa',
    lastName: 'Murphy',
    email: 'lisa.murphy@bigpond.com',
    phone: '0413 456 790',
    dateOfBirth: '1975-10-03',
    occupation: 'Part-time Teacher',
    employer: 'Doncaster Secondary College',
    streetAddress: '41 Bottlebrush Close',
    suburb: 'Doncaster',
    state: 'VIC',
    postcode: '3108',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Thomas\'s wife, couple strategy review due',
  },
  {
    title: 'Mr' as const,
    firstName: 'Andrew',
    lastName: 'Kim',
    email: 'andrew.kim@gmail.com',
    phone: '0425 678 901',
    dateOfBirth: '1988-08-14',
    occupation: 'Pharmacist',
    employer: 'Chemist Warehouse',
    streetAddress: '9 Melaleuca Boulevard',
    suburb: 'South Yarra',
    state: 'VIC',
    postcode: '3141',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Looking to buy investment property in 2 years',
  },
  {
    title: 'Ms' as const,
    firstName: 'Rachel',
    lastName: 'Davies',
    email: 'r.davies@outlook.com',
    phone: '0499 012 345',
    dateOfBirth: '1970-01-28',
    occupation: 'Accountant',
    employer: 'Deloitte',
    streetAddress: '56 Hakea Road',
    suburb: 'Malvern',
    state: 'VIC',
    postcode: '3144',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Divorce settlement, rebuilding financial plan',
  },
  {
    title: 'Mr' as const,
    firstName: 'Peter',
    lastName: 'Anderson',
    email: 'peter.anderson@gmail.com',
    phone: '0411 234 567',
    dateOfBirth: '1960-07-07',
    occupation: 'Solicitor',
    employer: 'Anderson & Partners',
    streetAddress: '12 Lilly Pilly Drive',
    suburb: 'Camberwell',
    state: 'VIC',
    postcode: '3124',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Complex estate planning requirements',
  },
  {
    title: 'Ms' as const,
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@gmail.com',
    phone: '0437 890 123',
    dateOfBirth: '1996-11-20',
    occupation: 'Graphic Designer',
    employer: 'Freelance',
    streetAddress: '78 Callistemon Court',
    suburb: 'Northcote',
    state: 'VIC',
    postcode: '3070',
    country: 'Australia',
    status: 'PROSPECT',
    quickNote: 'Self-employed, irregular income, needs budgeting help',
  },
  {
    title: 'Mr' as const,
    firstName: 'George',
    lastName: 'Papadopoulos',
    email: 'george.papa@gmail.com',
    phone: '0462 345 678',
    dateOfBirth: '1967-04-15',
    occupation: 'Restaurant Owner',
    employer: 'Yiamas Kitchen Pty Ltd',
    streetAddress: '33 Waratah Street',
    suburb: 'Oakleigh',
    state: 'VIC',
    postcode: '3166',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Business succession planning in progress',
  },
  {
    title: 'Mrs' as const,
    firstName: 'Catherine',
    lastName: 'Papadopoulos',
    email: 'cathy.papa@gmail.com',
    phone: '0462 345 679',
    dateOfBirth: '1969-09-08',
    occupation: 'Co-Director',
    employer: 'Yiamas Kitchen Pty Ltd',
    streetAddress: '33 Waratah Street',
    suburb: 'Oakleigh',
    state: 'VIC',
    postcode: '3166',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'George\'s wife, joint SMSF',
  },
  {
    title: 'Mr' as const,
    firstName: 'Nathan',
    lastName: 'Scott',
    email: 'nscott@gmail.com',
    phone: '0478 901 234',
    dateOfBirth: '1985-03-31',
    occupation: 'Pilot',
    employer: 'Qantas',
    streetAddress: '5 Stringybark Place',
    suburb: 'Essendon',
    state: 'VIC',
    postcode: '3040',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'High salary, focus on tax minimisation strategies',
  },
  {
    title: 'Ms' as const,
    firstName: 'Olivia',
    lastName: 'Brown',
    email: 'olivia.brown@hotmail.com',
    phone: '0491 567 890',
    dateOfBirth: '1992-08-05',
    occupation: 'Physiotherapist',
    employer: 'Sports Medicine Australia',
    streetAddress: '19 Paperbark Drive',
    suburb: 'Prahran',
    state: 'VIC',
    postcode: '3181',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Inherited share portfolio from grandparents',
  },
  {
    title: 'Mr' as const,
    firstName: 'William',
    lastName: 'Taylor',
    email: 'will.taylor@gmail.com',
    phone: '0403 234 567',
    dateOfBirth: '1950-12-22',
    occupation: 'Retired',
    employer: '',
    streetAddress: '61 Ironbark Way',
    suburb: 'Hawthorn',
    state: 'VIC',
    postcode: '3122',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Aged care planning required, family involved',
  },
  {
    title: 'Ms' as const,
    firstName: 'Hannah',
    lastName: 'Clarke',
    email: 'hannah.clarke@gmail.com',
    phone: '0444 678 901',
    dateOfBirth: '1987-06-16',
    occupation: 'HR Manager',
    employer: 'NAB',
    streetAddress: '27 Angophora Grove',
    suburb: 'St Kilda',
    state: 'VIC',
    postcode: '3182',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Recently engaged, updating beneficiary nominations',
  },
  {
    title: 'Mr' as const,
    firstName: 'Benjamin',
    lastName: 'Foster',
    email: 'ben.foster@gmail.com',
    phone: '0416 789 012',
    dateOfBirth: '1983-02-09',
    occupation: 'Dentist',
    employer: 'Foster Dental Practice',
    streetAddress: '8 Jacaranda Crescent',
    suburb: 'Toorak',
    state: 'VIC',
    postcode: '3142',
    country: 'Australia',
    status: 'PROSPECT',
    quickNote: 'Referred by Nathan Scott, wants to review insurance coverage',
  },
  {
    title: 'Ms' as const,
    firstName: 'Natalie',
    lastName: 'Hughes',
    email: 'nat.hughes@icloud.com',
    phone: '0427 012 345',
    dateOfBirth: '1975-05-11',
    occupation: 'Real Estate Agent',
    employer: 'RT Edgar',
    streetAddress: '14 Turpentine Way',
    suburb: 'Balwyn',
    state: 'VIC',
    postcode: '3103',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Commission-based income, irregular cash flow',
  },
  {
    title: 'Mr' as const,
    firstName: 'Daniel',
    lastName: 'White',
    email: 'dan.white@gmail.com',
    phone: '0452 345 678',
    dateOfBirth: '1979-10-27',
    occupation: 'IT Director',
    employer: 'Telstra',
    streetAddress: '36 Casuarina Street',
    suburb: 'Kew',
    state: 'VIC',
    postcode: '3101',
    country: 'Australia',
    status: 'ACTIVE',
    quickNote: 'Stock options vesting next year, tax advice needed',
  },
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysAgo(days: number): string {
  return daysFromNow(-days)
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${clients.length} clients for org: Wealth Advisors...`)

  // Spread createdAt over the past 3 years so the dashboard looks active
  const now = new Date()
  const threeYearsAgo = new Date(now)
  threeYearsAgo.setFullYear(now.getFullYear() - 3)
  const range = now.getTime() - threeYearsAgo.getTime()

  const rows = clients.map((c, i) => {
    const createdAt = new Date(threeYearsAgo.getTime() + Math.floor((i / clients.length) * range))
    return {
      organizationId: ORG_ID,
      title: c.title,
      firstName: c.firstName,
      lastName: c.lastName,
      preferredName: null,
      dateOfBirth: c.dateOfBirth,
      email: c.email,
      phone: c.phone,
      streetAddress: c.streetAddress,
      suburb: c.suburb,
      state: c.state,
      postcode: c.postcode,
      country: c.country,
      status: c.status,
      occupation: c.occupation || null,
      employer: c.employer || null,
      quickNote: c.quickNote,
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt,
      updatedAt: createdAt,
    }
  })

  const insertedClients = await db.insert(schema.client).values(rows).returning()
  console.log(`✓ Inserted ${insertedClients.length} clients`)

  // Build a lookup map by firstName+lastName
  const byName = (first: string, last: string) => {
    const c = insertedClients.find((r) => r.firstName === first && r.lastName === last)
    if (!c) throw new Error(`Client not found: ${first} ${last}`)
    return c
  }

  const michaelT = byName('Michael', 'Thompson')
  const sarahT = byName('Sarah', 'Thompson')
  const davidN = byName('David', 'Nguyen')
  const emilyP = byName('Emily', 'Patel')
  const robertW = byName('Robert', 'Wilson')
  const jenniferW = byName('Jennifer', 'Wilson')
  const jamesC = byName('James', 'Chen')
  const thomasM = byName('Thomas', 'Murphy')
  const lisaM = byName('Lisa', 'Murphy')
  const andrewK = byName('Andrew', 'Kim')
  const rachelD = byName('Rachel', 'Davies')
  const sophieM = byName('Sophie', 'Martin')
  const georgeP = byName('George', 'Papadopoulos')
  const catherineP = byName('Catherine', 'Papadopoulos')
  const nathanS = byName('Nathan', 'Scott')
  const oliviaB = byName('Olivia', 'Brown')
  const williamT = byName('William', 'Taylor')

  // ─── Jobs ────────────────────────────────────────────────────────────────────

  console.log('Seeding jobs...')

  const jobRows = [
    // #1 - Thompson joint annual review (overdue)
    {
      organizationId: ORG_ID,
      title: 'Annual Review 2025-26',
      jobType: 'ANNUAL_REVIEW',
      currentStage: 'DATA_GATHERING',
      status: 'ACTIVE',
      priority: 'HIGH',
      dueDate: daysAgo(21),
      description: 'Joint annual review for Michael and Sarah',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #2 - Wilson joint insurance review (overdue)
    {
      organizationId: ORG_ID,
      title: 'Insurance Review 2025',
      jobType: 'INSURANCE_REVIEW',
      currentStage: 'NEEDS_ANALYSIS',
      status: 'ACTIVE',
      priority: 'HIGH',
      dueDate: daysAgo(10),
      description: 'Review life and TPD cover for Robert and Jennifer',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #3 - Emily Patel new client (upcoming)
    {
      organizationId: ORG_ID,
      title: 'New Client Onboarding',
      jobType: 'NEW_CLIENT',
      currentStage: 'DATA_COLLECTION',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: daysFromNow(5),
      description: 'First home buyer onboarding and financial plan',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #4 - Murphy joint mortgage review (upcoming)
    {
      organizationId: ORG_ID,
      title: 'Mortgage Refinance Review',
      jobType: 'MORTGAGE_REVIEW',
      currentStage: 'LENDER_RESEARCH',
      status: 'ACTIVE',
      priority: 'HIGH',
      dueDate: daysFromNow(10),
      description: 'Review refinancing options for Thomas and Lisa',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #5 - David Nguyen tax planning (upcoming)
    {
      organizationId: ORG_ID,
      title: 'End of Year Tax Planning',
      jobType: 'TAX_PLANNING',
      currentStage: 'ANALYSIS',
      status: 'ACTIVE',
      priority: 'HIGH',
      dueDate: daysFromNow(12),
      description: 'SMSF and trust structure tax minimisation',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #6 - Nathan Scott investment review (upcoming)
    {
      organizationId: ORG_ID,
      title: 'Portfolio Rebalancing Review',
      jobType: 'INVESTMENT_REVIEW',
      currentStage: 'PORTFOLIO_REVIEW',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: daysFromNow(7),
      description: 'Review and rebalance diversified portfolio',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #7 - Papadopoulos joint estate planning (active)
    {
      organizationId: ORG_ID,
      title: 'Estate Planning & Business Succession',
      jobType: 'ESTATE_PLANNING',
      currentStage: 'STRATEGY',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: daysFromNow(30),
      description: 'Succession planning for Yiamas Kitchen and estate review',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #8 - James Chen annual review (active)
    {
      organizationId: ORG_ID,
      title: 'Annual Review 2025-26',
      jobType: 'ANNUAL_REVIEW',
      currentStage: 'REVIEW_SCHEDULED',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: daysFromNow(45),
      description: 'Annual review including investment property performance',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #9 - Rachel Davies tax planning (active, no due date)
    {
      organizationId: ORG_ID,
      title: 'Tax Planning – Post Divorce',
      jobType: 'TAX_PLANNING',
      currentStage: 'DATA_GATHERING',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: null,
      description: 'Tax planning following divorce settlement',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #10 - Andrew Kim other (active, no due date)
    {
      organizationId: ORG_ID,
      title: 'Investment Property Strategy',
      jobType: 'OTHER',
      currentStage: 'IN_PROGRESS',
      status: 'ACTIVE',
      priority: 'LOW',
      dueDate: null,
      description: 'Preparing for investment property purchase in 2 years',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #11 - Thompson joint annual review (completed)
    {
      organizationId: ORG_ID,
      title: 'Annual Review 2024-25',
      jobType: 'ANNUAL_REVIEW',
      currentStage: 'COMPLETED',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: null,
      description: 'Completed joint annual review',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #12 - Nathan Scott insurance review (completed)
    {
      organizationId: ORG_ID,
      title: 'Life Insurance Review',
      jobType: 'INSURANCE_REVIEW',
      currentStage: 'COMPLETED',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: null,
      description: 'Income protection policy upgraded',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #13 - Sophie Martin new client (completed)
    {
      organizationId: ORG_ID,
      title: 'New Client Onboarding',
      jobType: 'NEW_CLIENT',
      currentStage: 'COMPLETED',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: null,
      description: 'Initial financial plan for freelance designer',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #14 - William Taylor annual review (on hold)
    {
      organizationId: ORG_ID,
      title: 'Annual Review – Aged Care Assessment',
      jobType: 'ANNUAL_REVIEW',
      currentStage: 'DATA_GATHERING',
      status: 'ON_HOLD',
      priority: 'HIGH',
      dueDate: null,
      description: 'On hold pending aged care assessment outcome',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
    // #15 - Olivia Brown investment review (upcoming)
    {
      organizationId: ORG_ID,
      title: 'Inherited Portfolio Review',
      jobType: 'INVESTMENT_REVIEW',
      currentStage: 'PORTFOLIO_REVIEW',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: daysFromNow(3),
      description: 'Review and restructure inherited share portfolio',
      createdById: USER_ID,
      updatedById: USER_ID,
    },
  ]

  const insertedJobs = await db.insert(schema.job).values(jobRows).returning()
  console.log(`✓ Inserted ${insertedJobs.length} jobs`)

  // ─── Job-Client junction rows ─────────────────────────────────────────────

  const j = (i: number) => insertedJobs[i - 1]

  const jobClientRows = [
    // Single-client jobs
    { jobId: j(3).id, clientId: emilyP.id },
    { jobId: j(5).id, clientId: davidN.id },
    { jobId: j(6).id, clientId: nathanS.id },
    { jobId: j(8).id, clientId: jamesC.id },
    { jobId: j(9).id, clientId: rachelD.id },
    { jobId: j(10).id, clientId: andrewK.id },
    { jobId: j(12).id, clientId: nathanS.id },
    { jobId: j(13).id, clientId: sophieM.id },
    { jobId: j(14).id, clientId: williamT.id },
    { jobId: j(15).id, clientId: oliviaB.id },
    // Joint jobs (2 clients each)
    { jobId: j(1).id, clientId: michaelT.id },
    { jobId: j(1).id, clientId: sarahT.id },
    { jobId: j(2).id, clientId: robertW.id },
    { jobId: j(2).id, clientId: jenniferW.id },
    { jobId: j(4).id, clientId: thomasM.id },
    { jobId: j(4).id, clientId: lisaM.id },
    { jobId: j(7).id, clientId: georgeP.id },
    { jobId: j(7).id, clientId: catherineP.id },
    { jobId: j(11).id, clientId: michaelT.id },
    { jobId: j(11).id, clientId: sarahT.id },
  ]

  await db.insert(schema.jobClient).values(jobClientRows)
  console.log(`✓ Inserted ${jobClientRows.length} job-client links`)

  // ─── Financial Data ───────────────────────────────────────────────────────

  console.log('Seeding financial data...')

  // Assets
  const assetRows = [
    // Michael Thompson
    { clientId: michaelT.id, category: 'SUPERANNUATION', name: 'AustralianSuper', value: 485000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: michaelT.id, category: 'PROPERTY', name: 'Family Home – Caulfield North', value: 1450000, owner: 'JOINT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: michaelT.id, category: 'CASH_AND_BANK', name: 'CBA Savings', value: 62000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Sarah Thompson
    { clientId: sarahT.id, category: 'SUPERANNUATION', name: 'HESTA Super', value: 210000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: sarahT.id, category: 'CASH_AND_BANK', name: 'ANZ Savings', value: 28000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // David Nguyen
    { clientId: davidN.id, category: 'SUPERANNUATION', name: 'SMSF – Nguyen Family', value: 820000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: davidN.id, category: 'PROPERTY', name: 'Commercial Property – Box Hill', value: 1100000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: davidN.id, category: 'CASH_AND_BANK', name: 'Business Transaction Account', value: 145000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Nathan Scott
    { clientId: nathanS.id, category: 'SUPERANNUATION', name: 'QSuper', value: 390000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: nathanS.id, category: 'INVESTMENT', name: 'Vanguard ETF Portfolio', value: 215000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: nathanS.id, category: 'CASH_AND_BANK', name: 'ING Savings Maximiser', value: 54000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Andrew Kim
    { clientId: andrewK.id, category: 'SUPERANNUATION', name: 'Aware Super', value: 155000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: andrewK.id, category: 'CASH_AND_BANK', name: 'UBank Savings', value: 42000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Rachel Davies
    { clientId: rachelD.id, category: 'SUPERANNUATION', name: 'REST Super', value: 298000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: rachelD.id, category: 'CASH_AND_BANK', name: 'Westpac Savings', value: 85000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // James Chen
    { clientId: jamesC.id, category: 'SUPERANNUATION', name: 'UniSuper', value: 340000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'PROPERTY', name: 'Investment Property – Brunswick', value: 780000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'CASH_AND_BANK', name: 'NAB iSaver', value: 38000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
  ]

  await db.insert(schema.clientAsset).values(assetRows)
  console.log(`✓ Inserted ${assetRows.length} assets`)

  // Liabilities
  const liabilityRows = [
    // Michael Thompson
    { clientId: michaelT.id, category: 'MORTGAGE', name: 'Home Loan – ANZ', balance: 620000, interestRate: 615, owner: 'JOINT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: michaelT.id, category: 'CREDIT_CARD', name: 'ANZ Frequent Flyer Card', balance: 3200, limit: 15000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Sarah Thompson
    { clientId: sarahT.id, category: 'CREDIT_CARD', name: 'CBA Awards Card', balance: 1800, limit: 8000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // David Nguyen
    { clientId: davidN.id, category: 'MORTGAGE', name: 'Commercial Property Loan – CBA', balance: 450000, interestRate: 695, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: davidN.id, category: 'CREDIT_CARD', name: 'Business Visa', balance: 8500, limit: 25000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Nathan Scott
    { clientId: nathanS.id, category: 'CREDIT_CARD', name: 'Qantas American Express', balance: 4200, limit: 20000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Andrew Kim
    { clientId: andrewK.id, category: 'PERSONAL_LOAN', name: 'Car Loan – Westpac', balance: 22000, interestRate: 850, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: andrewK.id, category: 'CREDIT_CARD', name: 'CBA Gold Credit Card', balance: 2100, limit: 10000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Rachel Davies
    { clientId: rachelD.id, category: 'CREDIT_CARD', name: 'NAB Visa', balance: 5600, limit: 12000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // James Chen
    { clientId: jamesC.id, category: 'MORTGAGE', name: 'Investment Property Loan – Westpac', balance: 520000, interestRate: 660, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'CREDIT_CARD', name: 'NAB Visa Platinum', balance: 2800, limit: 15000, owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
  ]

  await db.insert(schema.clientLiability).values(liabilityRows)
  console.log(`✓ Inserted ${liabilityRows.length} liabilities`)

  // Income
  const incomeRows = [
    // Michael Thompson
    { clientId: michaelT.id, category: 'EMPLOYMENT', name: 'Salary – BHP Billiton', amount: 165000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Sarah Thompson
    { clientId: sarahT.id, category: 'EMPLOYMENT', name: 'Salary – Alfred Health', amount: 88000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // David Nguyen
    { clientId: davidN.id, category: 'SELF_EMPLOYMENT', name: 'Business Income – Nguyen Accounting', amount: 280000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: davidN.id, category: 'RENTAL', name: 'Commercial Property Rent', amount: 52000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Nathan Scott
    { clientId: nathanS.id, category: 'EMPLOYMENT', name: 'Salary – Qantas', amount: 210000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: nathanS.id, category: 'INVESTMENT', name: 'ETF Dividends', amount: 8500, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Andrew Kim
    { clientId: andrewK.id, category: 'EMPLOYMENT', name: 'Salary – Chemist Warehouse', amount: 105000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // Rachel Davies
    { clientId: rachelD.id, category: 'EMPLOYMENT', name: 'Salary – Deloitte', amount: 135000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    // James Chen
    { clientId: jamesC.id, category: 'EMPLOYMENT', name: 'Salary – Monash University', amount: 140000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'RENTAL', name: 'Investment Property Rent', amount: 36000, frequency: 'ANNUALLY', owner: 'CLIENT', createdById: USER_ID, updatedById: USER_ID },
  ]

  await db.insert(schema.clientIncome).values(incomeRows)
  console.log(`✓ Inserted ${incomeRows.length} income records`)

  // Expenses
  const expenseRows = [
    // Michael Thompson (household expenses attributed to Michael)
    { clientId: michaelT.id, category: 'HOUSING', name: 'Mortgage Repayments', amount: 3800, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: michaelT.id, category: 'LIVING', name: 'Groceries & Household', amount: 1200, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: michaelT.id, category: 'TRANSPORT', name: 'Fuel & Car Costs', amount: 350, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    // David Nguyen
    { clientId: davidN.id, category: 'HOUSING', name: 'Mortgage Repayments', amount: 3200, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: davidN.id, category: 'LIVING', name: 'Living Expenses', amount: 2000, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    // Nathan Scott
    { clientId: nathanS.id, category: 'HOUSING', name: 'Rent – Essendon', amount: 2400, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: nathanS.id, category: 'LIVING', name: 'General Living', amount: 1800, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: nathanS.id, category: 'TRANSPORT', name: 'Car Lease', amount: 750, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    // Andrew Kim
    { clientId: andrewK.id, category: 'HOUSING', name: 'Rent – South Yarra', amount: 2200, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: andrewK.id, category: 'LIVING', name: 'Groceries & Entertainment', amount: 900, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: andrewK.id, category: 'TRANSPORT', name: 'Car Loan Repayments', amount: 620, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    // Rachel Davies
    { clientId: rachelD.id, category: 'HOUSING', name: 'Rent – Malvern', amount: 2600, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: rachelD.id, category: 'LIVING', name: 'General Living', amount: 1400, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    // James Chen
    { clientId: jamesC.id, category: 'HOUSING', name: 'Mortgage – Home (PPOR)', amount: 2100, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'HOUSING', name: 'Investment Loan Repayments', amount: 2800, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'LIVING', name: 'Living Expenses', amount: 1600, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
    { clientId: jamesC.id, category: 'TRANSPORT', name: 'Vehicle Costs', amount: 400, frequency: 'MONTHLY', createdById: USER_ID, updatedById: USER_ID },
  ]

  await db.insert(schema.clientExpense).values(expenseRows)
  console.log(`✓ Inserted ${expenseRows.length} expense records`)

  // ─── File Notes ───────────────────────────────────────────────────────────

  console.log('Seeding file notes...')

  const now2 = new Date()
  const oneWeekAgo = new Date(now2)
  oneWeekAgo.setDate(now2.getDate() - 7)
  const twoWeeksAgo = new Date(now2)
  twoWeeksAgo.setDate(now2.getDate() - 14)

  const fileNoteRows = [
    // Michael Thompson
    {
      clientId: michaelT.id,
      title: 'Client Overview',
      body: 'Michael is a senior engineer at BHP Billiton with a strong focus on retirement planning. He has been a client for over 5 years and is well-engaged. Key priorities: maximise super contributions, review insurance cover annually, and plan for early retirement at 60.',
      noteType: 'GENERAL',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: twoWeeksAgo,
      updatedAt: twoWeeksAgo,
    },
    {
      clientId: michaelT.id,
      title: 'Annual Review Meeting – Feb 2026',
      body: 'Met with Michael and Sarah at the office. Discussed portfolio performance (+12.4% YTD), reviewed asset allocation, and confirmed salary sacrifice strategy. Michael wants to increase super contributions to $27,500 this FY. Sarah is considering returning to full-time hours at Alfred Health. Agreed to reconvene after tax return is lodged.',
      noteType: 'MEETING',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: oneWeekAgo,
      updatedAt: oneWeekAgo,
    },
    // David Nguyen
    {
      clientId: davidN.id,
      title: 'SMSF Client Overview',
      body: 'David runs a small accounting firm and has operated an SMSF for 8 years. The fund holds commercial property and Australian equities. Key focus areas: ensure SMSF compliance, optimise business-to-super contribution strategy, and review trust distributions annually.',
      noteType: 'GENERAL',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: twoWeeksAgo,
      updatedAt: twoWeeksAgo,
    },
    {
      clientId: davidN.id,
      title: 'Tax Planning Strategy Meeting',
      body: 'Met with David to discuss end-of-year tax position. Business income approximately $280K this year. Discussed pre-paying expenses, maximising deductible super contributions via SMSF, and timing of trust distributions. David keen to explore Division 7A planning before 30 June. Accountant to be looped in next week.',
      noteType: 'MEETING',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: oneWeekAgo,
      updatedAt: oneWeekAgo,
    },
    // Nathan Scott
    {
      clientId: nathanS.id,
      title: 'Client Profile Summary',
      body: 'Nathan is a Qantas pilot earning a high base salary plus allowances. Key objectives are tax minimisation, building investment portfolio, and income protection. Salary sacrifice to super is maxed. Has existing ETF portfolio and is considering direct shares. Single, no dependants, low debt.',
      noteType: 'GENERAL',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: twoWeeksAgo,
      updatedAt: twoWeeksAgo,
    },
    {
      clientId: nathanS.id,
      title: 'Portfolio Review Call – Jan 2026',
      body: 'Called Nathan to discuss portfolio rebalancing. ETF portfolio has drifted from target allocation (now 72% growth / 28% defensive, target 70/30). Plan to rebalance via dividends rather than selling. Discussed adding VGS to improve international diversification. Nathan also wants to review life insurance now that new pilot roster increases flying hours.',
      noteType: 'MEETING',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: oneWeekAgo,
      updatedAt: oneWeekAgo,
    },
    // Andrew Kim
    {
      clientId: andrewK.id,
      title: 'Investment Property Goal',
      body: 'Andrew is a pharmacist working towards purchasing an investment property in approximately 2 years. Currently saving aggressively and has $42K in savings. Needs to grow deposit to ~$100K for a $550K property purchase. Key focus: savings strategy, reduce personal loan, and build borrowing capacity.',
      noteType: 'GENERAL',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: twoWeeksAgo,
      updatedAt: twoWeeksAgo,
    },
    {
      clientId: andrewK.id,
      title: 'Strategy Review Meeting',
      body: 'Met with Andrew to review progress towards property goal. On track with savings – $42K in UBank, up from $28K six months ago. Discussed accelerating car loan repayment to free up cash flow ($620/mth). Andrew has been pre-approved for $480K borrowing. May need to adjust target property price or expand search area. Next meeting in 3 months.',
      noteType: 'MEETING',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: oneWeekAgo,
      updatedAt: oneWeekAgo,
    },
    // Rachel Davies
    {
      clientId: rachelD.id,
      title: 'Post-Divorce Financial Rebuilding',
      body: 'Rachel joined as a new client following divorce settlement. Received $85K cash and retains her super ($298K). No property assets post-settlement. Rebuilding from scratch – needs emergency fund, comprehensive financial plan, and review of estate planning documents. High earner at Deloitte ($135K), good capacity to save.',
      noteType: 'GENERAL',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: twoWeeksAgo,
      updatedAt: twoWeeksAgo,
    },
    {
      clientId: rachelD.id,
      title: 'Initial Financial Planning Meeting',
      body: 'First detailed meeting with Rachel post-divorce. Went through full fact find. She is emotionally settled and focused on the future. Priorities: (1) establish emergency fund of 3 months expenses, (2) update Will and beneficiary nominations, (3) review income protection insurance. Tax planning job opened to address settlement tax implications. Will touch base monthly for the next quarter.',
      noteType: 'MEETING',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: oneWeekAgo,
      updatedAt: oneWeekAgo,
    },
    // James Chen
    {
      clientId: jamesC.id,
      title: 'Investment Property Owner Profile',
      body: 'James is a university lecturer with a solid income and investment property in Brunswick. He is a strategic thinker and does his own research before meetings. Key focus areas: maximise negative gearing benefits, grow super through salary sacrifice, and assess whether to purchase a second investment property.',
      noteType: 'GENERAL',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: twoWeeksAgo,
      updatedAt: twoWeeksAgo,
    },
    {
      clientId: jamesC.id,
      title: 'Annual Review Planning Discussion',
      body: 'Called James ahead of upcoming annual review. He mentioned Brunswick property is fully leased at $3K/mth – vacancy was zero last year. Loan is IO for one more year, will need to convert to P&I. Discussed refinancing options and impact on cash flow. James keen to assess purchasing a second property in 2027. Will prepare detailed property analysis for the review meeting.',
      noteType: 'MEETING',
      createdById: USER_ID,
      updatedById: USER_ID,
      createdAt: oneWeekAgo,
      updatedAt: oneWeekAgo,
    },
  ]

  await db.insert(schema.fileNote).values(fileNoteRows)
  console.log(`✓ Inserted ${fileNoteRows.length} file notes`)
}

seed()
  .then(() => {
    console.log('Seed complete.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
