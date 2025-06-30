---

### Cursor Ready Project Input:

**Build a full-stack web app called "CharterOps".**

---

**Problem:**
Small Part 135 charter operators flying Gulfstream G550s struggle with real-time disruption management—such as weather delays, crew duty conflicts, airport curfews, and mechanical issues. Most tools are fragmented or designed for large fleets, forcing small teams to manually monitor risks across multiple systems.

---

**Requirements:**

* Users can sign up, log in, and manage their charter operations
* View live dashboard of upcoming and active flights
* Automatically receive alerts for weather, crew duty violations, or airport issues
* Assign and activate backup crew, aircraft, or alternate airports
* Send real-time status updates to passengers
* Generate downloadable disruption reports per flight

---

**Tech Stack:**

* Frontend: React + Tailwind
* Backend: Supabase (Auth, PostgreSQL, Edge Functions)
* APIs: OpenSky, AviationWeather.gov, FAA NOTAM feeds

---

**Endpoints:**

* `GET /api/flights`
* `POST /api/flights`
* `GET /api/crew/:id`
* `PATCH /api/crew/:id/duty`
* `POST /api/alerts`
* `POST /api/flights/:id/activate-backup`
* `POST /api/messages`
* `GET /api/reports/:flight_id`

---

**Database:**

**users**: id, email, role, org\_id
**flights**: id, tail\_number, origin, destination, departure\_time, arrival\_time, crew\_ids\[], status, issues\[]
**crew**: id, name, current\_duty, assigned\_flight, rest\_compliant
**alerts**: id, flight\_id, type, message, triggered\_at, resolved
**messages**: id, flight\_id, type, text, recipients\[], sent\_at
**backups**: id, flight\_id, crew\_ids\[], aircraft\_id, fallback\_airport, activated

---

**Generate full-stack scaffold with:**

* Supabase authentication
* CRUD for flights, crew, and alerts
* Real-time subscriptions for alert updates
* Dashboard UI with filters and color-coded status indicators
* Passenger message panel
* Disruption report builder with PDF export

---
