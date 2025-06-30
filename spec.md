# Project Specification Document

## Project Title

**CharterOps** – A Real-Time Trip Disruption Management Dashboard for Part 135 Operators

---

## Problem Statement

Private jet charter operators—especially small Part 135 operators managing high-value aircraft like the Gulfstream G550—face constant risk from **trip disruptions**: weather issues, crew duty violations, airport curfews, and mechanical delays. Yet, most operators **lack a centralized, proactive tool** to anticipate and manage these problems in real time.

As highlighted across **Reddit** and **aviation forums**, both professionals and customers describe this reactive model as inefficient and damaging to service quality. Brokers note that what separates a professional from an amateur is the ability to **anticipate and respond to disruptions**—not just quote a flight.

Despite available flight tracking tools, operators still resort to **manual processes or siloed software**, leaving flights vulnerable when unexpected issues occur.

This project directly addresses that gap.

## Objective

To develop a lightweight, real-time operations dashboard that helps Part 135 charter operators proactively manage trip disruptions (e.g., weather, crew limits, FBO issues, mechanical delays) and maintain smooth flight execution for a small fleet (2–3 G550s).

---

## Target Users

* Charter Dispatchers
* Chief Pilots
* Trip Managers / Brokers
* Flight Ops Directors

---

## Tech Stack

| Component     | Technology                                   |
| ------------- | -------------------------------------------- |
| Frontend      | React + Tailwind                             |
| Backend       | Supabase (PostgreSQL, Auth, Edge Functions)  |
| Realtime Sync | Supabase Subscriptions                       |
| External APIs | OpenSky API, AviationWeather.gov, FAA NOTAMs |
| Hosting       | Vercel (Frontend) + Supabase (Backend)       |

---

## Core Features

### 1. Live Flight Ops Dashboard

* Table of ongoing/upcoming flights
* Status indicators: ✈️ OK / ⚠️ At Risk / ❌ Disrupted
* Filter by airport, time, aircraft, status

### 2. Real-Time Disruption Alerts

* Weather alerts (METAR/TAF via NOAA API)
* Airport curfew/FBO closure flags
* Crew duty/rest conflict warnings
* Mechanically grounded (manual trigger or OpenSky status)

### 3. Crew Duty Tracker

* Real-time cumulative duty hours
* FAA Part 135 rest compliance checks
* Warnings on scheduling violations

### 4. Backup Plan System

* Assign pre-vetted alternate crews, aircraft, or airports
* Alerts when fallback is activated
* View recovery steps in a timeline

### 5. Passenger Communication Panel

* Predefined templates for SMS/email alerts
* "Delay due to weather," "Crew swap in progress," etc.
* Timestamped message logs

### 6. Disruption Report Generator

* Auto-compile logs, timestamps, and decision history
* Downloadable PDF or view in-app
* Add internal notes and lessons learned

---

## Data Models (Supabase Tables)

### `flights`

| Column          | Type                                                   |
| --------------- | ------------------------------------------------------ |
| id              | UUID (PK)                                              |
| tail\_number    | Text                                                   |
| departure\_time | Timestamp                                              |
| arrival\_time   | Timestamp                                              |
| origin          | Text (ICAO)                                            |
| destination     | Text (ICAO)                                            |
| crew\_ids       | Array of UUID                                          |
| status          | Enum (`scheduled`, `delayed`, `diverted`, `completed`) |
| issues          | Text\[]                                                |

### `crew`

| Column           | Type      |
| ---------------- | --------- |
| id               | UUID (PK) |
| name             | Text      |
| current\_duty    | Interval  |
| assigned\_flight | UUID (FK) |
| rest\_compliant  | Boolean   |

### `alerts`

| Column        | Type                                              |
| ------------- | ------------------------------------------------- |
| id            | UUID (PK)                                         |
| flight\_id    | UUID (FK)                                         |
| type          | Enum (`weather`, `crew`, `mechanical`, `airport`) |
| message       | Text                                              |
| triggered\_at | Timestamp                                         |
| resolved      | Boolean                                           |

### `fbo_info` *(Optional - from external data or admin inputs)*

| Column        | Type |
| ------------- | ---- |
| airport\_code | Text |
| fbo\_name     | Text |
| closes\_at    | Time |

---

## External Integrations

| Source               | Use Case                               |
| -------------------- | -------------------------------------- |
| **OpenSky API**      | Live aircraft movement & flight status |
| **NOAA / METAR API** | Weather alerts for origin/destination  |
| **FAA NOTAM data**   | Curfews, airport restrictions          |

---

## Timeline

| Phase        | Duration  | Features                                                    |
| ------------ | --------- | ----------------------------------------------------------- |
| Phase 1: MVP | 1–2 hours | Dashboard, Flight Table, Supabase schema, manual data entry |
| Phase 2      | 2–3 hours | Real-time weather alerts, Crew Duty module                  |
| Phase 3      | 1–2 hours | Backup plan builder, SMS/Email alerts                       |

---

## Success Metrics

* Time from disruption to notification reduced by 70%
* 0 flight delays due to missed duty rest limits
* 100% of flights have defined backup plan
* Auto-generated disruption reports used in post-trip debriefs

---

## References

1. **r/PrivateJetCharters – Rookie vs Veteran Charter Brokers**  
   Discusses the importance of anticipating issues like delays, weather, crew duty limits, and how experienced brokers shine during disruption.  
   [Reddit Thread](https://www.reddit.com/r/PrivateJetCharters/comments/1k2ikhn/rookie_or_a_veteran_charter_broker/)

2. **r/flying – Charter Flight Diversion & Lack of Communication**  
   Charter company failed to notify or reroute clients after a diversion due to weather.  
   [Reddit Thread](https://www.reddit.com/r/flying/comments/ynvwdz/charter_flight_experience_after_diverting_due_to/)

3. **r/PrivateJetCharters – Charter Problems & Risk Acknowledgment**  
   Industry user admits: "Charter is not a guaranteed product; sick crew, broken aircraft, knock-on delays…"  
   [Reddit Thread](https://www.reddit.com/r/PrivateJetCharters/comments/12vz1ob/charter_problems/)

4. **r/flying – Part 135 Dispatch & Software Limitations**  
   Dispatchers express frustration with lack of integrated tools for trip release and tracking.  
   [Reddit Thread](https://www.reddit.com/r/flying/comments/v0xu0d/part_135_haa_operators_what_software_are_you/)

5. **BoldIQ Solver – Enterprise-level disruption recovery**  
   Existing tools like Solver offer some solutions but are aimed at larger fleets, not small operators.  
   [BoldIQ Website](https://boldiq.com/products/solver/)
