/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, Flight } from "@/lib/supabase";
import FlightCard from "@/components/FlightCard";
import { CheckCircle, AlertTriangle, Users, ClipboardList } from "lucide-react";

export default function FlightsPageContent() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [flightDetails, setFlightDetails] = useState<unknown>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const flightId = searchParams.get("flight_id");

  useEffect(() => {
    if (flightId) {
      setDetailsLoading(true);
      fetch(`/api/monitor?action=details&flight_id=${flightId}`)
        .then((res) => res.json())
        .then((data) => {
          setFlightDetails(data);
          setDetailsLoading(false);
        });
    } else {
      const fetchFlights = async () => {
        let query = supabase.from("flights").select("*").order("departure_time", { ascending: true });
        if (status) {
          query = query.eq("status", status);
        }
        const { data } = await query;
        setFlights(data || []);
        setLoading(false);
      };
      fetchFlights();
    }
  }, [status, flightId]);

  if (flightId) {
    if (detailsLoading || !flightDetails) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
          <ClipboardList className="h-10 w-10 text-blue-300 mb-2 animate-spin" />
          <span className="text-lg font-semibold">Loading flight details...</span>
        </div>
      );
    }
    if (typeof flightDetails !== 'object' || flightDetails === null) {
      return <div className="text-red-500">Invalid flight details data.</div>;
    }
    const { flight, alerts, crewCompliance, backupPlans } = flightDetails as {
      flight: any;
      alerts: unknown[];
      crewCompliance: unknown[];
      backupPlans: unknown[];
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl mx-auto">
          <button
            className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            onClick={() => router.push("/dashboard/flights")}
            aria-label="Back to Flights"
          >
            Back to Flights
          </button>
          <h2 className="text-2xl font-bold mb-6 text-center tracking-tight">Flight Details</h2>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg font-semibold text-gray-900">{flight.tail_number}</span>
                <span className="ml-3 text-gray-500">{flight.origin} → {flight.destination}</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {flight.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Departure:</strong> {new Date(flight.departure_time).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Arrival:</strong> {new Date(flight.arrival_time).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Crew IDs:</strong> {flight.crew_ids?.join(", ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Flight ID:</strong> {flight.id}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Aircraft:</strong> {flight.aircraft_id || "N/A"}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Notes:</strong> {flight.notes || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="text-gray-500">No alerts for this flight.</div>
            ) : (
              <ul className="space-y-2">
                {alerts.map((alert: unknown) => {
                  if (typeof alert !== 'object' || alert === null) return null;
                  const a = alert as { id: string; type: string; triggered_at: string; message: string };
                  return (
                    <li key={a.id} className="border rounded p-3 bg-red-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-700">{a.type}</span>
                        <span className="text-xs text-gray-500">{new Date(a.triggered_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{a.message}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Crew Compliance */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-3">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Crew Compliance</h3>
            </div>
            {crewCompliance.length === 0 ? (
              <div className="text-gray-500">No crew compliance issues.</div>
            ) : (
              <ul className="space-y-2">
                {crewCompliance.map((c: unknown, idx: number) => {
                  if (typeof c !== 'object' || c === null) return null;
                  const cc = c as { crew_name?: string; crewId?: string; is_compliant?: boolean; violations?: string[] };
                  return (
                    <li key={idx} className="border rounded p-3 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-700">{cc.crew_name || cc.crewId || "Crew"}</span>
                        <span className="text-xs text-gray-500">{cc.is_compliant ? "Compliant" : "Non-compliant"}</span>
                      </div>
                      {cc.violations && cc.violations.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-red-600 mt-1">
                          {cc.violations.map((v: string, i: number) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Backup Plans */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-3">
              <ClipboardList className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Backup Plans</h3>
            </div>
            {backupPlans.length === 0 ? (
              <div className="text-gray-500">No backup plans for this flight.</div>
            ) : (
              <ul className="space-y-2">
                {backupPlans.map((plan: unknown, idx: number) => (
                  <li key={idx} className="border rounded p-3 bg-green-50">
                    <div className="text-sm text-gray-700">{JSON.stringify(plan)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view for all flights
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mx-auto">
        <button
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          onClick={() => router.push("/dashboard")}
          aria-label="Back to Dashboard"
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center tracking-tight">Flights</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
              <CheckCircle className="h-10 w-10 text-blue-300 mb-2 animate-spin" />
              <span className="text-lg font-semibold">Loading flights...</span>
            </div>
          ) : flights.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <CheckCircle className="h-10 w-10 text-green-300 mb-2 animate-bounce" />
              <span className="text-lg font-semibold">No flights found.</span>
              <span className="text-sm text-gray-400">No flights match the current filter.</span>
            </div>
          ) : (
            flights.map((flight) => <FlightCard key={flight.id} flight={flight} />)
          )}
        </div>
      </div>
    </div>
  );
} 