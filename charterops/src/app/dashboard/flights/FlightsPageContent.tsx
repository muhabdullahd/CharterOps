"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, Flight } from "@/lib/supabase";
import FlightCard from "@/components/FlightCard";
import { CheckCircle } from "lucide-react";

export default function FlightsPageContent() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchFlights = async () => {
      let query = supabase.from("flights").select("*").order("departure_time", { ascending: true });
      const status = searchParams.get("status");
      if (status) {
        query = query.eq("status", status);
      }
      const { data } = await query;
      setFlights(data || []);
      setLoading(false);
    };
    fetchFlights();
    // Only depend on searchParams.toString() to avoid useEffect warning
  }, [searchParams.toString()]);

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