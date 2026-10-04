import { 
  Project, 
  Expense, 
  AttentionItem, 
  CalendarEvent, 
  DocumentItem, 
  NotificationItem, 
  Lead, 
  Task, 
  StaffMember,
  Vendor,
  ClientPayment,
  Purchase,
  Branch,
  ApprovalRequest,
  CustomRole
} from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Mehta Residence',
    client: 'Rajesh & Sunita Mehta',
    clientPhone: '+91 98201 44521',
    location: 'Bandra West, Mumbai',
    city: 'Mumbai',
    branch_id: 'branch-1',
    branchName: 'Bandra Flagship Studio',
    type: 'Residential',
    budget: 1800000,
    spent: 1140000,
    progress: 68,
    status: 'On Track',
    startDate: '2026-06-10',
    deadline: '2026-09-18',
    coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    description: 'Complete 3BHK luxury interior makeover featuring warm Italian marble, custom walnut wood carpentry, fluted glass partitions, and ambient cove lighting.',
    categoryBudgets: [
      { category: 'Materials', allocated: 800000, spent: 540000 },
      { category: 'Labour', allocated: 400000, spent: 280000 },
      { category: 'Furniture', allocated: 300000, spent: 190000 },
      { category: 'Electrical', allocated: 150000, spent: 80000 },
      { category: 'Miscellaneous', allocated: 150000, spent: 50000 },
    ],
    notes: [
      {
        id: 'note-1',
        projectId: 'proj-1',
        content: 'Client approved walnut finish for master bedroom wardrobe and brushed brass profile handles.',
        createdAt: '2026-09-02T14:30:00Z',
        author: 'Aarav Mehta',
        tag: 'Client Decision'
      },
      {
        id: 'note-2',
        projectId: 'proj-1',
        content: 'Kitchen Italian countertop delivery moved to 8 September due to custom edge chamfering.',
        createdAt: '2026-09-01T11:15:00Z',
        author: 'Aarav Mehta',
        tag: 'Site Update'
      },
      {
        id: 'note-3',
        projectId: 'proj-1',
        content: 'Electrical wiring and smart dimming automation panels completed in living and dining zones.',
        createdAt: '2026-08-28T16:45:00Z',
        author: 'Pooja (Site Supervisor)',
        tag: 'Site Update'
      }
    ],
    photos: [
      {
        id: 'photo-1',
        projectId: 'proj-1',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        title: 'Living Room 3D Render Proposal',
        category: 'Design',
        uploadedAt: '2026-06-12',
        uploadedBy: 'Aarav Mehta'
      },
      {
        id: 'photo-2',
        projectId: 'proj-1',
        url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
        title: 'Master Bedroom Wardrobe Carpentry',
        category: 'Site Progress',
        uploadedAt: '2026-08-29',
        uploadedBy: 'Pooja'
      },
      {
        id: 'photo-3',
        projectId: 'proj-1',
        url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        title: 'Italian Botticino Marble Slab Selection',
        category: 'Materials',
        uploadedAt: '2026-07-05',
        uploadedBy: 'Aarav Mehta'
      },
      {
        id: 'photo-4',
        projectId: 'proj-1',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        title: 'Dining Area Lighting Installation',
        category: 'Completed Work',
        uploadedAt: '2026-09-02',
        uploadedBy: 'Aarav Mehta'
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Kapoor Apartment',
    client: 'Vikram Kapoor',
    clientPhone: '+91 98119 23890',
    location: 'Powai, Mumbai',
    city: 'Mumbai',
    branch_id: 'branch-1',
    branchName: 'Bandra Flagship Studio',
    type: 'Residential',
    budget: 1250000,
    spent: 1080000,
    progress: 82,
    status: 'Budget Alert',
    startDate: '2026-06-25',
    deadline: '2026-09-10',
    coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern minimalist 2BHK renovation with Scandinavian aesthetics, smart kitchen storage, and concealed acoustic wall panelling.',
    categoryBudgets: [
      { category: 'Materials', allocated: 550000, spent: 510000 },
      { category: 'Labour', allocated: 300000, spent: 290000 },
      { category: 'Furniture', allocated: 200000, spent: 180000 },
      { category: 'Electrical', allocated: 100000, spent: 70000 },
      { category: 'Miscellaneous', allocated: 100000, spent: 30000 }
    ],
    notes: [
      {
        id: 'kp-note-1',
        projectId: 'proj-2',
        content: 'Budget usage reached 86%. Client requested extra gold-trim profile lighting which exceeded initial allowance.',
        createdAt: '2026-09-02T09:00:00Z',
        author: 'Aarav Mehta',
        tag: 'Vendor Issue'
      }
    ],
    photos: [
      {
        id: 'kp-photo-1',
        projectId: 'proj-2',
        url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
        title: 'Living Room Scandinavian Lounge',
        category: 'Completed Work',
        uploadedAt: '2026-08-30',
        uploadedBy: 'Aarav Mehta'
      }
    ]
  },
  {
    id: 'proj-3',
    name: 'The Brew House',
    client: 'Ananya Singhania & Partners',
    clientPhone: '+91 97690 11200',
    location: 'Andheri West, Mumbai',
    city: 'Mumbai',
    branch_id: 'branch-1',
    branchName: 'Bandra Flagship Studio',
    type: 'Commercial',
    budget: 2800000,
    spent: 1720000,
    progress: 61,
    status: 'On Track',
    startDate: '2026-07-01',
    deadline: '2026-09-28',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    description: 'Industrial rustic artisan cafe & roastery with exposed brick cladding, custom brass espresso bar counter, and distressed pine booths.',
    categoryBudgets: [
      { category: 'Materials', allocated: 1200000, spent: 780000 },
      { category: 'Labour', allocated: 600000, spent: 390000 },
      { category: 'Furniture', allocated: 500000, spent: 310000 },
      { category: 'Electrical', allocated: 300000, spent: 160000 },
      { category: 'Miscellaneous', allocated: 200000, spent: 80000 }
    ],
    notes: [
      {
        id: 'bh-note-1',
        projectId: 'proj-3',
        content: 'Bar counter terrazzo tiles and brass trim delivery scheduled for tomorrow morning 9:30 AM.',
        createdAt: '2026-09-03T17:00:00Z',
        author: 'Aarav Mehta',
        tag: 'Site Update'
      }
    ],
    photos: [
      {
        id: 'bh-photo-1',
        projectId: 'proj-3',
        url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        title: 'Brew Bar Concept Render',
        category: 'Design',
        uploadedAt: '2026-07-03',
        uploadedBy: 'Aarav Mehta'
      }
    ]
  },
  {
    id: 'proj-4',
    name: 'Arora Villa',
    client: 'Col. Sanjeev Arora (Retd.)',
    clientPhone: '+91 99220 89100',
    location: 'Koregaon Park, Pune',
    city: 'Pune',
    branch_id: 'branch-2',
    branchName: 'Pune Studio',
    type: 'Residential',
    budget: 3200000,
    spent: 1950000,
    progress: 54,
    status: 'Delayed',
    startDate: '2026-06-01',
    deadline: '2026-10-12',
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    description: 'Expansive 4BHK bungalow interior overhaul with double-height chandelier living room, teakwood louvers, and bespoke master suite.',
    categoryBudgets: [
      { category: 'Materials', allocated: 1400000, spent: 890000 },
      { category: 'Labour', allocated: 800000, spent: 510000 },
      { category: 'Furniture', allocated: 500000, spent: 320000 },
      { category: 'Electrical', allocated: 300000, spent: 150000 },
      { category: 'Miscellaneous', allocated: 200000, spent: 80000 }
    ],
    notes: [
      {
        id: 'av-note-1',
        projectId: 'proj-4',
        content: 'Project is 4 days behind schedule due to monsoon water-proofing curing delay on the terrace garden deck.',
        createdAt: '2026-09-02T10:00:00Z',
        author: 'Aarav Mehta',
        tag: 'Site Update'
      }
    ],
    photos: []
  },
  {
    id: 'proj-5',
    name: 'Shah Penthouse',
    client: 'Nirav & Bhavna Shah',
    clientPhone: '+91 98200 66782',
    location: 'Worli Seaface, Mumbai',
    city: 'Mumbai',
    type: 'Residential',
    budget: 2200000,
    spent: 1420000,
    progress: 75,
    status: 'Needs Attention',
    startDate: '2026-05-15',
    deadline: '2026-09-22',
    coverImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
    description: 'High-floor sea view penthouse with modern contemporary palette, curved micro-cement arches, and custom velvet modular lounge.',
    categoryBudgets: [
      { category: 'Materials', allocated: 1000000, spent: 680000 },
      { category: 'Labour', allocated: 500000, spent: 340000 },
      { category: 'Furniture', allocated: 400000, spent: 250000 },
      { category: 'Electrical', allocated: 200000, spent: 110000 },
      { category: 'Miscellaneous', allocated: 100000, spent: 40000 }
    ],
    notes: [
      {
        id: 'sp-note-1',
        projectId: 'proj-5',
        content: '₹2,40,000 milestone invoice submitted to client on Aug 28; payment reminder sent yesterday.',
        createdAt: '2026-09-03T12:00:00Z',
        author: 'Aarav Mehta',
        tag: 'Client Decision'
      }
    ],
    photos: []
  },
  {
    id: 'proj-6',
    name: 'Oberoi Sky Heights',
    client: 'Rohit Deshmukh',
    clientPhone: '+91 98210 99401',
    location: 'Goregaon East, Mumbai',
    city: 'Mumbai',
    type: 'Residential',
    budget: 1500000,
    spent: 810000,
    progress: 45,
    status: 'On Track',
    startDate: '2026-07-15',
    deadline: '2026-10-30',
    coverImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    description: 'Contemporary 3BHK compact luxury layout for young tech couple featuring space-saving wall beds, quartz breakfast bar, and pastel tones.',
    categoryBudgets: [
      { category: 'Materials', allocated: 650000, spent: 380000 },
      { category: 'Labour', allocated: 350000, spent: 190000 },
      { category: 'Furniture', allocated: 250000, spent: 130000 },
      { category: 'Electrical', allocated: 150000, spent: 70000 },
      { category: 'Miscellaneous', allocated: 100000, spent: 40000 }
    ],
    notes: [],
    photos: []
  },
  {
    id: 'proj-7',
    name: 'Zen Cafe Indiranagar',
    client: 'Kavita Chawla',
    clientPhone: '+91 98450 11982',
    location: '100ft Road, Bengaluru',
    city: 'Bengaluru',
    type: 'Commercial',
    budget: 1650000,
    spent: 1280000,
    progress: 88,
    status: 'On Track',
    startDate: '2026-06-20',
    deadline: '2026-09-15',
    coverImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
    description: 'Japanese wabi-sabi themed matcha cafe with raw cedarwood joinery, rice paper acoustic pendants, and stone rock garden foyer.',
    categoryBudgets: [
      { category: 'Materials', allocated: 700000, spent: 580000 },
      { category: 'Labour', allocated: 400000, spent: 320000 },
      { category: 'Furniture', allocated: 300000, spent: 220000 },
      { category: 'Electrical', allocated: 150000, spent: 110000 },
      { category: 'Miscellaneous', allocated: 100000, spent: 50000 }
    ],
    notes: [],
    photos: []
  },
  {
    id: 'proj-8',
    name: 'Singhania Villa Estate',
    client: 'Harshvardhan Singhania',
    clientPhone: '+91 99890 33410',
    location: 'Jubilee Hills, Hyderabad',
    city: 'Hyderabad',
    type: 'Residential',
    budget: 3500000,
    spent: 2160000,
    progress: 50,
    status: 'On Track',
    startDate: '2026-05-10',
    deadline: '2026-11-15',
    coverImage: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80',
    description: 'Heritage modern royal residence featuring bespoke brass chandeliers, onyx bathroom vanity, and acoustic home theatre.',
    categoryBudgets: [
      { category: 'Materials', allocated: 1500000, spent: 980000 },
      { category: 'Labour', allocated: 900000, spent: 560000 },
      { category: 'Furniture', allocated: 600000, spent: 370000 },
      { category: 'Electrical', allocated: 300000, spent: 160000 },
      { category: 'Miscellaneous', allocated: 200000, spent: 90000 }
    ],
    notes: [],
    photos: []
  },
  {
    id: 'proj-9',
    name: 'Malabar Hill Duplex',
    client: 'Aditi & Gautam Piramal',
    clientPhone: '+91 98200 44109',
    location: 'Walkeshwar, South Mumbai',
    city: 'Mumbai',
    type: 'Residential',
    budget: 2600000,
    spent: 1690000,
    progress: 60,
    status: 'Needs Attention',
    startDate: '2026-06-15',
    deadline: '2026-10-05',
    coverImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    description: 'Duplex apartment with spiral floating staircase, Venetian plaster walls, and custom walk-in Italian dressing suite.',
    categoryBudgets: [
      { category: 'Materials', allocated: 1100000, spent: 750000 },
      { category: 'Labour', allocated: 650000, spent: 440000 },
      { category: 'Furniture', allocated: 450000, spent: 280000 },
      { category: 'Electrical', allocated: 250000, spent: 140000 },
      { category: 'Miscellaneous', allocated: 150000, spent: 80000 }
    ],
    notes: [],
    photos: []
  },
  {
    id: 'proj-10',
    name: 'Studio 45 Coworking',
    client: 'Spaces Co-labs India',
    clientPhone: '+91 98190 88200',
    location: 'BKC, Mumbai',
    city: 'Mumbai',
    type: 'Commercial',
    budget: 1900000,
    spent: 1340000,
    progress: 70,
    status: 'On Track',
    startDate: '2026-06-01',
    deadline: '2026-10-20',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern open-plan coworking studio with phone booths, acoustic felt baffles, ergonomic workstations, and micro-kitchen pantry.',
    categoryBudgets: [
      { category: 'Materials', allocated: 800000, spent: 590000 },
      { category: 'Labour', allocated: 450000, spent: 330000 },
      { category: 'Furniture', allocated: 350000, spent: 240000 },
      { category: 'Electrical', allocated: 200000, spent: 120000 },
      { category: 'Miscellaneous', allocated: 100000, spent: 60000 }
    ],
    notes: [],
    photos: []
  },
  {
    id: 'proj-11',
    name: 'DLF Cyber Park Executive Suite',
    client: 'Acuity Partners LLP',
    clientPhone: '+91 98101 22910',
    location: 'DLF Phase 2, Gurugram',
    city: 'Gurugram',
    type: 'Commercial',
    budget: 2100000,
    spent: 1520000,
    progress: 65,
    status: 'On Track',
    startDate: '2026-06-18',
    deadline: '2026-10-25',
    coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
    description: 'Executive legal conference lounge and partner cabins with soundproof double glazing and fluted smoked oak panelling.',
    categoryBudgets: [
      { category: 'Materials', allocated: 900000, spent: 690000 },
      { category: 'Labour', allocated: 500000, spent: 370000 },
      { category: 'Furniture', allocated: 400000, spent: 270000 },
      { category: 'Electrical', allocated: 200000, spent: 130000 },
      { category: 'Miscellaneous', allocated: 100000, spent: 60000 }
    ],
    notes: [],
    photos: []
  },
  {
    id: 'proj-12',
    name: 'Godrej Woodsville 3BHK',
    client: 'Sameer & Divya Joshi',
    clientPhone: '+91 98230 45611',
    location: 'Hinjawadi, Pune',
    city: 'Pune',
    type: 'Residential',
    budget: 1400000,
    spent: 1380000,
    progress: 100,
    status: 'Completed',
    startDate: '2026-04-10',
    deadline: '2026-09-01',
    coverImage: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
    description: 'Contemporary turnkey 3BHK handed over with modular kitchen, customized study room, and balcony garden vertical planter wall.',
    categoryBudgets: [
      { category: 'Materials', allocated: 600000, spent: 600000 },
      { category: 'Labour', allocated: 350000, spent: 345000 },
      { category: 'Furniture', allocated: 250000, spent: 245000 },
      { category: 'Electrical', allocated: 120000, spent: 120000 },
      { category: 'Miscellaneous', allocated: 80000, spent: 70000 }
    ],
    notes: [
      {
        id: 'gw-note-1',
        projectId: 'proj-12',
        content: 'Final walkthrough and snaglist clearance signed off by Mr. Joshi. Handover completed successfully!',
        createdAt: '2026-09-01T18:00:00Z',
        author: 'Aarav Mehta',
        tag: 'Client Decision'
      }
    ],
    photos: []
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Italian Marble Botticino Slabs',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Materials',
    vendor: 'StoneCraft India',
    date: '2026-09-03',
    amount: 128000,
    paymentStatus: 'Paid',
    notes: 'Premium 18mm imported slabs for living room flooring and TV console panel.'
  },
  {
    id: 'exp-2',
    title: 'Architectural Smart Fixtures & LED Profile',
    projectId: 'proj-2',
    projectName: 'Kapoor Apartment',
    category: 'Electrical',
    vendor: 'Luma Electricals',
    date: '2026-09-02',
    amount: 46500,
    paymentStatus: 'Paid',
    notes: '3000K warm white dimmable drivers and linear cove channels.'
  },
  {
    id: 'exp-3',
    title: 'Carpentry Labour - Week 8 Milestone',
    projectId: 'proj-3',
    projectName: 'The Brew House',
    category: 'Labour',
    vendor: 'Rajesh Contractor',
    date: '2026-09-02',
    amount: 72000,
    paymentStatus: 'Paid',
    notes: 'Bar counter structure framing and booth partition installations.'
  },
  {
    id: 'exp-4',
    title: 'Custom Boucle Sofa & Velvet Fabric',
    projectId: 'proj-4',
    projectName: 'Arora Villa',
    category: 'Furniture',
    vendor: 'FabIndia Contract',
    date: '2026-09-01',
    amount: 38400,
    paymentStatus: 'Pending',
    notes: 'High rub-count upholstery fabric for 8-seater living room sectional.'
  },
  {
    id: 'exp-5',
    title: 'Asian Paints Royale Luxury Emulsion & Primer',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Materials',
    vendor: 'Asian Paints Studio',
    date: '2026-08-30',
    amount: 54000,
    paymentStatus: 'Paid',
    notes: 'Base coats and custom tinting for master suite and guest bedroom.'
  },
  {
    id: 'exp-6',
    title: 'German Hettich Soft-Close Hardware & Hinges',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Materials',
    vendor: 'Hettich India Experience Center',
    date: '2026-08-28',
    amount: 68500,
    paymentStatus: 'Paid',
    notes: 'InnoTech Atira drawer channels and Sensys concealed hinges.'
  },
  {
    id: 'exp-7',
    title: 'Custom Fluted Smoked Glass Partitions',
    projectId: 'proj-5',
    projectName: 'Shah Penthouse',
    category: 'Materials',
    vendor: 'Saint-Gobain Glass Direct',
    date: '2026-08-27',
    amount: 92000,
    paymentStatus: 'Partially Paid',
    notes: '10mm toughened reed glass with slim anodized black aluminium frame.'
  },
  {
    id: 'exp-8',
    title: 'False Ceiling & POP Gypsum Labour',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Labour',
    vendor: 'Suresh Plaster & Gypsum Works',
    date: '2026-08-25',
    amount: 45000,
    paymentStatus: 'Paid',
    notes: 'Cove detail drop-ceiling across foyer and dining area.'
  },
  {
    id: 'exp-9',
    title: 'Kohler Brushed Rose Gold Sanitaryware',
    projectId: 'proj-8',
    projectName: 'Singhania Villa Estate',
    category: 'Plumbing',
    vendor: 'Kohler Signature Studio',
    date: '2026-08-24',
    amount: 145000,
    paymentStatus: 'Paid',
    notes: 'Thermostatic shower mixers and wall-hung sensor faucets.'
  },
  {
    id: 'exp-10',
    title: 'Custom Teakwood Dining Chairs (Set of 6)',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Furniture',
    vendor: 'WoodenStreet Studio',
    date: '2026-08-22',
    amount: 78000,
    paymentStatus: 'Paid',
    notes: 'Handcrafted solid teak with beige linen seating cushion.'
  },
  {
    id: 'exp-11',
    title: 'Site Transport & Freight Delivery - Marble slabs',
    projectId: 'proj-4',
    projectName: 'Arora Villa',
    category: 'Transport',
    vendor: 'CityLogistics Pune',
    date: '2026-08-21',
    amount: 18500,
    paymentStatus: 'Paid',
    notes: 'Heavy vehicle freight from Makrana depot to Koregaon Park site.'
  },
  {
    id: 'exp-12',
    title: 'Wabi-Sabi Handmade Ceramic Wall Pendants',
    projectId: 'proj-7',
    projectName: 'Zen Cafe Indiranagar',
    category: 'Electrical',
    vendor: 'Clay & Kiln Artisan Studio',
    date: '2026-08-20',
    amount: 32000,
    paymentStatus: 'Paid',
    notes: 'Terracotta earthy pendants for counter overhang.'
  },
  {
    id: 'exp-13',
    title: 'Polishing & Duco Finish Specialist Labour',
    projectId: 'proj-2',
    projectName: 'Kapoor Apartment',
    category: 'Labour',
    vendor: 'Manoj Polishers',
    date: '2026-08-18',
    amount: 38000,
    paymentStatus: 'Paid',
    notes: 'PU Matt finish on master wardrobe and bar cabinet.'
  },
  {
    id: 'exp-14',
    title: 'Acoustic Felt Baffles & Ceiling Panels',
    projectId: 'proj-10',
    projectName: 'Studio 45 Coworking',
    category: 'Materials',
    vendor: 'EchoSound Acoustics Mumbai',
    date: '2026-08-15',
    amount: 84000,
    paymentStatus: 'Paid',
    notes: 'NRC 0.85 fire-rated overhead sound absorbers for calling booths.'
  },
  {
    id: 'exp-15',
    title: '3D Photorealistic Renderings & VR Walkthrough',
    projectId: 'proj-9',
    projectName: 'Malabar Hill Duplex',
    category: 'Design',
    vendor: 'PixelCraft 3D Studio',
    date: '2026-08-12',
    amount: 35000,
    paymentStatus: 'Paid',
    notes: 'High-res exterior terrace and spiral staircase client presentations.'
  },
  {
    id: 'exp-16',
    title: 'Marble Diamond Polishing & Crystallization',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Labour',
    vendor: 'GlossStone Polishers',
    date: '2026-08-10',
    amount: 42000,
    paymentStatus: 'Paid',
    notes: '5-step diamond pad grinding and nano-sealant coat.'
  },
  {
    id: 'exp-17',
    title: 'KalingaStone White Quartz Countertop Slab',
    projectId: 'proj-6',
    projectName: 'Oberoi Sky Heights',
    category: 'Materials',
    vendor: 'KalingaStone Gallery',
    date: '2026-08-08',
    amount: 52000,
    paymentStatus: 'Paid',
    notes: 'Stain-resistant engineered quartz for open kitchen breakfast counter.'
  },
  {
    id: 'exp-18',
    title: 'Plumbing Core PVC Pipes & Concealed Cisterns',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Plumbing',
    vendor: 'Supreme Pipes & Sanitary',
    date: '2026-08-05',
    amount: 28500,
    paymentStatus: 'Paid',
    notes: 'Geberit concealed flushing systems and multi-layer pipe lines.'
  },
  {
    id: 'exp-19',
    title: 'Debris Removal & Post-Masonry Site Deep Cleaning',
    projectId: 'proj-3',
    projectName: 'The Brew House',
    category: 'Miscellaneous',
    vendor: 'CleanSite Services',
    date: '2026-08-02',
    amount: 14000,
    paymentStatus: 'Paid',
    notes: '3 truckloads rubble clearing and industrial vacuuming.'
  },
  {
    id: 'exp-20',
    title: 'Bespoke Executive Leather Swivel Chairs (4 units)',
    projectId: 'proj-11',
    projectName: 'DLF Cyber Park Executive Suite',
    category: 'Furniture',
    vendor: 'Godrej Interio Contract',
    date: '2026-07-29',
    amount: 96000,
    paymentStatus: 'Pending',
    notes: 'Tan top-grain leather with synchro-tilt mechanism.'
  }
];

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: 'att-1',
    projectId: 'proj-2',
    projectName: 'Kapoor Apartment',
    severity: 'red',
    title: 'Budget usage reached 86%',
    subtitle: '₹10.8L spent of ₹12.5L budget. Only ₹1.7L remaining for final finishes.',
    badgeText: '86% Used',
    type: 'budget'
  },
  {
    id: 'att-2',
    projectId: 'proj-4',
    projectName: 'Arora Villa',
    severity: 'orange',
    title: 'Project is 4 days behind schedule',
    subtitle: 'Terrace garden waterproofing delayed due to rains. Carpentry on hold.',
    badgeText: '4 Days Delayed',
    type: 'schedule'
  },
  {
    id: 'att-3',
    projectId: 'proj-5',
    projectName: 'Shah Penthouse',
    severity: 'yellow',
    title: '₹2,40,000 client payment pending',
    subtitle: 'Stage 3 milestone invoice sent 6 days ago. Follow-up recommended.',
    badgeText: '₹2.4L Due',
    type: 'payment'
  },
  {
    id: 'att-4',
    projectId: 'proj-3',
    projectName: 'The Brew House',
    severity: 'green',
    title: 'Material delivery expected tomorrow',
    subtitle: 'Bar counter terrazzo slabs arriving 9:30 AM from StoneCraft India.',
    badgeText: 'Expected 9:30 AM',
    type: 'delivery'
  }
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Material Delivery: Terrazzo Slabs',
    projectId: 'proj-3',
    projectName: 'The Brew House',
    date: '2026-09-05',
    time: '09:30 AM',
    type: 'delivery',
    location: 'Andheri West site'
  },
  {
    id: 'ev-2',
    title: 'Client Material Walkthrough with Mr. Kapoor',
    projectId: 'proj-2',
    projectName: 'Kapoor Apartment',
    date: '2026-09-06',
    time: '03:00 PM',
    type: 'meeting',
    location: 'Powai site'
  },
  {
    id: 'ev-3',
    title: 'Site Inspection: False Ceiling & Profile Lighting',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    date: '2026-09-07',
    time: '11:00 AM',
    type: 'site_visit',
    location: 'Bandra West site'
  },
  {
    id: 'ev-4',
    title: 'Kitchen Countertop Arrival & Fitment',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    date: '2026-09-08',
    time: '10:00 AM',
    type: 'delivery',
    location: 'Bandra West site'
  },
  {
    id: 'ev-5',
    title: 'Project Deadline: Kapoor Apartment Handover',
    projectId: 'proj-2',
    projectName: 'Kapoor Apartment',
    date: '2026-09-10',
    time: '05:00 PM',
    type: 'deadline',
    location: 'Powai site'
  },
  {
    id: 'ev-6',
    title: 'Zen Cafe Final Inspection & Snag Checklist',
    projectId: 'proj-7',
    projectName: 'Zen Cafe Indiranagar',
    date: '2026-09-15',
    time: '02:00 PM',
    type: 'site_visit',
    location: 'Indiranagar, Bengaluru'
  },
  {
    id: 'ev-7',
    title: 'Mehta Residence Handover Target',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    date: '2026-09-18',
    time: '04:00 PM',
    type: 'deadline',
    location: 'Bandra West'
  }
];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    organization_id: 'demo-org',
    full_name: 'Aarav Mehta',
    email: 'aarav@apniestate.in',
    role: 'owner',
    phone: '+91 98201 55901',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    branch_id: 'branch-1',
    branchName: 'Bandra Flagship Studio',
    status: 'Active',
    created_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'staff-2',
    organization_id: 'demo-org',
    full_name: 'Priya Sharma',
    email: 'priya@apniestate.in',
    role: 'designer',
    phone: '+91 98112 33445',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    branch_id: 'branch-1',
    branchName: 'Bandra Flagship Studio',
    custom_role_id: 'role-pm',
    customRoleName: 'Senior Project Manager',
    status: 'Active',
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'staff-3',
    organization_id: 'demo-org',
    full_name: 'Rohan Deshmukh',
    email: 'rohan@apniestate.in',
    role: 'supervisor',
    phone: '+91 98450 67890',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    branch_id: 'branch-2',
    branchName: 'Pune Studio',
    custom_role_id: 'role-site',
    customRoleName: 'Site Quality Specialist',
    status: 'Active',
    created_at: '2026-02-15T10:00:00Z'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    organization_id: 'demo-org',
    name: 'Vikram Malhotra',
    phone: '+91 98204 11223',
    email: 'vikram.malhotra@gmail.com',
    source: 'Instagram',
    requirement: '4BHK Luxury Duplex Turnkey Interior with Italian marble and smart automation.',
    estimated_budget: 3500000,
    status: 'Proposal Sent',
    notes: 'Visited site in Worli. Client loved the moodboard. Sent formal BOQ quote.',
    assigned_to: 'staff-2',
    assigned_staff_name: 'Priya Sharma',
    created_at: '2026-08-28T14:30:00Z'
  },
  {
    id: 'lead-2',
    organization_id: 'demo-org',
    name: 'Ananya Singhania',
    phone: '+91 98331 44556',
    email: 'ananya.singh@singhaniagroup.in',
    source: 'Referral',
    requirement: 'Boutique Law Office (1,800 sq ft) in Nariman Point with soundproof cabins.',
    estimated_budget: 2200000,
    status: 'Site Visit Scheduled',
    notes: 'Referred by Rajesh Mehta. Site inspection scheduled for Saturday 11 AM.',
    assigned_to: 'staff-1',
    assigned_staff_name: 'Aarav Mehta',
    created_at: '2026-09-01T11:00:00Z'
  },
  {
    id: 'lead-3',
    organization_id: 'demo-org',
    name: 'Rameshwar & Sunita Agarwal',
    phone: '+91 98190 77889',
    email: 'rsagarwal@hotmail.com',
    source: 'Website',
    requirement: '3BHK Flat Renovation in Powai — Modular kitchen and full wardrobes.',
    estimated_budget: 1500000,
    status: 'Negotiation',
    notes: 'Finalizing payment stages and milestone discount.',
    assigned_to: 'staff-2',
    assigned_staff_name: 'Priya Sharma',
    created_at: '2026-08-15T09:15:00Z'
  },
  {
    id: 'lead-4',
    organization_id: 'demo-org',
    name: 'Karan Patel',
    phone: '+91 98765 43210',
    email: 'karan@pateltech.io',
    source: 'Housing Portal',
    requirement: 'Penthouse Balcony Deck & Lounge Area with Pergola in Baner, Pune.',
    estimated_budget: 850000,
    status: 'New',
    notes: 'Inquiry received via online portal. Needs initial discovery call.',
    assigned_to: 'staff-1',
    assigned_staff_name: 'Aarav Mehta',
    created_at: '2026-09-04T16:45:00Z'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    title: 'Inspect Master Bedroom Veneer Batch',
    description: 'Verify smoke walnut veneer texture consistency before pressing onto wardrobe doors.',
    assigned_to: 'staff-2',
    assigned_staff_name: 'Priya Sharma',
    due_date: '2026-09-08',
    dueDate: '2026-09-08',
    priority: 'High',
    status: 'In Progress',
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'task-2',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    title: 'Coordinate False Ceiling Light Trough Cutouts',
    description: 'Provide electrician with exact magnetic track layout dimensions for living room.',
    assigned_to: 'staff-3',
    assigned_staff_name: 'Rohan Deshmukh',
    due_date: '2026-09-09',
    dueDate: '2026-09-09',
    priority: 'Urgent',
    status: 'To Do',
    created_at: '2026-09-02T11:30:00Z'
  },
  {
    id: 'task-3',
    organization_id: 'demo-org',
    project_id: 'proj-2',
    projectId: 'proj-2',
    projectName: 'Kapoor Apartment',
    title: 'Confirm Dining Room Italian Marble Slab Delivery',
    description: 'Coordinate crane hoist and site supervisor presence for 4 slabs of Botticino.',
    assigned_to: 'staff-3',
    assigned_staff_name: 'Rohan Deshmukh',
    due_date: '2026-09-07',
    dueDate: '2026-09-07',
    priority: 'High',
    status: 'In Progress',
    created_at: '2026-09-03T09:00:00Z'
  },
  {
    id: 'task-4',
    organization_id: 'demo-org',
    project_id: 'proj-3',
    projectId: 'proj-3',
    projectName: 'The Brew House',
    title: 'Bar Counter Epoxy Coating Polish Test',
    description: 'Sample 1 sq ft test of chemical-resistant matte epoxy over terrazzo counter.',
    assigned_to: 'staff-1',
    assigned_staff_name: 'Aarav Mehta',
    due_date: '2026-09-12',
    dueDate: '2026-09-12',
    priority: 'Medium',
    status: 'To Do',
    created_at: '2026-09-04T15:00:00Z'
  },
  {
    id: 'task-5',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectId: 'proj-1',
    projectName: 'Mehta Residence',
    title: 'Client Moodboard Approval Sign-off',
    description: 'Obtain physical signature on final moodboard presentation v3.',
    assigned_to: 'staff-2',
    assigned_staff_name: 'Priya Sharma',
    due_date: '2026-08-25',
    dueDate: '2026-08-25',
    priority: 'Low',
    status: 'Completed',
    created_at: '2026-08-20T10:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Mehta Residence - Approved Moodboard & Palette v3.pdf',
    projectId: 'proj-1',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Moodboard',
    type: 'Moodboard',
    file_name: 'Mehta_Residence_Moodboard_v3.pdf',
    size: '8.4 MB',
    file_size: 8808038,
    updatedAt: '2026-08-25'
  },
  {
    id: 'doc-2',
    title: 'Mehta Residence - Client Agreement & Payment Milestones.pdf',
    projectId: 'proj-1',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    category: 'Contract',
    type: 'Contract',
    file_name: 'Mehta_Agreement_Signed.pdf',
    size: '1.2 MB',
    file_size: 1258291,
    updatedAt: '2026-06-10'
  },
  {
    id: 'doc-3',
    title: 'The Brew House - Bar & Seating Layout 2D CAD.dwg',
    projectId: 'proj-3',
    project_id: 'proj-3',
    projectName: 'The Brew House',
    category: 'Drawing',
    type: 'Drawing',
    file_name: 'BrewHouse_2D_CAD_v2.dwg',
    size: '14.6 MB',
    file_size: 15309209,
    updatedAt: '2026-07-15'
  },
  {
    id: 'doc-4',
    title: 'Kapoor Apartment - Electrical Circuit & Switch Schematics.pdf',
    projectId: 'proj-2',
    project_id: 'proj-2',
    projectName: 'Kapoor Apartment',
    category: 'Drawing',
    type: 'Drawing',
    file_name: 'Kapoor_Electrical_Schematics.pdf',
    size: '4.8 MB',
    file_size: 5033164,
    updatedAt: '2026-07-02'
  },
  {
    id: 'doc-5',
    title: 'Shah Penthouse - Luxury Finish Estimate & BOQ Summary.pdf',
    projectId: 'proj-5',
    project_id: 'proj-5',
    projectName: 'Shah Penthouse',
    category: 'Estimate',
    type: 'Estimate',
    file_name: 'Shah_BOQ_Estimate_Final.pdf',
    size: '2.1 MB',
    file_size: 2202009,
    updatedAt: '2026-05-18'
  },
  {
    id: 'doc-6',
    title: 'Arora Villa - Landscape & Terrace Deck Proposal.pdf',
    projectId: 'proj-4',
    project_id: 'proj-4',
    projectName: 'Arora Villa',
    category: 'Proposal',
    type: 'Proposal',
    file_name: 'Arora_Villa_Landscape_Deck.pdf',
    size: '11.3 MB',
    file_size: 11848908,
    updatedAt: '2026-06-05'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Budget Alert: Kapoor Apartment',
    description: 'Budget usage reached 86%. Only ₹1.7L remaining.',
    time: '2 hours ago',
    read: false,
    type: 'alert',
    projectId: 'proj-2'
  },
  {
    id: 'notif-2',
    title: 'Delivery Scheduled: The Brew House',
    description: 'Terrazzo slabs arriving tomorrow at 9:30 AM.',
    time: '4 hours ago',
    read: false,
    type: 'update',
    projectId: 'proj-3'
  },
  {
    id: 'notif-3',
    title: 'Payment Pending: Shah Penthouse',
    description: 'Milestone 3 payment of ₹2,40,000 awaiting confirmation.',
    time: 'Yesterday',
    read: true,
    type: 'payment',
    projectId: 'proj-5'
  },
  {
    id: 'notif-4',
    title: 'Project Completed: Godrej Woodsville',
    description: 'Turnkey handover signed off by Mr. Joshi.',
    time: '3 days ago',
    read: true,
    type: 'milestone',
    projectId: 'proj-12'
  }
];

export const INITIAL_BOQ_ITEMS: any[] = [
  {
    id: 'boq-1',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    item_name: 'Italian Marble Flooring (Botticino)',
    description: 'Supplying and laying Botticino Italian marble with mirror polishing and epoxy filling.',
    category: 'Civil Work',
    quantity: 650,
    unit: 'Sq Ft',
    rate: 450,
    estimated_cost: 292500
  },
  {
    id: 'boq-2',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    item_name: 'Master Bed Walnut Wardrobe & Paneling',
    description: 'Floor-to-ceiling wardrobe in commercial ply with smoked walnut veneer finish and profile lighting.',
    category: 'Carpentry',
    quantity: 120,
    unit: 'Sq Ft',
    rate: 1850,
    estimated_cost: 222000
  },
  {
    id: 'boq-3',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    item_name: 'Modular Acrylic Kitchen Cabinets',
    description: 'High gloss acrylic finish shutters, Blum soft-close tandem boxes and stainless steel baskets.',
    category: 'Carpentry',
    quantity: 42,
    unit: 'Running Ft',
    rate: 3200,
    estimated_cost: 134400
  },
  {
    id: 'boq-4',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    item_name: 'False Ceiling with Indirect Lighting',
    description: 'Saint Gobain Gyproc false ceiling framing with concealed magnetic track channels.',
    category: 'Civil Work',
    quantity: 850,
    unit: 'Sq Ft',
    rate: 135,
    estimated_cost: 114750
  },
  {
    id: 'boq-5',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    item_name: 'Premium Velvet Touch Royale Painting',
    description: 'Asian Paints Royale Luxury Emulsion with 2 coats of primer and 3 coats of putty.',
    category: 'Painting',
    quantity: 2400,
    unit: 'Sq Ft',
    rate: 42,
    estimated_cost: 100800
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'ven-1',
    organization_id: 'demo-org',
    name: 'Royal Marble & Granites',
    contact_person: 'Ramesh Patel',
    phone: '+91 98200 44551',
    email: 'sales@royalmarbles.in',
    address: 'Gala 12, Marble Market, Vile Parle West, Mumbai',
    category: 'Materials',
    gst_number: '27AABCR1234F1Z5',
    rating: 5,
    notes: 'Premium Italian marble supplier with on-site polishing machinery.'
  },
  {
    id: 'ven-2',
    organization_id: 'demo-org',
    name: 'Greenply & Century Timber Hub',
    contact_person: 'Sunil Jha',
    phone: '+91 98112 88990',
    email: 'orders@timberhub.in',
    address: 'Plot 44, Timber Market, Reay Road, Mumbai',
    category: 'Materials',
    gst_number: '27BBCDE5678G2Z1',
    rating: 5,
    notes: 'Official distributor for BWR grade commercial and marine plywood.'
  },
  {
    id: 'ven-3',
    organization_id: 'demo-org',
    name: 'Lumina Architectural Lights',
    contact_person: 'Deepak Sharma',
    phone: '+91 98334 11223',
    email: 'info@luminalights.co.in',
    address: 'Shop 8, Laxmi Industrial Estate, Andheri West',
    category: 'Lighting',
    gst_number: '27CCDEF9012H3Z7',
    rating: 4,
    notes: 'Magnetic track lights, COB downlights, and custom LED profiles.'
  },
  {
    id: 'ven-4',
    organization_id: 'demo-org',
    name: 'Hafele & Hettich Hardware Studio',
    contact_person: 'Alok Verma',
    phone: '+91 98450 66778',
    email: 'contact@hardwaresolutions.in',
    address: 'Linking Road, Bandra West, Mumbai',
    category: 'Hardware',
    gst_number: '27DDEFG3456I4Z9',
    rating: 5,
    notes: 'Soft-close hinges, tandem pantry pullouts, and glass sliding systems.'
  }
];

export const INITIAL_CLIENT_PAYMENTS: ClientPayment[] = [
  {
    id: 'pay-1',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    client_id: 'cli-1',
    clientName: 'Rajesh & Sunita Mehta',
    title: '1st Milestone - Booking & Civil Demolition Advance (30%)',
    amount: 540000,
    due_date: '2026-06-15',
    paid_amount: 540000,
    paid_date: '2026-06-12',
    status: 'Paid',
    payment_method: 'Bank Transfer / NEFT',
    payment_reference: 'HDFC-UTR-882190',
    notes: 'Advance booking amount cleared upon 2D layout and BOQ confirmation.'
  },
  {
    id: 'pay-2',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    client_id: 'cli-1',
    clientName: 'Rajesh & Sunita Mehta',
    title: '2nd Milestone - False Ceiling & Italian Marble Flooring (40%)',
    amount: 720000,
    due_date: '2026-07-28',
    paid_amount: 600000,
    paid_date: '2026-08-02',
    status: 'Partially Paid',
    payment_method: 'Bank Transfer / NEFT',
    payment_reference: 'ICICI-UTR-441209',
    notes: 'Part payment received; balance ₹1,20,000 to be cleared with woodwork milestone.'
  },
  {
    id: 'pay-3',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    client_id: 'cli-1',
    clientName: 'Rajesh & Sunita Mehta',
    title: '3rd Milestone - Modular Kitchen & Wardrobe Carcass (20%)',
    amount: 360000,
    due_date: '2026-09-01',
    paid_amount: 0,
    status: 'Overdue',
    notes: 'Carpentry carcasses ready for veneer pasting. Awaiting client payment clearance.'
  },
  {
    id: 'pay-4',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    client_id: 'cli-1',
    clientName: 'Rajesh & Sunita Mehta',
    title: '4th Milestone - Final Handover & Deep Cleaning (10%)',
    amount: 180000,
    due_date: '2026-09-18',
    paid_amount: 0,
    status: 'Pending',
    notes: 'Retention amount payable upon final snag inspection.'
  },
  {
    id: 'pay-5',
    organization_id: 'demo-org',
    project_id: 'proj-2',
    projectName: 'Apex Tech Workspace',
    client_id: 'cli-2',
    clientName: 'Vikram Singhania',
    title: 'Advance Deposit - Turnkey Execution (40%)',
    amount: 1400000,
    due_date: '2026-07-05',
    paid_amount: 1400000,
    paid_date: '2026-07-04',
    status: 'Paid',
    payment_method: 'RTGS',
    payment_reference: 'KOTAK-RTGS-990142',
    notes: 'Commercial fit-out booking token.'
  }
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'po-1',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    vendor_id: 'ven-1',
    vendorName: 'Royal Marble & Granites',
    po_number: 'PO-2026-1041',
    order_date: '2026-06-20',
    expected_delivery: '2026-06-28',
    status: 'Received',
    payment_status: 'Paid',
    notes: 'Delivered Italian Statuario slabs with zero transit hairline cracks.',
    total_amount: 320000,
    items: [
      {
        id: 'poi-1',
        item_name: 'Italian Statuario Marble Slabs',
        description: 'First grade white background with grey veining',
        quantity: 800,
        unit: 'Sq Ft',
        rate: 400,
        total: 320000
      }
    ]
  },
  {
    id: 'po-2',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    vendor_id: 'ven-2',
    vendorName: 'Greenply & Century Timber Hub',
    po_number: 'PO-2026-1088',
    order_date: '2026-07-10',
    expected_delivery: '2026-07-16',
    status: 'Received',
    payment_status: 'Paid',
    notes: 'Delivered at site for master bedroom and modular kitchen carpentry.',
    total_amount: 198000,
    items: [
      {
        id: 'poi-2',
        item_name: 'Greenply Gold Calibrated Plywood 19mm',
        description: '8x4 ft sheets, BWR waterproof grade',
        quantity: 45,
        unit: 'Sheets',
        rate: 3200,
        total: 144000
      },
      {
        id: 'poi-3',
        item_name: 'Century Smoked Walnut Wood Veneer',
        description: '4mm natural wood decorative sheet',
        quantity: 18,
        unit: 'Sheets',
        rate: 3000,
        total: 54000
      }
    ]
  },
  {
    id: 'po-3',
    organization_id: 'demo-org',
    project_id: 'proj-1',
    projectName: 'Mehta Residence',
    vendor_id: 'ven-3',
    vendorName: 'Lumina Architectural Lights',
    po_number: 'PO-2026-1142',
    order_date: '2026-08-15',
    expected_delivery: '2026-08-25',
    status: 'Ordered',
    payment_status: 'Partially Paid',
    notes: 'Magnetic track lights custom fabrication order.',
    total_amount: 85000,
    items: [
      {
        id: 'poi-4',
        item_name: 'Recessed Magnetic Track Rails (2M)',
        description: 'Slim black anodized aluminum profile',
        quantity: 6,
        unit: 'pcs',
        rate: 3500,
        total: 21000
      },
      {
        id: 'poi-5',
        item_name: 'Magnetic Linear Grille Spotlights 12W 3000K',
        description: 'Warm white anti-glare COB optics',
        quantity: 16,
        unit: 'pcs',
        rate: 2800,
        total: 44800
      },
      {
        id: 'poi-6',
        item_name: 'Meanwell 48V DC 200W Power Drivers',
        description: 'Concealed driver unit for ceiling',
        quantity: 4,
        unit: 'pcs',
        rate: 4800,
        total: 19200
      }
    ]
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    organization_id: 'demo-org',
    name: 'Bandra Flagship Studio',
    code: 'MUM-BAN',
    address: '14th Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    phone: '+91 98201 55901',
    email: 'bandra@apniestate.in',
    manager_id: 'staff-1',
    managerName: 'Aarav Mehta',
    is_active: true,
    created_at: '2026-01-01T10:00:00Z'
  },
  {
    id: 'branch-2',
    organization_id: 'demo-org',
    name: 'Pune Koregaon Studio',
    code: 'PUN-KP',
    address: 'North Main Road, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    phone: '+91 98202 44102',
    email: 'pune@apniestate.in',
    manager_id: 'staff-3',
    managerName: 'Rohan Deshmukh',
    is_active: true,
    created_at: '2026-02-15T10:00:00Z'
  },
  {
    id: 'branch-3',
    organization_id: 'demo-org',
    name: 'Bengaluru Indiranagar Studio',
    code: 'BLR-IND',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    phone: '+91 98203 77803',
    email: 'bangalore@apniestate.in',
    manager_id: 'staff-2',
    managerName: 'Priya Sharma',
    is_active: true,
    created_at: '2026-03-01T10:00:00Z'
  }
];

export const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'appr-1',
    organization_id: 'demo-org',
    entity_type: 'purchase_order',
    entity_id: 'po-3',
    requested_by: 'staff-3',
    requesterName: 'Rohan Deshmukh',
    assigned_to: 'staff-1',
    assigneeName: 'Aarav Mehta',
    status: 'pending',
    title: 'PO-2026-1142: Lumina Architectural Lights Procurement',
    description: 'Custom magnetic slim track rails and spotlight modules exceeding ₹50,000 threshold for Mehta Residence.',
    amount: 85000,
    requested_at: '2026-08-15T10:30:00Z'
  },
  {
    id: 'appr-2',
    organization_id: 'demo-org',
    entity_type: 'expense',
    entity_id: 'exp-1',
    requested_by: 'staff-2',
    requesterName: 'Priya Sharma',
    assigned_to: 'staff-1',
    assigneeName: 'Aarav Mehta',
    status: 'approved',
    title: 'EXP-104: Italian Statuario Marble Extra Lot',
    description: 'Additional 200 sq ft slab batch required to complete seamless book-match flooring across living lounge.',
    amount: 80000,
    requested_at: '2026-08-10T14:15:00Z',
    reviewed_at: '2026-08-11T09:00:00Z',
    reviewed_by: 'staff-1',
    reviewerName: 'Aarav Mehta',
    review_notes: 'Approved after client confirmed batch slab selection.'
  },
  {
    id: 'appr-3',
    organization_id: 'demo-org',
    entity_type: 'expense',
    entity_id: 'exp-2',
    requested_by: 'staff-3',
    requesterName: 'Rohan Deshmukh',
    assigned_to: 'staff-1',
    assigneeName: 'Aarav Mehta',
    status: 'pending',
    title: 'EXP-112: Emergency Acoustic Panelling Fabric Lot',
    description: 'Special order acoustic felt fabric for conference room sound dampening at Kapoor Apartment.',
    amount: 45000,
    requested_at: '2026-09-02T11:00:00Z'
  },
  {
    id: 'appr-4',
    organization_id: 'demo-org',
    entity_type: 'purchase_order',
    entity_id: 'po-1',
    requested_by: 'staff-2',
    requesterName: 'Priya Sharma',
    assigned_to: 'staff-1',
    assigneeName: 'Aarav Mehta',
    status: 'approved',
    title: 'PO-2026-1041: Royal Marble & Granites Initial Slabs Batch',
    description: 'Initial 800 sq ft first grade white Italian Statuario slabs procurement.',
    amount: 320000,
    requested_at: '2026-06-18T16:00:00Z',
    reviewed_at: '2026-06-19T10:30:00Z',
    reviewed_by: 'staff-1',
    reviewerName: 'Aarav Mehta',
    review_notes: 'Authorized in accordance with sanctioned client BOQ schedule.'
  }
];

export const INITIAL_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'role-pm',
    organization_id: 'demo-org',
    name: 'Senior Project Manager',
    description: 'Full execution authority over projects, rooms, BOQ, milestones, and site tasks without financial ledger modification privileges.',
    is_active: true,
    permissions: [
      'projects.view',
      'projects.manage',
      'clients.view',
      'boq.manage',
      'tasks.manage',
      'documents.manage',
      'materials.manage',
      'approvals.request'
    ],
    user_count: 1,
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'role-procure',
    organization_id: 'demo-org',
    name: 'Procurement Specialist',
    description: 'Manages vendor relationships, purchase orders, material catalogs, and delivery fulfillment.',
    is_active: true,
    permissions: [
      'projects.view',
      'vendors.manage',
      'purchases.manage',
      'materials.manage',
      'approvals.request'
    ],
    user_count: 0,
    created_at: '2026-02-10T10:00:00Z'
  },
  {
    id: 'role-site',
    organization_id: 'demo-org',
    name: 'Site Quality Specialist',
    description: 'Oversees site execution, DPR updates, daily inspections, and safety standards.',
    is_active: true,
    permissions: [
      'projects.view',
      'tasks.manage',
      'documents.manage',
      'materials.manage',
      'approvals.request'
    ],
    user_count: 1,
    created_at: '2026-02-15T10:00:00Z'
  }
];
