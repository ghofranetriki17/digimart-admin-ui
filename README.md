# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Domain Model (Mermaid)
mermaid
classDiagram
direction LR

class Tenant {<<entity>> +Long id PK}
class User {<<entity>> +Long id PK}
class Order {<<entity>> +Long id PK}

class Store {<<entity>>
  +Long id PK
  +Long tenantId FK
  +String name
  +String code UNIQUE(tenant)
  +String address
  +String city
  +String postalCode
  +String country
  +String phone NULLABLE
  +String email NULLABLE
  +String imageUrl NULLABLE
  +BigDecimal latitude NULLABLE
  +BigDecimal longitude NULLABLE
  +boolean active
}
class StoreInventory {<<entity>>
  +Long id PK
  +Long tenantId FK
  +Long storeId FK
  +Long productId FK NULLABLE
  +Long productVariantId FK NULLABLE
  +Integer quantity
  +Integer reservedQuantity NULLABLE
  +LocalDateTime updatedAt
  ---
  UNIQUE(tenantId,storeId,productId,productVariantId)
}
class Product {<<entity>> +Long id PK}
class ProductVariant {<<entity>>
  +Long id PK
  +Long productId FK
}

class CashRegister {<<entity>>
  +Long id PK
  +Long tenantId FK
  +String registerName
  +BigDecimal openingAmount
  +BigDecimal closingAmount
  +LocalDateTime openedAt
  +LocalDateTime closedAt
  +Long openedBy FK
  +Long closedBy FK
  +CashRegisterStatus status
}
class CashTransaction {<<entity>>
  +Long id PK
  +Long tenantId FK
  +Long cashRegisterId FK
  +Long orderId FK NULLABLE
  +BigDecimal amount
  +BigDecimal cashReceived
  +BigDecimal changeGiven
  +LocalDateTime transactionDate
  +Long processedBy FK
}
class CashRegisterStatus {<<enumeration>> OPEN CLOSED }

Tenant "1" --o "0..*" Store : pointsDeVente >
Store "1" --o "0..*" CashRegister : registers >
CashRegister "1" --o "0..*" CashTransaction : transactions >
CashRegister "1" --> "1" CashRegisterStatus : status >
CashTransaction "0..*" --> "0..1" Order : for >
User "1" --o "0..*" CashRegister : operates >
User "1" --o "0..*" CashTransaction : processes >

Store "1" --o "0..*" StoreInventory : stocks >
StoreInventory "0..*" --> "0..1" Product : product >
StoreInventory "0..*" --> "0..1" ProductVariant : variant >
Product "1" --o "0..*" ProductVariant : variants >

%% Colors
style Tenant fill:#3F51B5,stroke:#1A237E,color:#fff
style User fill:#3F51B5,stroke:#1A237E,color:#fff
style Order fill:#FFEB3B,stroke:#F57F17,color:#000
style Store fill:#FF9800,stroke:#E65100,color:#fff,stroke-width:4px
style StoreInventory fill:#FF9800,stroke:#E65100,color:#fff,stroke-width:4px
style CashRegister fill:#FF9800,stroke:#E65100,color:#fff,stroke-width:4px
style CashTransaction fill:#FF9800,stroke:#E65100,color:#fff
style CashRegisterStatus fill:#FF9800,stroke:#E65100,color:#fff
style Product fill:#4CAF50,stroke:#1B5E20,color:#fff
style ProductVariant fill:#4CAF50,stroke:#1B5E20,color:#fff

``````
