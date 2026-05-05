export interface Template {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'auth',
    name: 'User Authentication Flow',
    description: 'Login, registration, 2FA decision tree',
    code: `flowchart TD
    A[User visits app] --> B{Has account?}
    B -->|No| C[Register]
    B -->|Yes| D[Login]
    C --> E[Verify Email]
    E --> D
    D --> F{2FA enabled?}
    F -->|Yes| G[Enter OTP]
    F -->|No| H[Dashboard]
    G --> H`,
  },
  {
    id: 'ecom',
    name: 'E-commerce Order Flow',
    description: 'Browse → cart → checkout → delivery',
    code: `flowchart TD
    A[Browse Products] --> B[Add to Cart]
    B --> C[Checkout]
    C --> D[Payment]
    D --> E{Payment OK?}
    E -->|Yes| F[Order Confirmed]
    E -->|No| G[Retry Payment]
    G --> D
    F --> H[Dispatch]
    H --> I[Delivered]`,
  },
  {
    id: 'api',
    name: 'API Request Lifecycle',
    description: 'Sequence diagram of a request through a gateway',
    code: `sequenceDiagram
    Client->>API Gateway: HTTP Request
    API Gateway->>Auth Service: Validate Token
    Auth Service-->>API Gateway: Token Valid
    API Gateway->>Backend: Forward Request
    Backend->>Database: Query
    Database-->>Backend: Result
    Backend-->>API Gateway: Response
    API Gateway-->>Client: HTTP 200`,
  },
  {
    id: 'er',
    name: 'Database Schema (ER)',
    description: 'Users, orders, products entity-relationship',
    code: `erDiagram
    USERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : includes
    USERS {
      string id PK
      string email
      string name
    }
    ORDERS {
      string id PK
      string user_id FK
      string status
    }
    PRODUCTS {
      string id PK
      string name
      float price
    }`,
  },
  {
    id: 'gantt',
    name: 'Sprint Gantt',
    description: 'Two-week sprint plan with milestones',
    code: `gantt
    title Sprint 12
    dateFormat  YYYY-MM-DD
    section Design
    Wireframes       :done, 2024-01-01, 3d
    UI Review        :active, 2024-01-04, 2d
    section Dev
    Backend API      :2024-01-06, 5d
    Frontend         :2024-01-08, 6d
    section QA
    Testing          :2024-01-14, 3d
    Release          :milestone, 2024-01-17, 0d`,
  },
  {
    id: 'arch',
    name: 'System Architecture',
    description: 'CDN, load balancer, web servers, cache, queue',
    code: `flowchart LR
    User --> CDN
    CDN --> LoadBalancer
    LoadBalancer --> WebServer1
    LoadBalancer --> WebServer2
    WebServer1 --> Cache
    WebServer2 --> Cache
    Cache --> Database
    WebServer1 --> Queue
    Queue --> Worker
    Worker --> Database`,
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];
