# SOLID Principles — Senior Engineer's Quick Reference

---

## 1. S — Single Responsibility Principle

### **Core Rule:** A class should have **one reason to change** — one job, one reason to evolve.

### 🔍 What to Look For (The Smell)
- Classes doing multiple things: parsing, validation, storage, logging, notifications
- The word **"and"** in class descriptions: `UserManager AND EmailSender`
- Multiple reasons the class would need modification

### ✅ Actionable Check
- Can you describe the class's purpose in **one sentence** without "and/or"?
- How many different external systems depend on this class for different reasons?
- If the requirement changes, does **only** this class need updating?

### 💡 Key Takeaway
A class changes for **one business reason**. Everything else belongs elsewhere.

---

## 2. O — Open/Closed Principle

### **Core Rule:** Open for **extension**, closed for **modification**. Add features without changing existing code.

### 🔍 What to Look For (The Smell)
- Adding features requires modifying existing methods
- Scattered `if/else` chains checking types: `if (type == "PDF") else if (type == "Excel")`
- "Stable" code that isn't actually stable — keeps breaking

### ✅ Actionable Check
- Can I add a new requirement by **creating a new class**, not editing old ones?
- Would adding a feature cause cascading changes through existing code?
- Are extensions pluggable via inheritance, composition, or interfaces?

### 💡 Key Takeaway
Design for the changes you know are coming. Use abstraction — interfaces, inheritance, composition — to let new behavior **plug in** without touching proven code.

---

## 3. L — Liskov Substitution Principle

### **Core Rule:** Subtypes must be substitutable for their base types **without breaking the contract**.

### 🔍 What to Look For (The Smell)
- Type checks before using objects: `if (obj instanceof Duck) { ... }`
- Subclass throws `NotImplementedException` in inherited methods
- Subclass weakens preconditions or strengthens postconditions
- "Duck typing" gone wrong — it quacks like a duck, but isn't logically a duck

### ✅ Actionable Check
- Can you pass **any subtype** where the parent is expected, without surprises?
- Do all subtypes honor the parent's **implicit contract**?
- Are there null checks or type guards protecting against "wrong" subtypes?

### 💡 Key Takeaway
Inheritance must be **IS-A**, not just code reuse. If it breaks when you swap parent for child, you've violated LSP.

---

## 4. I — Interface Segregation Principle

### **Core Rule:** Don't force clients to depend on methods they don't use. Keep interfaces **focused**.

### 🔍 What to Look For (The Smell)
- Fat interfaces: `IEntity` with 20 methods, each class uses only 5
- Classes implementing methods with `throw NotImplementedException()`
- A single interface serving wildly different use cases
- Clients forced to import massive interfaces for one tiny method

### ✅ Actionable Check
- Can I break this interface into **smaller, focused** ones?
- Would clients happily implement every method, or are some just noise?
- If I add a new method, does every implementer actually need it?

### 💡 Key Takeaway
Many client-specific interfaces beat one god interface. Clients should depend **only on what they use**.

---

## 5. D — Dependency Inversion Principle

### **Core Rule:** Depend on **abstractions**, not concretions. High-level modules shouldn't depend on low-level details.

### 🔍 What to Look For (The Smell)
- Classes instantiating dependencies with `new`: `this.logger = new FileLogger()`
- High-level logic directly importing low-level classes
- Mocking is painful — hard to inject test doubles
- Tight coupling: changing one class breaks ten others

### ✅ Actionable Check
- Are dependencies **injected** — constructor, setter, or provider?
- Does the class depend on **interfaces/abstractions**, not concrete classes?
- Could I swap implementations (e.g., `FileLogger → ConsoleLogger`) without changing code?
- Are tests easy to write with mocks?

### 💡 Key Takeaway
Inject dependencies. Depend on what something **does** (the contract), not what it **is** (the concrete type).

---

*"Good architecture makes the system easy to change, in all the ways it must change, by leaving options open." — Robert C. Martin*