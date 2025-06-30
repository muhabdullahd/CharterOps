# A. Functional Requirements

### Authentication

- User can sign up and log in using email/password.
- Authenticated users can access only their organization’s data.
- Admins can manage roles: `dispatcher`, `pilot`, `ops_manager`.

---

### Live Flight Ops Dashboard

- Authenticated users can view a dashboard showing active and upcoming flights.
- Each flight card shows:
  - Tail number, crew, origin/destination, status.
  - Color-coded alert status: OK / At Risk / Disrupted.
- Users can filter flights by time range, airport, or aircraft.

---

### Real-Time Disruption Alerts

- System auto-generates alerts for:
  - Weather (via METAR/TAF integration)
  - Crew duty conflicts
  - Airport curfews or FBO closures
  - Mechanical grounding (manual toggle)
- Alerts are pushed to dashboard and logged.

---

### Crew Duty Tracker

- System tracks each crew member's assigned duty time.
- Warns if assigned beyond FAA Part 135 limits.
- Automatically resets duty after proper rest periods.

---

### Backup Plan System

- Users can define backup crew, aircraft, and airports per flight.
- When a flight is marked disrupted, user can "activate" a backup.
- Activated backups update the flight log and trigger a new alert.

---

### Passenger Communication Panel

- User can send templated messages (SMS/email) to stored contact lists.
- Message types: “delay notice”, “reroute update”, “crew reassignment”.
- Communication log is timestamped and linked to flight ID.

---

### Disruption Report Generator

- User can generate a disruption report from any flight with active alerts.
- Report includes:
  - Timeline of events
  - Triggered alerts
  - Messages sent
  - Fallbacks used
- Can export as PDF.

---

# B. Non-Functional Requirements

- Dashboard should load in <400ms (95th percentile).
- Data updates (alerts, flight changes) pushed within 3 seconds via Supabase subscriptions.
- All data must be scoped to authenticated organization.
- Should support up to 20 simultaneous users (small charter ops team).
- Role-based access enforcement (dispatchers cannot edit reports).
- Passwords must be hashed and secured via Supabase Auth.
- Logs stored for at least 30 days for auditing.
- APIs should gracefully degrade if 3rd-party integrations fail (e.g., weather APIs).

---

# C. API Endpoints (REST Example via Supabase Edge Functions)

### Flights

- `GET /api/flights`

  - Query: `?status=active&origin=KTEB`
  - Response: `[ { id, status, departure_time, alerts[] } ]`

- `POST /api/flights`

  - Body: `{ tail_number, origin, destination, departure_time, crew_ids[] }`
  - Response: `{ id, status }`

### Crew

- `GET /api/crew/:id`

  - Returns: `{ id, name, duty_hours, rest_compliant }`

- `PATCH /api/crew/:id/duty`

  - Body: `{ new_hours: 9.5 }`

### Alerts

- `POST /api/alerts`
  - Body: `{ flight_id, type, message }`
  - Triggers notification + dashboard update

### Backups

- `POST /api/flights/:id/activate-backup`
  - Activates backup aircraft/crew for flight

### Messaging

- `POST /api/messages`
  - Body: `{ flight_id, type, recipients[], message_text }`

### Reports

- `GET /api/reports/:flight_id`
  - Returns JSON summary + downloadable PDF link

---

# D. Database Schema Draft

### `users`

| Field   | Type      |
| ------- | --------- |
| id      | UUID      |
| email   | Text      |
| role    | Enum      |
| org\_id | UUID (FK) |

---

### `flights`

| Field           | Type        |
| --------------- | ----------- |
| id              | UUID        |
| tail\_number    | Text        |
| origin          | Text (ICAO) |
| destination     | Text (ICAO) |
| departure\_time | Timestamp   |
| arrival\_time   | Timestamp   |
| crew\_ids       | UUID[]      |
| status          | Enum        |
| issues          | Text[]      |

---

### `crew`

| Field            | Type        |
| ---------------- | ----------- |
| id               | UUID        |
| name             | Text        |
| current\_duty    | Float (hrs) |
| assigned\_flight | UUID (FK)   |
| rest\_compliant  | Boolean     |

---

### `alerts`

| Field         | Type                                              |
| ------------- | ------------------------------------------------- |
| id            | UUID                                              |
| flight\_id    | UUID                                              |
| type          | Enum (`weather`, `crew`, `mechanical`, `airport`) |
| message       | Text                                              |
| triggered\_at | Timestamp                                         |
| resolved      | Boolean                                           |

---

### `messages`

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| flight\_id | UUID      |
| type       | Enum      |
| text       | Text      |
| recipients | Text[]    |
| sent\_at   | Timestamp |

---

### `backups`

| Field             | Type        |
| ----------------- | ----------- |
| id                | UUID        |
| flight\_id        | UUID        |
| crew\_ids         | UUID[]      |
| aircraft\_id      | Text        |
| fallback\_airport | Text (ICAO) |
| activated         | Boolean     |

---

