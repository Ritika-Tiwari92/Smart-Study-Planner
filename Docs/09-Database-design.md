# 🗄️ Database Design

The Smart Study Planner uses a structured relational database (MySQL) to store and manage all application data efficiently.

## 📊 Main Tables

### 👤 1. User Table
Stores user information.

| Field Name | Data Type | Description |
|-----------|----------|-------------|
| id | INT (PK) | Unique user ID |
| name | VARCHAR | User name |
| email | VARCHAR | User email |
| password | VARCHAR | User password |

---

### 📚 2. Subject Table
Stores subjects added by the user.

| Field Name | Data Type | Description |
|-----------|----------|-------------|
| id | INT (PK) | Subject ID |
| name | VARCHAR | Subject name (DSA, DBMS, etc.) |
| progress | INT | Completion percentage |
| difficulty | VARCHAR | Easy / Medium / Hard |

---

### 📅 3. Task Table
Stores study tasks and schedules.

| Field Name | Data Type | Description |
|-----------|----------|-------------|
| id | INT (PK) | Task ID |
| subject_id | INT (FK) | Linked subject |
| title | VARCHAR | Task title |
| date | DATE | Scheduled date |
| status | VARCHAR | Pending / Completed |

---

### 📝 4. Test Table
Stores test and quiz data.

| Field Name | Data Type | Description |
|-----------|----------|-------------|
| id | INT (PK) | Test ID |
| subject_id | INT (FK) | Linked subject |
| score | INT | Marks obtained |
| date | DATE | Test date |

---

### 💻 5. Coding Tracker Table

| Field Name | Data Type | Description |
|-----------|----------|-------------|
| id | INT (PK) | Entry ID |
| user_id | INT (FK) | Linked user |
| problems_solved | INT | Number of problems |
| difficulty | VARCHAR | Easy / Medium / Hard |
| date | DATE | Practice date |

---

## 🔗 Relationships

- One user can have multiple subjects
- One subject can have multiple tasks
- One subject can have multiple tests
- One user can have multiple coding records

---

## 🧠 Database Design Concept

- Primary Key (PK): Uniquely identifies each record
- Foreign Key (FK): Connects related tables
- Ensures data consistency and integrity

---

## 🎯 Conclusion

The database is designed to efficiently manage user data, study schedules, performance records, and coding progress. It supports scalability and ensures smooth data handling for the application.

# ER Diagram

![System Architecture](images/09-DB.png)