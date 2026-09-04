// Placeholder data — swap for real crm-api calls (ClientController) once auth is wired up.
export interface MockClient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'active' | 'lead' | 'inactive'
  personalDetails: {
    dateOfBirth: string
    gender: string
    maritalStatus: string
    address: string
  }
  financialDetails: {
    annualIncome: number
    netWorth: number
    superBalance: number
  }
}

export const mockClients: MockClient[] = [
  {
    id: '1',
    firstName: 'Amelia',
    lastName: 'Nguyen',
    email: 'amelia.nguyen@example.com',
    phone: '0412 345 678',
    status: 'active',
    personalDetails: {
      dateOfBirth: '1985-04-12',
      gender: 'Female',
      maritalStatus: 'Married',
      address: '12 Wattle St, Richmond VIC 3121',
    },
    financialDetails: { annualIncome: 145000, netWorth: 620000, superBalance: 210000 },
  },
  {
    id: '2',
    firstName: 'Liam',
    lastName: 'O’Brien',
    email: 'liam.obrien@example.com',
    phone: '0423 456 789',
    status: 'lead',
    personalDetails: {
      dateOfBirth: '1990-11-03',
      gender: 'Male',
      maritalStatus: 'Single',
      address: '4/8 Bay Rd, Brighton VIC 3186',
    },
    financialDetails: { annualIncome: 98000, netWorth: 180000, superBalance: 95000 },
  },
  {
    id: '3',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    phone: '0434 567 890',
    status: 'active',
    personalDetails: {
      dateOfBirth: '1978-07-22',
      gender: 'Female',
      maritalStatus: 'Married',
      address: '27 Church St, Hawthorn VIC 3122',
    },
    financialDetails: { annualIncome: 210000, netWorth: 1450000, superBalance: 480000 },
  },
  {
    id: '4',
    firstName: 'Marcus',
    lastName: 'Chen',
    email: 'marcus.chen@example.com',
    phone: '0445 678 901',
    status: 'inactive',
    personalDetails: {
      dateOfBirth: '1965-01-30',
      gender: 'Male',
      maritalStatus: 'Widowed',
      address: '9 Beach Rd, St Kilda VIC 3182',
    },
    financialDetails: { annualIncome: 0, netWorth: 890000, superBalance: 340000 },
  },
]

export function getMockClient(id: string) {
  return mockClients.find((c) => c.id === id)
}
